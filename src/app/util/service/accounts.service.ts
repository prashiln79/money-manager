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

    // 🔹 Generate a unique account ID
    private generateAccountId(): string {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
