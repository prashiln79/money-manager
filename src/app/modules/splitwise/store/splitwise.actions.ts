import { createAction, props } from '@ngrx/store';
import { SplitwiseGroup, GroupInvitation, SplitTransaction, SplitSettlement, CreateGroupRequest, AddMemberRequest } from '../../../util/models/splitwise.model';

// Load Groups
export const loadGroups = createAction('[Splitwise] Load Groups');
export const loadGroupsSuccess = createAction(
  '[Splitwise] Load Groups Success',
  props<{ groups: SplitwiseGroup[] }>()
);
export const loadGroupsFailure = createAction(
  '[Splitwise] Load Groups Failure',
  props<{ error: string }>()
);

// Load Invitations
export const loadInvitations = createAction('[Splitwise] Load Invitations');
export const loadInvitationsSuccess = createAction(
  '[Splitwise] Load Invitations Success',
  props<{ invitations: GroupInvitation[] }>()
);
export const loadInvitationsFailure = createAction(
  '[Splitwise] Load Invitations Failure',
  props<{ error: string }>()
);

// Create Group
export const createGroup = createAction(
  '[Splitwise] Create Group',
  props<{ request: CreateGroupRequest }>()
);
export const createGroupSuccess = createAction(
  '[Splitwise] Create Group Success',
  props<{ group: SplitwiseGroup }>()
);
export const createGroupFailure = createAction(
  '[Splitwise] Create Group Failure',
  props<{ error: string }>()
);

// Add Member
export const addMember = createAction(
  '[Splitwise] Add Member',
  props<{ groupId: string; request: AddMemberRequest }>()
);
export const addMemberSuccess = createAction(
  '[Splitwise] Add Member Success',
  props<{ group: SplitwiseGroup }>()
);
export const addMemberFailure = createAction(
  '[Splitwise] Add Member Failure',
  props<{ error: string }>()
);

// Accept Invitation
export const acceptInvitation = createAction(
  '[Splitwise] Accept Invitation',
  props<{ invitationId: string }>()
);
export const acceptInvitationSuccess = createAction(
  '[Splitwise] Accept Invitation Success',
  props<{ invitationId: string }>()
);
export const acceptInvitationFailure = createAction(
  '[Splitwise] Accept Invitation Failure',
  props<{ error: string }>()
);

// Decline Invitation
export const declineInvitation = createAction(
  '[Splitwise] Decline Invitation',
  props<{ invitationId: string }>()
);
export const declineInvitationSuccess = createAction(
  '[Splitwise] Decline Invitation Success',
  props<{ invitationId: string }>()
);
export const declineInvitationFailure = createAction(
  '[Splitwise] Decline Invitation Failure',
  props<{ error: string }>()
);

// Delete Group
export const deleteGroup = createAction(
  '[Splitwise] Delete Group',
  props<{ groupId: string }>()
);
export const deleteGroupSuccess = createAction(
  '[Splitwise] Delete Group Success',
  props<{ groupId: string }>()
);
export const deleteGroupFailure = createAction(
  '[Splitwise] Delete Group Failure',
  props<{ error: string }>()
);

// Select Group
export const selectGroup = createAction(
  '[Splitwise] Select Group',
  props<{ group: SplitwiseGroup | null }>()
);

// Load Transactions
export const loadTransactions = createAction(
  '[Splitwise] Load Transactions',
  props<{ groupId: string }>()
);
export const loadTransactionsSuccess = createAction(
  '[Splitwise] Load Transactions Success',
  props<{ transactions: SplitTransaction[] }>()
);
export const loadTransactionsFailure = createAction(
  '[Splitwise] Load Transactions Failure',
  props<{ error: string }>()
);

// Load Settlements
export const loadSettlements = createAction(
  '[Splitwise] Load Settlements',
  props<{ groupId: string }>()
);
export const loadSettlementsSuccess = createAction(
  '[Splitwise] Load Settlements Success',
  props<{ settlements: SplitSettlement[] }>()
);
export const loadSettlementsFailure = createAction(
  '[Splitwise] Load Settlements Failure',
  props<{ error: string }>()
);

// Clear Error
export const clearError = createAction('[Splitwise] Clear Error'); 