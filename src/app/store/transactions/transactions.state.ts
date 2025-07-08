import { Transaction } from '../../util/service/transactions.service';

export interface TransactionsState {
  entities: { [id: string]: Transaction };
  ids: string[];
  loading: boolean;
  error: any;
  selectedTransactionId: string | null;
}

export const initialState: TransactionsState = {
  entities: {},
  ids: [],
  loading: false,
  error: null,
  selectedTransactionId: null
}; 