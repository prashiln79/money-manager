import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Auth } from '@angular/fire/auth';
import { Transaction, TransactionsService } from 'src/app/util/service/transactions.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { TransactionComponent } from './add-transaction/transaction/transaction.component';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from 'src/app/util/service/loader.service';
import { ImportTransactionsComponent } from './add-transaction/import-transactions.component';
import { DateSelectionService, DateRange } from 'src/app/util/service/date-selection.service';
import { Subscription } from 'rxjs';
import moment from 'moment';

@Component({
  selector: 'transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss'
})
export class TransactionListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild("tableSort", { static: false }) sort!: MatSort;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  isMobile = false;
  displayedColumns: string[] = ['Payee', 'Amount', 'Status', 'Type', 'Date', 'Actions'];
  public pageSizeOptions: number[] = [10, 25, 100];
  selectedTx: any = null;
  longPressTimeout: any;
  
  // Date filtering properties
  selectedDate: Date | null = null;
  selectedDateRange: DateRange | any = null;
  allTransactions: any[] = [];
  private dateSubscription = new Subscription();
  
  // Search and filter properties
  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedType: string = 'all';

  // Table properties
  showFullTable: boolean = false;


  constructor(
    private loaderService: LoaderService, 
    private _dialog: MatDialog, 
    private breakpointObserver: BreakpointObserver, 
    private auth: Auth, 
    private transactionsService: TransactionsService, 
    private notificationService: NotificationService,
    private dateSelectionService: DateSelectionService
  ) {

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  ngOnInit() {
    this.loadTransactions();
    this.subscribeToDateSelection();
  }

  ngOnDestroy() {
    this.dateSubscription.unsubscribe();
  }

  loadTransactions() {
    this.loaderService.show();
    this.transactionsService.getTransactions(this.auth.currentUser?.uid || '').subscribe(transactions => {
      this.allTransactions = transactions.sort((a: any, b: any) => b.date.toDate() - a.date.toDate());
      this.applyDateFilter();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.loaderService.hide();
    });
  }

  subscribeToDateSelection() {
    // Subscribe to single date selection
    this.dateSubscription.add(
      this.dateSelectionService.selectedDate$.subscribe(date => {
        if(date){
          this.selectedDate = date;
          this.selectedDateRange = null;
          this.applyDateFilter();
        }
      })
    );

    // Subscribe to date range selection
    this.dateSubscription.add(
      this.dateSelectionService.selectedDateRange$.subscribe(dateRange => {
        if(dateRange){
        this.selectedDateRange = dateRange;
          this.selectedDate = null;
          this.applyDateFilter();
        }
      })
    );
  }

  applyDateFilter() {
    let filteredData = [...this.allTransactions];
    
    // Apply date filtering
    if (this.selectedDate) {
      const selectedDateStr = this.formatDate(this.selectedDate);
      filteredData = filteredData.filter(transaction => {
        const transactionDate = transaction.date.toDate();
        return this.formatDate(transactionDate) === selectedDateStr;
      });
      this.notificationService.success(`Showing transactions for ${moment(this.selectedDate).format('MMM DD, YYYY')}`);
    } else if (this.selectedDateRange) {
      // Use Moment.js for date range filtering
      const startOfDay = moment(this.selectedDateRange.startDate).startOf('day').toDate();
      const endOfDay = moment(this.selectedDateRange.endDate).endOf('day').toDate();
      
      filteredData = filteredData.filter(transaction => {
        const transactionDate = transaction.date.toDate();
        return transactionDate >= startOfDay && transactionDate <= endOfDay;
      });
      const startDate = moment(this.selectedDateRange.startDate).format('MMM DD, YYYY');
      const endDate = moment(this.selectedDateRange.endDate).format('MMM DD, YYYY');
      this.notificationService.success(`Showing transactions from ${startDate} to ${endDate}`);
    }
    
    // Apply search and other filters
    filteredData = this.applySearchAndFilters(filteredData);
    
    this.dataSource.data = filteredData;
  }

  applySearchAndFilters(transactions: any[]): any[] {
    let filtered = transactions;
    
    // Apply search term
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(transaction => 
        transaction.payee.toLowerCase().includes(searchLower) ||
        transaction.category.toLowerCase().includes(searchLower) ||
        (transaction.notes && transaction.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.category === this.selectedCategory
      );
    }
    
    // Apply type filter
    if (this.selectedType && this.selectedType !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.type === this.selectedType
      );
    }
    
    return filtered;
  }

  onSearchChange(): void {
    this.applyDateFilter();
  }

  onCategoryChange(): void {
    this.applyDateFilter();
  }

  onTypeChange(): void {
    this.applyDateFilter();
  }

  private formatDate(date: Date): string {
    // Use Moment.js for consistent date formatting
    return moment(date).format('YYYY-MM-DD');
  }

  clearDateFilter() {
    this.selectedDate = null;
    this.selectedDateRange = null;
    this.dateSelectionService.clearSelectedDate();
    this.applyDateFilter();
  }

  clearAllFilters(): void {
    this.selectedDate = null;
    this.selectedDateRange = null;
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedType = 'all';
    this.dateSelectionService.clearSelectedDate();
    this.applyDateFilter();
    this.notificationService.success('All filters cleared');
  }

  editTransaction(transaction: Transaction) {
    const dialogRef = this._dialog.open(TransactionComponent, {
      data: transaction
    });
  }

  async deleteTransaction(transaction: Transaction) {
    await this.transactionsService.deleteTransaction(this.auth.currentUser?.uid || '', transaction.id || '');
    this.notificationService.success('Transaction deleted successfully');
  }

  onLongPress(tx: any) {
    this.selectedTx = tx;
  }

  // Row-level editing methods
  startRowEdit(element: any) {
    // Store original values for cancellation
    element.originalValues = {
      payee: element.payee,
      amount: element.amount,
      type: element.type
    };
    element.isEditing = true;
  }

  saveRowEdit(element: any) {
    // Validate inputs
    if (!element.payee || !element.payee.trim()) {
      this.notificationService.error('Payee cannot be empty');
      return;
    }

    const amount = parseFloat(element.amount);
    if (!amount || amount <= 0) {
      this.notificationService.error('Amount must be a positive number');
      return;
    }

    if (!element.type || (element.type !== 'income' && element.type !== 'expense')) {
      this.notificationService.error('Please select a valid transaction type');
      return;
    }

    // Prepare update data
    const updateData = {
      payee: element.payee.trim(),
      amount: amount,
      type: element.type
    };

    // Save to database
    this.transactionsService.updateTransaction(
      this.auth.currentUser?.uid || '', 
      element.id || '', 
      updateData
    ).then(() => {
      this.notificationService.success('Transaction updated successfully');
      element.isEditing = false;
      delete element.originalValues;
    }).catch(error => {
      this.notificationService.error('Failed to update transaction');
      // Revert to original values
      element.payee = element.originalValues.payee;
      element.amount = element.originalValues.amount;
      element.type = element.originalValues.type;
      element.isEditing = false;
    });
  }

  cancelRowEdit(element: any) {
    // Revert to original values
    element.payee = element.originalValues.payee;
    element.amount = element.originalValues.amount;
    element.type = element.originalValues.type;
    element.isEditing = false;
    delete element.originalValues;
  }

  openImportDialog() {
    const dialogRef = this._dialog.open(ImportTransactionsComponent, {
      width: '600px',
      maxWidth: '95vw',
    });
    dialogRef.afterClosed().subscribe((imported: any[]) => {
      if (imported && imported.length) {
        // Here you would call your service to add these transactions
        // For now, just show a notification
        this.notificationService.success(`${imported.length} transactions ready to import!`);
        // TODO: Actually import to backend
      }
    });
  }

  exportToExcel() {
    if (!this.dataSource.data || this.dataSource.data.length === 0) {
      this.notificationService.error('No transactions to export');
      return;
    }

    // Prepare data for export using Moment.js
    const exportData = this.dataSource.data.map(tx => ({
      'Date': moment(tx.date.seconds * 1000).format('MM/DD/YYYY'),
      'Time': moment(tx.date.seconds * 1000).format('hh:mm A'),
      'Payee': tx.payee,
      'Amount': tx.amount,
      'Type': tx.type,
      'Category': tx.category,
      'Notes': tx.notes || ''
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${moment().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.notificationService.success(`Exported ${exportData.length} transactions successfully`);
  }

  // Header enhancement methods
  getCurrentMonthTransactions(): number {
    const currentMonth = moment().month();
    const currentYear = moment().year();
    return this.dataSource.data.filter((tx: any) => {
      const txDate = moment(tx.date.seconds * 1000);
      return txDate.month() === currentMonth && txDate.year() === currentYear;
    }).length;
  }

  getUniqueCategories(): number {
    const categories = new Set(this.dataSource.data.map((tx: any) => tx.category));
    return categories.size;
  }

  getFilteredCount(): number {
    return this.dataSource.data.length;
  }

  getTotalCount(): number {
    return this.allTransactions.length;
  }

  getCurrentYearCount(): number {
    const currentYear = moment().year();
    return this.allTransactions.filter((tx: any) => {
      const txYear = moment(tx.date.seconds * 1000).year();
      return txYear === currentYear;
    }).length;
  }

  getCurrentYear(): number {
    return moment().year();
  }

  getCategoriesList(): string[] {
    const categories = new Set(this.allTransactions.map((tx: any) => tx.category));
    return Array.from(categories).sort();
  }

  getTypesList(): string[] {
    return ['income', 'expense'];
  }

  refreshTransactions(): void {
    this.loadTransactions();
    this.notificationService.success('Transactions refreshed');
  }

  openFilterDialog(): void {
    // TODO: Implement filter dialog
    this.notificationService.success('Filter functionality coming soon');
  }

  viewAnalytics(): void {
    // TODO: Navigate to analytics or open analytics dialog
    this.notificationService.success('Analytics view coming soon');
  }

  addTransactionDialog(): void {
    const dialogRef = this._dialog.open(TransactionComponent, {
      width: '600px',
      maxWidth: '95vw',
    });
    dialogRef.afterClosed().subscribe((transaction: Transaction) => {
      if (transaction) {
        this.loadTransactions();
      }
    });
  }

  expandTable(): void {
    this.showFullTable = !this.showFullTable;
  }

}
