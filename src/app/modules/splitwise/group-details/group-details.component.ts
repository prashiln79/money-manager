import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NotificationService } from 'src/app/util/service/notification.service';
import { SplitwiseGroup, SplitTransaction, SplitSettlement } from 'src/app/util/models/splitwise.model';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog.component';

// NgRx
import { AppState } from '../../../store/app.state';
import * as SplitwiseActions from '../store/splitwise.actions';
import { selectSplitwiseState } from '../store/splitwise.selectors';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit, OnDestroy {
  group: SplitwiseGroup | null = null;
  transactions: SplitTransaction[] = [];
  settlements: SplitSettlement[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  currentUser: any = null;
  isMobile: boolean = false;
  Math = Math; // Make Math available in template
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private breakpointObserver: BreakpointObserver
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
    this.subscribeToStore();
    this.loadGroupDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToStore(): void {
    this.store.select(selectSplitwiseState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isLoading = state.loading;
        this.error = state.error;

        // Get the group from the selected group or find by ID
        const groupId = this.route.snapshot.paramMap.get('id');
        if (groupId) {
          this.group = state.groups.find(g => g.id === groupId) || null;
          
          // If group not found in store, try to load it
          if (!this.group && !this.isLoading) {
            this.store.dispatch(SplitwiseActions.loadGroupById({ groupId }));
          }
        }

        // Get transactions and settlements for the current group
        this.transactions = state.transactions.filter(t => t.groupId === groupId);
        this.settlements = state.settlements.filter(s => s.groupId === groupId);

        // Show error notification if there's an error
        if (this.error) {
          this.notificationService.error(this.error);
          this.store.dispatch(SplitwiseActions.clearError());
        }
      });
  }

  private loadGroupDetails(): void {
    const groupId = this.route.snapshot.paramMap.get('id');
    if (groupId) {
      this.store.dispatch(SplitwiseActions.loadGroupById({ groupId }));
      this.store.dispatch(SplitwiseActions.loadTransactions({ groupId }));
      this.store.dispatch(SplitwiseActions.loadSettlements({ groupId }));
    }
  }

  goBack(): void {
    this.router.navigate(['dashboard/splitwise']);
  }

  openAddMemberDialog(): void {
    if (!this.group) return;

    const dialogRef = this.dialog.open(AddMemberDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: { group: this.group },
      disableClose: true,
      panelClass: 'mobile-dialog'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.store.dispatch(SplitwiseActions.addMember({ 
          groupId: this.group!.id!, 
          request: result 
        }));
      }
    });
  }

  deleteGroup(): void {
    if (!this.group) return;

    if (confirm(`Are you sure you want to delete the group "${this.group.name}"?`)) {
      this.store.dispatch(SplitwiseActions.deleteGroup({ groupId: this.group.id! }));
      this.goBack();
    }
  }

  getCurrentUserRole(): string {
    if (!this.group || !this.currentUser) return '';

    const member = this.group.members.find(m => m.userId === this.currentUser.uid);
    return member?.role || '';
  }

  canManageGroup(): boolean {
    const role = this.getCurrentUserRole();
    return role === 'admin';
  }

  getGroupMemberCount(): number {
    return this.group?.members.filter(member => member.isActive).length || 0;
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

  getTotalBalance(): number {
    if (!this.group) return 0;
    return this.group.members.reduce((total, member) => total + member.balance, 0);
  }



  getTransactionStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'partial':
        return 'warning';
      case 'pending':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }

  getTransactionStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'partial':
        return 'Partial';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  getTransactionCreatorName(transaction: SplitTransaction): string {
    if (!this.group) return '';
    const member = this.group.members.find(m => m.userId === transaction.createdBy);
    return member?.displayName || 'Unknown';
  }

  getTransactionSplitsSummary(transaction: SplitTransaction): string {
    const paidCount = transaction.splits.filter(split => split.isPaid).length;
    const totalCount = transaction.splits.length;
    return `${paidCount}/${totalCount} paid`;
  }

  getTotalTransactionAmount(): number {
    return this.transactions.reduce((total, transaction) => total + transaction.totalAmount, 0);
  }

  getTransactionCount(): number {
    return this.transactions.length;
  }

  getSettlementCount(): number {
    return this.settlements.length;
  }


  getMemberName(userId: string): string {
    if (!this.group) return 'Unknown';
    const member = this.group.members.find(m => m.userId === userId);
    return member?.displayName || 'Unknown';
  }

  toggleMembers(): void {
    // Navigate to the members page instead of toggling
    this.router.navigate(['dashboard/splitwise/members', this.group?.id]);
  }
} 