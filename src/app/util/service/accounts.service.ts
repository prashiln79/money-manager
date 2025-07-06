import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../models/account.model';

@Injectable({
    providedIn: 'root'
})
export class AccountsService {
    constructor(private firestore: Firestore, private auth: Auth) { }

    // 🔹 Create a new account for the logged-in user
    async createAccount(userId: string, accountData: CreateAccountRequest): Promise<string> {
        const accountId = this.generateAccountId();
        const account: Account = {
            accountId,
            userId,
            ...accountData,
            createdAt: new Date() as any, // Firebase Timestamp
            isActive: true
        };
        const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
        await setDoc(accountRef, account);
        return accountId;
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
    async updateAccount(userId: string, accountId: string, accountData: UpdateAccountRequest): Promise<void> {
        const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
        const updateData = {
            ...accountData,
            updatedAt: new Date() as any // Firebase Timestamp
        };
        await updateDoc(accountRef, updateData);
    }

    // 🔹 Delete an account
    async deleteAccount(userId: string, accountId: string): Promise<void> {
        const accountRef = doc(this.firestore, `users/${userId}/accounts/${accountId}`);
        await deleteDoc(accountRef);
    }

    // 🔹 Generate a unique account ID
    private generateAccountId(): string {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
