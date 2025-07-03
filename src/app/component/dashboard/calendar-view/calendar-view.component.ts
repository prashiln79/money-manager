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
  
  // Date range selection properties
  isRangeMode = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  rangeTransactions: Transaction[] = [];
  
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

  // Custom date class function to highlight dates with transactions and range selection
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const dateStr = this.formatDate(cellDate);
      let classes = '';
      
      // Check if date has transactions
      const hasTransactions = this.transactions.some(transaction => {
        const transactionDate = transaction.date.toDate();
        return this.formatDate(transactionDate) === dateStr;
      });
      
      if (hasTransactions) {
        classes += 'has-transactions ';
      }
      
      // Range mode highlighting
      if (this.isRangeMode) {
        if (this.startDate && this.formatDate(this.startDate) === dateStr) {
          classes += 'range-start ';
        }
        if (this.endDate && this.formatDate(this.endDate) === dateStr) {
          classes += 'range-end ';
        }
        if (this.startDate && this.endDate && 
            cellDate >= this.startDate && cellDate <= this.endDate) {
          classes += 'range-in-between ';
        }
      } else {
        // Single date mode highlighting
        if (this.selectedDate && this.formatDate(this.selectedDate) === dateStr) {
          classes += 'selected-date ';
        }
      }
      
      return classes.trim();
    }
    return '';
  }

  // Handle date selection
  onDateSelected(date: Date | null) {
    if (this.isRangeMode) {
      this.handleRangeSelection(date);
    } else {
      this.handleSingleDateSelection(date);
    }
  }

  // Handle single date selection
  private handleSingleDateSelection(date: Date | null) {
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

  // Handle date range selection
  private handleRangeSelection(date: Date | null) {
    if (!date) return;

    if (!this.startDate || (this.startDate && this.endDate)) {
      // Start new range
      this.startDate = date;
      this.endDate = null;
      this.rangeTransactions = [];
    } else {
      // Complete the range
      if (date >= this.startDate) {
        this.endDate = date;
      } else {
        // If end date is before start date, swap them
        this.endDate = this.startDate;
        this.startDate = date;
      }
      this.rangeTransactions = this.getTransactionsForDateRange(this.startDate, this.endDate);
      // Emit date range to other components
      this.dateSelectionService.setSelectedDateRange(this.startDate, this.endDate);
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

  // Get transactions for a date range
  getTransactionsForDateRange(startDate: Date, endDate: Date): Transaction[] {
    return this.transactions.filter(transaction => {
      const transactionDate = transaction.date.toDate();
      return transactionDate >= startDate && transactionDate <= endDate;
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

  // Toggle between single date and range mode
  toggleRangeMode(): void {
    this.isRangeMode = !this.isRangeMode;
    this.clearSelections();
  }

  // Clear all selections
  clearSelections(): void {
    this.selectedDate = null;
    this.selectedDateTransactions = [];
    this.startDate = null;
    this.endDate = null;
    this.rangeTransactions = [];
    this.dateSelectionService.clearSelectedDate();
  }

  // Get total income for date range
  getRangeTotalIncome(): number {
    return this.rangeTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Get total expenses for date range
  getRangeTotalExpenses(): number {
    return this.rangeTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Get net amount for date range
  getRangeNetAmount(): number {
    return this.getRangeTotalIncome() - this.getRangeTotalExpenses();
  }
}
