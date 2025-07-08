import { createAction, props } from '@ngrx/store';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../../util/models/account.model';

// Load Accounts
export const loadAccounts = createAction(
  '[Accounts] Load Accounts',
  props<{ userId: string }>()
);

export const loadAccountsSuccess = createAction(
  '[Accounts] Load Accounts Success',
  props<{ accounts: Account[] }>()
);

export const loadAccountsFailure = createAction(
  '[Accounts] Load Accounts Failure',
  props<{ error: any }>()
);

// Create Account
export const createAccount = createAction(
  '[Accounts] Create Account',
  props<{ userId: string; accountData: CreateAccountRequest }>()
);

export const createAccountSuccess = createAction(
  '[Accounts] Create Account Success',
  props<{ account: Account }>()
);

export const createAccountFailure = createAction(
  '[Accounts] Create Account Failure',
  props<{ error: any }>()
);

// Update Account
export const updateAccount = createAction(
  '[Accounts] Update Account',
  props<{ userId: string; accountId: string; accountData: UpdateAccountRequest }>()
);

export const updateAccountSuccess = createAction(
  '[Accounts] Update Account Success',
  props<{ account: Account }>()
);

export const updateAccountFailure = createAction(
  '[Accounts] Update Account Failure',
  props<{ error: any }>()
);

// Delete Account
export const deleteAccount = createAction(
  '[Accounts] Delete Account',
  props<{ userId: string; accountId: string }>()
);

export const deleteAccountSuccess = createAction(
  '[Accounts] Delete Account Success',
  props<{ accountId: string }>()
);

export const deleteAccountFailure = createAction(
  '[Accounts] Delete Account Failure',
  props<{ error: any }>()
);

// Get Single Account
export const getAccount = createAction(
  '[Accounts] Get Account',
  props<{ userId: string; accountId: string }>()
);

export const getAccountSuccess = createAction(
  '[Accounts] Get Account Success',
  props<{ account: Account }>()
);

export const getAccountFailure = createAction(
  '[Accounts] Get Account Failure',
  props<{ error: any }>()
);

// Clear State
export const clearAccounts = createAction('[Accounts] Clear Accounts'); 