import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../../store/app.state';
import { GroupInvitation } from '../../models/splitwise.model';
import * as SplitwiseActions from '../../../modules/splitwise/store/splitwise.actions';
import { NotificationService } from '../../service/notification.service';
import { DateService } from '../../service/date.service';

export interface InvitationPopupData {
  invitations: GroupInvitation[];
}

@Component({
  selector: 'app-invitation-popup',
  templateUrl: './invitation-popup.component.html',
  styleUrls: ['./invitation-popup.component.scss']
})
export class InvitationPopupComponent implements OnInit, OnDestroy {
  invitations: GroupInvitation[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<InvitationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvitationPopupData,
    private store: Store<AppState>,
    private notificationService: NotificationService,
    private dateService: DateService
  ) {
    this.invitations = data.invitations || [];
  }

  ngOnInit(): void {
    // Auto-close dialog if no invitations
    if (this.invitations.length === 0) {
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  acceptInvitation(invitation: GroupInvitation): void {
    this.loading = true;
    this.store.dispatch(SplitwiseActions.acceptInvitation({ invitationId: invitation.id! }));
    
    // Remove from local list
    this.invitations = this.invitations.filter(inv => inv.id !== invitation.id);
    
    // Close dialog if no more invitations
    if (this.invitations.length === 0) {
      this.dialogRef.close();
    }
    
    this.loading = false;
  }

  declineInvitation(invitation: GroupInvitation): void {
    this.loading = true;
    this.store.dispatch(SplitwiseActions.declineInvitation({ invitationId: invitation.id! }));
    
    // Remove from local list
    this.invitations = this.invitations.filter(inv => inv.id !== invitation.id);
    
    // Close dialog if no more invitations
    if (this.invitations.length === 0) {
      this.dialogRef.close();
    }
    
    this.loading = false;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  formatDate(date: any): string {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInvitationStatusText(invitation: GroupInvitation): string {
    const daysSinceInvitation = Math.floor(
      (Date.now() - (this.dateService.toDate(invitation.createdAt)?.getTime() ?? 0)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceInvitation === 0) return 'Today';
    if (daysSinceInvitation === 1) return 'Yesterday';
    if (daysSinceInvitation < 7) return `${daysSinceInvitation} days ago`;
    return this.formatDate(invitation.createdAt);
  }
} 