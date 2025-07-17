import { SplitwiseGroup, GroupInvitation, SplitTransaction, SplitSettlement } from '../../../util/models/splitwise.model';

export interface SplitwiseState {
  groups: SplitwiseGroup[];
  invitations: GroupInvitation[];
  transactions: SplitTransaction[];
  settlements: SplitSettlement[];
  selectedGroup: SplitwiseGroup | null;
  loading: boolean;
  error: string | null;
}

export const initialState: SplitwiseState = {
  groups: [],
  invitations: [],
  transactions: [],
  settlements: [],
  selectedGroup: null,
  loading: false,
  error: null
}; 