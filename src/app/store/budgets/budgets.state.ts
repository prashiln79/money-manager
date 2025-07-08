import { Budget } from '../../util/service/budgets.service';

export interface BudgetsState {
  budgets: Budget[];
  loading: boolean;
  error: any;
}

export const initialState: BudgetsState = {
  budgets: [],
  loading: false,
  error: null
}; 