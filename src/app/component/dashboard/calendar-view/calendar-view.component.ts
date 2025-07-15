import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { UserService } from '../../../util/service/user.service';
import { FilterService } from '../../../util/service/filter.service';
import { NotificationService } from '../../../util/service/notification.service';

import { Subscription } from 'rxjs';
import moment from 'moment';
import { DateService } from 'src/app/util/service/date.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import * as TransactionsSelectors from '../../../store/transactions/transactions.selectors';
import * as CategoriesSelectors from '../../../store/categories/categories.selectors';
import { Transaction } from 'src/app/util/models/transaction.model';
import { Category } from 'src/app/util/models/category.model';
import { TransactionType } from 'src/app/util/config/enums';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss'
})
export class CalendarViewComponent implements OnInit, OnDestroy {

  isMobile = false;
  transactions: Transaction[] = [];
  categories: Category[] = [];
  selectedDate: Date | null = null;
  selectedDateTransactions: Transaction[] = [];
  
  
  // Date range selection properties
  isRangeMode = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  rangeTransactions: Transaction[] = [];
  
  // Collapsible controls
  isControlsExpanded = false;

  // Pie chart properties
  pieChartOption: EChartsOption = {};
  showPieChart = false;
  showCalendar = true;
  chartViewMode: 'income-expense' | 'category' = 'category';
  
  // Calendar navigation
  currentViewDate = new Date();
  
