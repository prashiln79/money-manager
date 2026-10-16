import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap, withLatestFrom, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import * as AccountsSelectors from './accounts.selectors';
import { AccountsService } from '../../util/service/db/accounts.service';
import * as AccountsActions from './accounts.actions';

@Injectable()
export class AccountsEffects {
  
  loadAccounts$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.loadAccounts),
    withLatestFrom(
      this.store.select(AccountsSelectors.selectAllAccountsRaw),
      this.store.select(AccountsSelectors.selectAccountsLastLoaded)
    ),
    filter(([action, accounts, lastLoaded]) => {
      if (action.force) return true;
      const isCacheValid = !!lastLoaded && (Date.now() - lastLoaded < 300000); // 5 minutes TTL
      return !isCacheValid || accounts.length === 0;
    }),
    switchMap(([action]) => this.accountsService.getAccounts(action.userId)
      .pipe(
        map(accounts => AccountsActions.loadAccountsSuccess({ accounts, context: action.context })),
        catchError(error => of(AccountsActions.loadAccountsFailure({ error })))
      ))
  ));

  createAccount$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.createAccount),
    mergeMap(({ userId, accountData }) => 
      this.accountsService.createAccount(userId, accountData)
        .pipe(
          map(() => ({ type: '[Accounts] Create Account Success (Handled by Service)' })),
          catchError(error => of(AccountsActions.createAccountFailure({ error })))
        ))
  ));

  updateAccount$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.updateAccount),
    mergeMap(({ userId, accountId, accountData }) => 
      this.accountsService.updateAccount(userId, accountId, accountData)
        .pipe(
          map(() => ({ type: '[Accounts] Update Account Success (Handled by Service)' })),
          catchError(error => of(AccountsActions.updateAccountFailure({ error })))
        ))
  ));

  deleteAccount$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.deleteAccount),
    mergeMap(({ userId, accountId }) => 
      this.accountsService.deleteAccount(userId, accountId)
        .pipe(
          map(() => ({ type: '[Accounts] Delete Account Success (Handled by Service)' })),
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

  updateAccountBalanceForTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.updateAccountBalanceForTransaction),
    mergeMap(({ userId, accountId, transactionType, oldTransaction, newTransaction }) => 
      this.accountsService.updateAccountBalanceForTransaction(userId, accountId, transactionType, oldTransaction, newTransaction)
        .pipe(
          map(() => ({ type: '[Accounts] Update Balance For Transaction Success (Handled by Service)' })),
          catchError(error => of(AccountsActions.updateAccountBalanceForTransactionFailure({ error })))
        ))
  ));

  updateAccountBalanceForTransactions$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.updateAccountBalanceForTransactions),
    mergeMap(({ userId, transactions }) => 
      this.accountsService.updateAccountBalanceForTransactions(userId, transactions)
        .pipe(
          map(() => ({ type: '[Accounts] Update Balance For Transactions Success (Handled by Service)' })),
          catchError(error => of(AccountsActions.updateAccountBalanceForTransactionsFailure({ error })))
        ))
  ));

  updateAccountBalanceForAccountTransfer$ = createEffect(() => this.actions$.pipe(
    ofType(AccountsActions.updateAccountBalanceForAccountTransfer),
    mergeMap(({ userId, oldAccountId, newAccountId, transaction }) => 
      this.accountsService.updateAccountBalanceForAccountTransfer(userId, oldAccountId, newAccountId, transaction)
        .pipe(
          map(() => ({ type: '[Accounts] Update Balance For Transfer Success (Handled by Service)' })),
          catchError(error => of(AccountsActions.updateAccountBalanceForAccountTransferFailure({ error })))
        ))
  ));

  constructor(
    private actions$: Actions,
    private accountsService: AccountsService,
    private store: Store<AppState>
  ) {}
} 