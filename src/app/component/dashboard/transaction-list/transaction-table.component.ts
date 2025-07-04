import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Transaction } from '../../../util/service/transactions.service';
import { Subscription } from 'rxjs';
import moment from 'moment';

@Component({
  selector: 'transaction-table',
  templateUrl: './transaction-table.component.html',
  styleUrls: ['./transaction-table.component.scss']
})
export class TransactionTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() searchTerm: string = '';
  @Input() selectedCategory: string = 'all';
  @Input() selectedType: string = 'all';
  @Input() selectedDate: Date | null = null;
  @Input() selectedDateRange: { start: Date; end: Date } | null = null;

  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() startRowEdit = new EventEmitter<Transaction>();
  @Output() saveRowEdit = new EventEmitter<Transaction>();
  @Output() cancelRowEdit = new EventEmitter<Transaction>();
  @Output() addTransaction = new EventEmitter<void>();

  @ViewChild(MatSort) sort!: MatSort;

  dataSource: MatTableDataSource<Transaction> = new MatTableDataSource<Transaction>();
  displayedColumns: string[] = ['Date', 'Type', 'Payee', 'Amount', 'Status', 'Actions'];

  private subscription = new Subscription();

  constructor() {}

  ngOnInit() {
    this.setupDataSource();
    this.filterTransactions();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filterTransactions();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  private setupDataSource() {
    this.dataSource = new MatTableDataSource<Transaction>([]);
    
    // Custom filter predicate for complex filtering
    this.dataSource.filterPredicate = (data: Transaction, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.payee.toLowerCase().includes(searchStr) ||
        data.category.toLowerCase().includes(searchStr) ||
        (data.notes && data.notes.toLowerCase().includes(searchStr)) ||
        data.type.toLowerCase().includes(searchStr) ||
        data.amount.toString().includes(searchStr)
      );
    };
  }

  filterTransactions() {
    let filtered = [...this.transactions];

    // Filter to show only current year transactions
    const currentYear = moment().year();
    filtered = filtered.filter(tx => {
      const txYear = moment(tx.date.toDate()).year();
      return txYear === currentYear;
    });

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.payee.toLowerCase().includes(searchLower) ||
        tx.category.toLowerCase().includes(searchLower) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === this.selectedCategory);
    }

    // Apply type filter
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(tx => tx.type === this.selectedType);
    }

    // Apply date filter
    if (this.selectedDate) {
      const selectedMoment = moment(this.selectedDate).startOf('day');
      filtered = filtered.filter(tx => {
        const txMoment = moment(tx.date.toDate()).startOf('day');
        return txMoment.isSame(selectedMoment, 'day');
      });
    }

    // Apply date range filter
    if (this.selectedDateRange) {
      const startMoment = moment(this.selectedDateRange.start).startOf('day');
      const endMoment = moment(this.selectedDateRange.end).endOf('day');
      filtered = filtered.filter(tx => {
        const txMoment = moment(tx.date.toDate());
        return txMoment.isBetween(startMoment, endMoment, 'day', '[]');
      });
    }

    this.dataSource.data = filtered;
  }

  onEditTransaction(transaction: Transaction) {
    this.editTransaction.emit(transaction);
  }

  onDeleteTransaction(transaction: Transaction) {
    this.deleteTransaction.emit(transaction);
  }

  onStartRowEdit(transaction: Transaction) {
    this.startRowEdit.emit(transaction);
  }

  onSaveRowEdit(transaction: Transaction) {
    this.saveRowEdit.emit(transaction);
  }

  onCancelRowEdit(transaction: Transaction) {
    this.cancelRowEdit.emit(transaction);
  }

  onAddTransaction() {
    this.addTransaction.emit();
  }

  getFilteredCount(): number {
    return this.dataSource.data.length;
  }

  getTotalCount(): number {
    return this.transactions.length;
  }

  getCurrentYear(): number {
    return moment().year();
  }

  // Custom sort function for amount column
  sortAmount(a: Transaction, b: Transaction): number {
    return a.amount - b.amount;
  }

  // Custom sort function for date column
  sortDate(a: Transaction, b: Transaction): number {
    return a.date.toDate().getTime() - b.date.toDate().getTime();
  }

  // Custom sort function for payee column
  sortPayee(a: Transaction, b: Transaction): number {
    return a.payee.localeCompare(b.payee);
  }

  // Custom sort function for category column
  sortCategory(a: Transaction, b: Transaction): number {
    return a.category.localeCompare(b.category);
  }

  // Custom sort function for type column
  sortType(a: Transaction, b: Transaction): number {
    return a.type.localeCompare(b.type);
  }
} 