import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, addDoc, onSnapshot, writeBatch } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
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
import { CommonSyncService, SyncItem } from './common-sync.service';
import { BaseService } from './base.service';

@Injectable({
    providedIn: 'root'
})
export class TransactionsService extends BaseService {
    private transactionsSubject = new BehaviorSubject<Transaction[]>([]);

    constructor(
        firestore: Firestore,
        auth: Auth,
        private dateService: DateService,
        private store: Store<AppState>,
        private accountsService: AccountsService,
        private splitwiseService: SplitwiseService,
        private commonSyncService: CommonSyncService
    ) {
        super(firestore, auth);
    }

    /**
     * Create a new transaction
     */
    createTransaction(userId: string, transaction: Omit<Transaction, 'id'>): Observable<void> {
        return new Observable<void>(observer => {
            const transactionData = {
                ...transaction,
                date: this.dateService.toDate(transaction.date),
                syncStatus: 'synced' as const
            };

            const createTransactionAsync = async () => {
                try {
                    if (this.commonSyncService.isCurrentlyOnline()) {
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
                            await this.addToSyncQueue('create', transactionData);
                            observer.next();
                            observer.complete();
                        }
                    } else {
                        // Store offline
                        await this.addToSyncQueue('create', transactionData);
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

    /**
     * Update an existing transaction
     */
    updateTransaction(userId: string, transactionId: string, updatedTransaction: Partial<Transaction>): Observable<void> {
        return new Observable<void>(observer => {
            const updateTransactionAsync = async () => {
                try {
                    const updateData = {
                        ...updatedTransaction,
                        updatedAt: new Date(),
                        updatedBy: userId,
                        syncStatus: 'synced' as const
                    };

                    if (this.commonSyncService.isCurrentlyOnline()) {
                        try {
                            const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                            await updateDoc(transactionRef, updateData);

                            // Update account balance if amount or account changed
                            if (updatedTransaction.amount || updatedTransaction.accountId) {
                                this.store.dispatch(AccountsActions.updateAccountBalanceForTransaction({
                                    userId: userId,
                                    accountId: updatedTransaction.accountId || '',
                                    transactionType: 'update',
                                    oldTransaction: { id: transactionId } as Transaction,
                                    newTransaction: updateData as Transaction
                                }));
                            }

                            observer.next();
                            observer.complete();
                        } catch (error) {
                            console.error('Failed to update transaction online:', error);
                            await this.addToSyncQueue('update', { id: transactionId, ...updateData });
                            observer.next();
                            observer.complete();
                        }
                    } else {
                        await this.addToSyncQueue('update', { id: transactionId, ...updateData, syncStatus: 'pending' });
                        observer.next();
                        observer.complete();
                    }
                } catch (error) {
                    observer.error(error);
                }
            };

            updateTransactionAsync();
        });
    }

    /**
     * Delete a transaction
     */
    deleteTransaction(userId: string, transactionId: string): Observable<void> {
        return new Observable<void>(observer => {
            const deleteTransactionAsync = async () => {
                try {
                    // Get transaction data for balance update
                    const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                    const transactionDoc = await getDoc(transactionRef);
                    const transactionToDelete = transactionDoc.exists() ? { id: transactionDoc.id, ...transactionDoc.data() } as Transaction : null;

                    if (this.commonSyncService.isCurrentlyOnline()) {
                        try {
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

                            observer.next();
                            observer.complete();
                        } catch (error) {
                            console.error('Failed to delete transaction online:', error);
                            await this.addToSyncQueue('delete', { id: transactionId });
                            observer.next();
                            observer.complete();
                        }
                    } else {
                        await this.addToSyncQueue('delete', { id: transactionId });
                        observer.next();
                        observer.complete();
                    }
                } catch (error) {
                    observer.error(error);
                }
            };

            deleteTransactionAsync();
        });
    }

    /**
     * Get all transactions for a user
     */
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

                    this.transactionsSubject.next(transactions);
                    observer.next(transactions);
                },
                (error) => {
                    console.error('Failed to fetch transactions:', error);
                    observer.next([]);
                }
            );

            return () => unsubscribe();
        });
    }

    /**
     * Get a specific transaction
     */
    getTransaction(userId: string, transactionId: string): Observable<Transaction | undefined> {
        return new Observable<Transaction | undefined>(observer => {
            const getTransactionAsync = async () => {
                try {
                    const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
                    const transactionDoc = await getDoc(transactionRef);

                    if (transactionDoc.exists()) {
                        const transaction = { id: transactionDoc.id, ...transactionDoc.data() } as Transaction;
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

    /**
     * Get sync status
     */
    getSyncStatus(): { count: number; hasPendingOperations: boolean } {
        const status = this.commonSyncService.syncStatus;
        return {
            count: status.pendingItems,
            hasPendingOperations: status.pendingItems > 0
        };
    }

    /**
     * Force sync offline operations
     */
    async forceSync(): Promise<void> {
        await this.commonSyncService.manualSync();
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
                    if (transaction.recurringInterval && transaction.nextOccurrence) {
                        const nextOccurrence = this.calculateNextOccurrence(
                            transaction.recurringInterval,
                            transaction.nextOccurrence
                        );

                        const updatedRecurringTransaction: Partial<Transaction> = {
                            nextOccurrence: nextOccurrence,
                            updatedAt: new Date(),
                            updatedBy: userId
                        };

                        // Check if we've reached the end date
                        if (transaction.recurringEndDate && nextOccurrence > transaction.recurringEndDate) {
                            // Mark as non-recurring since we've reached the end
                            updatedRecurringTransaction.isRecurring = false;
                            updatedRecurringTransaction.recurringInterval = undefined;
                            updatedRecurringTransaction.recurringEndDate = undefined;
                        }

                        await this.updateTransaction(userId, transaction.id!, updatedRecurringTransaction).toPromise();
                    }

                    observer.next();
                    observer.complete();
                } catch (error) {
                    console.error('Failed to process recurring transaction:', error);
                    observer.error(error);
                }
            };

            processAsync();
        });
    }

    /**
     * Calculate next occurrence for recurring transactions
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
                nextDate.setDate(nextDate.getDate() + 1);
        }

        return nextDate;
    }

    /**
     * Create split transaction
     */
    private async createSplitTransaction(selectedGroupId: string, formData: any, originalTransactionId: string, userId: string): Promise<void> {
        try {
            const splitTransactionData: CreateSplitTransactionRequest = {
                groupId: selectedGroupId,
                originalTransactionId: originalTransactionId,
                amount: formData.amount,
                splits: formData.splits || []
            };

            await this.splitwiseService.createSplitTransaction(splitTransactionData, userId).toPromise();
        } catch (error) {
            console.error('Failed to create split transaction:', error);
        }
    }

    /**
     * Add transaction to sync queue
     */
    private async addToSyncQueue(operation: 'create' | 'update' | 'delete', data: any): Promise<void> {
        const syncItem: Omit<SyncItem, 'timestamp' | 'retryCount'> = {
            id: this.generateId(),
            type: 'transaction',
            operation: operation,
            data: data,
            maxRetries: 3
        };

        const result = await this.commonSyncService.registerSyncItem(syncItem);
        if (!result.success) {
            console.error('Failed to register transaction for sync:', result.errors);
        }
    }

    /**
     * Check if Firebase validation error
     */
    private isFirebaseValidationError(error: any): boolean {
        return error && (
            error.code === 'permission-denied' ||
            error.code === 'unavailable' ||
            error.code === 'invalid-argument' ||
            error.message?.includes('permission') ||
            error.message?.includes('validation')
        );
    }
}
