import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, HostListener } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { Transaction } from '../../../../util/models/transaction.model';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import moment from 'moment';
import { DateService } from 'src/app/util/service/date.service';
import { FilterService } from 'src/app/util/service/filter.service';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import { Category } from 'src/app/util/models';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import { APP_CONFIG } from 'src/app/util/config/config';

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
  
  // Responsive breakpoints
  private readonly MOBILE_BREAKPOINT = 640; // sm
  private readonly TABLET_BREAKPOINT = 768; // md

  private subscription = new Subscription();
  categories: any[] = [];

  constructor(
    private auth: Auth,
    private dateService: DateService,
    private filterService: FilterService,
    private store: Store<AppState>
  ) {}

  ngOnInit() {
    this.setupDataSource();
    this.filterTransactions();
    this.loadCategories();
    this.updateColumnVisibility();
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

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateColumnVisibility();
  }

  private updateColumnVisibility() {
    const screenWidth = window.innerWidth;
    
    if (screenWidth < this.MOBILE_BREAKPOINT) {
      // Mobile: Show only essential columns
      this.displayedColumns = ['Date', 'Payee', 'Amount', 'Actions'];
    } else if (screenWidth < this.TABLET_BREAKPOINT) {
      // Small tablet: Show more columns but hide status
      this.displayedColumns = ['Date', 'Type', 'Payee', 'Amount', 'Actions'];
    } else {
      // Desktop: Show all columns
      this.displayedColumns = ['Date', 'Type', 'Payee', 'Amount', 'Status', 'Actions'];
    }
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
    // Use the common filtering service with custom filters
    const filtered = this.filterService.filterTransactionsWithCustomFilters(
      this.transactions,
      {
        searchTerm: this.searchTerm,
        selectedCategory: this.selectedCategory,
        selectedType: this.selectedType,
        selectedDate: this.selectedDate,
        selectedDateRange: this.selectedDateRange ? {
          startDate: this.selectedDateRange.start,
          endDate: this.selectedDateRange.end
        } : null
      }
    );

    // Filter to show only current year transactions
    const currentYear = moment().year();
    const yearFiltered = filtered.filter(tx => {
      const txYear = moment(this.dateService.toDate(tx.date)).year();
      return txYear === currentYear;
    });

    this.dataSource.data = yearFiltered;
  }

  onEditTransaction(transaction: Transaction) {
    this.editTransaction.emit(transaction);
  }

  onDeleteTransaction(transaction: Transaction) {
    this.deleteTransaction.emit(transaction);
  }

  onStartRowEdit(transaction: Transaction) {
    this.editTransaction.emit(transaction);
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

  // Removed duplicate sort methods - now using FilterService.sortTransactions()

  private loadCategories(): void {
    const userId = this.auth.currentUser?.uid;
    if (userId) {
      this.store.select(selectAllCategories).subscribe((categories: Category[]) => {
        this.categories = categories;
      });
    }
  }

  getCategoryIcon(category: string): string {
    return this.categories.find((c) => c.name === category)?.icon || "category";
  }

  getCategoryColor(category: string): string {
    return this.categories.find((c) => c.name === category)?.color || "#46777f";
  }

  getDateDisplay(date: Date | any): string {
    if (date && typeof date === 'object' && 'seconds' in date) {
      // Handle Timestamp
      return new Date(date.seconds * 1000).toLocaleDateString(APP_CONFIG.LANGUAGE.DEFAULT, { month: 'short', day: 'numeric' });
    } else if (date instanceof Date) {
      // Handle Date
      return date.toLocaleDateString(APP_CONFIG.LANGUAGE.DEFAULT, { month: 'short', day: 'numeric' });
    }
    return '';
  }

  // Removed duplicate sort methods - now using FilterService.sortTransactions()
} 