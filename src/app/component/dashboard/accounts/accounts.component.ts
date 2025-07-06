import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Account, AccountsService } from 'src/app/util/service/accounts.service';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MobileAccountComponent } from './mobile-account/mobile-account.component';
import { AccountDialogComponent } from './account-dialog/account-dialog.component';
import { MobileAccountsListComponent } from './mobile-accounts-list/mobile-accounts-list.component';
import { NotificationService } from 'src/app/util/service/notification.service';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'user-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit, OnDestroy {
  // Component state
  public accounts: Account[] = [];
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public isMobile: boolean = false;
  

  
  // Private properties
  private userId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private readonly accountsService: AccountsService,
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly notificationService: NotificationService
  ) {}

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
    await this.loadUserAccounts();
  }

  /**
   * Load all accounts for the current user
   */
  private async loadUserAccounts(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      this.accountsService
        .getAccounts(this.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (accounts) => {
            this.accounts = accounts;
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = 'Failed to load accounts';
            this.isLoading = false;
            console.error('Error loading accounts:', error);
          }
        });
    } catch (error) {
      this.errorMessage = 'Failed to load accounts';
      this.isLoading = false;
      console.error('Error loading accounts:', error);
    }
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
      dialogRef = this.dialog.open(AccountDialogComponent, {
        width: '500px',
        data: account || null
      });
    }

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUserAccounts();
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
          this.isLoading = true;
          await this.accountsService.deleteAccount(this.userId, account.accountId);
          this.notificationService.success('Account deleted successfully');
          await this.loadUserAccounts();
        } catch (error) {
          this.notificationService.error('Failed to delete account');
          console.error('Error deleting account:', error);
        } finally {
          this.isLoading = false;
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
}
