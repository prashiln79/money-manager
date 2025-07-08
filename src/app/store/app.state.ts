import { TransactionsState } from './transactions/transactions.state';
import { CategoriesState } from './categories/categories.state';
import { AccountsState } from './accounts/accounts.state';

export interface AppState {
  transactions: TransactionsState;
  categories: CategoriesState;
  accounts: AccountsState;
} 