import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BudgetsState } from './budgets.state';

export const selectBudgetsState = createFeatureSelector<BudgetsState>('budgets');

export const selectAllBudgets = createSelector(
  selectBudgetsState,
  (state: BudgetsState) => state.budgets
);

export const selectBudgetsLoading = createSelector(
  selectBudgetsState,
  (state: BudgetsState) => state.loading
);

export const selectBudgetsError = createSelector(
  selectBudgetsState,
  (state: BudgetsState) => state.error
);

export const selectBudgetById = (budgetId: string) => createSelector(
  selectAllBudgets,
  (budgets) => budgets.find(budget => budget.budgetId === budgetId)
);

export const selectBudgetsByCategory = (category: string) => createSelector(
  selectAllBudgets,
  (budgets) => budgets.filter(budget => budget.category === category)
); 