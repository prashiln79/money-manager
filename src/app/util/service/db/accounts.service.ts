import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, writeBatch } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';

@Injectable({
    providedIn: 'root'
})
export class AccountsService {
    constructor(private firestore: Firestore, private auth: Auth) { }

    // 🔹 Create a new account for the logged-in user
    createAccount(userId: string, accountData: CreateAccountRequest): Observable<string> {
        return new Observable<string>(observer => {
            const accountId = this.generateAccountId();
            const account: Account = {
                accountId,
                userId,
                ...accountData,
                createdAt: new Date() as any, // Firebase Timestamp
                isActive: true
            };
            const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
            setDoc(accountRef, account).then(() => {
                observer.next(accountId);
                observer.complete();
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    // 🔹 Get all accounts for the logged-in user
    getAccounts(userId: string): Observable<Account[]> {
        const accountsRef = collection(this.firestore, `users/${userId}/accounts`);
        return new Observable<Account[]>(observer => {
            getDocs(accountsRef).then(querySnapshot => {
                const accounts: Account[] = [];
                querySnapshot.forEach(doc => {
                    accounts.push(doc.data() as Account);
                });
                observer.next(accounts);
            });
        });
    }

    // 🔹 Get a single account by its ID
    getAccount(userId: string, accountId: string): Observable<Account | undefined> {
        return new Observable<Account | undefined>(observer => {
            const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
            getDoc(accountRef).then(accountSnap => {
                if (accountSnap.exists()) {
                    observer.next(accountSnap.data() as Account);
                } else {
                    observer.next(undefined);
                }
                observer.complete();
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    // 🔹 Update an existing account's details
    updateAccount(userId: string, accountId: string, accountData: UpdateAccountRequest): Observable<void> {
        return new Observable<void>(observer => {
            const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
            const updateData = {
                ...accountData,
                updatedAt: new Date() as any // Firebase Timestamp
            };
            updateDoc(accountRef, updateData).then(() => {
                observer.next();
                observer.complete();
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    // 🔹 Delete an account
    deleteAccount(userId: string, accountId: string): Observable<void> {
        return new Observable<void>(observer => {
            const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
            deleteDoc(accountRef).then(() => {
                observer.next();
                observer.complete();
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    // 🔹 Update account balance based on transaction changes
    updateAccountBalanceForTransaction(
        userId: string, 
        accountId: string, 
        transactionType: 'create' | 'update' | 'delete',
        oldTransaction?: Transaction,
        newTransaction?: Transaction
    ): Observable<number> {
        return new Observable<number>(observer => {
            const updateBalanceAsync = async () => {
                try {
                    // Get current account
                    const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
                    const accountSnap = await getDoc(accountRef);
                    
                    if (!accountSnap.exists()) {
                        observer.error('Account not found');
                        return;
                    }

                    const account = accountSnap.data() as Account;
                    let balanceChange = 0;
                    let loanRemainingBalanceChange = 0;

                    switch (transactionType) {
                        case 'create':
                            if (newTransaction) {
                                console.log('Creating transaction:', newTransaction);
                                // For income transactions, add to balance
                                // For expense transactions, subtract from balance
                                if (newTransaction.type === 'income') {
                                    balanceChange = newTransaction.amount;
                                    console.log('Income transaction - adding to balance:', newTransaction.amount);
                                } else if (newTransaction.type === 'expense') {
                                    balanceChange = -newTransaction.amount;
                                    console.log('Expense transaction - subtracting from balance:', newTransaction.amount);
                                }
                                
                                // For loan accounts, if it's an expense transaction, it reduces the remaining balance
                                if (account.type === 'loan' && newTransaction.type === 'expense') {
                                    loanRemainingBalanceChange = -newTransaction.amount;
                                }
                            }
                            break;
                        
                        case 'update':
                            if (oldTransaction && newTransaction) {
                                // Calculate the difference
                                const oldAmount = oldTransaction.type === 'income' ? oldTransaction.amount : -oldTransaction.amount;
                                const newAmount = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
                                balanceChange = newAmount - oldAmount;
                                
                                // For loan accounts, calculate the difference in remaining balance
                                if (account.type === 'loan') {
                                    const oldLoanChange = oldTransaction.type === 'expense' ? -oldTransaction.amount : 0;
                                    const newLoanChange = newTransaction.type === 'expense' ? -newTransaction.amount : 0;
                                    loanRemainingBalanceChange = newLoanChange - oldLoanChange;
                                }
                            }
                            break;
                        
                        case 'delete':
                            if (oldTransaction) {
                                // Reverse the transaction effect
                                if (oldTransaction.type === 'income') {
                                    balanceChange = -oldTransaction.amount;
                                } else if (oldTransaction.type === 'expense') {
                                    balanceChange = oldTransaction.amount;
                                }
                                
                                // For loan accounts, reverse the remaining balance change
                                if (account.type === 'loan' && oldTransaction.type === 'expense') {
                                    loanRemainingBalanceChange = oldTransaction.amount;
                                }
                            }
                            break;
                    }

                    // Calculate new balance
                    const currentBalance = account.balance || 0;
                    const newBalance = currentBalance + balanceChange;
                    
                    console.log('Balance calculation:', { currentBalance, balanceChange, newBalance });

                    // Prepare update data
                    const updateData: any = {
                        balance: newBalance,
                        updatedAt: new Date() as any
                    };

                    // Update loan remaining balance if it's a loan account and there's a change
                    if (account.type === 'loan' && account.loanDetails && loanRemainingBalanceChange !== 0) {
                        const currentRemainingBalance = account.loanDetails.remainingBalance || 0;
                        const newRemainingBalance = Math.max(0, currentRemainingBalance + loanRemainingBalanceChange);
                        
                        updateData['loanDetails.remainingBalance'] = newRemainingBalance;
                    }

                    await updateDoc(accountRef, updateData);

                    observer.next(newBalance);
                    observer.complete();
                } catch (error) {
                    observer.error(error);
                }
            };

            updateBalanceAsync();
        });
    }

    // 🔹 Update account balance for multiple transactions (batch update)
    updateAccountBalanceForTransactions(
        userId: string,
        transactions: { accountId: string; type: 'income' | 'expense'; amount: number }[]
    ): Observable<void> {
        return new Observable<void>(observer => {
            const updateBalancesAsync = async () => {
                try {
                    const batch = writeBatch(this.firestore);
                    const accountBalanceChanges = new Map<string, number>();
                    const accountLoanChanges = new Map<string, number>();

                    // Calculate balance changes for each account
                    transactions.forEach(transaction => {
                        const currentChange = accountBalanceChanges.get(transaction.accountId) || 0;
                        const transactionChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
                        accountBalanceChanges.set(transaction.accountId, currentChange + transactionChange);
                        
                        // Track loan changes for expense transactions
                        if (transaction.type === 'expense') {
                            const currentLoanChange = accountLoanChanges.get(transaction.accountId) || 0;
                            accountLoanChanges.set(transaction.accountId, currentLoanChange + transaction.amount);
                        }
                    });

                    // Update each account's balance
                    for (const [accountId, balanceChange] of accountBalanceChanges) {
                        const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
                        const accountSnap = await getDoc(accountRef);
                        
                        if (accountSnap.exists()) {
                            const account = accountSnap.data() as Account;
                            const newBalance = (account.balance || 0) + balanceChange;
                            const updateData: any = {
                                balance: newBalance,
                                updatedAt: new Date() as any
                            };

                            // Handle loan account updates
                            if (account.type === 'loan' && account.loanDetails) {
                                const loanChange = accountLoanChanges.get(accountId) || 0;
                                if (loanChange > 0) {
                                    const currentRemainingBalance = account.loanDetails.remainingBalance || 0;
                                    const newRemainingBalance = Math.max(0, currentRemainingBalance - loanChange);
                                    
                                    updateData['loanDetails.remainingBalance'] = newRemainingBalance;
                                }
                            }

                            batch.update(accountRef, updateData);
                        }
                    }

                    await batch.commit();
                    observer.next();
                    observer.complete();
                } catch (error) {
                    observer.error(error);
                }
            };

            updateBalancesAsync();
        });
    }

    // 🔹 Update account balance when transaction account is changed
    updateAccountBalanceForAccountTransfer(
        userId: string,
        oldAccountId: string,
        newAccountId: string,
        transaction: Transaction
    ): Observable<void> {
        return new Observable<void>(observer => {
            const updateBalancesAsync = async () => {
                try {
                    const batch = writeBatch(this.firestore);
                    
                    // Get both accounts
                    const oldAccountRef = doc(this.firestore, `users/${userId}/accounts/${oldAccountId}`);
                    const newAccountRef = doc(this.firestore, `users/${userId}/accounts/${newAccountId}`);
                    
                    const [oldAccountSnap, newAccountSnap] = await Promise.all([
                        getDoc(oldAccountRef),
                        getDoc(newAccountRef)
                    ]);
                    
                    if (!oldAccountSnap.exists() || !newAccountSnap.exists()) {
                        observer.error('One or both accounts not found');
                        return;
                    }

                    const oldAccount = oldAccountSnap.data() as Account;
                    const newAccount = newAccountSnap.data() as Account;
                    
                    // Calculate the transaction effect
                    const transactionEffect = transaction.type === 'income' ? transaction.amount : -transaction.amount;
                    
                    // Prepare update data for old account
                    const oldAccountUpdateData: any = {
                        balance: (oldAccount.balance || 0) - transactionEffect,
                        updatedAt: new Date() as any
                    };
                    
                    // Handle loan account updates for old account
                    if (oldAccount.type === 'loan' && oldAccount.loanDetails && transaction.type === 'expense') {
                        // Remove the loan payment effect from old account
                        const currentRemainingBalance = oldAccount.loanDetails.remainingBalance || 0;
                        const newRemainingBalance = currentRemainingBalance + transaction.amount;
                        
                        oldAccountUpdateData['loanDetails.remainingBalance'] = newRemainingBalance;
                    }
                    
                    // Prepare update data for new account
                    const newAccountUpdateData: any = {
                        balance: (newAccount.balance || 0) + transactionEffect,
                        updatedAt: new Date() as any
                    };
                    
                    // Handle loan account updates for new account
                    if (newAccount.type === 'loan' && newAccount.loanDetails && transaction.type === 'expense') {
                        // Add the loan payment effect to new account
                        const currentRemainingBalance = newAccount.loanDetails.remainingBalance || 0;
                        const newRemainingBalance = Math.max(0, currentRemainingBalance - transaction.amount);
                        
                        newAccountUpdateData['loanDetails.remainingBalance'] = newRemainingBalance;
                    }
                    
                    // Update both accounts
                    batch.update(oldAccountRef, oldAccountUpdateData);
                    batch.update(newAccountRef, newAccountUpdateData);
                    
                    await batch.commit();
                    observer.next();
                    observer.complete();
                } catch (error) {
                    observer.error(error);
                }
            };

            updateBalancesAsync();
        });
    }



    // 🔹 Generate a unique account ID
    private generateAccountId(): string {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
