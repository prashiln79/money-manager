import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, Timestamp, addDoc, onSnapshot, writeBatch } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { OfflineService } from './offline.service';

export interface Transaction {
    id?: string;
    payee: string;
    userId: string;
    accountId: string;  // Reference to an account
    amount: number;
    category: string;   // "Food", "Transport", etc.
    type: 'income' | 'expense';  // Income or expense
    date: Timestamp;  // Timestamp for transaction date
    notes?: string;  // Optional notes for the transaction
    recurring?: boolean;  // Whether the transaction is recurring
    recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';  // Interval for recurring transactions
    isPending?: boolean; // For offline operations
    syncStatus?: 'synced' | 'pending' | 'failed'; // Sync status
}

interface OfflineOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
    retryCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class TransactionsService {
    private offlineQueue: OfflineOperation[] = [];
    private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
    private isOnline = true;

    constructor(
        private firestore: Firestore, 
        private auth: Auth,
        private offlineService: OfflineService
    ) {
        this.initializeOfflineHandling();
    }

    private initializeOfflineHandling(): void {
        // Subscribe to network status
        this.offlineService.isOnline$.subscribe(online => {
            this.isOnline = online;
            if (online) {
                this.processOfflineQueue();
            }
        });

        // Load offline queue from storage
        this.loadOfflineQueue();
    }

    private async loadOfflineQueue(): Promise<void> {
        try {
            const queue = await this.offlineService.getCachedData('offline-queue');
            if (queue) {
                this.offlineQueue = queue;
            }
        } catch (error) {
            console.error('Failed to load offline queue:', error);
        }
    }

    private async saveOfflineQueue(): Promise<void> {
        try {
            await this.offlineService.cacheData('offline-queue', this.offlineQueue);
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    private async addToOfflineQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
        const offlineOp: OfflineOperation = {
            ...operation,
            id: this.generateId(),
            timestamp: Date.now(),
            retryCount: 0
        };

        this.offlineQueue.push(offlineOp);
        await this.saveOfflineQueue();
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private async processOfflineQueue(): Promise<void> {
        if (this.offlineQueue.length === 0) return;

        const batch = writeBatch(this.firestore);
        const processedOperations: string[] = [];

        for (const operation of this.offlineQueue) {
            try {
                const userId = this.auth.currentUser?.uid;
                if (!userId) continue;

                switch (operation.type) {
                    case 'create':
                        const transactionsRef = collection(this.firestore, `users/${userId}/transactions`);
                        const docRef = doc(transactionsRef);
                        batch.set(docRef, operation.data);
                        break;

                    case 'update':
                        const updateRef = doc(this.firestore, `users/${userId}/transactions/${operation.data.id}`);
                        batch.update(updateRef, operation.data);
                        break;

                    case 'delete':
                        const deleteRef = doc(this.firestore, `users/${userId}/transactions/${operation.data.id}`);
                        batch.delete(deleteRef);
                        break;
                }

                processedOperations.push(operation.id);
            } catch (error) {
                console.error(`Failed to process offline operation ${operation.id}:`, error);
                operation.retryCount++;
                
                // Remove operation if it has been retried too many times
                if (operation.retryCount >= 3) {
                    processedOperations.push(operation.id);
                }
            }
        }

        // Commit batch if there are operations to process
        if (processedOperations.length > 0) {
            try {
                await batch.commit();
                
                // Remove processed operations from queue
                this.offlineQueue = this.offlineQueue.filter(op => !processedOperations.includes(op.id));
                await this.saveOfflineQueue();
                
                console.log(`✅ Processed ${processedOperations.length} offline operations`);
            } catch (error) {
                console.error('Failed to commit offline operations:', error);
            }
        }
    }

    createTransaction(userId: string, transaction: Omit<Transaction, 'transactionId'>): Observable<void> {
        return new Observable<void>(observer => {
            const transactionData = {
                ...transaction,
                date: Timestamp.fromDate(transaction.date.toDate()),
                syncStatus: 'synced' as const
            };

            const createTransactionAsync = async () => {
                try {
                    if (this.isOnline) {
                        try {
                            const transactionsCollection = collection(this.firestore, `users/${userId}/transactions`);
                            await addDoc(transactionsCollection, transactionData);
                        } catch (error) {
                            console.error('Failed to create transaction online:', error);
                            // Fall back to offline mode
                            await this.addToOfflineQueue({
                                type: 'create',
                                data: transactionData
                            });
                        }
                    } else {
                        // Store offline
                        await this.addToOfflineQueue({
                            type: 'create',
                            data: { ...transactionData, syncStatus: 'pending' }
                        });
                        
                        // Update local cache
                        const currentTransactions = this.transactionsSubject.value;
                        const newTransaction = { ...transactionData, id: this.generateId(), isPending: true };
                        this.transactionsSubject.next([...currentTransactions, newTransaction]);
                    }
                    observer.next();
                    observer.complete();
                } catch (error) {
                    observer.error(error);
                }
            };

            createTransactionAsync();
        });
    }

    // 🔹 Get all transactions for a user
    getTransactions(userId: string): Observable<Transaction[]> {
        const transactionsRef = collection(this.firestore, `users/${userId}/transactions`);
        
        return new Observable<Transaction[]>(observer => {
            const unsubscribe = onSnapshot(transactionsRef, (querySnapshot) => {
                const transactions: Transaction[] = [];
                querySnapshot.forEach(doc => {
                    const transaction = { id: doc.id, ...doc.data() } as unknown as Transaction;
                    transactions.push(transaction);
                });
                
                // Add pending offline transactions
                const pendingTransactions = this.transactionsSubject.value.filter(t => t.isPending);
                const allTransactions = [...transactions, ...pendingTransactions];
                
                this.transactionsSubject.next(allTransactions);
                observer.next(allTransactions);
            }, error => {
                console.error('Failed to fetch transactions:', error);
                // Return cached data if available
                observer.next(this.transactionsSubject.value);
            });
    
            return () => unsubscribe();
        });
    }

    // 🔹 Get a single transaction by its ID
    getTransaction(userId: string, transactionId: string): Observable<Transaction | undefined> {
        return new Observable<Transaction | undefined>(observer => {
            const getTransactionAsync = async () => {
                try {
                    const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                    const transactionSnap = await getDoc(transactionRef);
                    if (transactionSnap.exists()) {
                        const transaction = { id: transactionSnap.id, ...transactionSnap.data() } as Transaction;
                        observer.next(transaction);
                    } else {
                        observer.next(undefined);
                    }
                    observer.complete();
                } catch (error) {
                    observer.error(error);
                }
            };

            getTransactionAsync();
        });
    }

    // 🔹 Update an existing transaction
    updateTransaction(userId: string, transactionId: string, updatedTransaction: Partial<Transaction>): Observable<void> {
        return new Observable<void>(observer => {
            const updateData = { ...updatedTransaction, syncStatus: 'synced' as const };

            const updateTransactionAsync = async () => {
                try {
                    if (this.isOnline) {
                        try {
                            const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                            await updateDoc(transactionRef, updateData);
                        } catch (error) {
                            console.error('Failed to update transaction online:', error);
                            await this.addToOfflineQueue({
                                type: 'update',
                                data: { id: transactionId, ...updateData }
                            });
                        }
                    } else {
                        await this.addToOfflineQueue({
                            type: 'update',
                            data: { id: transactionId, ...updateData, syncStatus: 'pending' }
                        });
                        
                        // Update local cache
                        const currentTransactions = this.transactionsSubject.value;
                        const updatedTransactions = currentTransactions.map(t => 
                            t.id === transactionId ? { ...t, ...updateData, isPending: true } : t
                        );
                        this.transactionsSubject.next(updatedTransactions);
                    }
                    observer.next();
                    observer.complete();
                } catch (error) {
                    observer.error(error);
                }
            };

            updateTransactionAsync();
        });
    }

    // 🔹 Delete a transaction
    deleteTransaction(userId: string, transactionId: string): Observable<void> {
        return new Observable<void>(observer => {
            const deleteTransactionAsync = async () => {
                try {
                    if (this.isOnline) {
                        try {
                            const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                            await deleteDoc(transactionRef);
                        } catch (error) {
                            console.error('Failed to delete transaction online:', error);
                            await this.addToOfflineQueue({
                                type: 'delete',
                                data: { id: transactionId }
                            });
                        }
                    } else {
                        await this.addToOfflineQueue({
                            type: 'delete',
                            data: { id: transactionId }
                        });
                        
                        // Update local cache
                        const currentTransactions = this.transactionsSubject.value;
                        const filteredTransactions = currentTransactions.filter(t => t.id !== transactionId);
                        this.transactionsSubject.next(filteredTransactions);
                    }
                    observer.next();
                    observer.complete();
                } catch (error) {
                    observer.error(error);
                }
            };

            deleteTransactionAsync();
        });
    }

    // 🔹 Get offline queue status
    getOfflineQueueStatus(): { count: number; hasPendingOperations: boolean } {
        return {
            count: this.offlineQueue.length,
            hasPendingOperations: this.offlineQueue.length > 0
        };
    }

    // 🔹 Force sync offline operations
    async forceSync(): Promise<void> {
        if (this.isOnline) {
            await this.processOfflineQueue();
        }
    }
}
