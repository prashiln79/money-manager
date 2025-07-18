import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from 'src/app/util/service/notification.service';
import { SplitwiseGroup, GroupInvitation } from 'src/app/util/models/splitwise.model';
import { CreateGroupDialogComponent } from './create-group-dialog/create-group-dialog.component';

// NgRx
import { AppState } from '../../store/app.state';
import * as SplitwiseActions from './store/splitwise.actions';
import { selectSplitwiseState } from './store/splitwise.selectors';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-splitwise',
  templateUrl: './splitwise.component.html',
  styleUrls: ['./splitwise.component.scss']
})
export class SplitwiseComponent implements OnInit, OnDestroy {
  groups: SplitwiseGroup[] = [];
  invitations: GroupInvitation[] = [];
  isMobile: boolean = false;
  currentUser: any = null;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private auth: Auth,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {
    // Observe breakpoints for mobile detection
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  ngOnInit(): void {
    this.currentUser = this.auth.currentUser;
    this.loadData();
    this.subscribeToStore();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToStore(): void {
    this.store.select(selectSplitwiseState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.groups = state.groups;
        this.invitations = state.invitations;
        this.error = state.error;

        // Show error notification if there's an error
        if (this.error) {
          this.notificationService.error(this.error);
          this.store.dispatch(SplitwiseActions.clearError());
        }
      });
  }

  loadData(): void {
    this.store.dispatch(SplitwiseActions.loadGroups());
    this.store.dispatch(SplitwiseActions.loadInvitations());
  }

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: this.isMobile ? '90vw' : '500px',
      maxWidth: this.isMobile ? '500px' : '90vw',
      disableClose: true,
      panelClass: 'mobile-dialog'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.store.dispatch(SplitwiseActions.createGroup({ request: result }));
      }
    });
  }



  handleAddMember(data: { groupId: string, request: any }): void {
    this.store.dispatch(SplitwiseActions.addMember(data));
  }

  acceptInvitation(invitation: GroupInvitation): void {
    this.store.dispatch(SplitwiseActions.acceptInvitation({ invitationId: invitation.id! }));
  }

  declineInvitation(invitation: GroupInvitation): void {
    this.store.dispatch(SplitwiseActions.declineInvitation({ invitationId: invitation.id! }));
  }



  deleteGroup(group: SplitwiseGroup): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Delete Group',
        message: 'Are you sure you want to delete the group "${group.name}"?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    }).afterClosed().subscribe((result: any) => {   
      if (result) {
        this.store.dispatch(SplitwiseActions.deleteGroup({ groupId: group.id! }));
      }
    });
  }



  formatDate(date: Date | any): string {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString();
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
} 