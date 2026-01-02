import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { GoalsService } from '../../util/service/db/goals.service';
import * as GoalsActions from './goals.actions';

@Injectable()
export class GoalsEffects {
  loadGoals$ = createEffect(() => this.actions$.pipe(
    ofType(GoalsActions.loadGoals),
    mergeMap(({ userId }) => this.goalsService.getGoals(userId)
      .pipe(
        map(goals => GoalsActions.loadGoalsSuccess({ goals })),
        catchError(error => of(GoalsActions.loadGoalsFailure({ error })))
      ))
  ));

  createGoal$ = createEffect(() => this.actions$.pipe(
    ofType(GoalsActions.createGoal),
    mergeMap(({ userId, goal }) => from(this.goalsService.createGoal(userId, goal))
      .pipe(
        map(() => GoalsActions.createGoalSuccess({ goal })),
        catchError(error => of(GoalsActions.createGoalFailure({ error })))
      ))
  ));

  updateGoal$ = createEffect(() => this.actions$.pipe(
    ofType(GoalsActions.updateGoal),
    mergeMap(({ userId, goalId, goal }) => from(this.goalsService.updateGoal(userId, goalId, goal))
      .pipe(
        map(() => GoalsActions.updateGoalSuccess({ goal: { ...goal, goalId } as any })),
        catchError(error => of(GoalsActions.updateGoalFailure({ error })))
      ))
  ));

  deleteGoal$ = createEffect(() => this.actions$.pipe(
    ofType(GoalsActions.deleteGoal),
    mergeMap(({ userId, goalId }) => from(this.goalsService.deleteGoal(userId, goalId))
      .pipe(
        map(() => GoalsActions.deleteGoalSuccess({ goalId })),
        catchError(error => of(GoalsActions.deleteGoalFailure({ error })))
      ))
  ));

  updateCurrentAmount$ = createEffect(() => this.actions$.pipe(
    ofType(GoalsActions.updateCurrentAmount),
    mergeMap(({ userId, goalId, amount }) => from(this.goalsService.updateCurrentAmount(userId, goalId, amount))
      .pipe(
        map(() => GoalsActions.updateCurrentAmountSuccess({ goal: { goalId, currentAmount: amount } as any })),
        catchError(error => of(GoalsActions.updateCurrentAmountFailure({ error })))
      ))
  ));

  constructor(
    private actions$: Actions,
    private goalsService: GoalsService
  ) {}
} 