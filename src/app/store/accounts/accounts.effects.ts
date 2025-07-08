import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { AccountsService } from '../../util/service/accounts.service';
import * as AccountsActions from './accounts.actions';

@Injectable()
export class AccountsEffects {
  
  loadAccounts$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.loadAccounts),
    mergeMap(({ userId }) => this.accountsService.getAccounts(userId)
      .pipe(
        map(accounts => AccountsActions.loadAccountsSuccess({ accounts })),
        catchError(error => of(AccountsActions.loadAccountsFailure({ error })))
      ))
  ));

  createAccount$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.createAccount),
    mergeMap(({ userId, accountData }) => 
      this.accountsService.createAccount(userId, accountData)
        .pipe(
          map(accountId => {
            // Since the service returns accountId, we need to reload to get the full account
            return AccountsActions.loadAccounts({ userId });
          }),
          catchError(error => of(AccountsActions.createAccountFailure({ error })))
        ))
  ));

  updateAccount$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.updateAccount),
    mergeMap(({ userId, accountId, accountData }) => 
      this.accountsService.updateAccount(userId, accountId, accountData)
        .pipe(
          map(() => {
            // Reload accounts to get the updated data
            return AccountsActions.loadAccounts({ userId });
          }),
          catchError(error => of(AccountsActions.updateAccountFailure({ error })))
        ))
  ));

  deleteAccount$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.deleteAccount),
    mergeMap(({ userId, accountId }) => 
      this.accountsService.deleteAccount(userId, accountId)
        .pipe(
          map(() => AccountsActions.deleteAccountSuccess({ accountId })),
          catchError(error => of(AccountsActions.deleteAccountFailure({ error })))
        ))
  ));

  getAccount$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.getAccount),
    mergeMap(({ userId, accountId }) => 
      this.accountsService.getAccount(userId, accountId)
        .pipe(
          map(account => {
            if (account) {
              return AccountsActions.getAccountSuccess({ account });
            } else {
              return AccountsActions.getAccountFailure({ error: 'Account not found' });
            }
          }),
          catchError(error => of(AccountsActions.getAccountFailure({ error })))
        ))
  ));

  constructor(
    private actions$: Actions,
    private accountsService: AccountsService
  ) {}
} 