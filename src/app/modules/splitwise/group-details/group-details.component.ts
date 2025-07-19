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
    
    // Test balance calculation with sample data
    setTimeout(() => {
      this.testBalanceCalculation();
    }, 2000); // Wait 2 seconds for data to load
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

        // Log state changes for debugging
        console.log('Store state updated:', {
          loading: state.loading,
          transactionsCount: state.transactions.length,
          settlementsCount: state.settlements.length,
          error: state.error
        });
      });
  }

  // Reload data after successful operations
  private reloadData(): void {
    const groupId = this.route.snapshot.paramMap.get('id');
    if (groupId) {
      this.store.dispatch(SplitwiseActions.loadTransactions({ groupId }));
      this.store.dispatch(SplitwiseActions.loadSettlements({ groupId }));
    }
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

  // Improved algorithm to calculate net balances considering settlements
  calculateNetBalances(): Record<string, Record<string, number>> {
    const balances: Record<string, Record<string, number>> = {};

    // Step 1: Process Transactions (Expenses)
    for (const transaction of this.transactions) {
      const paidBy = transaction.createdBy; // Who paid for the transaction
      const amount = transaction.totalAmount;

      for (const split of transaction.splits) {
        const { userId, amount: owedAmount } = split;

        if (userId === paidBy) continue; // Skip self

        // userId owes paidBy
        if (!balances[userId]) balances[userId] = {};
        if (!balances[userId][paidBy]) balances[userId][paidBy] = 0;

        balances[userId][paidBy] += owedAmount;
      }
    }

    // Step 2: Process Settlements
    for (const settlement of this.settlements) {
      if (settlement.status === 'cancelled') continue; // Skip cancelled settlements
      
      const { fromUserId, toUserId, amount } = settlement;

      // fromUserId paid toUserId, so reduce debt
      if (!balances[fromUserId]) balances[fromUserId] = {};
      if (!balances[fromUserId][toUserId]) balances[fromUserId][toUserId] = 0;

      balances[fromUserId][toUserId] -= amount;
    }

    // Step 3: Simplify balances to show only net one-way debts
    return this.simplifyBalances(balances);
  }

  // Simplify balances to show only net one-way debts
  simplifyBalances(balances: Record<string, Record<string, number>>): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    const visited = new Set<string>();

    for (const userA in balances) {
      for (const userB in balances[userA]) {
        const key = `${userA}_${userB}`;
        const reverseKey = `${userB}_${userA}`;
        
        if (visited.has(key) || visited.has(reverseKey)) continue;

        const amountAB = balances[userA]?.[userB] || 0;
        const amountBA = balances[userB]?.[userA] || 0;

        const net = amountAB - amountBA;

        if (net > 0) {
          if (!result[userA]) result[userA] = {};
          result[userA][userB] = Math.round(net * 100) / 100;
        } else if (net < 0) {
          if (!result[userB]) result[userB] = {};
          result[userB][userA] = Math.round(-net * 100) / 100;
        }

        visited.add(key);
        visited.add(reverseKey);
      }
    }

    return result;
  }

  getMemberBalances(): any[] {
    if (!this.group) return [];

    // Step 1: Calculate simplified net balances
    const simplifiedBalances = this.calculateNetBalances();
    
    // Step 2: Convert to the expected format for display
    const balances: any[] = [];
    
    this.group.members.forEach(member => {
      const memberBalances = simplifiedBalances[member.userId] || {};
      
      // Calculate total owed by this member to others (only positive amounts)
      let totalOwed = 0;
      Object.values(memberBalances).forEach((amount: any) => {
        if (amount > 0) {
          totalOwed += amount;
        }
      });
      
      // Calculate total owed to this member by others
      let totalPaid = 0;
      Object.keys(simplifiedBalances).forEach(otherUserId => {
        if (otherUserId !== member.userId) {
          const otherBalances = simplifiedBalances[otherUserId] || {};
          const owedToMember = otherBalances[member.userId] || 0;
          if (owedToMember > 0) {
            totalPaid += owedToMember;
          }
        }
      });
      
      // Calculate net balance (positive = they owe you, negative = you owe them)
      const netBalance = totalPaid - totalOwed;
      
      balances.push({
        userId: member.userId,
        displayName: member.displayName,
        email: member.email,
        totalPaid: totalPaid,
        totalOwed: totalOwed,
        netBalance: netBalance,
        simplifiedBalances: memberBalances // Keep simplified balances for reference
      });
    });

    return balances.sort((a, b) => b.netBalance - a.netBalance);
  }

  // Get detailed balance breakdown for a user (simplified)
  getDetailedBalanceBreakdown(userId: string): any[] {
    const simplifiedBalances = this.calculateNetBalances();
    const userBalances = simplifiedBalances[userId] || {};
    const breakdown: any[] = [];

    // Check what this user owes to others (only positive amounts)
    Object.entries(userBalances).forEach(([otherUserId, amount]) => {
      if (amount > 0) {
        breakdown.push({
          type: 'owes',
          otherUserId: otherUserId,
          otherUserName: this.getMemberName(otherUserId),
          amount: amount,
          message: `${this.getMemberName(userId)} owes ${this.getMemberName(otherUserId)} ${this.formatCurrency(amount, this.group?.currency || 'USD')}`
        });
      }
    });

    // Check what others owe to this user
    Object.keys(simplifiedBalances).forEach(otherUserId => {
      if (otherUserId !== userId) {
        const otherBalances = simplifiedBalances[otherUserId] || {};
        const owedToUser = otherBalances[userId] || 0;
        
        if (owedToUser > 0) {
          breakdown.push({
            type: 'owed',
            otherUserId: otherUserId,
            otherUserName: this.getMemberName(otherUserId),
            amount: owedToUser,
            message: `${this.getMemberName(otherUserId)} owes ${this.getMemberName(userId)} ${this.formatCurrency(owedToUser, this.group?.currency || 'USD')}`
          });
        }
      }
    });

    return breakdown.sort((a, b) => b.amount - a.amount);
  }

  // Get balance between two specific users (simplified)
  getBalanceBetweenUsers(userId1: string, userId2: string): number {
    const simplifiedBalances = this.calculateNetBalances();
    
    const balance1to2 = simplifiedBalances[userId1]?.[userId2] || 0;
    const balance2to1 = simplifiedBalances[userId2]?.[userId1] || 0;
    
    // Return net balance (positive = userId1 owes userId2, negative = userId2 owes userId1)
    return balance1to2 - balance2to1;
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
        
        // Use the new balance calculation to get exact amount owed
        const exactAmountOwed = this.getBalanceBetweenUsers(this.currentUser.uid, creditor.userId);
        
        if (exactAmountOwed > 0) {
          const settlementAmount = Math.min(exactAmountOwed, availableCredit);
          
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
        }
      });
    } else if (currentUserNetBalance > 0) {
      // Current user is owed money - show who should pay them
      const creditAmount = currentUserNetBalance;
      const debtors = balances.filter(b => b.netBalance < 0 && b.userId !== this.currentUser.uid);
      
      debtors.forEach(debtor => {
        // Use the new balance calculation to get exact amount owed
        const exactAmountOwed = this.getBalanceBetweenUsers(debtor.userId, this.currentUser.uid);
        
        if (exactAmountOwed > 0) {
          const settlementAmount = Math.min(exactAmountOwed, creditAmount);
          
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
          
          // Use the new balance calculation to get exact amount owed
          const exactAmountOwed = this.getBalanceBetweenUsers(debtor.userId, creditor.userId);
          
          if (exactAmountOwed > 0) {
            const settlementAmount = Math.min(remainingDebt, availableCredit, exactAmountOwed);
            
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
          }
        });
      });
    }

    return suggestions;
  }

  // Settle a transaction
  settleTransaction(transaction: SplitTransaction): void {
    if (!this.group) {
      this.notificationService.error('Group not found');
      return;
    }

    if (!this.currentUser?.uid) {
      this.notificationService.error('User not authenticated');
      return;
    }

    // Check for existing settlements related to this transaction
    const existingSettlements = this.getExistingSettlementsForTransaction(transaction);
    
    let message = `Mark all splits in this transaction as paid?`;
    if (existingSettlements.length > 0) {
      message += `\n\nNote: There are ${existingSettlements.length} existing settlement(s) that may be affected.`;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Settle Transaction',
        message: message,
        confirmText: 'Settle',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        try {
          // Create updated splits without email and displayName (as expected by the service)
          const updatedSplits = transaction.splits.map(split => ({
            userId: split.userId,
            amount: split.amount,
            percentage: split.percentage,
            isPaid: true,
            paidBy: this.currentUser?.uid,
            paidAt: new Date()
          }));

          console.log('Settling transaction:', transaction.id, 'with splits:', updatedSplits);

          // Dispatch action to update transaction
          this.store.dispatch(SplitwiseActions.updateSplitTransaction({
            groupId: this.group!.id!,
            transactionId: transaction.id!,
            updates: {
              splits: updatedSplits,
              status: 'completed'
            }
          }));

          // Show success notification
          this.notificationService.success('Transaction settled successfully');
          
          // Reload data after a short delay to ensure the update is processed
          setTimeout(() => {
            this.reloadData();
          }, 1000);
        } catch (error) {
          console.error('Error settling transaction:', error);
          this.notificationService.error('Failed to settle transaction');
        }
      }
    });
  }

  // Get existing settlements that might be affected by settling this transaction
  getExistingSettlementsForTransaction(transaction: SplitTransaction): any[] {
    const affectedSettlements: any[] = [];
    
    // Get all unique user pairs from the transaction splits
    const userPairs = new Set<string>();
    transaction.splits.forEach(split => {
      if (split.userId !== this.currentUser?.uid) {
        userPairs.add(`${this.currentUser?.uid}-${split.userId}`);
        userPairs.add(`${split.userId}-${this.currentUser?.uid}`);
      }
    });

    // Check for existing settlements between these user pairs
    userPairs.forEach(pair => {
      const [fromUserId, toUserId] = pair.split('-');
      const settlement = this.settlements.find(s => 
        s.fromUserId === fromUserId && 
        s.toUserId === toUserId && 
        s.status !== 'cancelled'
      );
      
      if (settlement) {
        affectedSettlements.push({
          fromUserName: this.getMemberName(settlement.fromUserId),
          toUserName: this.getMemberName(settlement.toUserId),
          amount: settlement.amount,
          status: settlement.status
        });
      }
    });

    return affectedSettlements;
  }

  // Check if a transaction can be settled (no conflicts with existing settlements)
  canSettleTransaction(transaction: SplitTransaction): { canSettle: boolean; reason?: string } {
    if (transaction.status === 'completed') {
      return { canSettle: false, reason: 'Transaction is already completed' };
    }

    const existingSettlements = this.getExistingSettlementsForTransaction(transaction);
    
    if (existingSettlements.length > 0) {
      const pendingSettlements = existingSettlements.filter(s => s.status === 'pending');
      if (pendingSettlements.length > 0) {
        return { 
          canSettle: false, 
          reason: `There are ${pendingSettlements.length} pending settlement(s) that need to be resolved first` 
        };
      }
    }

    return { canSettle: true };
  }

  // Get settlement conflicts for a transaction
  getSettlementConflicts(transaction: SplitTransaction): any[] {
    const conflicts: any[] = [];
    
    // Check if there are pending settlements that might conflict
    const existingSettlements = this.getExistingSettlementsForTransaction(transaction);
    const pendingSettlements = existingSettlements.filter(s => s.status === 'pending');
    
    pendingSettlements.forEach(settlement => {
      conflicts.push({
        type: 'pending_settlement',
        message: `Pending settlement: ${settlement.fromUserName} → ${settlement.toUserName} (${this.formatCurrency(settlement.amount, this.group?.currency || 'USD')})`,
        settlement: settlement
      });
    });

    return conflicts;
  }

  // Check if transaction has settlement conflicts
  hasSettlementConflicts(transaction: SplitTransaction): boolean {
    return this.getSettlementConflicts(transaction).length > 0;
  }

  // Create settlement between members
  createSettlement(suggestion: any): void {
    if (!this.group) {
      this.notificationService.error('Group not found');
      return;
    }

    if (!this.currentUser?.uid) {
      this.notificationService.error('User not authenticated');
      return;
    }

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
        try {
          console.log('Creating settlement:', suggestion);

          this.store.dispatch(SplitwiseActions.createSettlement({
            groupId: this.group!.id!,
            fromUserId: suggestion.fromUserId,
            toUserId: suggestion.toUserId,
            amount: suggestion.amount,
            notes: `Settlement created from balance summary`
          }));

          // Show success notification
          this.notificationService.success('Settlement created successfully');
          
          // Reload data after a short delay to ensure the update is processed
          setTimeout(() => {
            this.reloadData();
          }, 1000);
        } catch (error) {
          console.error('Error creating settlement:', error);
          this.notificationService.error('Failed to create settlement');
        }
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

  // Get settlement status for a specific user pair
  getSettlementStatus(fromUserId: string, toUserId: string): { exists: boolean; status: string; amount: number } {
    const settlement = this.settlements.find(s => 
      s.fromUserId === fromUserId && 
      s.toUserId === toUserId
    );
    
    if (!settlement) {
      return { exists: false, status: '', amount: 0 };
    }
    
    return { 
      exists: true, 
      status: settlement.status, 
      amount: settlement.amount 
    };
  }

  // Check if a settlement suggestion is already pending
  isSettlementPending(fromUserId: string, toUserId: string): boolean {
    const settlement = this.settlements.find(s => 
      s.fromUserId === fromUserId && 
      s.toUserId === toUserId && 
      s.status === 'pending'
    );
    return !!settlement;
  }

  // Check if a settlement suggestion is already completed
  isSettlementCompleted(fromUserId: string, toUserId: string): boolean {
    const settlement = this.settlements.find(s => 
      s.fromUserId === fromUserId && 
      s.toUserId === toUserId && 
      s.status === 'completed'
    );
    return !!settlement;
  }

  // Get existing settlements summary
  getExistingSettlementsSummary(): any[] {
    if (!this.currentUser?.uid) return [];

    const summary: any[] = [];
    
    // Get settlements involving current user
    const userSettlements = this.settlements.filter(s => 
      (s.fromUserId === this.currentUser.uid || s.toUserId === this.currentUser.uid) &&
      s.status !== 'cancelled'
    );

    userSettlements.forEach(settlement => {
      const isFromUser = settlement.fromUserId === this.currentUser.uid;
      const otherUserId = isFromUser ? settlement.toUserId : settlement.fromUserId;
      const otherUserName = this.getMemberName(otherUserId);
      
      summary.push({
        fromUserId: settlement.fromUserId,
        fromUserName: this.getMemberName(settlement.fromUserId),
        toUserId: settlement.toUserId,
        toUserName: this.getMemberName(settlement.toUserId),
        amount: settlement.amount,
        currency: settlement.currency,
        status: settlement.status,
        isInvolvingCurrentUser: true,
        isFromCurrentUser: isFromUser,
        otherUserName: otherUserName
      });
    });

    return summary;
  }

  // Get pending settlements count
  getPendingSettlementsCount(): number {
    return this.settlements.filter(s => s.status === 'pending').length;
  }

  // Get completed settlements count
  getCompletedSettlementsCount(): number {
    return this.settlements.filter(s => s.status === 'completed').length;
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
    return this.getMemberName(transaction.createdBy);
  }

  // Get transaction title
  getTransactionTitle(transaction: SplitTransaction): string {
    const memberCount = transaction.splits.length;
    const paidCount = transaction.splits.filter(split => split.isPaid).length;
    
    if (paidCount === memberCount) {
      return `Transaction (${memberCount} members, all paid)`;
    } else if (paidCount === 0) {
      return `Transaction (${memberCount} members, pending)`;
    } else {
      return `Transaction (${memberCount} members, ${paidCount} paid)`;
    }
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


  // Get member name by user ID
  getMemberName(userId: string): string {
    if (!this.group) return 'Unknown';
    const member = this.group.members.find(m => m.userId === userId);
    return member?.displayName || 'Unknown';
  }

  // Debug method to log balance calculations
  debugBalanceCalculations(): void {
    console.log('=== BALANCE CALCULATION DEBUG ===');
    
    if (!this.group) {
      console.log('No group found');
      return;
    }

    console.log('Group:', this.group.name);
    console.log('Members:', this.group.members.map(m => ({ id: m.userId, name: m.displayName })));
    
    console.log('Transactions:', this.transactions.length);
    this.transactions.forEach((t, i) => {
      console.log(`Transaction ${i + 1}:`, {
        id: t.id,
        amount: t.totalAmount,
        paidBy: this.getMemberName(t.createdBy),
        splits: t.splits.map(s => ({
          user: this.getMemberName(s.userId),
          amount: s.amount,
          isPaid: s.isPaid
        }))
      });
    });

    console.log('Settlements:', this.settlements.length);
    this.settlements.forEach((s, i) => {
      console.log(`Settlement ${i + 1}:`, {
        id: s.id,
        from: this.getMemberName(s.fromUserId),
        to: this.getMemberName(s.toUserId),
        amount: s.amount,
        status: s.status
      });
    });

    // Raw balances before simplification
    const rawBalances = this.calculateRawBalances();
    console.log('Raw Balances (before simplification):', rawBalances);

    // Simplified balances
    const simplifiedBalances = this.calculateNetBalances();
    console.log('Simplified Balances (after simplification):', simplifiedBalances);

    // Member balances for display
    const memberBalances = this.getMemberBalances();
    console.log('Member Balances (for display):', memberBalances);

    // Current user breakdown
    if (this.currentUser?.uid) {
      const breakdown = this.getDetailedBalanceBreakdown(this.currentUser.uid);
      console.log('Current User Breakdown:', breakdown);
    }

    console.log('=== END DEBUG ===');
  }

  // Calculate raw balances without simplification (for debugging)
  calculateRawBalances(): Record<string, Record<string, number>> {
    const balances: Record<string, Record<string, number>> = {};

    // Step 1: Process Transactions (Expenses)
    for (const transaction of this.transactions) {
      const paidBy = transaction.createdBy;
      for (const split of transaction.splits) {
        if (split.userId === paidBy) continue;
        if (!balances[split.userId]) balances[split.userId] = {};
        if (!balances[split.userId][paidBy]) balances[split.userId][paidBy] = 0;
        balances[split.userId][paidBy] += split.amount;
      }
    }

    console.log('After transactions:', balances);

    // Process settlements
    for (const settlement of this.settlements) {
      if (!balances[settlement.fromUserId]) balances[settlement.fromUserId] = {};
      if (!balances[settlement.fromUserId][settlement.toUserId]) balances[settlement.fromUserId][settlement.toUserId] = 0;
      balances[settlement.fromUserId][settlement.toUserId] -= settlement.amount;
    }

    console.log('After settlements:', balances);

    // Simplify
    const result: Record<string, Record<string, number>> = {};
    const visited = new Set<string>();

    for (const userA in balances) {
      for (const userB in balances[userA]) {
        const key = `${userA}_${userB}`;
        const reverseKey = `${userB}_${userA}`;
        
        if (visited.has(key) || visited.has(reverseKey)) continue;

        const amountAB = balances[userA]?.[userB] || 0;
        const amountBA = balances[userB]?.[userA] || 0;
        const net = amountAB - amountBA;

        if (net > 0) {
          if (!result[userA]) result[userA] = {};
          result[userA][userB] = Math.round(net * 100) / 100;
        } else if (net < 0) {
          if (!result[userB]) result[userB] = {};
          result[userB][userA] = Math.round(-net * 100) / 100;
        }

        visited.add(key);
        visited.add(reverseKey);
      }
    }

    console.log('Final simplified result:', result);
    console.log('=== END TEST ===');
    return result;
  }

  // Test balance calculation with sample data
  testBalanceCalculation(): void {
    console.log('=== TESTING BALANCE CALCULATION ===');
    
    // Sample test data
    const testTransactions = [
      {
        id: '1',
        createdBy: 'user1',
        totalAmount: 100,
        splits: [
          { userId: 'user1', amount: 50, isPaid: true },
          { userId: 'user2', amount: 50, isPaid: false }
        ]
      },
      {
        id: '2',
        createdBy: 'user2',
        totalAmount: 60,
        splits: [
          { userId: 'user1', amount: 30, isPaid: false },
          { userId: 'user2', amount: 30, isPaid: true }
        ]
      }
    ];

    const testSettlements = [
      {
        id: '1',
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 20,
        status: 'completed'
      }
    ];

    console.log('Test Transactions:', testTransactions);
    console.log('Test Settlements:', testSettlements);

    // Simulate the calculation
    const balances: Record<string, Record<string, number>> = {};

    // Process transactions
    for (const transaction of testTransactions) {
      const paidBy = transaction.createdBy;
      for (const split of transaction.splits) {
        if (split.userId === paidBy) continue;
        if (!balances[split.userId]) balances[split.userId] = {};
        if (!balances[split.userId][paidBy]) balances[split.userId][paidBy] = 0;
        balances[split.userId][paidBy] += split.amount;
      }
    }

    console.log('After transactions:', balances);

    // Process settlements
    for (const settlement of testSettlements) {
      if (!balances[settlement.fromUserId]) balances[settlement.fromUserId] = {};
      if (!balances[settlement.fromUserId][settlement.toUserId]) balances[settlement.fromUserId][settlement.toUserId] = 0;
      balances[settlement.fromUserId][settlement.toUserId] -= settlement.amount;
    }

    console.log('After settlements:', balances);

    // Simplify
    const result: Record<string, Record<string, number>> = {};
    const visited = new Set<string>();

    for (const userA in balances) {
      for (const userB in balances[userA]) {
        const key = `${userA}_${userB}`;
        const reverseKey = `${userB}_${userA}`;
        
        if (visited.has(key) || visited.has(reverseKey)) continue;

        const amountAB = balances[userA]?.[userB] || 0;
        const amountBA = balances[userB]?.[userA] || 0;
        const net = amountAB - amountBA;

        if (net > 0) {
          if (!result[userA]) result[userA] = {};
          result[userA][userB] = Math.round(net * 100) / 100;
        } else if (net < 0) {
          if (!result[userB]) result[userB] = {};
          result[userB][userA] = Math.round(-net * 100) / 100;
        }

        visited.add(key);
        visited.add(reverseKey);
      }
    }

    console.log('Final simplified result:', result);
    console.log('=== END TEST ===');
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