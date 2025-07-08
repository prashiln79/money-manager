import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TransactionsState } from './transactions.state';
import { Timestamp } from 'firebase/firestore';

export const selectTransactionsState = createFeatureSelector<TransactionsState>('transactions');

export const selectAllTransactions = createSelector(
  selectTransactionsState,
  (state) => state.ids.map(id => state.entities[id]).filter(transaction => transaction)
);

export const selectTransactionsLoading = createSelector(
  selectTransactionsState,
  (state) => state.loading
);

export const selectTransactionsError = createSelector(
  selectTransactionsState,
  (state) => state.error
);

export const selectSelectedTransactionId = createSelector(
  selectTransactionsState,
  (state) => state.selectedTransactionId
);

export const selectSelectedTransaction = createSelector(
  selectTransactionsState,
  selectSelectedTransactionId,
  (state, selectedId) => selectedId ? state.entities[selectedId] : null
);

export const selectTransactionById = (transactionId: string) => createSelector(
  selectTransactionsState,
  (state) => state.entities[transactionId]
);

export const selectTransactionsByAccount = (accountId: string) => createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(t => t.accountId === accountId)
);

export const selectTransactionsByCategory = (category: string) => createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(t => t.category === category)
);

export const selectTransactionsByType = (type: 'income' | 'expense') => createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(t => t.type === type)
);

export const selectTransactionsByDateRange = (startDate: Date | Timestamp, endDate: Date | Timestamp) => createSelector(
  selectAllTransactions,
  (transactions) => transactions.filter(t => {
    const transactionDate = t.date  || new Date();
    return transactionDate >= startDate && transactionDate <= endDate;
  })
);

export const selectTotalIncome = createSelector(
  selectTransactionsByType('income'),
  (transactions) => transactions.reduce((sum, t) => sum + t.amount, 0)
);

export const selectTotalExpenses = createSelector(
  selectTransactionsByType('expense'),
  (transactions) => transactions.reduce((sum, t) => sum + t.amount, 0)
);

export const selectNetBalance = createSelector(
  selectTotalIncome,
  selectTotalExpenses,
  (income, expenses) => income - expenses
); 