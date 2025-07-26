import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map } from 'rxjs';
import { Transaction } from '../../models/transaction.model';
import { Account } from '../../models/account.model';
import { RecurringInterval } from '../../config/enums';
import { AppState } from '../../../store/app.state';
import { selectUserCurrency } from '../../../store/profile/profile.selectors';
import { selectAllAccounts } from '../../../store/accounts/accounts.selectors';
import { CurrencyService } from '../../service/currency.service';

export interface RecurringTransactionDialogData {
  transactions: Transaction[];
}

export interface RecurringTransactionDialogResult {
  action: 'confirm' | 'skip' | 'cancel';
  transactions?: Transaction[];
}

@Component({
  selector: 'app-recurring-transaction-confirmation-dialog',
  templateUrl: './recurring-transaction-confirmation-dialog.component.html',
  styleUrls: ['./recurring-transaction-confirmation-dialog.component.scss']
})
export class RecurringTransactionConfirmationDialogComponent implements OnInit {
  selectedTransactions: Set<string> = new Set();
  allSelected = false;
  userCurrency$: Observable<string | undefined>;
  accounts$: Observable<Account[]>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RecurringTransactionDialogData,
    public dialogRef: MatDialogRef<RecurringTransactionConfirmationDialogComponent>,
    private store: Store<AppState>,
    private currencyService: CurrencyService
  ) {
    this.userCurrency$ = this.store.select(selectUserCurrency);
    this.accounts$ = this.store.select(selectAllAccounts);
  }

  ngOnInit(): void {
    // Select all transactions by default
    this.selectAll();
  }

  /**
   * Select all transactions
   */
  selectAll(): void {
    this.allSelected = true;
    this.selectedTransactions.clear();
    this.data.transactions.forEach(t => {
      if (t.id) {
        this.selectedTransactions.add(t.id);
      }
    });
  }

  /**
   * Deselect all transactions
   */
  deselectAll(): void {
    this.allSelected = false;
    this.selectedTransactions.clear();
  }

  /**
   * Toggle selection of a transaction
   */
  toggleTransaction(transactionId: string): void {
    if (this.selectedTransactions.has(transactionId)) {
      this.selectedTransactions.delete(transactionId);
    } else {
      this.selectedTransactions.add(transactionId);
    }
    this.updateSelectAllState();
  }

  /**
   * Update the select all state based on current selections
   */
  updateSelectAllState(): void {
    this.allSelected = this.data.transactions.every(t => 
      t.id && this.selectedTransactions.has(t.id)
    );
  }

  /**
   * Get selected transactions
   */
  getSelectedTransactions(): Transaction[] {
    return this.data.transactions.filter(t => 
      t.id && this.selectedTransactions.has(t.id)
    );
  }

  /**
   * Format recurring interval for display
   */
  getRecurringIntervalText(interval: RecurringInterval): string {
    switch (interval) {
      case RecurringInterval.DAILY:
        return 'Daily';
      case RecurringInterval.WEEKLY:
        return 'Weekly';
      case RecurringInterval.MONTHLY:
        return 'Monthly';
      case RecurringInterval.YEARLY:
        return 'Yearly';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format amount for display using user's currency
   */
  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }

  /**
   * Get total amount of selected transactions
   */
  getSelectedTransactionsTotal(): number {
    return this.getSelectedTransactions().reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Track by function for transaction list
   */
  trackByTransactionId(index: number, transaction: Transaction): string {
    return transaction.id || index.toString();
  }

  /**
   * Get account details for a transaction
   */
  getAccountDetails(transaction: Transaction): Observable<Account | undefined> {
    return this.accounts$.pipe(
      map(accounts => accounts.find(account => account.accountId === transaction.accountId))
    );
  }

  /**
   * Check if transaction is for a credit card account
   */
  isCreditCardTransaction(transaction: Transaction): Observable<boolean> {
    return this.getAccountDetails(transaction).pipe(
      map(account => account?.type === 'credit')
    );
  }

  /**
   * Get credit card due date for a transaction
   */
  getCreditCardDueDate(transaction: Transaction): Observable<string | null> {
    return this.getAccountDetails(transaction).pipe(
      map(account => {
        if (account?.type === 'credit' && account.creditCardDetails?.dueDate) {
          const dueDate = account.creditCardDetails.dueDate;
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          // Calculate next due date
          let nextDueDate = new Date(currentYear, currentMonth, dueDate);
          
          // If the due date has passed this month, move to next month
          if (nextDueDate < today) {
            nextDueDate = new Date(currentYear, currentMonth + 1, dueDate);
          }
          
          return nextDueDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
        }
        return null;
      })
    );
  }

  /**
   * Get billing cycle info for a credit card transaction
   */
  getBillingCycleInfo(transaction: Transaction): Observable<string | null> {
    return this.getAccountDetails(transaction).pipe(
      map(account => {
        if (account?.type === 'credit' && account.creditCardDetails?.billingCycleStart) {
          const billingCycleStart = account.creditCardDetails.billingCycleStart;
          return `Billing cycle starts on ${billingCycleStart}${this.getDaySuffix(billingCycleStart)} of each month`;
        }
        return null;
      })
    );
  }

  /**
   * Get day suffix (st, nd, rd, th)
   */
  private getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  /**
   * Confirm selected transactions
   */
  confirm(): void {
    const selectedTransactions = this.getSelectedTransactions();
    this.dialogRef.close({
      action: 'confirm',
      transactions: selectedTransactions
    } as RecurringTransactionDialogResult);
  }

  /**
   * Skip all transactions
   */
  skip(): void {
    this.dialogRef.close({
      action: 'skip'
    } as RecurringTransactionDialogResult);
  }

  /**
   * Cancel the dialog
   */
  cancel(): void {
    this.dialogRef.close({
      action: 'cancel'
    } as RecurringTransactionDialogResult);
  }
} 