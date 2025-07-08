import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { Transaction } from '../../../../util/service/transactions.service';
import { CategoryService } from '../../../../util/service/category.service';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import moment from 'moment';
import { DateService } from 'src/app/util/service/date.service';

@Component({
  selector: 'transaction-table',
  templateUrl: './transaction-table.component.html',
  styleUrls: ['./transaction-table.component.scss']
})
export class TransactionTableComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() transactions: Transaction[] = [];
  @Input() searchTerm: string = '';
  @Input() selectedCategory: string[] = ['all'];
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
  categories: any[] = [];

  constructor(
    private categoryService: CategoryService,
    private auth: Auth,
    private dateService: DateService
  ) {}

  ngOnInit() {
    this.setupDataSource();
    this.filterTransactions();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filterTransactions();
  }

  ngAfterViewInit() {
    this.setupSorting();
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

  private setupSorting() {
    // Set up custom sort accessors
    this.dataSource.sortingDataAccessor = (item: Transaction, property: string) => {
      switch (property) {
        case 'Date':
          return (this.dateService.toDate(item?.date) || new Date()).getTime();
        case 'Type':
          return (item?.category.toString().toLowerCase() || '');
        case 'Payee':
          return (item?.payee || '').toLowerCase();
        case 'Amount':
          return item?.amount;
        case 'Status':
          return (item?.type || '').toLowerCase();
        default:
          return '';
      }
    };

    // Connect the sort to the data source
    this.dataSource.sort = this.sort;

    // Subscribe to sort changes for additional functionality
    this.subscription.add(
      this.sort.sortChange.subscribe((sort: Sort) => {
        console.log(`Sorting by ${sort.active} in ${sort.direction} order`);
        // You can add additional logic here, such as analytics tracking
      })
    );

    // Set default sort
    this.sort.sort({
      id: 'Date',
      start: 'desc',
      disableClear: false
    });
  }

  filterTransactions() {
    let filtered = [...this.transactions];

    // Filter to show only current year transactions
    const currentYear = moment().year();
    filtered = filtered.filter(tx => {
      const txYear = moment(this.dateService.toDate(tx.date)).year();
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

    // Apply category filter - handle multi-select
    if (!this.selectedCategory.includes('all')) {
      filtered = filtered.filter(tx => this.selectedCategory.includes(tx.category));
    }

    // Apply type filter
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(tx => tx.type === this.selectedType);
    }

    // Apply date filter
    if (this.selectedDate) {
      const selectedMoment = moment(this.selectedDate).startOf('day');
      filtered = filtered.filter(tx => {
        const txMoment = moment(this.dateService.toDate(tx.date)).startOf('day');
        return txMoment.isSame(selectedMoment, 'day');
      });
    }

    // Apply date range filter
    if (this.selectedDateRange) {
      const startMoment = moment(this.selectedDateRange.start).startOf('day');
      const endMoment = moment(this.selectedDateRange.end).endOf('day');
      filtered = filtered.filter(tx => {
        const txMoment = moment(this.dateService.toDate(tx.date));
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

  // Get current sort state
  getCurrentSortState(): Sort | null {
    return this.sort ? this.sort.active ? {
      active: this.sort.active,
      direction: this.sort.direction
    } : null : null;
  }

  // Clear current sort
  clearSort(): void {
    if (this.sort) {
      this.sort.sort({
        id: '',
        start: 'asc',
        disableClear: false
      });
    }
  }

  // Custom sort function for amount column
  sortAmount(a: Transaction, b: Transaction): number {
    return a.amount - b.amount;
  }

  // Custom sort function for date column
  sortDate(a: Transaction, b: Transaction): number {
    return this.dateService.toDate(a.date).getTime() - this.dateService.toDate(b.date).getTime();
  }

  // Custom sort function for payee column
  sortPayee(a: Transaction, b: Transaction): number {
    return a.payee.localeCompare(b.payee);
  }

  private loadCategories(): void {
    const userId = this.auth.currentUser?.uid;
    if (userId) {
      this.categoryService.getCategories(userId).subscribe(categories => {
        this.categories = categories;
      });
    }
  }

  getCategoryIcon(category: string): string {
    return this.categories.find((c) => c.name === category)?.icon || "category";
  }

  getCategoryColor(category: string): string {
    return this.categories.find((c) => c.name === category)?.color || "#2196F3";
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