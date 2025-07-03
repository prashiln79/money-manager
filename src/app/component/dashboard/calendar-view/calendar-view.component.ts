import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { TransactionsService, Transaction } from '../../../util/service/transactions.service';
import { UserService } from '../../../util/service/user.service';
import { DateSelectionService } from '../../../util/service/date-selection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss'
})
export class CalendarViewComponent implements OnInit, OnDestroy {

  isMobile = false;
  transactions: Transaction[] = [];
  selectedDate: Date | null = null;
  selectedDateTransactions: Transaction[] = [];
  private subscription = new Subscription();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private transactionsService: TransactionsService,
    private userService: UserService,
    private dateSelectionService: DateSelectionService
  ) {
    this.breakpointObserver.observe(['(max-width: 600px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngOnInit() {
    this.loadTransactions();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadTransactions() {
    const currentUser = this.userService.getUser();
    if (currentUser) {
      this.subscription.add(
        this.transactionsService.getTransactions(currentUser.uid).subscribe(
          (transactions) => {
            this.transactions = transactions;
          },
          (error) => {
            console.error('Error loading transactions:', error);
          }
        )
      );
    }
  }

  // Custom date class function to highlight dates with transactions
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const dateStr = this.formatDate(cellDate);
      const hasTransactions = this.transactions.some(transaction => {
        const transactionDate = transaction.date.toDate();
        return this.formatDate(transactionDate) === dateStr;
      });
      
      return hasTransactions ? 'has-transactions' : '';
    }
    return '';
  }

  // Handle date selection
  onDateSelected(date: Date | null) {
    this.selectedDate = date;
    if (date) {
      this.selectedDateTransactions = this.getTransactionsForDate(date);
      // Emit selected date to other components
      this.dateSelectionService.setSelectedDate(date);
    } else {
      this.selectedDateTransactions = [];
      this.dateSelectionService.clearSelectedDate();
    }
  }

  // Get transactions for a specific date
  getTransactionsForDate(date: Date): Transaction[] {
    const dateStr = this.formatDate(date);
    return this.transactions.filter(transaction => {
      const transactionDate = transaction.date.toDate();
      return this.formatDate(transactionDate) === dateStr;
    });
  }

  // Format date to string for comparison
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get total income for selected date
  getTotalIncome(): number {
    return this.selectedDateTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Get total expenses for selected date
  getTotalExpenses(): number {
    return this.selectedDateTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Get net amount for selected date
  getNetAmount(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }
}
