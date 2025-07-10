import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoriesState } from './categories.state';
import { TransactionType } from 'src/app/util/config/enums';

export const selectCategoriesState = createFeatureSelector<CategoriesState>('categories');

export const selectAllCategories = createSelector(
  selectCategoriesState,
  (state) => state.ids.map(id => state.entities[id]).filter(category => category)
);

export const selectCategoriesLoading = createSelector(
  selectCategoriesState,
  (state) => state.loading
);

export const selectCategoriesError = createSelector(
  selectCategoriesState,
  (state) => state.error
);

export const selectCategoryById = (categoryId: string) => createSelector(
  selectCategoriesState,
  (state) => state.entities[categoryId]
);

export const selectCategoriesByType = (type: TransactionType) => createSelector(
  selectAllCategories,
  (categories) => categories.filter(c => c.type === type)
);

export const selectIncomeCategories = createSelector(
  selectAllCategories,
  (categories) => categories.filter(c => c.type === TransactionType.INCOME)
);

export const selectExpenseCategories = createSelector(
  selectAllCategories,
  (categories) => categories.filter(c => c.type === TransactionType.EXPENSE)
);

export const selectCategoryByName = (name: string) => createSelector(
  selectAllCategories,
  (categories) => categories.find(c => c.name.toLowerCase() === name.toLowerCase())
); 