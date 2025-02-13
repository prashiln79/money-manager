import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, Timestamp, addDoc, onSnapshot } from '@angular/fire/firestore';
// import firebase from 'firebase/app';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface Transaction {
    transactionId?: string;
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
}

@Injectable({
    providedIn: 'root'
})
export class TransactionsService {
    constructor(private firestore: Firestore, private auth: Auth) { }


    async createTransaction(userId: string, transaction: Omit<Transaction, 'transactionId'>): Promise<void> {
        const transactionsCollection = collection(this.firestore, `users/${userId}/transactions`);
        await addDoc(transactionsCollection, {
            ...transaction,
            date: Timestamp.fromDate(transaction.date.toDate()),  // Ensure date is stored as a Firestore timestamp
        });
    }

    // 🔹 Get all transactions for a user
    getTransactions(userId: string): Observable<Transaction[]> {
        const transactionsRef = collection(this.firestore, `users/${userId}/transactions`);
        
        return new Observable<Transaction[]>(observer => {
            const unsubscribe = onSnapshot(transactionsRef, (querySnapshot) => {
                const transactions: Transaction[] = [];
                querySnapshot.forEach(doc => {
                    transactions.push({ id: doc.id, ...doc.data() } as unknown as Transaction);
                });
                observer.next(transactions);
            }, error => {
                observer.error(error);
            });
    
            return () => unsubscribe(); // Cleanup on unsubscribe
        });
    }

    // 🔹 Get a single transaction by its ID
    async getTransaction(userId: string, transactionId: string): Promise<Transaction | undefined> {
        const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
        const transactionSnap = await getDoc(transactionRef);
        if (transactionSnap.exists()) {
            return transactionSnap.data() as Transaction;
        }
        return undefined;
    }

    // 🔹 Update an existing transaction
    async updateTransaction(userId: string, transactionId: string, updatedTransaction: Partial<Transaction>): Promise<void> {
        const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
        await updateDoc(transactionRef, updatedTransaction);
    }

    // 🔹 Delete a transaction
    async deleteTransaction(userId: string, transactionId: string): Promise<void> {
        const transactionRef = doc(this.firestore, `users/${userId}/transactions/${transactionId}`);
        await deleteDoc(transactionRef);
    }
}