  // Date filter options
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth();
  availableYears: number[] = [];
  availableMonths = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' }
  ];
  
  private subscription = new Subscription();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private userService: UserService,
    private filterService: FilterService,
    private notificationService: NotificationService,
    private dateService: DateService,
    private store: Store<AppState>
  ) {
    this.breakpointObserver.observe(['(max-width: 600px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngOnInit() {
    this.loadTransactions();
    this.loadCategories();
    this.initializePieChart();
    this.generateAvailableYears();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadTransactions() {
      this.subscription.add(
        this.store.select(TransactionsSelectors.selectAllTransactions).subscribe({
          next: (transactions) => {
            this.transactions = transactions;
            this.updatePieChart();
            this.updateCalendar();
          },
          error: (error) => {
            console.error('Error loading transactions:', error);
            this.notificationService.error('Failed to load calendar data');
          }
        })
      );
  }

  loadCategories() {
    this.subscription.add(
      this.store.select(CategoriesSelectors.selectAllCategories).subscribe({
        next: (categories) => {
          this.categories = categories;
          this.updatePieChart();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      })
    );
  }

  generateAvailableYears() {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      this.availableYears.push(year);
    }
  }

  // Initialize pie chart
  initializePieChart() {
    this.pieChartOption = {
      title: {
        text: 'Category-wise Spending',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br> ₹{c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        bottom: '10%',
        type: 'scroll'
      },
      series: [
        {
          name: 'Categories',
          type: 'pie',
          radius: '50%',
          data: [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  }

  // Update pie chart data
  updatePieChart() {
    if (this.chartViewMode === 'category') {
      this.updateCategoryChart();
    } else {
      this.updateIncomeExpenseChart();
    }
  }

  // Update category-wise spending chart
  updateCategoryChart() {
    const filteredTransactions = this.getFilteredTransactions();
    const categoryData = this.getCategorySpendingData(filteredTransactions);
    const totalSpending = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    this.pieChartOption = {
      ...this.pieChartOption,
      title: {
        text: `${this.availableMonths[this.selectedMonth].label} ${this.selectedYear} - ₹${totalSpending.toLocaleString()}`,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      series: [
        {
          name: 'Categories',
          type: 'pie',
          radius: '50%',
          data: categoryData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  }

  // Handle chart click events
  onChartClick(event: any) {
    if (this.chartViewMode === 'category' && event.data) {
      this.applyCategoryFilter(event.data.name);
    }
  }

  // Apply category filter to transaction list
  applyCategoryFilter(categoryName: string) {
    // Set category filter using the date selection service
    this.filterService.setCategoryFilter(
      categoryName, 
      this.selectedYear, 
      this.selectedMonth, 
      this.availableMonths[this.selectedMonth].label
    );
    
    // Show success notification
    this.notificationService.success(`Filtering transactions for ${categoryName} in ${this.availableMonths[this.selectedMonth].label} ${this.selectedYear}`);
  }



  // Update income vs expense chart
  updateIncomeExpenseChart() {
    let income = 0;
    let expenses = 0;

    if (this.isRangeMode && this.startDate && this.endDate) {
      income = this.getRangeTotalIncome();
      expenses = this.getRangeTotalExpenses();
    } else if (this.selectedDate) {
      income = this.getTotalIncome();
      expenses = this.getTotalExpenses();
    }

    this.pieChartOption = {
      ...this.pieChartOption,
      title: {
        text: 'Income vs Expenses',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      series: [
        {
          name: 'Transactions',
          type: 'pie',
          radius: '50%',
          data: [
            { value: income, name: 'Income', itemStyle: { color: '#10b981' } },
            { value: expenses, name: 'Expenses', itemStyle: { color: '#ef4444' } }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  }

  // Get filtered transactions based on year/month selection
  getFilteredTransactions(): Transaction[] {
    const startOfMonth = moment([this.selectedYear, this.selectedMonth, 1]);
    const endOfMonth = moment(startOfMonth).endOf('month');
    
    return this.transactions.filter(transaction => {
      const transactionDate = moment(this.dateService.toDate(transaction.date));
      return transactionDate.isBetween(startOfMonth, endOfMonth, 'day', '[]') && 
             transaction.type === 'expense';
    });
  }

  // Get category-wise spending data
  getCategorySpendingData(transactions: Transaction[]): any[] {
    const categoryMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const categoryId = transaction.categoryId;
      const category = this.categories.find(c => c.id === categoryId);
      const categoryName = category ? category.name : '';
      
      if (categoryName && categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName)! + transaction.amount);
      } else {
        categoryMap.set(categoryName, transaction.amount);
      }
    });

    // Convert to chart data format
    const colors = [
      '#5B8DEF', // Soft Blue
      '#A0C4FF', // Light Cornflower
      '#B8B8FF', // Lavender Gray
      '#CDB4DB', // Soft Purple
      '#FFAFCC', // Pink Coral
      '#FFC8DD', // Light Pink
      '#FDCB82', // Soft Orange
      '#90DBF4', // Baby Blue
      '#ADE8F4', // Aqua Tint
      '#CAF0F8', // Ice Blue
      '#A2D2FF', // Powder Blue
      '#D0F4DE'  // Mint
    ];

    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      itemStyle: { color: colors[index % colors.length] }
    }));
  }

  // Toggle pie chart visibility
  togglePieChart() {
    this.showPieChart = !this.showPieChart;
    this.showCalendar = !this.showCalendar;
    if (this.showPieChart) {
      this.updatePieChart();
    }
  }

  // Toggle calendar visibility
  toggleCalendar() {
    this.showCalendar = !this.showCalendar;
    this.showPieChart =  !this.showCalendar ;
  }

  // Toggle chart view mode
  toggleChartViewMode() {
    this.chartViewMode = this.chartViewMode === 'category' ? 'income-expense' : 'category';
    this.updatePieChart();
  }

  // Handle year change
  onYearChange(year: number) {
    this.selectedYear = year;
    this.updatePieChart();
  }

  // Handle month change
  onMonthChange(month: number) {
    this.selectedMonth = month;
    this.updatePieChart();
  }

  // Calendar navigation methods
  goToPreviousMonth() {
    this.currentViewDate = moment(this.currentViewDate).subtract(1, 'month').toDate();
  }

  goToNextMonth() {
    this.currentViewDate = moment(this.currentViewDate).add(1, 'month').toDate();
  }

  goToToday() {
    this.currentViewDate = new Date();
  }

  // Custom date class function to highlight dates with transactions and range selection using Moment.js
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const cellMoment = moment(cellDate).startOf('day');
      let classes = '';
      
      // Check if date has transactions
      const isIncomeTx = this.transactions.some(transaction => {
        const transactionMoment = moment(this.dateService.toDate(transaction.date)).startOf('day');
        return transactionMoment.isSame(cellMoment, 'day') && transaction.type === TransactionType.INCOME;
      });

      const hasTransactions = this.transactions.some(transaction => {
        const transactionMoment = moment(this.dateService.toDate(transaction.date)).startOf('day');
        return transactionMoment.isSame(cellMoment, 'day');
      });
      
      if (hasTransactions) {
        if(isIncomeTx){
          classes += 'has-transactions has-income ';
        }else{
          classes += 'has-transactions has-expense ';
        }
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
    this.updatePieChart();
  }

  // Handle single date selection
  private handleSingleDateSelection(date: Date | null) {
    this.selectedDate = date;
    if (date) {
      this.selectedDateTransactions = this.getTransactionsForDate(date);
      // Emit selected date to other components
      this.filterService.setSelectedDate(date);
    } else {
      this.selectedDateTransactions = [];
      this.filterService.clearSelectedDate();
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
      this.filterService.setSelectedDateRange(this.startDate, this.endDate);
    }
  }

  // Get transactions for a specific date using Moment.js
  getTransactionsForDate(date: Date): Transaction[] {
    const targetMoment = moment(date).startOf('day');
    
    return this.transactions.filter(transaction => {
      const transactionMoment = moment(this.dateService.toDate(transaction.date)).startOf('day');
      return transactionMoment.isSame(targetMoment, 'day');
    });
  }

  // Get transactions for a date range using Moment.js
  getTransactionsForDateRange(startDate: Date, endDate: Date): Transaction[] {
    const startMoment = moment(startDate).startOf('day');
    const endMoment = moment(endDate).endOf('day');
    
    return this.transactions.filter(transaction => {
      const transactionMoment = moment(this.dateService.toDate(transaction.date));
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
      .filter(t => t.type === TransactionType.INCOME)
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
    this.filterService.clearSelectedDate();
    this.updatePieChart();
  }

  // Get total income for date range
  getRangeTotalIncome(): number {
    return this.rangeTransactions
      .filter(t => t.type === TransactionType.INCOME)
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
    this.filterService.clearSelectedDate();
  }

  updateCalendar() {
    this.showCalendar = false;
    setTimeout(() => {
      this.showCalendar = true;
    }, 0);
  }

}
