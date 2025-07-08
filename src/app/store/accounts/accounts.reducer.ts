import { createReducer, on } from '@ngrx/store';
import { AccountsState, initialState } from './accounts.state';
import * as AccountsActions from './accounts.actions';

export const accountsReducer = createReducer(
  initialState,
  
  // Load Accounts
  on(AccountsActions.loadAccounts, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AccountsActions.loadAccountsSuccess, (state, { accounts }) => {
    const entities = accounts.reduce((acc, account) => {
      acc[account.accountId] = account;
      return acc;
    }, {} as { [id: string]: any });
    
    const ids = accounts.map(a => a.accountId);
    
    return {
      ...state,
      entities,
      ids,
      loading: false,
      error: null
    };
  }),
  
  on(AccountsActions.loadAccountsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Create Account
  on(AccountsActions.createAccount, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AccountsActions.createAccountSuccess, (state, { account }) => {
    return {
      ...state,
      entities: {
        ...state.entities,
        [account.accountId]: account
      },
      ids: [...state.ids, account.accountId],
      loading: false,
      error: null
    };
  }),
  
  on(AccountsActions.createAccountFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Account
  on(AccountsActions.updateAccount, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AccountsActions.updateAccountSuccess, (state, { account }) => {
    return {
      ...state,
      entities: {
        ...state.entities,
        [account.accountId]: account
      },
      loading: false,
      error: null
    };
  }),
  
  on(AccountsActions.updateAccountFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Delete Account
  on(AccountsActions.deleteAccount, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AccountsActions.deleteAccountSuccess, (state, { accountId }) => {
    const { [accountId]: removed, ...remainingEntities } = state.entities;
    
    return {
      ...state,
      entities: remainingEntities,
      ids: state.ids.filter(id => id !== accountId),
      loading: false,
      error: null
    };
  }),
  
  on(AccountsActions.deleteAccountFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Get Single Account
  on(AccountsActions.getAccount, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AccountsActions.getAccountSuccess, (state, { account }) => {
    return {
      ...state,
      entities: {
        ...state.entities,
        [account.accountId]: account
      },
      ids: state.ids.includes(account.accountId) ? state.ids : [...state.ids, account.accountId],
      selectedAccountId: account.accountId,
      loading: false,
      error: null
    };
  }),
  
  on(AccountsActions.getAccountFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Clear State
  on(AccountsActions.clearAccounts, () => initialState)
); 