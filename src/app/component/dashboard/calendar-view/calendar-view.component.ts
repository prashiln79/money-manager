import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { TransactionsService, Transaction } from '../../../util/service/transactions.service';
import { UserService } from '../../../util/service/user.service';
import { DateSelectionService } from '../../../util/service/date-selection.service';
import { Subscription } from 'rxjs';
import moment from 'moment';

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
  
  // Collapsible controls
  isControlsExpanded = false;

  
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

  // Custom date class function to highlight dates with transactions and range selection using Moment.js
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const cellMoment = moment(cellDate).startOf('day');
      let classes = '';
      
      // Check if date has transactions
      const hasTransactions = this.transactions.some(transaction => {
        const transactionMoment = moment(transaction.date.toDate()).startOf('day');
        return transactionMoment.isSame(cellMoment, 'day');
      });
      
      if (hasTransactions) {
        classes += 'has-transactions ';
      }
      
      // Range mode highlighting
      if (this.isRangeMode) {
        if (this.startDate && moment(this.startDate).startOf('day').isSame(cellMoment, 'day')) {
          classes += 'range-start ';
        }
        if (this.endDate && moment(this.endDate).startOf('day').isSame(cellMoment, 'day')) {
          classes += 'range-end ';
        }
        if (this.startDate && this.endDate) {
          const startMoment = moment(this.startDate).startOf('day');
          const endMoment = moment(this.endDate).endOf('day');
          if (cellMoment.isBetween(startMoment, endMoment, 'day', '[]')) {
            classes += 'range-in-between ';
          }
        }
      } else {
        // Single date mode highlighting
        if (this.selectedDate && moment(this.selectedDate).startOf('day').isSame(cellMoment, 'day')) {
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

  // Get transactions for a specific date using Moment.js
  getTransactionsForDate(date: Date): Transaction[] {
    const targetMoment = moment(date).startOf('day');
    
    return this.transactions.filter(transaction => {
      const transactionMoment = moment(transaction.date.toDate()).startOf('day');
      return transactionMoment.isSame(targetMoment, 'day');
    });
  }

  // Get transactions for a date range using Moment.js
  getTransactionsForDateRange(startDate: Date, endDate: Date): Transaction[] {
    const startMoment = moment(startDate).startOf('day');
    const endMoment = moment(endDate).endOf('day');
    
    return this.transactions.filter(transaction => {
      const transactionMoment = moment(transaction.date.toDate());
      return transactionMoment.isBetween(startMoment, endMoment, 'day', '[]'); // inclusive
    });
  }

  // Format date to string for comparison using Moment.js
  private formatDate(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
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

  // Toggle controls visibility
  toggleControls(): void {
    this.isControlsExpanded = !this.isControlsExpanded;
  }

  // Check if any date is selected
  hasSelection(): boolean {
    if (this.isRangeMode) {
      return this.startDate !== null || this.endDate !== null;
    } else {
      return this.selectedDate !== null;
    }
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

  // Utility method to get formatted date range string
  getFormattedDateRange(): string {
    if (!this.startDate || !this.endDate) {
      return '';
    }
    
    const startMoment = moment(this.startDate);
    const endMoment = moment(this.endDate);
    
    if (startMoment.isSame(endMoment, 'day')) {
      return startMoment.format('MMM DD, YYYY');
    } else if (startMoment.isSame(endMoment, 'year')) {
      return `${startMoment.format('MMM DD')} - ${endMoment.format('MMM DD, YYYY')}`;
    } else {
      return `${startMoment.format('MMM DD, YYYY')} - ${endMoment.format('MMM DD, YYYY')}`;
    }
  }

  // Utility method to get number of days in range
  getDaysInRange(): number {
    if (!this.startDate || !this.endDate) {
      return 0;
    }
    
    const startMoment = moment(this.startDate);
    const endMoment = moment(this.endDate);
    return endMoment.diff(startMoment, 'days') + 1; // +1 to include both start and end dates
  }

  // Utility method to check if a date is today
  isToday(date: Date): boolean {
    return moment(date).isSame(moment(), 'day');
  }

  // Utility method to check if a date is in the past
  isPastDate(date: Date): boolean {
    return moment(date).isBefore(moment(), 'day');
  }

  // Utility method to check if a date is in the future
  isFutureDate(date: Date): boolean {
    return moment(date).isAfter(moment(), 'day');
  }

  clearAll() {
    this.clearSelections();
    this.isControlsExpanded = this.isRangeMode = false;
    this.dateSelectionService.clearSelectedDate();
  }
}
