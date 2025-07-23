import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Transaction } from '../../models/transaction.model';
import { RecurringInterval } from '../../config/enums';
import { AppState } from '../../../store/app.state';
import { selectUserCurrency } from '../../../store/profile/profile.selectors';
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RecurringTransactionDialogData,
    public dialogRef: MatDialogRef<RecurringTransactionConfirmationDialogComponent>,
    private store: Store<AppState>,
    private currencyService: CurrencyService
  ) {
    this.userCurrency$ = this.store.select(selectUserCurrency);
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