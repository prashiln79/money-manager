import { createReducer, on } from '@ngrx/store';
import { SplitwiseState, initialState } from './splitwise.state';
import * as SplitwiseActions from './splitwise.actions';

export const splitwiseReducer = createReducer(
  initialState,
  
  // Load Groups
  on(SplitwiseActions.loadGroups, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.loadGroupsSuccess, (state, { groups }) => ({
    ...state,
    groups,
    loading: false,
    error: null
  })),
  on(SplitwiseActions.loadGroupsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Invitations
  on(SplitwiseActions.loadInvitations, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.loadInvitationsSuccess, (state, { invitations }) => ({
    ...state,
    invitations,
    loading: false,
    error: null
  })),
  on(SplitwiseActions.loadInvitationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Group
  on(SplitwiseActions.createGroup, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.createGroupSuccess, (state, { group }) => ({
    ...state,
    groups: [...state.groups, group],
    loading: false,
    error: null
  })),
  on(SplitwiseActions.createGroupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Add Member
  on(SplitwiseActions.addMember, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.addMemberSuccess, (state, { group }) => ({
    ...state,
    groups: state.groups.map(g => g.id === group.id ? group : g),
    loading: false,
    error: null
  })),
  on(SplitwiseActions.addMemberFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Accept Invitation
  on(SplitwiseActions.acceptInvitation, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.acceptInvitationSuccess, (state, { invitationId }) => ({
    ...state,
    invitations: state.invitations.filter(inv => inv.id !== invitationId),
    loading: false,
    error: null
  })),
  on(SplitwiseActions.acceptInvitationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Decline Invitation
  on(SplitwiseActions.declineInvitation, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.declineInvitationSuccess, (state, { invitationId }) => ({
    ...state,
    invitations: state.invitations.filter(inv => inv.id !== invitationId),
    loading: false,
    error: null
  })),
  on(SplitwiseActions.declineInvitationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Group
  on(SplitwiseActions.deleteGroup, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.deleteGroupSuccess, (state, { groupId }) => ({
    ...state,
    groups: state.groups.filter(g => g.id !== groupId),
    selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
    loading: false,
    error: null
  })),
  on(SplitwiseActions.deleteGroupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Select Group
  on(SplitwiseActions.selectGroup, (state, { group }) => ({
    ...state,
    selectedGroup: group
  })),

  // Load Transactions
  on(SplitwiseActions.loadTransactions, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.loadTransactionsSuccess, (state, { transactions }) => ({
    ...state,
    transactions,
    loading: false,
    error: null
  })),
  on(SplitwiseActions.loadTransactionsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Settlements
  on(SplitwiseActions.loadSettlements, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.loadSettlementsSuccess, (state, { settlements }) => ({
    ...state,
    settlements,
    loading: false,
    error: null
  })),
  on(SplitwiseActions.loadSettlementsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Split Transaction
  on(SplitwiseActions.createSplitTransaction, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SplitwiseActions.createSplitTransactionSuccess, (state, { transaction }) => ({
    ...state,
    transactions: [...state.transactions, transaction],
    loading: false,
    error: null
  })),
  on(SplitwiseActions.createSplitTransactionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Error
  on(SplitwiseActions.clearError, (state) => ({
    ...state,
    error: null
  }))
); 