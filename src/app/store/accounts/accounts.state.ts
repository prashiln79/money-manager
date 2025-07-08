import { Account } from '../../util/models/account.model';

export interface AccountsState {
  entities: { [id: string]: Account };
  ids: string[];
  loading: boolean;
  error: any;
  selectedAccountId: string | null;
}

export const initialState: AccountsState = {
  entities: {},
  ids: [],
  loading: false,
  error: null,
  selectedAccountId: null
}; 