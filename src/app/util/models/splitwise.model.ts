import { Timestamp } from '@angular/fire/firestore';
import { TransactionType, SyncStatus } from '../config/enums';

/**
 * Splitwise Group interface
 */
export interface SplitwiseGroup {
  id?: string;
  name: string;
  description?: string;
  createdBy: string;
  members: GroupMember[];
  currency: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  isActive: boolean;
  syncStatus: SyncStatus;
}

/**
 * Group member interface
 */
export interface GroupMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: GroupMemberRole;
  joinedAt: Date | Timestamp;
  isActive: boolean;
}

/**
 * Group member roles
 */
export enum GroupMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member'
}

/**
 * Split transaction interface
 */
export interface SplitTransaction {
  id?: string;
  groupId: string;
  originalTransactionId?: string; // Reference to the original transaction
  amount: number;
  createdBy: string;
  splits: TransactionSplit[];
  totalAmount: number;
  currency: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  syncStatus: SyncStatus;
}

/**
 * Individual split within a transaction
 */
export interface TransactionSplit {
  userId: string;
  email: string;
  displayName: string;
  amount: number;
  percentage: number;
  isPaid: boolean;
  paidBy?: string; // Who actually paid this amount
  paidAt?: Date | Timestamp;
}

/**
 * Split settlement interface
 */
export interface SplitSettlement {
  id?: string;
  groupId: string;
  originalTransactionId: string; // Reference to the original transaction for cleanup
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: SettlementStatus;
  notes?: string;
  settledAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Settlement status
 */
export enum SettlementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Group invitation interface
 */
export interface GroupInvitation {
  id?: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  invitedByEmail: string;
  invitedByDisplayName: string;
  invitedEmail: string;
  status: InvitationStatus;
  expiresAt: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Invitation status
 */
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

/**
 * Group activity log
 */
export interface GroupActivity {
  id?: string;
  groupId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  action: GroupActivityAction;
  details: any;
  timestamp: Date | Timestamp;
}

/**
 * Group activity actions
 */
export enum GroupActivityAction {
  GROUP_CREATED = 'group_created',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  TRANSACTION_ADDED = 'transaction_added',
  TRANSACTION_UPDATED = 'transaction_updated',
  TRANSACTION_DELETED = 'transaction_deleted',
  SETTLEMENT_COMPLETED = 'settlement_completed',
  INVITATION_SENT = 'invitation_sent',
  INVITATION_ACCEPTED = 'invitation_accepted',
  INVITATION_DECLINED = 'invitation_declined'
}

/**
 * Group summary statistics
 */
export interface GroupSummary {
  groupId: string;
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  memberCount: number;
  activeMemberCount: number;
  pendingSettlements: number;
  lastActivity: Date | Timestamp;
}

/**
 * Member balance summary
 */
export interface MemberBalance {
  userId: string;
  email: string;
  displayName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  transactionCount: number;
}

/**
 * Create group request
 */
export interface CreateGroupRequest {
  name: string;
  description?: string;
  currency: string;
  initialMembers?: string[]; // Array of email addresses
}

/**
 * Update group request
 */
export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  currency?: string;
}

/**
 * Add member request
 */
export interface AddMemberRequest {
  email: string;
  role?: GroupMemberRole;
}

/**
 * Create split transaction request
 */
export interface CreateSplitTransactionRequest {
  groupId: string;
  originalTransactionId?: string; // Optional link to original transaction
  amount: number;
  splits: TransactionSplit [];
}

/**
 * Update split transaction request
 */
export interface UpdateSplitTransactionRequest {
  payee?: string;
  amount?: number;
  type?: TransactionType;
  date?: Date;
  notes?: string;
  categoryId?: string;
  category?: string;
  splits?: Omit<TransactionSplit, 'email' | 'displayName'>[];
}

/**
 * Settlement request
 */
export interface CreateSettlementRequest {
  groupId: string;
  originalTransactionId: string; // Reference to the original transaction
  fromUserId: string;
  toUserId: string;
  amount: number;
  notes?: string;
} 