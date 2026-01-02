import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, from } from 'rxjs';
import { map, mergeMap, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';

import * as SplitwiseActions from './splitwise.actions';
import { SplitwiseService } from '../services/splitwise.service';
import { UserService } from '../../../util/service/db/user.service';
import { AppState } from '../../../store/app.state';

@Injectable()
export class SplitwiseEffects {

  loadGroups$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.loadGroups),
    mergeMap(() => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.loadGroupsFailure({ error: 'User not authenticated' }));
        }
        return this.splitwiseService.getUserGroups(user.uid).pipe(
          map(groups => SplitwiseActions.loadGroupsSuccess({ groups: groups || [] })),
          catchError(error => of(SplitwiseActions.loadGroupsFailure({ error: error.message })))
        );
      })
    ))
  ));

  loadGroupById$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.loadGroupById),
    mergeMap((action) => from(this.splitwiseService.getGroupById(action.groupId)).pipe(
      map(group => {
        if (group) {
          return SplitwiseActions.loadGroupByIdSuccess({ group });
        } else {
          return SplitwiseActions.loadGroupByIdFailure({ error: 'Group not found' });
        }
      }),
      catchError(error => of(SplitwiseActions.loadGroupByIdFailure({ error: error.message })))
    ))
  ));

  loadInvitations$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.loadInvitations),
    mergeMap(() => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.loadInvitationsFailure({ error: 'User not authenticated' }));
        }
        return this.splitwiseService.getUserInvitations(user.uid).pipe(
          map(invitations => SplitwiseActions.loadInvitationsSuccess({ invitations: invitations || [] })),
          catchError(error => of(SplitwiseActions.loadInvitationsFailure({ error: error.message })))
        );
      })
    ))
  ));

  createGroup$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.createGroup),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.createGroupFailure({ error: 'User not authenticated' }));
        }
        return this.splitwiseService.createGroup(action.request, user.uid).pipe(
          map(group => SplitwiseActions.createGroupSuccess({ group })),
          catchError(error => of(SplitwiseActions.createGroupFailure({ error: error.message })))
        );
      })
    ))
  ));

  addMember$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.addMember),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.addMemberFailure({ error: 'User not authenticated' }));
        }
        return from(this.splitwiseService.addMemberToGroup(action.groupId, action.request, user.uid)).pipe(
          map(group => SplitwiseActions.addMemberSuccess({ group })),
          catchError(error => of(SplitwiseActions.addMemberFailure({ error: error.message })))
        );
      })
    ))
  ));

  acceptInvitation$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.acceptInvitation),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.acceptInvitationFailure({ error: 'User not authenticated' }));
        }
        return from(this.splitwiseService.acceptInvitation(action.invitationId, user.uid)).pipe(
          map(() => SplitwiseActions.acceptInvitationSuccess({ invitationId: action.invitationId })),
          catchError(error => of(SplitwiseActions.acceptInvitationFailure({ error: error.message })))
        );
      })
    ))
  ));

  declineInvitation$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.declineInvitation),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.declineInvitationFailure({ error: 'User not authenticated' }));
        }
        return from(this.splitwiseService.declineInvitation(action.invitationId, user.uid)).pipe(
          map(() => SplitwiseActions.declineInvitationSuccess({ invitationId: action.invitationId })),
          catchError(error => of(SplitwiseActions.declineInvitationFailure({ error: error.message })))
        );
      })
    ))
  ));

  deleteGroup$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.deleteGroup),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.deleteGroupFailure({ error: 'User not authenticated' }));
        }
        return this.splitwiseService.deleteGroup(action.groupId, user.uid).pipe(
          map(() => SplitwiseActions.deleteGroupSuccess({ groupId: action.groupId })),
          catchError(error => of(SplitwiseActions.deleteGroupFailure({ error: error.message })))
        );
      })
    ))
  ));

  loadTransactions$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.loadTransactions),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.loadTransactionsFailure({ error: 'User not authenticated' }));
        }
        return this.splitwiseService.getGroupTransactions(action.groupId, user.uid).pipe(
          map(transactions => SplitwiseActions.loadTransactionsSuccess({ transactions: transactions || [] })),
          catchError(error => of(SplitwiseActions.loadTransactionsFailure({ error: error.message })))
        );
      })
    ))
  ));

  loadSettlements$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.loadSettlements),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.loadSettlementsFailure({ error: 'User not authenticated' }));
        }
        return this.splitwiseService.getGroupSettlements(action.groupId, user.uid).pipe(
          map(settlements => SplitwiseActions.loadSettlementsSuccess({ settlements: settlements || [] })),
          catchError(error => of(SplitwiseActions.loadSettlementsFailure({ error: error.message })))
        );
      })
    ))
  ));

  createSplitTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.createSplitTransaction),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.createSplitTransactionFailure({ error: 'User not authenticated' }));
        }
        return this.splitwiseService.createSplitTransaction(action.request, user.uid).pipe(
          map(transaction => SplitwiseActions.createSplitTransactionSuccess({ transaction })),
          catchError(error => of(SplitwiseActions.createSplitTransactionFailure({ error: error.message })))
        );
      })
    ))
  ));

  updateSplitTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.updateSplitTransaction),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.updateSplitTransactionFailure({ error: 'User not authenticated' }));
        }
        return from(this.splitwiseService.updateSplitTransaction(action.transactionId, action.updates)).pipe(
          map(() => {
            // Return a mock transaction since the service doesn't return the updated transaction
            return SplitwiseActions.updateSplitTransactionSuccess({ 
              transaction: { id: action.transactionId } as any 
            });
          }),
          catchError(error => of(SplitwiseActions.updateSplitTransactionFailure({ error: error.message })))
        );
      })
    ))
  ));

  createSettlement$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.createSettlement),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.createSettlementFailure({ error: 'User not authenticated' }));
        }
        const request = {
          groupId: action.groupId,
          fromUserId: action.fromUserId,
          toUserId: action.toUserId,
          amount: action.amount,
          notes: action.notes,
          originalTransactionId: action.originalTransactionId
        };
        return from(this.splitwiseService.createSettlement(request)).pipe(
          map(settlementId => {
            // Return a mock settlement since the service only returns the ID
            return SplitwiseActions.createSettlementSuccess({ 
              settlement: { id: settlementId } as any 
            });
          }),
          catchError(error => of(SplitwiseActions.createSettlementFailure({ error: error.message })))
        );
      })
    ))
  ));

  removeMember$ = createEffect(() => this.actions$.pipe(
    ofType(SplitwiseActions.removeMember),
    mergeMap((action) => from(this.userService.getCurrentUser()).pipe(
      mergeMap(user => {
        if (!user?.uid) {
          return of(SplitwiseActions.removeMemberFailure({ error: 'User not authenticated' }));
        }
        return from(this.splitwiseService.removeMemberFromGroup(action.groupId, action.userId, user.uid)).pipe(
          map(() => SplitwiseActions.removeMemberSuccess({ groupId: action.groupId })),
          catchError(error => of(SplitwiseActions.removeMemberFailure({ error: error.message })))
        );
      })
    ))
  ));

  constructor(
    private actions$: Actions,
    private splitwiseService: SplitwiseService,
    private userService: UserService,
    private store: Store<AppState>,
    private auth: Auth
  ) {}
} 