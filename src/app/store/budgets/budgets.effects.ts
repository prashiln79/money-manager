import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { BudgetsService } from '../../util/service/db/budgets.service';
import * as BudgetsActions from './budgets.actions';

@Injectable()
export class BudgetsEffects {
  loadBudgets$ = createEffect(() => this.actions$.pipe(
    ofType(BudgetsActions.loadBudgets),
    mergeMap(({ userId }) => this.budgetsService.getBudgets(userId)
      .pipe(
        map(budgets => BudgetsActions.loadBudgetsSuccess({ budgets })),
        catchError(error => of(BudgetsActions.loadBudgetsFailure({ error })))
      ))
  ));

  createBudget$ = createEffect(() => this.actions$.pipe(
    ofType(BudgetsActions.createBudget),
    mergeMap(({ userId, budget }) => from(this.budgetsService.createBudget(userId, budget))
      .pipe(
        map(() => BudgetsActions.createBudgetSuccess({ budget })),
        catchError(error => of(BudgetsActions.createBudgetFailure({ error })))
      ))
  ));

  updateBudget$ = createEffect(() => this.actions$.pipe(
    ofType(BudgetsActions.updateBudget),
    mergeMap(({ userId, budgetId, budget }) => from(this.budgetsService.updateBudget(userId, budgetId, budget))
      .pipe(
        map(() => BudgetsActions.updateBudgetSuccess({ budget: { ...budget, budgetId } as any })),
        catchError(error => of(BudgetsActions.updateBudgetFailure({ error })))
      ))
  ));

  deleteBudget$ = createEffect(() => this.actions$.pipe(
    ofType(BudgetsActions.deleteBudget),
    mergeMap(({ userId, budgetId }) => from(this.budgetsService.deleteBudget(userId, budgetId))
      .pipe(
        map(() => BudgetsActions.deleteBudgetSuccess({ budgetId })),
        catchError(error => of(BudgetsActions.deleteBudgetFailure({ error })))
      ))
  ));

  updateSpent$ = createEffect(() => this.actions$.pipe(
    ofType(BudgetsActions.updateSpent),
    mergeMap(({ userId, budgetId, amount }) => from(this.budgetsService.updateSpent(userId, budgetId, amount))
      .pipe(
        map(() => BudgetsActions.updateSpentSuccess({ budget: { budgetId, spent: amount } as any })),
        catchError(error => of(BudgetsActions.updateSpentFailure({ error })))
      ))
  ));

  constructor(
    private actions$: Actions,
    private budgetsService: BudgetsService
  ) {}
} 