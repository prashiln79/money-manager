import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject, takeUntil, Observable, of } from 'rxjs';
import { Account, LoanDetails } from 'src/app/util/models/account.model';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MobileAccountComponent } from './mobile-account/mobile-account.component';
import { AddAccountDialogComponent } from './add-account-dialog/add-account-dialog.component';
import { NotificationService } from 'src/app/util/service/notification.service';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import * as AccountsActions from '../../../store/accounts/accounts.actions';
import * as AccountsSelectors from '../../../store/accounts/accounts.selectors';

@Component({
  selector: 'user-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit, OnDestroy {
  // Observables from store
  public accounts$: Observable<Account[]> = of([]);
  public isLoading$: Observable<boolean>;
  public error$: Observable<any>;
  public totalBalance$: Observable<number>;
  
  // Component state
  public accounts: Account[] = [];
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public isMobile: boolean = false;
  public selectedAccount: Account | null = null;
  public expandedAccount: Account | null = null;
  
  // Private properties
  private userId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly notificationService: NotificationService,
    private readonly store: Store<AppState>
  ) {
    // Initialize selectors
    this.accounts$ = this.store.select(AccountsSelectors.selectAllAccounts) || of([]);
    this.isLoading$ = this.store.select(AccountsSelectors.selectAccountsLoading);
    this.error$ = this.store.select(AccountsSelectors.selectAccountsError);
    this.totalBalance$ = this.store.select(AccountsSelectors.selectTotalBalance);
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupMobileDetection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the component by loading user accounts
   */
  private async initializeComponent(): Promise<void> {
    const currentUser = this.auth.currentUser;
    
    if (!currentUser) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.userId = currentUser.uid;
    this.loadUserAccounts();
  }

  /**
   * Load all accounts for the current user
   */
  private loadUserAccounts(): void {
    this.store.dispatch(AccountsActions.loadAccounts({ userId: this.userId }));
    
    // Subscribe to store data for backward compatibility
    this.accounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => {
        this.accounts = accounts;
      });

    this.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    this.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.errorMessage = 'Failed to load accounts';
          console.error('Error loading accounts:', error);
        }
      });
  }





  /**
   * Clear any error messages
   */
  public clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Track function for ngFor to optimize rendering performance
   */
  public trackByAccountId(index: number, account: Account): string {
    return account.accountId;
  }

  /**
   * Setup mobile detection using breakpoint observer
   */
  private setupMobileDetection(): void {
    this.breakpointObserver.observe(['(max-width: 600px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  /**
   * Open dialog for adding/editing accounts
   */
  public openAccountDialog(account?: Account): void {
    let dialogRef;
    
    if (this.isMobile) {
      dialogRef = this.dialog.open(MobileAccountComponent, {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        panelClass: 'full-screen-dialog',
        data: account || null
      });
    } else {
      dialogRef = this.dialog.open(AddAccountDialogComponent, {
        width: '500px',
        data: account || null
      });
    }

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.dispatch(AccountsActions.loadAccounts({ userId: this.userId }));
      }
    });
  }

  /**
   * Edit an existing account
   */
  public editAccount(account: Account): void {
    this.openAccountDialog(account);
  }

  /**
   * Delete an account
   */
  public async deleteAccount(account: Account): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Account',
        message: `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          this.store.dispatch(AccountsActions.deleteAccount({ userId: this.userId, accountId: account.accountId }));
          this.notificationService.success('Account deleted successfully');
        } catch (error) {
          this.notificationService.error('Failed to delete account');
          console.error('Error deleting account:', error);
        }
      }
    });
  }

  /**
   * Add a new account
   */
  public addAccount(): void {
    this.openAccountDialog();
  }

  /**
   * Calculate monthly interest for loan accounts
   */
  public calculateMonthlyInterest(account: Account): number {
    if (account.type !== 'loan' || !account.loanDetails) {
      return 0;
    }
    
    const { interestRate, remainingBalance } = account.loanDetails;
    // Monthly interest = (Annual Rate / 12) * Remaining Balance
    return (interestRate / 12 / 100) * remainingBalance;
  }

  /**
   * Check if account is a loan account
   */
  public isLoanAccount(account: Account): boolean {
    return account.type === 'loan' && !!account.loanDetails;
  }

  /**
   * Get loan details safely
   */
  public getLoanDetails(account: Account): LoanDetails | undefined {
    return account.loanDetails;
  }

  /**
   * Handle account click to show/hide actions
   */
  public onAccountClick(account: Account): void {
    if (this.selectedAccount?.accountId === account.accountId) {
      this.selectedAccount = null;
    } else {
      this.selectedAccount = account;
    }
  }

  /**
   * Get balance class for styling
   */
  public getBalanceClass(account: Account): string {
    if (account.type === 'loan') {
      return 'loan-account';
    }
    return account.balance >= 0 ? 'positive-balance' : 'negative-balance';
  }

  /**
   * Get account icon based on type
   */
  public getAccountIcon(type: string): string {
    switch (type) {
      case 'bank':
        return 'account_balance';
      case 'cash':
        return 'payments';
      case 'credit':
        return 'credit_card';
      case 'loan':
        return 'account_balance_wallet';
      default:
        return 'account_balance';
    }
  }

  /**
   * Toggle account expansion to show/hide details
   */
  public toggleAccountExpansion(account: Account): void {
    if (this.expandedAccount?.accountId === account.accountId) {
      this.expandedAccount = null;
    } else {
      this.expandedAccount = account;
    }
  }

  /**
   * Get recent transactions for an account (placeholder implementation)
   */
  public getRecentTransactions(account: Account): any[] {
    // This is a placeholder - in a real app, you would fetch transactions from a service
    // For now, return an empty array
    return [];
  }
}
