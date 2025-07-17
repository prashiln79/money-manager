import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of } from 'rxjs';
import { NotificationService } from './notification.service';
import { DateService } from './date.service';
import {
  SplitwiseGroup,
  GroupMember,
  GroupMemberRole,
  SplitTransaction,
  TransactionSplit,
  SplitTransactionStatus,
  SplitSettlement,
  SettlementStatus,
  GroupInvitation,
  InvitationStatus,
  GroupActivity,
  GroupActivityAction,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberRequest,
  CreateSplitTransactionRequest,
  UpdateSplitTransactionRequest,
  CreateSettlementRequest,
  GroupSummary,
  MemberBalance
} from '../models/splitwise.model';
import { SyncStatus } from '../config/enums';
import { User } from '../models/user.model';
import { promises } from 'dns';

@Injectable({
  providedIn: 'root'
})
export class SplitwiseService {
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private notificationService: NotificationService,
    private dateService: DateService
  ) { }

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Create a new group
   */

  async createGroup(request: CreateGroupRequest): Promise<string> {
    try {
      const user = this.auth.currentUser;
      if (!user?.uid) throw new Error('User not authenticated');
      const userId = user.uid;

      const groupData: Omit<SplitwiseGroup, 'id'> = {
        name: request.name,
        description: request.description || '',
        createdBy: userId,
        members: [{
          userId,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: GroupMemberRole.ADMIN,
          joinedAt: new Date(),
          isActive: true,
          balance: 0
        }],
        currency: request.currency,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        syncStatus: SyncStatus.SYNCED
      };

      const groupRef = await addDoc(
        collection(this.firestore, `splitwise/${userId}/groups`),
        groupData
      );

      if (request.initialMembers?.length) {
        for (const email of request.initialMembers) {
          if (email !== user.email) {
            await this.sendGroupInvitation(groupRef.id, email);
          }
        }
      }

      this.notificationService.success('Group created successfully');
      return groupRef.id;

    } catch (error) {
      console.error('Error creating group:', error);
      this.notificationService.error('Failed to create group');
      throw error;
    }
  }


  /**
   * Get all groups for current user
   */
  async getUserGroups(userId: string): Promise<SplitwiseGroup[]> {
    if (!userId) return Promise.resolve([]);

    const groupRef = query(collection(this.firestore, `splitwise/${userId}/groups`), where('isActive', '==', true), orderBy('updatedAt', 'desc'));
    const groupSnapshot = await getDocs(groupRef);
    return groupSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SplitwiseGroup));
  }

  /**
   * Get group by ID
   */
  getGroup(groupId: string): Observable<SplitwiseGroup | null> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return of(null);
    
    return from(getDoc(doc(this.firestore, `splitwise/${userId}/groups`, groupId))).pipe(
      map(doc => {
        if (doc.exists()) {
          return { id: doc.id, ...doc.data() } as SplitwiseGroup;
        }
        return null;
      })
    );
  }

  /**
   * Update group
   */
  async updateGroup(groupId: string, request: UpdateGroupRequest): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const updateData: any = {
        updatedAt: new Date()
      };

      if (request.name) updateData.name = request.name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.currency) updateData.currency = request.currency;

      await updateDoc(doc(this.firestore, `splitwise/${userId}/groups`, groupId), updateData);

      this.notificationService.success('Group updated successfully');
    } catch (error) {
      console.error('Error updating group:', error);
      this.notificationService.error('Failed to update group');
      throw error;
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await updateDoc(doc(this.firestore, `splitwise/${userId}/groups`, groupId), {
        isActive: false,
        updatedAt: new Date()
      });

      this.notificationService.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      this.notificationService.error('Failed to delete group');
      throw error;
    }
  }

  // ==================== MEMBER MANAGEMENT ====================

  /**
   * Add member to group
   */
  async addMemberToGroup(groupId: string, request: AddMemberRequest): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Check if user exists
      const userQuery = query(
        collection(this.firestore, 'users'),
        where('email', '==', request.email),
        limit(1)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        // Send invitation instead
        await this.sendGroupInvitation(groupId, request.email);
        return;
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data() as User;

      const newMember: GroupMember = {
        userId: userDoc.id,
        email: userData.email,
        displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
        photoURL: userData?.photoURL || '',
        role: request.role || GroupMemberRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
        balance: 0
      };

      const groupRef = doc(this.firestore, `splitwise/${userId}/groups`, groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data() as SplitwiseGroup;
      const updatedMembers = [...groupData.members, newMember];

      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: new Date()
      });


      this.notificationService.success('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      this.notificationService.error('Failed to add member');
      throw error;
    }
  }

  /**
   * Remove member from group
   */
  async removeMemberFromGroup(groupId: string, memberUserId: string): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const groupRef = doc(this.firestore, `splitwise/${userId}/groups`, groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data() as SplitwiseGroup;
      const updatedMembers = groupData.members.filter(member => member.userId !== memberUserId);

      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: new Date()
      });


      this.notificationService.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      this.notificationService.error('Failed to remove member');
      throw error;
    }
  }

  // ==================== SPLIT TRANSACTIONS ====================

  /**
   * Create split transaction
   */
  async createSplitTransaction(request: CreateSplitTransactionRequest): Promise<string> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Get group and member details
      const groupDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/groups`, request.groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data() as SplitwiseGroup;

      // Calculate total amount and validate splits
      const totalAmount = request.splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalAmount - request.amount) > 0.01) {
        throw new Error('Split amounts must equal the total transaction amount');
      }

      // Add member details to splits
      const splitsWithDetails: TransactionSplit[] = request.splits.map(split => {
        const member = groupData.members.find(m => m.userId === split.userId);
        return {
          ...split,
          email: member?.email || '',
          displayName: member?.displayName || '',
          isPaid: false
        };
      });

      const splitTransactionData: Omit<SplitTransaction, 'id'> = {
        groupId: request.groupId,
        originalTransactionId: (request as any).originalTransactionId, // Link to original transaction if provided
        amount: request.amount,
        createdBy: userId,
        splits: splitsWithDetails,
        totalAmount: request.amount,
        currency: groupData.currency,
        status: SplitTransactionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: SyncStatus.SYNCED
      };

      const transactionRef = await addDoc(collection(this.firestore, `splitwise/${userId}/transactions`), splitTransactionData);

      // Update member balances
      await this.updateMemberBalances(request.groupId, splitsWithDetails);



      this.notificationService.success('Split transaction created successfully');
      return transactionRef.id;
    } catch (error) {
      console.error('Error creating split transaction:', error);
      this.notificationService.error('Failed to create split transaction');
      throw error;
    }
  }

  /**
   * Get split transactions for a group
   */
  getGroupTransactions(groupId: string): Observable<SplitTransaction[]> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return of([]);

    return from(
      getDocs(
        query(
          collection(this.firestore, `splitwise/${userId}/transactions`),
          where('groupId', '==', groupId),
          orderBy('date', 'desc')
        )
      )
    ).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SplitTransaction))
      )
    );
  }

  /**
   * Get split transaction by ID
   */
  getSplitTransaction(transactionId: string): Observable<SplitTransaction | null> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return of(null);
    
    return from(getDoc(doc(this.firestore, `splitwise/${userId}/transactions`, transactionId))).pipe(
      map(doc => {
        if (doc.exists()) {
          return { id: doc.id, ...doc.data() } as SplitTransaction;
        }
        return null;
      })
    );
  }

  /**
   * Update split transaction
   */
  async updateSplitTransaction(transactionId: string, request: UpdateSplitTransactionRequest): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const updateData: any = {
        updatedAt: new Date()
      };

      if (request.payee) updateData.payee = request.payee;
      if (request.amount) updateData.amount = request.amount;
      if (request.type) updateData.type = request.type;
      if (request.date) updateData.date = this.dateService.toTimestamp(request.date);
      if (request.notes !== undefined) updateData.notes = request.notes;
      if (request.categoryId) updateData.categoryId = request.categoryId;
      if (request.category) updateData.category = request.category;
      if (request.status) updateData.status = request.status;

      if (request.splits) {
        // Recalculate splits and update member balances
        const totalAmount = request.splits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalAmount - (request.amount || 0)) > 0.01) {
          throw new Error('Split amounts must equal the total transaction amount');
        }

        // Get group for member details
        const transactionDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/transactions`, transactionId));
        if (!transactionDoc.exists()) {
          throw new Error('Transaction not found');
        }

        const transactionData = transactionDoc.data() as SplitTransaction;
        const groupDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/groups`, transactionData.groupId));
        const groupData = groupDoc.data() as SplitwiseGroup;

        const splitsWithDetails: TransactionSplit[] = request.splits.map(split => {
          const member = groupData.members.find(m => m.userId === split.userId);
          return {
            ...split,
            email: member?.email || '',
            displayName: member?.displayName || '',
            isPaid: false
          };
        });

        updateData.splits = splitsWithDetails;
        updateData.totalAmount = request.amount;

        // Update member balances
        await this.updateMemberBalances(transactionData.groupId, splitsWithDetails);
      }

      await updateDoc(doc(this.firestore, `splitwise/${userId}/transactions`, transactionId), updateData);

      // Log activity
      const transactionDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/transactions`, transactionId));
      const transactionData = transactionDoc.data() as SplitTransaction;


      this.notificationService.success('Split transaction updated successfully');
    } catch (error) {
      console.error('Error updating split transaction:', error);
      this.notificationService.error('Failed to update split transaction');
      throw error;
    }
  }

  /**
   * Delete split transaction
   */
  async deleteSplitTransaction(transactionId: string): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const transactionDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/transactions`, transactionId));
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data() as SplitTransaction;

      // Reverse member balances
      const reversedSplits = transactionData.splits.map(split => ({
        ...split,
        amount: -split.amount
      }));
      await this.updateMemberBalances(transactionData.groupId, reversedSplits);

      // Delete transaction
      await deleteDoc(doc(this.firestore, `splitwise/${userId}/transactions`, transactionId));


      this.notificationService.success('Split transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting split transaction:', error);
      this.notificationService.error('Failed to delete split transaction');
      throw error;
    }
  }

  // ==================== SETTLEMENTS ====================

  /**
   * Create settlement
   */
  async createSettlement(request: CreateSettlementRequest): Promise<string> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const settlementData: Omit<SplitSettlement, 'id'> = {
        groupId: request.groupId,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
        amount: request.amount,
        currency: 'USD', // Get from group
        status: SettlementStatus.PENDING,
        notes: request.notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const settlementRef = await addDoc(collection(this.firestore, `splitwise/${userId}/settlements`), settlementData);

      this.notificationService.success('Settlement created successfully');
      return settlementRef.id;
    } catch (error) {
      console.error('Error creating settlement:', error);
      this.notificationService.error('Failed to create settlement');
      throw error;
    }
  }

  /**
   * Complete settlement
   */
  async completeSettlement(settlementId: string): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await updateDoc(doc(this.firestore, `splitwise/${userId}/settlements`, settlementId), {
        status: SettlementStatus.COMPLETED,
        settledAt: new Date(),
        updatedAt: new Date()
      });

      // Log activity
      const settlementDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/settlements`, settlementId));
      const settlementData = settlementDoc.data() as SplitSettlement;


      this.notificationService.success('Settlement completed successfully');
    } catch (error) {
      console.error('Error completing settlement:', error);
      this.notificationService.error('Failed to complete settlement');
      throw error;
    }
  }

  // ==================== INVITATIONS ====================

  /**
   * Send group invitation
   */
  async sendGroupInvitation(groupId: string, email: string): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const user = this.auth.currentUser;
      const groupDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/groups`, groupId));
      const groupData = groupDoc.data() as SplitwiseGroup;

      const invitationData: Omit<GroupInvitation, 'id'> = {
        groupId: groupId,
        groupName: groupData.name,
        invitedBy: userId,
        invitedByEmail: user?.email || '',
        invitedByDisplayName: user?.displayName || '',
        invitedEmail: email,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(this.firestore, `splitwise/${userId}/invitations`), invitationData);



      this.notificationService.success('Invitation sent successfully');
    } catch (error) {
      console.error('Error sending invitation:', error);
      this.notificationService.error('Failed to send invitation');
      throw error;
    }
  }

  /**
   * Get pending invitations for user
   */
  async getUserInvitations(): Promise<GroupInvitation[]> {
    const user = this.auth.currentUser;
    if (!user?.email) return Promise.resolve([]);

    const invitationRef = collection(this.firestore, `splitwise/${user.uid}/invitations`);
    const invitationSnapshot = await getDocs(invitationRef);
    return invitationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GroupInvitation));

  }

  /**
   * Accept invitation
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const invitationDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/invitations`, invitationId));
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitationData = invitationDoc.data() as GroupInvitation;
      const user = this.auth.currentUser;

      // Add user to group
      const newMember: GroupMember = {
        userId: userId,
        email: user?.email || '',
        displayName: user?.displayName || '',
        photoURL: user?.photoURL || '',
        role: GroupMemberRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
        balance: 0
      };

      const groupRef = doc(this.firestore, `splitwise/${userId}/groups`, invitationData.groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data() as SplitwiseGroup;
      const updatedMembers = [...groupData.members, newMember];

      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: new Date()
      });

      // Update invitation status
      await updateDoc(doc(this.firestore, `splitwise/${userId}/invitations`, invitationId), {
        status: InvitationStatus.ACCEPTED,
        updatedAt: new Date()
      });


      this.notificationService.success('Invitation accepted successfully');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      this.notificationService.error('Failed to accept invitation');
      throw error;
    }
  }

  /**
   * Decline invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await updateDoc(doc(this.firestore, `splitwise/${userId}/invitations`, invitationId), {
        status: InvitationStatus.DECLINED,
        updatedAt: new Date()
      });

      this.notificationService.success('Invitation declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      this.notificationService.error('Failed to decline invitation');
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Update member balances
   */
  private async updateMemberBalances(groupId: string, splits: TransactionSplit[]): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return;
    
    const groupRef = doc(this.firestore, `splitwise/${userId}/groups`, groupId);
    const groupDoc = await getDoc(groupRef);
    const groupData = groupDoc.data() as SplitwiseGroup;

    const updatedMembers = groupData.members.map(member => {
      const split = splits.find(s => s.userId === member.userId);
      if (split) {
        return {
          ...member,
          balance: member.balance + split.amount
        };
      }
      return member;
    });

    await updateDoc(groupRef, {
      members: updatedMembers,
      updatedAt: new Date()
    });
  }


  /**
   * Get group summary
   */
  async getGroupSummary(groupId: string): Promise<GroupSummary> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const [transactions, settlements] = await Promise.all([
      getDocs(query(
        collection(this.firestore, `splitwise/${userId}/transactions`),
        where('groupId', '==', groupId)
      )),
      getDocs(query(
        collection(this.firestore, `splitwise/${userId}/settlements`),
        where('groupId', '==', groupId),
        where('status', '==', SettlementStatus.PENDING)
      ))
    ]);

    const groupDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/groups`, groupId));
    const groupData = groupDoc.data() as SplitwiseGroup;

    const totalAmount = transactions.docs.reduce((sum, doc) => {
      const transaction = doc.data() as SplitTransaction;
      return sum + transaction.amount;
    }, 0);

    return {
      groupId: groupId,
      totalTransactions: transactions.docs.length,
      totalAmount: totalAmount,
      averageAmount: transactions.docs.length > 0 ? totalAmount / transactions.docs.length : 0,
      memberCount: groupData.members.length,
      activeMemberCount: groupData.members.filter(m => m.isActive).length,
      pendingSettlements: settlements.docs.length,
      lastActivity: new Date()
    };
  }

  /**
   * Get member balances for a group
   */
  async getMemberBalances(groupId: string): Promise<MemberBalance[]> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const groupDoc = await getDoc(doc(this.firestore, `splitwise/${userId}/groups`, groupId));
    const groupData = groupDoc.data() as SplitwiseGroup;

    const transactions = await getDocs(query(
      collection(this.firestore, `splitwise/${userId}/transactions`),
      where('groupId', '==', groupId)
    ));

    const memberBalances = new Map<string, MemberBalance>();

    // Initialize member balances
    groupData.members.forEach(member => {
      memberBalances.set(member.userId, {
        userId: member.userId,
        email: member.email,
        displayName: member.displayName,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
        transactionCount: 0
      });
    });

    // Calculate balances from transactions
    transactions.docs.forEach(doc => {
      const transaction = doc.data() as SplitTransaction;
      transaction.splits.forEach(split => {
        const balance = memberBalances.get(split.userId);
        if (balance) {
          balance.transactionCount++;
          if (split.amount > 0) {
            balance.totalPaid += split.amount;
          } else {
            balance.totalOwed += Math.abs(split.amount);
          }
          balance.netBalance = balance.totalPaid - balance.totalOwed;
        }
      });
    });

    return Array.from(memberBalances.values());
  }
} 