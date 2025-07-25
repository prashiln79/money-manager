import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Transaction } from '../../../../util/models/transaction.model';
import { Subject, Subscription } from 'rxjs';
import moment from 'moment';
import { Auth } from '@angular/fire/auth';
import { Account, Category } from 'src/app/util/models';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../../../../util/components/confirm-dialog/confirm-dialog.component';
import {
  CustomDateRangeDialogComponent,
  CustomDateRangeData,
} from '../../../../util/components/custom-date-range-dialog';
import { DateService } from 'src/app/util/service/date.service';
import { selectAllAccounts } from 'src/app/store/accounts/accounts.selectors';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import { RecurringInterval } from 'src/app/util/config/enums';
import { FilterService } from 'src/app/util/service/filter.service';
import { CategoryService } from 'src/app/util/service/category.service';

interface SortOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'mobile-transaction-list',
  templateUrl: './mobile-transaction-list.component.html',
  styleUrls: ['./mobile-transaction-list.component.scss'],
})
export class MobileTransactionListComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() transactions: Transaction[] = [];
  @Input() searchTerm: string = '';
  @Input() selectedCategory: string[] = ['all'];
  @Input() selectedType: string = 'all';
  @Input() selectedDate: Date | null = null;
  @Input() selectedDateRange: { startDate: Date; endDate: Date } | null = null;

  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() addTransaction = new EventEmitter<void>();
  @Output() importTransactions = new EventEmitter<void>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() selectedCategoryChange = new EventEmitter<string[]>();
  @Output() selectedTypeChange = new EventEmitter<string>();
  @Output() selectedDateRangeChange = new EventEmitter<{
    startDate: Date;
    endDate: Date;
  } | null>();

  selectedTx: Transaction | null = null;
  filteredTransactions: Transaction[] = [];
  selectedSort: string = 'date-desc';
  showFilters: boolean = false;
  accounts: Account[] = [];

  sortOptions: SortOption[] = [
    { value: 'date-desc', label: 'Newest First', icon: 'schedule' },
    { value: 'date-asc', label: 'Oldest First', icon: 'schedule' },
    { value: 'amount-desc', label: 'Highest Amount', icon: 'trending_up' },
    { value: 'amount-asc', label: 'Lowest Amount', icon: 'trending_down' },
    { value: 'payee-asc', label: 'Payee A-Z', icon: 'sort_by_alpha' },
    { value: 'category-asc', label: 'Category A-Z', icon: 'category' },
  ];

  private subscription = new Subscription();
  destroy$: Subject<void> = new Subject<void>();
  categories: Category[] = [];

  constructor(
    private readonly auth: Auth,
    private readonly route: Router,
    private readonly dialog: MatDialog,
    public readonly dateService: DateService,
    private readonly store: Store<AppState>,
    private readonly filterService: FilterService,
    private readonly categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.filterTransactions();
    this.loadUserCategories();
    this.loadUserAccounts();
    if (this.route.url.includes('transactions')) {
      this.showFilters = true;
    }
    
    // Subscribe to category filter from calendar view
    this.subscription.add(
      this.filterService.categoryFilter$.subscribe((categoryFilter: any) => {
        if (categoryFilter) {
          // Set the category filter using categoryId
          this.selectedCategory = [categoryFilter.categoryId];
          
          // Set date range for the selected month/year
          const startDate = new Date(categoryFilter.year, categoryFilter.month, 1);
          const endDate = new Date(categoryFilter.year, categoryFilter.month + 1, 0);
          this.selectedDateRange = { startDate, endDate };
          
          // Apply filters
          this.filterTransactions();
          
          // Emit changes to parent
          this.selectedCategoryChange.emit(this.selectedCategory);
          this.selectedDateRangeChange.emit({ startDate, endDate });
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filterTransactions();
  }

  filterTransactions() {
    // Use the common filtering service
    const filtered = this.filterService.filterTransactionsWithCustomFilters(
      this.transactions,
      {
        searchTerm: this.searchTerm,
        selectedCategory: this.selectedCategory,
        selectedType: this.selectedType,
        selectedDate: this.selectedDate,
        selectedDateRange: this.selectedDateRange
      }
    );

    // Sort transactions using the common service
    const sorted = this.filterService.sortTransactions(filtered, this.selectedSort);

    this.filteredTransactions = sorted;
  }

  // Removed duplicate sortTransactions method - now using FilterService.sortTransactions()

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.searchTermChange.emit(term);
    this.filterTransactions();
  }

  onSortChange(sortValue: string) {
    this.selectedSort = sortValue;
    this.filterTransactions();
  }

  onTypeChange(type: string) {
    this.selectedType = type;
    this.selectedTypeChange.emit(type);
    this.filterTransactions();
  }

  onCategoryChange(category: string) {
    if (category === 'all') {
      // If "all" is selected, clear other selections
      this.selectedCategory = ['all'];
    } else {
      // Remove "all" if it exists
      this.selectedCategory = this.selectedCategory.filter((c) => c !== 'all');

      // Toggle the selected category
      if (this.selectedCategory.includes(category)) {
        this.selectedCategory = this.selectedCategory.filter(
          (c) => c !== category
        );
        // If no categories selected, default to "all"
        if (this.selectedCategory.length === 0) {
          this.selectedCategory = ['all'];
        }
      } else {
        this.selectedCategory.push(category);
      }
    }

    this.selectedCategoryChange.emit(this.selectedCategory);
    this.filterTransactions();
  }

  onDateRangeChange(range: string | null) {
    if (!range) {
      this.selectedDateRange = null;
    } else {
      switch (range) {
        case 'currentMonth':
          this.selectedDateRange = {
            startDate: (moment().startOf('month')).toDate(),
            endDate: (moment().endOf('month')).toDate(),
          };
          break;
        case 'lastMonth':
          this.selectedDateRange = {
            startDate: (moment().subtract(1, 'month').startOf('month')).toDate(),
            endDate: (moment().subtract(1, 'month').endOf('month')).toDate(),
          };
          break;
        case 'currentYear':
          this.selectedDateRange = {
            startDate: (moment().startOf('year')).toDate(),
            endDate: (moment().endOf('year')).toDate(),
          };
          break;
      }
    }
    this.selectedDateRangeChange.emit(this.selectedDateRange);
    this.filterTransactions();
  }

  isCurrentMonth(): boolean {
    if (!this.selectedDateRange) return false;
    const now = moment();
    const start = moment(this.selectedDateRange.startDate);
    const end = moment(this.selectedDateRange.endDate);
    return start.isSame(now.startOf('month')) && end.isSame(now.endOf('month'));
  }

  isLastMonth(): boolean {
    if (!this.selectedDateRange) return false;
    const now = moment();
    const lastMonth = now.subtract(1, 'month');
    const start = moment(this.selectedDateRange.startDate);
    const end = moment(this.selectedDateRange.endDate);
    return (
      start.isSame(lastMonth.startOf('month')) &&
      end.isSame(lastMonth.endOf('month'))
    );
  }

  isCurrentYear(): boolean {
    if (!this.selectedDateRange) return false;
    const now = moment();
    const start = moment(this.selectedDateRange.startDate);
    const end = moment(this.selectedDateRange.endDate);
    return start.isSame(now.startOf('year')) && end.isSame(now.endOf('year'));
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      !this.selectedCategory.includes('all') ||
      this.selectedType !== 'all' ||
      this.selectedDate ||
      this.selectedDateRange
    );
  }

  getCurrentSortLabel(): string {
    const option = this.sortOptions.find(
      (opt) => opt.value === this.selectedSort
    );
    return option ? option.label : 'Sort';
  }

  getCurrentTypeLabel(): string {
    switch (this.selectedType) {
      case 'all':
        return 'All Types';
      case 'income':
        return 'Income';
      case 'expense':
        return 'Expense';
      default:
        return 'All Types';
    }
  }

  getCurrentCategoryLabel(): string {
    if (this.selectedCategory.includes('all')) {
      return 'All Categories';
    }
    if (this.selectedCategory.length === 1) {
      return this.selectedCategory[0];
    }
    return `${this.selectedCategory.length} Categories`;
  }

  getCurrentDateLabel(): string {
    if (!this.selectedDateRange) return 'All Time';
    if (this.isCurrentMonth()) return 'This Month';
    if (this.isLastMonth()) return 'Last Month';
    if (this.isCurrentYear()) return 'This Year';
    return 'Custom Range';
  }

  onLongPress(transaction: Transaction) {
    this.selectedTx =
      this.selectedTx?.id === transaction.id ? null : transaction;
  }

  onEditTransaction(transaction: Transaction) {
    this.editTransaction.emit(transaction);
    this.selectedTx = null;
  }

  onDeleteTransaction(transaction: Transaction) {
    // this.deleteTransaction.emit(transaction);
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '300px',
        data: {
          title: 'Delete Transaction',
          message: 'Are you sure you want to delete this transaction?',
          confirmText: 'Delete',
          cancelText: 'Cancel',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.deleteTransaction.emit(transaction);
        }
      });
    this.selectedTx = null;
  }

  onAddTransaction() {
    this.addTransaction.emit();
  }

  onImportTransactions() {
    this.importTransactions.emit();
  }

  getTotalIncome(): number {
    return this.filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpenses(): number {
    return this.filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getNetAmount(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  getCategoriesList(): string[] {
    const categories = new Set(this.transactions.map((tx) => tx.category));
    return Array.from(categories).sort();
  }

  getFilteredCount(): number {
    return this.filteredTransactions.length;
  }

  getTotalCount(): number {
    return this.transactions.length;
  }

  getCurrentYear(): number {
    return moment().year();
  }

  getCategoryIcon(category: string): string {
    return this.categories.find((c) => c.name === category)?.icon || 'category';
  }

  getCategoryColor(category: string): string {
    return this.categories.find((c) => c.name === category)?.color || '#46777f';
  }

  private async loadUserCategories(): Promise<void> {
    if (this.auth.currentUser?.uid) {
      this.subscription.add(
        this.store.select(selectAllCategories).subscribe(
          (categories) => {
            this.categories = categories;
          },
          (error) => {
            console.error('Error loading categories:', error);
          }
        )
      );
    }
  }

  private async loadUserAccounts(): Promise<void> {
    if (this.auth.currentUser?.uid) {
      this.subscription.add(
        this.store.select(selectAllAccounts).subscribe(
            (accounts) => {
            this.accounts = accounts;
          },
          (error) => {
            console.error('Error loading accounts:', error);
          }
        )
      );
    }
  }

  getAccountName(accountId: string): string {
    const account = this.accounts.find((acc) => acc.accountId === accountId);
    return account ? account.name : 'Unknown Account';
  }

  getAccountType(accountId: string): string {
    const account = this.accounts.find((acc) => acc.accountId === accountId);
    return account ? account.type : '';
  }

  getRecurringInfo(transaction: Transaction): string {
    if (!transaction.isRecurring) return '';

    const interval = transaction.recurringInterval || RecurringInterval.MONTHLY;
    return `Recurring (${interval})`;
  }

  getSyncStatusInfo(transaction: Transaction): string {
    if (transaction.isPending) return 'Pending';
    if (transaction.syncStatus === 'failed') return 'Sync Failed';
    if (transaction.syncStatus === 'pending') return 'Syncing...';
    return 'Synced';
  }

  getSyncStatusIcon(transaction: Transaction): string {
    if (transaction.isPending) return 'schedule';
    if (transaction.syncStatus === 'failed') return 'error';
    if (transaction.syncStatus === 'pending') return 'sync';
    return 'check_circle';
  }

  getSyncStatusColor(transaction: Transaction): string {
    if (transaction.isPending) return '#ff9800';
    if (transaction.syncStatus === 'failed') return '#f44336';
    if (transaction.syncStatus === 'pending') return '#46777f';
    return '#4caf50';
  }

  clearAllFilters() {
    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Clear Filters',
        message: 'Are you sure you want to clear all filters?',
        confirmText: 'Clear',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.performClearAllFilters();
      }
    });
  }

  private performClearAllFilters() {
    this.searchTerm = '';
    this.selectedCategory = ['all'];
    this.selectedType = 'all';
    this.selectedDate = null;
    this.selectedDateRange = null;
    this.selectedSort = 'date-desc';

    // Emit changes
    this.searchTermChange.emit('');
    this.selectedCategoryChange.emit(['all']);
    this.selectedTypeChange.emit('all');
    this.selectedDateRangeChange.emit(null);

    this.filterTransactions();
  }

  // Quick clear without confirmation (for obvious clear buttons)
  quickClearFilters() {
    this.performClearAllFilters();
  }

  getActiveFiltersCount(): number {
    let count = 0;

    if (this.searchTerm) count++;
    if (!this.selectedCategory.includes('all')) count++;
    if (this.selectedType !== 'all') count++;
    if (this.selectedDate) count++;
    if (this.selectedDateRange) count++;

    return count;
  }

  isCategorySelected(category: string): boolean {
    return this.selectedCategory.includes(category);
  }

  isCustomDateRange(): boolean {
    if (!this.selectedDateRange) return false;
    return (
      !this.isCurrentMonth() && !this.isLastMonth() && !this.isCurrentYear()
    );
  }

  openCustomDateRangeDialog() {
    const dialogData: CustomDateRangeData = {
      startDate: this.selectedDateRange?.startDate,
      endDate: this.selectedDateRange?.endDate,
    };

    const dialogRef = this.dialog.open(CustomDateRangeDialogComponent, {
      width:  '400px',
      data: dialogData,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedDateRange = {
          startDate: result.startDate,
          endDate: result.endDate,
        };
        this.selectedDateRangeChange.emit(this.selectedDateRange);
        this.filterTransactions();
      }
    });
  }

  openImportDialog() {
    this.importTransactions.emit();
  }

  getCategoryName(categoryId: string): string {
    return this.categoryService.getCategoryNameById(categoryId);
  }
}
