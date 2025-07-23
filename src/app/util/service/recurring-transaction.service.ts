import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { TransactionsService } from './transactions.service';
import { UserService } from './user.service';
import { NotificationService } from './notification.service';
import { Transaction } from '../models/transaction.model';
import { RecurringTransactionConfirmationDialogComponent } from '../../util/components/recurring-transaction-confirmation-dialog/recurring-transaction-confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class RecurringTransactionService {

  constructor(
    private transactionsService: TransactionsService,
    private userService: UserService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  /**
   * Check for due recurring transactions and show confirmation dialog
   */
  checkDueRecurringTransactions(): Observable<void> {
    const userId = this.userService.getUser()?.uid;
    if (!userId) {
      return of(void 0);
    }

    return this.transactionsService.getDueRecurringTransactions(userId).pipe(
      switchMap(dueTransactions => {
        if (dueTransactions.length === 0) {
          return of(void 0);
        }

        // Show confirmation dialog for each due transaction
        return this.showRecurringTransactionConfirmation(dueTransactions);
      })
    );
  }

  /**
   * Show confirmation dialog for recurring transactions
   */
  private showRecurringTransactionConfirmation(transactions: Transaction[]): Observable<void> {
    return new Observable<void>(observer => {
      const dialogRef = this.dialog.open(RecurringTransactionConfirmationDialogComponent, {
        width: '400px',
        data: { transactions },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.action === 'confirm') {
          // Process confirmed transactions
          this.processConfirmedTransactions(result.transactions).subscribe({
            next: () => {
              this.notificationService.success('Recurring transactions processed successfully');
              observer.next();
              observer.complete();
            },
            error: (error) => {
              this.notificationService.error('Failed to process recurring transactions');
              observer.error(error);
            }
          });
        } else {
          // User cancelled or skipped
          observer.next();
          observer.complete();
        }
      });
    });
  }

  /**
   * Process confirmed recurring transactions
   */
  private processConfirmedTransactions(transactions: Transaction[]): Observable<void> {
    const userId = this.userService.getUser()?.uid;
    if (!userId) {
      return of(void 0);
    }

    // Process each transaction sequentially
    return new Observable<void>(observer => {
      let processedCount = 0;
      const totalCount = transactions.length;

      const processNext = () => {
        if (processedCount >= totalCount) {
          observer.next();
          observer.complete();
          return;
        }

        const transaction = transactions[processedCount];
        this.transactionsService.processRecurringTransaction(userId, transaction).subscribe({
          next: () => {
            processedCount++;
            processNext();
          },
          error: (error) => {
            console.error(`Failed to process transaction ${transaction.id}:`, error);
            processedCount++;
            processNext(); // Continue with next transaction even if one fails
          }
        });
      };

      processNext();
    });
  }

  /**
   * Get all recurring transactions for a user
   */
  getRecurringTransactions(userId: string): Observable<Transaction[]> {
    return this.transactionsService.getRecurringTransactions(userId);
  }

  /**
   * Get recurring transactions summary
   */
  getRecurringTransactionsSummary(userId: string): Observable<{
    total: number;
    due: number;
    upcoming: number;
  }> {
    return this.transactionsService.getRecurringTransactions(userId).pipe(
      map(transactions => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const due = transactions.filter(t => {
          if (!t.nextOccurrence) return false;
          const nextOccurrence = t.nextOccurrence instanceof Date 
            ? t.nextOccurrence 
            : t.nextOccurrence.toDate();
          nextOccurrence.setHours(0, 0, 0, 0);
          return nextOccurrence <= today;
        }).length;

        const upcoming = transactions.filter(t => {
          if (!t.nextOccurrence) return false;
          const nextOccurrence = t.nextOccurrence instanceof Date 
            ? t.nextOccurrence 
            : t.nextOccurrence.toDate();
          nextOccurrence.setHours(0, 0, 0, 0);
          return nextOccurrence > today;
        }).length;

        return {
          total: transactions.length,
          due,
          upcoming
        };
      })
    );
  }
} 