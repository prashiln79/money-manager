import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, addDoc, onSnapshot, writeBatch } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { OfflineService } from './offline.service';
import { orderBy, query, Timestamp } from '@angular/fire/firestore';
import { DateService } from './date.service';
import { Transaction } from '../models/transaction.model';
import { RecurringInterval, SyncStatus } from '../config/enums';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import * as CategoriesActions from '../../store/categories/categories.actions';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import { AccountsService } from './accounts.service';
import * as AccountsActions from '../../store/accounts/accounts.actions';
import { CreateSplitTransactionRequest, SplitwiseGroup, TransactionSplit } from '../models/splitwise.model';
import * as SplitwiseActions from '../../modules/splitwise/store/splitwise.actions';
import { selectGroups } from '../../modules/splitwise/store/splitwise.selectors';
import { SplitwiseService } from 'src/app/modules/splitwise/services/splitwise.service';
import { BackgroundSyncService } from './background-sync.service';


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
        private offlineService: OfflineService,
        private dateService: DateService,
        private store: Store<AppState>,
        private accountsService: AccountsService,
        private splitwiseService: SplitwiseService,
        private backgroundSyncService: BackgroundSyncService
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

        // Register with background sync service
        if (this.backgroundSyncService.isSupported()) {
            await this.backgroundSyncService.registerSyncItem({
                id: offlineOp.id,
                type: 'transaction',
                data: offlineOp
            });
        }
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private async processOfflineQueue(): Promise<void> {
        if (this.offlineQueue.length === 0) return;

        const batch = writeBatch(this.firestore);
        const processedOperations: string[] = [];
        const balanceUpdates: { userId: string; accountId: string; transactionType: 'create' | 'update' | 'delete'; oldTransaction?: Transaction; newTransaction?: Transaction }[] = [];

        for (const operation of this.offlineQueue) {
            try {
                const userId = this.auth.currentUser?.uid;
                if (!userId) continue;

                switch (operation.type) {
                    case 'create':
                        const transactionsRef = collection(this.firestore, `users/${userId}/transactions`);
                        const docRef = doc(transactionsRef);
                        batch.set(docRef, operation.data);

                        // Track balance update for create operation
                        if (operation.data.accountId) {
                            balanceUpdates.push({
                                userId,
                                accountId: operation.data.accountId,
                                transactionType: 'create',
                                newTransaction: operation.data as Transaction
                            });
                        }
                        break;

                    case 'update':
                        const updateRef = doc(this.firestore, `users/${userId}/transactions/${operation.data.id}`);
                        batch.update(updateRef, operation.data);

                        // For update operations, we need to get the original transaction to calculate balance difference
                        // This will be handled after the batch commit
                        break;

                    case 'delete':
                        const deleteRef = doc(this.firestore, `users/${userId}/transactions/${operation.data.id}`);
                        batch.delete(deleteRef);

                        // Track balance update for delete operation
                        if (operation.data.accountId) {
                            balanceUpdates.push({
                                userId,
                                accountId: operation.data.accountId,
                                transactionType: 'delete',
                                oldTransaction: operation.data as Transaction
                            });
                        }
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

                // Process balance updates after successful batch commit
                for (const balanceUpdate of balanceUpdates) {
                    this.store.dispatch(AccountsActions.updateAccountBalanceForTransaction(balanceUpdate));
                }

                // Handle update operations that need original transaction data
                for (const operation of this.offlineQueue) {
                    if (operation.type === 'update' && processedOperations.includes(operation.id)) {
                        const userId = this.auth.currentUser?.uid;
                        if (userId && operation.data.accountId) {
                            // For update operations, we'll let the account balance update happen
                            // when the transaction is next loaded, or we could implement a more
                            // sophisticated approach here if needed
                        }
                    }
                }

                // Remove processed operations from queue
                this.offlineQueue = this.offlineQueue.filter(op => !processedOperations.includes(op.id));
                await this.saveOfflineQueue();

                // Clear completed items from background sync service
                await this.backgroundSyncService.clearCompletedItems();

                console.log(`✅ Processed ${processedOperations.length} offline operations`);
            } catch (error) {
                console.error('Failed to commit offline operations:', error);
            }
        }
    }

    createTransaction(userId: string, transaction: Omit<Transaction, 'id'>): Observable<void> {
        return new Observable<void>(observer => {
            const transactionData = {
                ...transaction,
                date: this.dateService.toDate(transaction.date),
                syncStatus: 'synced' as const
            };

            const createTransactionAsync = async () => {
                try {
                    if (this.isOnline) {
                        try {
                            const transactionsCollection = collection(this.firestore, `users/${userId}/transactions`);
                            const transactionRef = await addDoc(transactionsCollection, transactionData);

                            if (transaction.isSplitTransaction && transaction.splitGroupId) {
                                await this.createSplitTransaction(transaction.splitGroupId, transaction, transactionRef.id, userId);
                            }

                            // Update category budget if categoryId exists
                            if (transaction.categoryId) {
                                this.store.dispatch(CategoriesActions.updateBudgetSpent({
                                    userId: userId,
                                    categoryId: transaction.categoryId,
                                    budgetSpent: transaction.amount
                                }));
                            }

                            // Update account balance
                            this.store.dispatch(AccountsActions.updateAccountBalanceForTransaction({
                                userId: userId,
                                accountId: transaction.accountId,
                                transactionType: 'create',
                                newTransaction: transactionData as Transaction
                            }));

                            observer.next();
                            observer.complete();
                        } catch (error) {
                            console.error('Failed to create transaction online:', error);
                            // Fall back to offline mode
                            await this.addToOfflineQueue({
                                type: 'create',
                                data: { ...transactionData, syncStatus: 'pending' }
                            });

                            // Update local cache
                            const currentTransactions = this.transactionsSubject.value;
                            const newTransaction: Transaction = {
                                ...transactionData,
                                id: this.generateId(),
                                isPending: true,
                                syncStatus: SyncStatus.PENDING,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                createdBy: userId,
                                updatedBy: userId,
                                lastSyncedAt: new Date(),
                                nextOccurrence: new Date(),
                                recurringInterval: RecurringInterval.DAILY,
                                recurringEndDate: new Date(),
                                isRecurring: false,
                                date: transactionData.date || new Date(),
                            };
                            this.transactionsSubject.next([...currentTransactions, newTransaction]);

                            observer.next();
                            observer.complete();
                        }
                    } else {
                        // Store offline
                        await this.addToOfflineQueue({
                            type: 'create',
                            data: { ...transactionData, syncStatus: 'pending' }
                        });

                        // Update local cache
                        const currentTransactions = this.transactionsSubject.value;
                        const newTransaction: Transaction = {
                            ...transactionData,
                            id: this.generateId(),
                            isPending: true,
                            syncStatus: SyncStatus.PENDING,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            createdBy: userId,
                            updatedBy: userId,
                            lastSyncedAt: new Date(),
                            nextOccurrence: new Date(),
                            recurringInterval: RecurringInterval.DAILY,
                            recurringEndDate: new Date(),
                            isRecurring: false,
                            date: transactionData.date || new Date(),
                        };
                        this.transactionsSubject.next([...currentTransactions, newTransaction]);

                        observer.next();
                        observer.complete();
                    }
                } catch (error) {
                    console.error('Error in createTransaction:', error);
                    observer.error(error);
                }
            };

            createTransactionAsync();
        });
    }

    // 🔹 Get all transactions for a user
    getTransactions(userId: string): Observable<Transaction[]> {
        const transactionsRef = query(
            collection(this.firestore, `users/${userId}/transactions`),
            orderBy('date', 'desc')
        );

        return new Observable<Transaction[]>(observer => {
            const unsubscribe = onSnapshot(
                transactionsRef,
                (querySnapshot) => {
                    const transactions: Transaction[] = [];

                    querySnapshot.forEach(doc => {
                        const transaction = { id: doc.id, ...doc.data() } as Transaction;
                        transactions.push(transaction);
                    });

                    // Avoid duplicates by checking existing IDs
                    const pendingTransactions = this.transactionsSubject.value.filter(
                        t => t.isPending && !transactions.some(tr => tr.id === t.id)
                    );

                    const allTransactions = [...transactions, ...pendingTransactions];

                    this.transactionsSubject.next(allTransactions);
                    observer.next(allTransactions);
                },
                (error) => {
                    console.error('Failed to fetch transactions:', error);
                    observer.next(this.transactionsSubject.value); // Fallback
                    observer.complete(); // Optional
                }
            );

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
                    // Get the original transaction to calculate balance difference
                    let originalTransaction: Transaction | undefined;
                    try {
                        const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                        const transactionSnap = await getDoc(transactionRef);
                        if (transactionSnap.exists()) {
                            originalTransaction = { id: transactionSnap.id, ...transactionSnap.data() } as Transaction;
                        }
                    } catch (error) {
                        console.warn('Could not fetch original transaction for balance update:', error);
                    }

                    if (this.isOnline) {
                        try {
                            const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                            await updateDoc(transactionRef, updateData);

                            // Handle account balance updates
                            if (originalTransaction) {
                                const newTransaction = { ...originalTransaction, ...updateData } as Transaction;

                                // Check if account was changed
                                if (updatedTransaction.accountId && updatedTransaction.accountId !== originalTransaction.accountId) {
                                    // Handle account transfer
                                    this.store.dispatch(AccountsActions.updateAccountBalanceForAccountTransfer({
                                        userId: userId,
                                        oldAccountId: originalTransaction.accountId,
                                        newAccountId: updatedTransaction.accountId,
                                        transaction: newTransaction
                                    }));
                                } else if (updatedTransaction.amount !== undefined || updatedTransaction.type !== undefined) {
                                    // Handle amount or type change
                                    this.store.dispatch(AccountsActions.updateAccountBalanceForTransaction({
                                        userId: userId,
                                        accountId: originalTransaction.accountId,
                                        transactionType: 'update',
                                        oldTransaction: originalTransaction,
                                        newTransaction: newTransaction
                                    }));
                                }
                            }
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
                            t.id === transactionId ? {
                                ...t,
                                ...updateData,
                                isPending: true,
                                syncStatus: SyncStatus.PENDING,
                                lastSyncedAt: new Date(),
                                nextOccurrence: new Date(),
                                recurringInterval: RecurringInterval.DAILY,
                                recurringEndDate: new Date(),
                            } : t
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
                    // Get the transaction to calculate balance reversal
                    let transactionToDelete: Transaction | undefined;
                    try {
                        const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                        const transactionSnap = await getDoc(transactionRef);
                        if (transactionSnap.exists()) {
                            transactionToDelete = { id: transactionSnap.id, ...transactionSnap.data() } as Transaction;
                        }
                    } catch (error) {
                        console.warn('Could not fetch transaction for balance update:', error);
                    }

                    if (this.isOnline) {
                        try {
                            const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                            await deleteDoc(transactionRef);

                            // Update account balance to reverse the transaction effect
                            if (transactionToDelete) {
                                this.store.dispatch(AccountsActions.updateAccountBalanceForTransaction({
                                    userId: userId,
                                    accountId: transactionToDelete.accountId,
                                    transactionType: 'delete',
                                    oldTransaction: transactionToDelete
                                }));

                                if (transactionToDelete.isSplitTransaction) {
                                    await this.splitwiseService.deleteSplitTransaction(transactionToDelete.id!, userId);
                                }
                            }
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

    /**
     * Get recurring transactions for a user
     */
    getRecurringTransactions(userId: string): Observable<Transaction[]> {
        const transactionsRef = query(
            collection(this.firestore, `users/${userId}/transactions`),
            orderBy('date', 'desc')
        );

        return new Observable<Transaction[]>(observer => {
            const unsubscribe = onSnapshot(
                transactionsRef,
                (querySnapshot) => {
                    const transactions: Transaction[] = [];

                    querySnapshot.forEach(doc => {
                        const transaction = { id: doc.id, ...doc.data() } as Transaction;
                        transactions.push(transaction);
                    });

                    // Filter only recurring transactions
                    const recurringTransactions = transactions.filter(t => t.isRecurring === true);
                    
                    observer.next(recurringTransactions);
                },
                (error) => {
                    console.error('Failed to fetch recurring transactions:', error);
                    observer.next([]);
                }
            );

            return () => unsubscribe();
        });
    }

    /**
     * Get recurring transactions that are due (next occurrence is today or in the past)
     */
    getDueRecurringTransactions(userId: string): Observable<Transaction[]> {
        return this.getRecurringTransactions(userId).pipe(
            map(transactions => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                return transactions.filter(transaction => {
                    if (!transaction.nextOccurrence) return false;
                    
                    const nextOccurrence = transaction.nextOccurrence instanceof Date 
                        ? transaction.nextOccurrence 
                        : transaction.nextOccurrence.toDate();
                    
                    nextOccurrence.setHours(0, 0, 0, 0);
                    
                    return nextOccurrence <= today;
                });
            })
        );
    }

    /**
     * Process a recurring transaction and update its next occurrence
     */
    processRecurringTransaction(userId: string, transaction: Transaction): Observable<void> {
        return new Observable<void>(observer => {
            const processAsync = async () => {
                try {
                    // Create a new transaction for the current occurrence
                    const newTransaction: Omit<Transaction, 'id'> = {
                        ...transaction,
                        date: new Date(),
                        nextOccurrence: undefined, // Remove recurring info for the new transaction
                        isRecurring: false,
                        recurringInterval: undefined,
                        recurringEndDate: undefined,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: userId,
                        updatedBy: userId,
                        syncStatus: SyncStatus.SYNCED,
                        isPending: false,
                        lastSyncedAt: new Date()
                    };

                    // Create the new transaction
                    await this.createTransaction(userId, newTransaction).toPromise();

                    // Update the original recurring transaction with next occurrence
                    const nextOccurrence = this.calculateNextOccurrence(
                        transaction.recurringInterval!,
                        transaction.nextOccurrence || new Date()
                    );

                    const updateData: Partial<Transaction> = {
                        nextOccurrence: nextOccurrence,
                        updatedAt: new Date(),
                        updatedBy: userId
                    };

                    // Check if we've reached the end date
                    if (transaction.recurringEndDate) {
                        const endDate = transaction.recurringEndDate instanceof Date 
                            ? transaction.recurringEndDate 
                            : transaction.recurringEndDate.toDate();
                        
                        if (nextOccurrence > endDate) {
                            // Mark as non-recurring since we've reached the end
                            updateData.isRecurring = false;
                            updateData.recurringInterval = undefined;
                            updateData.recurringEndDate = undefined;
                        }
                    }

                    await this.updateTransaction(userId, transaction.id!, updateData).toPromise();

                    observer.next();
                    observer.complete();
                } catch (error) {
                    console.error('Error processing recurring transaction:', error);
                    observer.error(error);
                }
            };

            processAsync();
        });
    }

    /**
     * Calculate the next occurrence date based on the recurring interval
     */
    private calculateNextOccurrence(interval: RecurringInterval, currentDate: Date | Timestamp): Date {
        const date = currentDate instanceof Date ? currentDate : currentDate.toDate();
        const nextDate = new Date(date);

        switch (interval) {
            case RecurringInterval.DAILY:
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case RecurringInterval.WEEKLY:
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case RecurringInterval.MONTHLY:
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case RecurringInterval.YEARLY:
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
        }

        return nextDate;
    }

    /**
 * Create split transaction
 */
    private async createSplitTransaction(selectedGroupId: string, formData: any, originalTransactionId: string, userId: string): Promise<void> {


        const selectedGroup = await this.splitwiseService.getGroupById(selectedGroupId);

        if (!selectedGroup) {
            throw new Error('No group selected for split transaction');
        }

        // Create equal splits for all group members
        const splits: TransactionSplit[] = selectedGroup.members.map((member: any) => ({
            userId: member.userId,
            amount: parseFloat(formData.amount) / selectedGroup.members.length,
            percentage: 100 / selectedGroup.members.length,
            isPaid: member.userId === userId, // Current user is marked as paid
            email: member.email,
            displayName: member.displayName
        }));

        const request: CreateSplitTransactionRequest = {
            groupId: selectedGroup.id!,
            amount: parseFloat(formData.amount),
            splits: splits,
            originalTransactionId: originalTransactionId
        };

        // Dispatch action to create split transaction
        this.store.dispatch(SplitwiseActions.createSplitTransaction({ request }));
    }
}
