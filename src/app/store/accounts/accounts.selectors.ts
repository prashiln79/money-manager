import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AccountsState } from './accounts.state';
import { AccountType } from 'src/app/util/config/enums';
import { LoanDetails } from 'src/app/util/models';

export const selectAccountsState = createFeatureSelector<AccountsState>('accounts');

export const selectAllAccounts = createSelector(
  selectAccountsState,
  (state) => state.ids.map(id => state.entities[id]).filter(account => account)
);

export const selectAccountsLoading = createSelector(
  selectAccountsState,
  (state) => state.loading
);

export const selectAccountsError = createSelector(
  selectAccountsState,
  (state) => state.error
);

export const selectSelectedAccountId = createSelector(
  selectAccountsState,
  (state) => state.selectedAccountId
);

export const selectSelectedAccount = createSelector(
  selectAccountsState,
  selectSelectedAccountId,
  (state, selectedId) => selectedId ? state.entities[selectedId] : null
);

export const selectAccountById = (accountId: string) => createSelector(
  selectAccountsState,
  (state) => state.entities[accountId]
);

export const selectAccountsByType = (type: 'bank' | 'cash' | 'credit' | 'loan') => createSelector(
  selectAllAccounts,
  (accounts) => accounts.filter(a => a.type === type)
);

export const selectActiveAccounts = createSelector(
  selectAllAccounts,
  (accounts) => accounts.filter(a => a.isActive !== false)
);

export const selectTotalBalance = createSelector(
  selectAllAccounts,
  (accounts) => {
    const totalBalance = accounts.reduce((sum, account) => {
      if (account.type === AccountType.LOAN) {
        const loanDetails = account.loanDetails as LoanDetails;
        return sum - loanDetails.remainingBalance;
      }
      return sum + account.balance;
    }, 0);
    return totalBalance;
  }
);

export const selectTotalBalanceByType = (type: 'bank' | 'cash' | 'credit' | 'loan') => createSelector(
  selectAccountsByType(type),
  (accounts) => accounts.reduce((sum, account) => sum + account.balance, 0)
);

export const selectAccountsByInstitution = (institution: string) => createSelector(
  selectAllAccounts,
  (accounts) => accounts.filter(a => a.institution === institution)
); 