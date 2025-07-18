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
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';
import { SplitwiseService } from '../services/splitwise.service';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit, OnDestroy {
  group: SplitwiseGroup | null = null;
  transactions: SplitTransaction[] = [];
  settlements: SplitSettlement[] = [];
  error: string | null = null;
  currentUser: any = null;
  isMobile: boolean = false;
  isLoading: boolean = false;
  Math = Math; // Make Math available in template
  showBalances: boolean = true; // Toggle for balance display
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private breakpointObserver: BreakpointObserver,
    private splitwiseService: SplitwiseService
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
            this.splitwiseService.getGroupById(groupId).then(group => {
              this.group = group;
            });
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
        if (result.action === 'delete') {
          this.store.dispatch(SplitwiseActions.removeMember({
            groupId: this.group!.id!,
            userId: result.userId
          }));
        } else {
        this.store.dispatch(SplitwiseActions.addMember({
          groupId: this.group!.id!,
          request: result
        }));
        }
      }
    });
  }

  deleteGroup(): void {
    if (!this.group) return;
    
    this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Delete Group',
        message: 'Are you sure you want to delete the group "${this.group.name}"?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    }).afterClosed().subscribe((result: any) => {
      if (result) {
        this.store.dispatch(SplitwiseActions.deleteGroup({ groupId: this.group?.id! }));
        this.goBack();
      }
    });
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
    // Calculate total balance from transactions instead of member.balance
    return this.transactions.reduce((total, transaction) => {
      return total + transaction.splits.reduce((splitTotal, split) => splitTotal + split.amount, 0);
    }, 0);
  }

  // Calculate member balances
  getMemberBalances(): any[] {
    if (!this.group) return [];

    const balances = new Map<string, any>();

    // Initialize balances for all members
    this.group.members.forEach(member => {
      balances.set(member.userId, {
        userId: member.userId,
        displayName: member.displayName,
        email: member.email,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0
      });
    });

    // Calculate balances from transactions
    this.transactions.forEach(transaction => {
      transaction.splits.forEach(split => {
        const memberBalance = balances.get(split.userId);
        if (memberBalance) {
          if (split.isPaid) {
            memberBalance.totalPaid += split.amount;
          } else {
            memberBalance.totalOwed += split.amount;
          }
        }
      });
    });

    // Calculate net balance
    balances.forEach(balance => {
      balance.netBalance = balance.totalPaid - balance.totalOwed;
    });

    return Array.from(balances.values()).sort((a, b) => b.netBalance - a.netBalance);
  }

  // Get simplified balance summary
  getBalanceSummary(): { owes: any[], owed: any[] } {
    const balances = this.getMemberBalances();
    const owes = balances.filter(b => b.netBalance < 0);
    const owed = balances.filter(b => b.netBalance > 0);
    return { owes, owed };
  }

  // Calculate who owes what to whom
  getSettlementSuggestions(): any[] {
    const balances = this.getMemberBalances();
    const suggestions: any[] = [];
    
    if (!this.currentUser?.uid) return suggestions;

    // Find current user's balance
    const currentUserBalance = balances.find(b => b.userId === this.currentUser.uid);
    if (!currentUserBalance) return suggestions;

    const currentUserNetBalance = currentUserBalance.netBalance;

    if (currentUserNetBalance < 0) {
      // Current user owes money - show who they should pay
      const debtAmount = Math.abs(currentUserNetBalance);
      const creditors = balances.filter(b => b.netBalance > 0 && b.userId !== this.currentUser.uid);
      
      creditors.forEach(creditor => {
        const availableCredit = creditor.netBalance;
        const settlementAmount = Math.min(debtAmount, availableCredit);
        
        if (settlementAmount > 0) {
          suggestions.push({
            fromUserId: this.currentUser.uid,
            fromUserName: currentUserBalance.displayName,
            toUserId: creditor.userId,
            toUserName: creditor.displayName,
            amount: settlementAmount,
            currency: this.group?.currency || 'USD',
            type: 'you_owe'
          });
        }
      });
    } else if (currentUserNetBalance > 0) {
      // Current user is owed money - show who should pay them
      const creditAmount = currentUserNetBalance;
      const debtors = balances.filter(b => b.netBalance < 0 && b.userId !== this.currentUser.uid);
      
      debtors.forEach(debtor => {
        const debtAmount = Math.abs(debtor.netBalance);
        const settlementAmount = Math.min(creditAmount, debtAmount);
        
        if (settlementAmount > 0) {
          suggestions.push({
            fromUserId: debtor.userId,
            fromUserName: debtor.displayName,
            toUserId: this.currentUser.uid,
            toUserName: currentUserBalance.displayName,
            amount: settlementAmount,
            currency: this.group?.currency || 'USD',
            type: 'owed_to_you'
          });
        }
      });
    } else {
      // Current user is balanced - show other settlements that don't involve them
      const owes = balances.filter(b => b.netBalance < 0 && b.userId !== this.currentUser.uid);
      const owed = balances.filter(b => b.netBalance > 0 && b.userId !== this.currentUser.uid);

      owes.forEach(debtor => {
        const debtAmount = Math.abs(debtor.netBalance);
        let remainingDebt = debtAmount;

        owed.forEach(creditor => {
          if (remainingDebt <= 0) return;
          
          const availableCredit = creditor.netBalance;
          const settlementAmount = Math.min(remainingDebt, availableCredit);
          
          if (settlementAmount > 0) {
            suggestions.push({
              fromUserId: debtor.userId,
              fromUserName: debtor.displayName,
              toUserId: creditor.userId,
              toUserName: creditor.displayName,
              amount: settlementAmount,
              currency: this.group?.currency || 'USD',
              type: 'others'
            });
            
            remainingDebt -= settlementAmount;
          }
        });
      });
    }

    return suggestions;
  }

  // Settle a transaction
  settleTransaction(transaction: SplitTransaction): void {
    if (!this.group) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Settle Transaction',
        message: `Mark all splits in this transaction as paid?`,
        confirmText: 'Settle',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        // Update all splits to paid
        const updatedSplits = transaction.splits.map(split => ({
          ...split,
          isPaid: true,
          paidBy: this.currentUser?.uid,
          paidAt: new Date()
        }));

        // Dispatch action to update transaction
        this.store.dispatch(SplitwiseActions.updateSplitTransaction({
          groupId: this.group!.id!,
          transactionId: transaction.id!,
          updates: {
            splits: updatedSplits,
            status: 'completed'
          }
        }));
      }
    });
  }

  // Create settlement between members
  createSettlement(suggestion: any): void {
    if (!this.group) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Create Settlement',
        message: `Create settlement of ${this.formatCurrency(suggestion.amount, suggestion.currency)} from ${suggestion.fromUserName} to ${suggestion.toUserName}?`,
        confirmText: 'Create',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.store.dispatch(SplitwiseActions.createSettlement({
          groupId: this.group!.id!,
          fromUserId: suggestion.fromUserId,
          toUserId: suggestion.toUserId,
          amount: suggestion.amount,
          notes: `Settlement created from balance summary`
        }));
      }
    });
  }

  // Toggle balance display
  toggleBalanceDisplay(): void {
    this.showBalances = !this.showBalances;
  }

  // Get member balance color
  getBalanceColor(balance: number): string {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  }

  // Get compact transaction summary
  getCompactTransactionSummary(transaction: SplitTransaction): string {
    const paidCount = transaction.splits.filter(split => split.isPaid).length;
    const totalCount = transaction.splits.length;
    const creator = this.getTransactionCreatorName(transaction);
    
    if (paidCount === totalCount) {
      return `Paid by ${creator}`;
    } else if (paidCount === 0) {
      return `Pending - ${creator}`;
    } else {
      return `${paidCount}/${totalCount} paid - ${creator}`;
    }
  }

  // Get settlement subtitle based on current user's situation
  getSettlementSubtitle(): string {
    if (!this.currentUser?.uid) return 'Quick settlements to balance the group';
    
    const balances = this.getMemberBalances();
    const currentUserBalance = balances.find(b => b.userId === this.currentUser.uid);
    
    if (!currentUserBalance) return 'Quick settlements to balance the group';
    
    if (currentUserBalance.netBalance < 0) {
      return 'You owe money to these members';
    } else if (currentUserBalance.netBalance > 0) {
      return 'These members owe you money';
    } else {
      return 'Other members can settle their balances';
    }
  }

  // Get personalized settlement message
  getSettlementMessage(suggestion: any): string {
    switch (suggestion.type) {
      case 'you_owe':
        return `You owe ${suggestion.toUserName}`;
      case 'owed_to_you':
        return `${suggestion.fromUserName} owes you`;
      case 'others':
        return `${suggestion.fromUserName} owes ${suggestion.toUserName}`;
      default:
        return 'Settlement suggestion';
    }
  }

  // Get current user status message
  getCurrentUserStatus(balance: number): string {
    if (balance < 0) {
      return '(You owe)';
    } else if (balance > 0) {
      return '(You are owed)';
    } else {
      return '(Balanced)';
    }
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

  addTransaction(): void {
    // Navigate to add transaction page or open dialog
    this.router.navigate(['dashboard/transactions'], {
      queryParams: { 
        splitGroupId: this.group?.id,
        returnUrl: this.router.url
      }
    });
  }
} 