import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AppState } from '../../store/app.state';
import { InvitationPopupComponent, InvitationPopupData } from '../components/invitation-popup/invitation-popup.component';
import { SplitwiseService } from '../../modules/splitwise/services/splitwise.service';
import { UserService } from './user.service';
import * as SplitwiseActions from '../../modules/splitwise/store/splitwise.actions';
import { GroupInvitation } from '../models/splitwise.model';
import { DateService } from './date.service';

@Injectable({
  providedIn: 'root'
})
export class InvitationPopupService {

  constructor(
    private dialog: MatDialog,
    private store: Store<AppState>,
    private splitwiseService: SplitwiseService,
    private userService: UserService,
    private dateService: DateService
  ) {}

  /**
   * Check for pending invitations and show popup if any exist
   */
  async checkAndShowInvitations(): Promise<void> {
    try {
      const currentUser = await this.userService.getCurrentUser();
      if (!currentUser?.uid) {
        return;
      }

      // Get pending invitations
      const invitations = await this.splitwiseService.getUserInvitations(currentUser.uid).toPromise();
      
      if (invitations && invitations.length > 0) {
        // Filter out expired invitations
        const validInvitations = invitations.filter(invitation => !this.isInvitationExpired(invitation));
        
        if (validInvitations.length > 0) {
          this.showInvitationPopup(validInvitations);
        }
      }
    } catch (error) {
      console.error('Error checking invitations:', error);
    }
  }

  /**
   * Show invitation popup with the given invitations
   */
  showInvitationPopup(invitations: GroupInvitation[]): void {
    if (!invitations || invitations.length === 0) {
      return;
    }

    const dialogRef = this.dialog.open(InvitationPopupComponent, {
      data: { invitations } as InvitationPopupData,
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
      panelClass: 'invitation-popup-dialog'
    });

    // Handle dialog close
    dialogRef.afterClosed().subscribe(() => {
      // Refresh invitations in store after popup is closed
      this.store.dispatch(SplitwiseActions.loadInvitations());
    });
  }

  /**
   * Check if invitation is expired
   */
  private isInvitationExpired(invitation: GroupInvitation): boolean {
    if (!invitation.expiresAt) {
      return false;
    }

    let expiresAt: Date | null = null;
    
    if (invitation.expiresAt instanceof Date) {
      expiresAt = invitation.expiresAt;
    } else if (invitation.expiresAt.toDate) {
      expiresAt = invitation.expiresAt.toDate();
    } else {
      expiresAt = this.dateService.toDate(invitation.expiresAt);
    }
    
    return expiresAt ? expiresAt < new Date() : false;
  }

  /**
   * Show invitation popup after successful login
   */
  async showInvitationsAfterLogin(): Promise<void> {
    // Add a small delay to ensure user data is loaded
    setTimeout(() => {
      this.checkAndShowInvitations();
    }, 1000);
  }
} 