import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Transaction } from '../../models/transaction.model';
import { TransactionsService } from './transactions.service';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CurrencyService } from '../currency.service';
import { DateService } from '../date.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import { AccountsService } from './accounts.service';

import { CommonSyncService } from '../common-sync.service';
import { LocalIndexDBStorageService } from '../indexdb-storage.service';
import { UserService } from './user.service';
import { FamilyService } from 'src/app/modules/family/services/family.service';

@Injectable({
    providedIn: 'root'
})
export class FamilyTransactionsService extends TransactionsService {
    constructor(
        firestore: Firestore,
        auth: Auth,
        currencyService: CurrencyService,
        dateService: DateService,
        store: Store<AppState>,
        accountsService: AccountsService,
        commonSyncService: CommonSyncService,
        localStorageUtility: LocalIndexDBStorageService,
        userService: UserService,
        private familyService: FamilyService
    ) {
        super(
            firestore,
            auth,
            currencyService,
            dateService,
            store,
            accountsService,
            commonSyncService,
            localStorageUtility,
            userService
        );
    }

    protected override getTransactionsPath(userId: string, familyId?: string): string {
        const fId = familyId !== undefined ? familyId : this.getFamilyId();
        
        if (!fId) {
            console.warn('[FamilyTransactionsService] No familyId found, returning invalid path for safety');
            return `family-groups/none/transactions`;
        }
        
        return `family-groups/${fId}/transactions`;
    }

    protected override getTransactionPath(userId: string, transactionId: string, familyId?: string): string {
        return `${this.getTransactionsPath(userId, familyId)}/${transactionId}`;
    }

    protected override getFamilyId(): string | undefined {
        return this.familyService.activeFamilyId() || '';
    }

    /**
     * Override createTransaction to ensure familyId and creator profile data are always set
     */
    override createTransaction(userId: string, transaction: Transaction): Observable<void> {
        const familyId = transaction.familyId || this.getFamilyId();
        const currentUser = this.userService.getCurrentUserSnapshot();
        const userDisplayName = transaction.userDisplayName || currentUser?.displayName || currentUser?.firstName || undefined;
        const userPhotoURL = transaction.userPhotoURL || currentUser?.photoURL || undefined;

        const transactionWithFamily = { 
            ...transaction, 
            familyId,
            ...(userDisplayName ? { userDisplayName } : {}),
            ...(userPhotoURL ? { userPhotoURL } : {})
        } as Transaction;
        
        return super.createTransaction(userId, transactionWithFamily);
    }
}
