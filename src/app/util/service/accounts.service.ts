import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface Account {
    accountId: string;
    userId: string;
    name: string;
    type: 'bank' | 'cash' | 'credit' | 'loan';
    balance: number;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AccountsService {
    constructor(private firestore: Firestore, private auth: Auth) { }

    // 🔹 Create a new account for the logged-in user
    async createAccount(userId: string, account: Account): Promise<void> {
        const accountRef = doc(this.firestore, `users/${userId}/accounts/${account.accountId}`);
        await setDoc(accountRef, account);
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
    async getAccount(userId: string, accountId: string): Promise<Account | undefined> {
        const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
        const accountSnap = await getDoc(accountRef);
        if (accountSnap.exists()) {
            return accountSnap.data() as Account;
        }
        return undefined;
    }

    // 🔹 Update an existing account's details
    async updateAccount(userId: string, accountId: string, account: Partial<Account>): Promise<void> {
        const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
        await updateDoc(accountRef, account);
    }

    // 🔹 Delete an account
    async deleteAccount(userId: string, accountId: string): Promise<void> {
        const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
        await deleteDoc(accountRef);
    }
}
