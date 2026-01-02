import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { TransactionsService } from '../../util/service/db/transactions.service';
import * as TransactionsActions from './transactions.actions';

@Injectable()
export class TransactionsEffects {
  
  loadTransactions$ = createEffect(() => this.actions$.pipe(
    ofType(TransactionsActions.loadTransactions),
    mergeMap(({ userId }) => this.transactionsService.getTransactions(userId)
      .pipe(
        map(transactions => TransactionsActions.loadTransactionsSuccess({ transactions })),
        catchError(error => of(TransactionsActions.loadTransactionsFailure({ error })))
      ))
  ));

  createTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(TransactionsActions.createTransaction),
    mergeMap(({ userId, transaction }) => 
      this.transactionsService.createTransaction(userId, transaction)
        .pipe(
          map(() => {
            // Since the service doesn't return the created transaction, we'll need to reload
            // In a real app, you might want to modify the service to return the created transaction
            return TransactionsActions.loadTransactions({ userId });
          }),
          catchError(error => of(TransactionsActions.createTransactionFailure({ error })))
        ))
  ));

  updateTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(TransactionsActions.updateTransaction),
    mergeMap(({ userId, transactionId, transaction }) => 
      this.transactionsService.updateTransaction(userId, transactionId, transaction)
        .pipe(
          map(() => {
            // Reload transactions to get the updated data
            return TransactionsActions.loadTransactions({ userId });
          }),
          catchError(error => of(TransactionsActions.updateTransactionFailure({ error })))
        ))
  ));

  deleteTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(TransactionsActions.deleteTransaction),
    mergeMap(({ userId, transactionId }) => 
      this.transactionsService.deleteTransaction(userId, transactionId)
        .pipe(
          map(() => TransactionsActions.deleteTransactionSuccess({ transactionId })),
          catchError(error => of(TransactionsActions.deleteTransactionFailure({ error })))
        ))
  ));

  getTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(TransactionsActions.getTransaction),
    mergeMap(({ userId, transactionId }) => 
      this.transactionsService.getTransaction(userId, transactionId)
        .pipe(
          map(transaction => {
            if (transaction) {
              return TransactionsActions.getTransactionSuccess({ transaction });
            } else {
              return TransactionsActions.getTransactionFailure({ error: 'Transaction not found' });
            }
          }),
          catchError(error => of(TransactionsActions.getTransactionFailure({ error })))
        ))
  ));

  constructor(
    private actions$: Actions,
    private transactionsService: TransactionsService
  ) {}
} 