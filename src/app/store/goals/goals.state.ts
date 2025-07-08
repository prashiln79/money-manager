import { Goal } from '../../util/service/goals.service';

export interface GoalsState {
  goals: Goal[];
  loading: boolean;
  error: any;
}

export const initialState: GoalsState = {
  goals: [],
  loading: false,
  error: null
}; 