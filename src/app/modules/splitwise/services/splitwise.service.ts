import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { Firestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { SyncStatus } from '../../../util/config/enums';

import {
  SplitwiseGroup,
  GroupInvitation,
  SplitTransaction,
  SplitSettlement,
  CreateGroupRequest,
  AddMemberRequest,
  GroupMember,
  GroupMemberRole
} from '../../../util/models/splitwise.model';

@Injectable({
  providedIn: 'root'
})
export class SplitwiseService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
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
} 