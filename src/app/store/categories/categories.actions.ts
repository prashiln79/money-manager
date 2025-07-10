import { createAction, props } from '@ngrx/store';
import { Category } from '../../util/models';

// Load Categories
export const loadCategories = createAction(
  '[Categories] Load Categories',
  props<{ userId: string }>()
);

export const loadCategoriesSuccess = createAction(
  '[Categories] Load Categories Success',
  props<{ categories: Category[] }>()
);

export const loadCategoriesFailure = createAction(
  '[Categories] Load Categories Failure',
  props<{ error: any }>()
);

// Create Category
export const createCategory = createAction(
  '[Categories] Create Category',
  props<{ 
    userId: string; 
    name: string; 
    categoryType: 'income' | 'expense'; 
    icon: string; 
    color: string 
  }>()
);

export const createCategorySuccess = createAction(
  '[Categories] Create Category Success',
  props<{ category: Category }>()
);

export const createCategoryFailure = createAction(
  '[Categories] Create Category Failure',
  props<{ error: any }>()
);

// Update Category
export const updateCategory = createAction(
  '[Categories] Update Category',
  props<{ 
    userId: string; 
    categoryId: string; 
    name: string; 
    categoryType: 'income' | 'expense'; 
    icon: string; 
    color: string;
    budgetData?: any;
  }>()
);

export const updateCategorySuccess = createAction(
  '[Categories] Update Category Success',
  props<{ category: Category }>()
);

export const updateCategoryFailure = createAction(
  '[Categories] Update Category Failure',
  props<{ error: any }>()
);

// Delete Category
export const deleteCategory = createAction(
  '[Categories] Delete Category',
  props<{ userId: string; categoryId: string }>()
);

export const deleteCategorySuccess = createAction(
  '[Categories] Delete Category Success',
  props<{ categoryId: string }>()
);

export const deleteCategoryFailure = createAction(
  '[Categories] Delete Category Failure',
  props<{ error: any }>()
);

export const updateBudgetSpent = createAction(
  '[Categories] Update Budget Spent',
  props<{ userId: string; categoryId: string; budgetSpent: number }>()
);

export const updateBudgetSpentSuccess = createAction(
  '[Categories] Update Budget Spent Success',
  props<{ categoryId: string; budgetSpent: number }>()
);

export const updateBudgetSpentFailure = createAction(
  '[Categories] Update Budget Spent Failure',
  props<{ error: any }>()
);



// Clear State
export const clearCategories = createAction('[Categories] Clear Categories'); 