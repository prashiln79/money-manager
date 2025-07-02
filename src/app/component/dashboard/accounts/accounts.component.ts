import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Account, AccountsService } from 'src/app/util/service/accounts.service';

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
  
  // Form data
  public newAccount: Account = this.getEmptyAccount();
  
  // Private properties
  private userId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private readonly accountsService: AccountsService,
    private readonly auth: Auth,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
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
   * Create a new account for the current user
   */
  public async createAccount(): Promise<void> {
    if (!this.isValidAccountData()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';

      const accountToCreate = this.prepareAccountForCreation();
      await this.accountsService.createAccount(this.userId, accountToCreate);
      
      // Reset form and reload accounts
      this.newAccount = this.getEmptyAccount();
      await this.loadUserAccounts();
    } catch (error) {
      this.errorMessage = 'Failed to create account';
      this.isLoading = false;
      console.error('Error creating account:', error);
    }
  }

  /**
   * Validate the new account form data
   */
  private isValidAccountData(): boolean {
    return !!(
      this.newAccount.name?.trim() &&
      this.newAccount.type &&
      this.newAccount.balance !== null &&
      this.newAccount.balance !== undefined
    );
  }

  /**
   * Prepare account data for creation with proper metadata
   */
  private prepareAccountForCreation(): Account {
    const timestamp = new Date().getTime();
    
    return {
      ...this.newAccount,
      accountId: `${this.userId}-${timestamp}`,
      userId: this.userId,
      createdAt: new Date().toISOString(),
      name: this.newAccount.name.trim(),
      balance: Number(this.newAccount.balance)
    };
  }

  /**
   * Get an empty account template
   */
  private getEmptyAccount(): Account {
    return {
      accountId: '',
      userId: '',
      name: '',
      type: 'bank',
      balance: 0,
      createdAt: ''
    };
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
}
