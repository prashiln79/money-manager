import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GoalsState } from './goals.state';

export const selectGoalsState = createFeatureSelector<GoalsState>('goals');

export const selectAllGoals = createSelector(
  selectGoalsState,
  (state: GoalsState) => state.goals
);

export const selectGoalsLoading = createSelector(
  selectGoalsState,
  (state: GoalsState) => state.loading
);

export const selectGoalsError = createSelector(
  selectGoalsState,
  (state: GoalsState) => state.error
);

export const selectGoalById = (goalId: string) => createSelector(
  selectAllGoals,
  (goals) => goals.find(goal => goal.goalId === goalId)
);

export const selectGoalsByProgress = (completed: boolean) => createSelector(
  selectAllGoals,
  (goals) => goals.filter(goal => {
    const progress = goal.currentAmount / goal.targetAmount;
    return completed ? progress >= 1 : progress < 1;
  })
);

export const selectGoalsProgress = createSelector(
  selectAllGoals,
  (goals) => goals.map(goal => ({
    ...goal,
    progress: goal.currentAmount / goal.targetAmount,
    percentage: Math.round((goal.currentAmount / goal.targetAmount) * 100)
  }))
); 