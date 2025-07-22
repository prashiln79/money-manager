import { createReducer, on } from '@ngrx/store';
import { CategoriesState, initialState } from './categories.state';
import * as CategoriesActions from './categories.actions';

export const categoriesReducer = createReducer(
  initialState,
  
  // Load Categories
  on(CategoriesActions.loadCategories, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CategoriesActions.loadCategoriesSuccess, (state, { categories }) => {
    const entities = categories.reduce((acc, category) => {
      if (category.id) {
        acc[category.id] = category;
      }
      return acc;
    }, {} as { [id: string]: any });
    
    const ids = categories.map(c => c.id).filter(id => id) as string[];
    
    return {
      ...state,
      entities,
      ids,
      loading: false,
      error: null
    };
  }),
  
  on(CategoriesActions.loadCategoriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Create Category
  on(CategoriesActions.createCategory, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CategoriesActions.createCategorySuccess, (state, { category }) => {
    if (!category.id) return state;
    
    return {
      ...state,
      entities: {
        ...state.entities,
        [category.id]: category
      },
      ids: [...state.ids, category.id],
      loading: false,
      error: null
    };
  }),
  
  on(CategoriesActions.createCategoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Category
  on(CategoriesActions.updateCategory, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CategoriesActions.updateCategorySuccess, (state, { category }) => {
    if (!category.id) return state;
    
    return {
      ...state,
      entities: {
        ...state.entities,
        [category.id]: category
      },
      loading: false,
      error: null
    };
  }),
  
  on(CategoriesActions.updateCategoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Delete Category
  on(CategoriesActions.deleteCategory, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CategoriesActions.deleteCategorySuccess, (state, { categoryId }) => {
    const { [categoryId]: removed, ...remainingEntities } = state.entities;
    
    return {
      ...state,
      entities: remainingEntities,
      ids: state.ids.filter(id => id !== categoryId),
      loading: false,
      error: null
    };
  }),
  
  on(CategoriesActions.deleteCategoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Budget Spent
  on(CategoriesActions.updateBudgetSpent, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CategoriesActions.updateBudgetSpentSuccess, (state, { categoryId, budgetSpent }) => {
    const category = state.entities[categoryId];
    if (category && category.budget) {
      return {
        ...state,
        entities: {
          ...state.entities,
          [categoryId]: {
            ...category,
            budget: {
              ...category.budget,
              budgetSpent
            }
          }
        },
        loading: false,
        error: null
      };
    }
    return state;
  }),
  
  on(CategoriesActions.updateBudgetSpentFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Remove from Parent Category
  on(CategoriesActions.removeFromParentCategory, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CategoriesActions.removeFromParentCategorySuccess, (state, { categoryId }) => {
    const category = state.entities[categoryId];
    if (category) {
      return {
        ...state,
        entities: {
          ...state.entities,
          [categoryId]: {
            ...category,
            parentCategoryId: undefined,
            isSubCategory: false
          }
        },
        loading: false,
        error: null
      };
    }
    return state;
  }),
  
  on(CategoriesActions.removeFromParentCategoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Clear State
  on(CategoriesActions.clearCategories, () => initialState)
); 