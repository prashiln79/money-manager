import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from 'src/app/util/service/notification.service';
import { SplitwiseService } from 'src/app/util/service/splitwise.service';
import { SplitwiseGroup, GroupInvitation } from 'src/app/util/models/splitwise.model';
import { CreateGroupDialogComponent } from './create-group-dialog/create-group-dialog.component';
import { AddMemberDialogComponent } from './add-member-dialog/add-member-dialog.component';

@Component({
  selector: 'app-splitwise',
  templateUrl: './splitwise.component.html',
  styleUrls: ['./splitwise.component.scss']
})
export class SplitwiseComponent implements OnInit, OnDestroy {
  groups: SplitwiseGroup[] = [];
  invitations: GroupInvitation[] = [];
  isLoading: boolean = false;
  isMobile: boolean = false;
  currentUser: any = null;
  selectedGroup: SplitwiseGroup | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private auth: Auth,
    private splitwiseService: SplitwiseService,
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      // Load groups and invitations in parallel
      const [groups, invitations] = await Promise.all([
        this.splitwiseService.getUserGroups(this.currentUser?.uid || ''),
        this.splitwiseService.getUserInvitations()
      ]);

      this.groups = groups || [];
      this.invitations = invitations || [];

      // Auto-select first group if none selected
      if (!this.selectedGroup && this.groups.length > 0) {
        this.selectedGroup = this.groups[0];
      }
    } catch (error) {
      console.error('Error loading splitwise data:', error);
      this.notificationService.error('Failed to load data');
    } finally {
      this.isLoading = false;
    }
  }

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: this.isMobile ? '90vw' : '500px',
      maxWidth: this.isMobile ? '500px' : '90vw',
      disableClose: true,
      panelClass: 'mobile-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  openAddMemberDialog(group: SplitwiseGroup): void {
    const dialogRef = this.dialog.open(AddMemberDialogComponent, {
      width: this.isMobile ? '90vw' : '400px',
      maxWidth: this.isMobile ? '400px' : '90vw',
      data: { group },
      disableClose: true,
      panelClass: 'mobile-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  async acceptInvitation(invitation: GroupInvitation): Promise<void> {
    try {
      await this.splitwiseService.acceptInvitation(invitation.id!);
      this.notificationService.success('Invitation accepted successfully');
      this.loadData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      this.notificationService.error('Failed to accept invitation');
    }
  }

  async declineInvitation(invitation: GroupInvitation): Promise<void> {
    try {
      await this.splitwiseService.declineInvitation(invitation.id!);
      this.notificationService.success('Invitation declined');
      this.loadData();
    } catch (error) {
      console.error('Error declining invitation:', error);
      this.notificationService.error('Failed to decline invitation');
    }
  }

  selectGroup(group: SplitwiseGroup): void {
    this.selectedGroup = group;
  }

  async deleteGroup(group: SplitwiseGroup): Promise<void> {
    if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      try {
        await this.splitwiseService.deleteGroup(group.id!);
        this.notificationService.success('Group deleted successfully');
        this.loadData();
      } catch (error) {
        console.error('Error deleting group:', error);
        this.notificationService.error('Failed to delete group');
      }
    }
  }

  getGroupMemberCount(group: SplitwiseGroup): number {
    return group.members.filter(member => member.isActive).length;
  }

  getCurrentUserRole(group: SplitwiseGroup): string {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return '';

    const member = group.members.find(m => m.userId === currentUser.uid);
    return member?.role || '';
  }

  canManageGroup(group: SplitwiseGroup): boolean {
    const role = this.getCurrentUserRole(group);
    return role === 'admin';
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