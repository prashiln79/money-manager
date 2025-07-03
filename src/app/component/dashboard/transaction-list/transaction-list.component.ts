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
import { DateSelectionService } from 'src/app/util/service/date-selection.service';
import { Subscription } from 'rxjs';

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
  allTransactions: any[] = [];
  private dateSubscription = new Subscription();


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
    this.dateSubscription = this.dateSelectionService.selectedDate$.subscribe(date => {
      this.selectedDate = date;
      this.applyDateFilter();
    });
  }

  applyDateFilter() {
    if (this.selectedDate) {
      const selectedDateStr = this.formatDate(this.selectedDate);
      this.dataSource.data = this.allTransactions.filter(transaction => {
        const transactionDate = transaction.date.toDate();
        return this.formatDate(transactionDate) === selectedDateStr;
      });
      this.notificationService.success(`Showing transactions for ${this.selectedDate.toLocaleDateString()}`);
    } else {
      this.dataSource.data = [...this.allTransactions];
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  clearDateFilter() {
    this.selectedDate = null;
    this.dateSelectionService.clearSelectedDate();
    this.applyDateFilter();
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

    // Prepare data for export
    const exportData = this.dataSource.data.map(tx => ({
      'Date': new Date(tx.date.seconds * 1000).toLocaleDateString(),
      'Time': new Date(tx.date.seconds * 1000).toLocaleTimeString(),
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
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.notificationService.success(`Exported ${exportData.length} transactions successfully`);
  }

  // Header enhancement methods
  getCurrentMonthTransactions(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.dataSource.data.filter((tx: any) => {
      const txDate = new Date(tx.date.seconds * 1000);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    }).length;
  }

  getUniqueCategories(): number {
    const categories = new Set(this.dataSource.data.map((tx: any) => tx.category));
    return categories.size;
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

}
