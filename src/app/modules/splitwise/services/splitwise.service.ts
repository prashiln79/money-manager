import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { Firestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, limit } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { SyncStatus } from '../../../util/config/enums';

import {
  SplitwiseGroup,
  GroupInvitation,
  SplitTransaction,
  SplitSettlement,
  CreateGroupRequest,
  AddMemberRequest,
  CreateSplitTransactionRequest,
  GroupMember,
  GroupMemberRole,
  SplitTransactionStatus,
  MemberBalance,
  SettlementStatus,
  CreateSettlementRequest,
  GroupSummary,
  InvitationStatus,
  TransactionSplit,
  UpdateGroupRequest,
  UpdateSplitTransactionRequest
} from '../../../util/models/splitwise.model';
import { NotificationService } from 'src/app/util/service/notification.service';
import { DateService } from 'src/app/util/service/date.service';

@Injectable({
  providedIn: 'root'
})
export class SplitwiseService {

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private notificationService: NotificationService,
    private dateService: DateService
  ) {}

  // Groups
  getUserGroups(userId: string): Observable<SplitwiseGroup[]> {
    const groupsRef = collection(this.firestore, `splitwise/${userId}/groups`);
    const q = query(
      groupsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SplitwiseGroup))),
      catchError(error => {
        console.error('Error fetching user groups:', error);
        return of([]);
      })
    );
  }

  getGroupById(groupId: string): Promise<SplitwiseGroup | null> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return Promise.resolve(null);
    
    return getDoc(doc(this.firestore, `splitwise/${userId}/groups`, groupId)).then(doc => {
      if (doc.exists()) {
        return { id: doc.id, ...doc.data() } as SplitwiseGroup;
      }
      return null;
    });
  }

  createGroup(request: CreateGroupRequest, userId: string): Observable<SplitwiseGroup> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const groupData: Omit<SplitwiseGroup, 'id'> = {
      name: request.name,
      description: request.description || '',
      createdBy: userId,
      members: [{
        userId: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        role: GroupMemberRole.ADMIN,
        joinedAt: new Date(),
        isActive: true,
        balance: 0
      }],
      currency: request.currency || 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      syncStatus: SyncStatus.SYNCED
    };

    const groupsRef = collection(this.firestore, `splitwise/${userId}/groups`);
    return from(addDoc(groupsRef, groupData)).pipe(
      map(docRef => ({
        id: docRef.id,
        ...groupData
      } as SplitwiseGroup))
    );
  }

  deleteGroup(groupId: string, userId: string): Observable<void> {
    const groupRef = doc(this.firestore, `splitwise/${userId}/groups`, groupId);
    return from(updateDoc(groupRef, { isActive: false, updatedAt: new Date() }));
  }

  // Invitations
  getUserInvitations(userId: string): Observable<GroupInvitation[]> {
    const currentUser = this.auth.currentUser;
    if (!currentUser?.email) {
      return of([]);
    }

    const invitationsRef = collection(this.firestore, `splitwise/${userId}/invitations`);
    const q = query(
      invitationsRef,
      where('invitedEmail', '==', currentUser.email),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GroupInvitation))),
      catchError(error => {
        console.error('Error fetching invitations:', error);
        return of([]);
      })
    );
  }

  acceptInvitation(invitationId: string, userId: string): Observable<void> {
    const invitationRef = doc(this.firestore, `splitwise/${userId}/invitations`, invitationId);
    return from(updateDoc(invitationRef, { 
      status: 'accepted', 
      updatedAt: new Date() 
    }));
  }

  declineInvitation(invitationId: string, userId: string): Observable<void> {
    const invitationRef = doc(this.firestore, `splitwise/${userId}/invitations`, invitationId);
    return from(updateDoc(invitationRef, { 
      status: 'declined', 
      updatedAt: new Date() 
    }));
  }

  // Members
  addMemberToGroup(groupId: string, request: AddMemberRequest, userId: string): Observable<SplitwiseGroup> {
    const groupRef = doc(this.firestore, `splitwise/${userId}/groups`, groupId);
    
    return from(getDoc(groupRef)).pipe(
      map(doc => {
        if (!doc.exists()) {
          throw new Error('Group not found');
        }
        return doc.data() as SplitwiseGroup;
      }),
      map(group => {
        const newMember: GroupMember = {
          userId: '', // Will be set when user accepts invitation
          email: request.email,
          displayName: request.email.split('@')[0], // Default display name
          role: request.role || GroupMemberRole.MEMBER,
          joinedAt: new Date(),
          isActive: false, // Will be true when user accepts invitation
          balance: 0
        };

        const updatedMembers = [...group.members, newMember];
        return { ...group, members: updatedMembers, updatedAt: new Date() };
      }),
      mergeMap(updatedGroup => 
        from(updateDoc(groupRef, { 
          members: updatedGroup.members, 
          updatedAt: new Date() 
        })).pipe(
          map(() => ({ id: groupId, ...updatedGroup } as SplitwiseGroup))
        )
      )
    );
  }

  // Transactions
  getGroupTransactions(groupId: string, userId: string): Observable<SplitTransaction[]> {
    const transactionsRef = collection(this.firestore, `splitwise/${userId}/transactions`);
    const q = query(
      transactionsRef,
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SplitTransaction))),
      catchError(error => {
        console.error('Error fetching group transactions:', error);
        return of([]);
      })
    );
  }

  // Settlements
  getGroupSettlements(groupId: string, userId: string): Observable<SplitSettlement[]> {
    const settlementsRef = collection(this.firestore, `splitwise/${userId}/settlements`);
    const q = query(
      settlementsRef,
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SplitSettlement))),
      catchError(error => {
        console.error('Error fetching group settlements:', error);
        return of([]);
      })
    );
  }

  // Split Transactions
  createSplitTransaction(request: CreateSplitTransactionRequest, userId: string): Observable<SplitTransaction> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const splitTransactionData: Omit<SplitTransaction, 'id'> = {
      groupId: request.groupId,
      originalTransactionId: request.originalTransactionId,
      amount: request.amount,
      createdBy: userId,
      splits: request.splits.map(split => ({
        ...split,
        email: '', // Will be populated from user data
        displayName: '' // Will be populated from user data
      })),
      totalAmount: request.amount,
      currency: 'USD', // Default currency
      status: SplitTransactionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: SyncStatus.SYNCED
    };

    const transactionsRef = collection(this.firestore, `splitwise/${userId}/transactions`);
    return from(addDoc(transactionsRef, splitTransactionData)).pipe(
      map(docRef => ({
        id: docRef.id,
        ...splitTransactionData
      } as SplitTransaction))
    );
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

  // ==================== MEMBER MANAGEMENT ====================


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

      return settlementRef.id;
    } catch (error) {
      console.error('Error creating settlement:', error);
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


    } catch (error) {
      console.error('Error completing settlement:', error);
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

    } catch (error) {
      console.error('Error sending invitation:', error);
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