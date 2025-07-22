import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Transaction } from '../../../../util/models/transaction.model';
import { NotificationService } from '../../../../util/service/notification.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app.state';
import * as CategoriesSelectors from '../../../../store/categories/categories.selectors';
import { Category } from '../../../../util/models';
import { Subscription } from 'rxjs';
import moment from 'moment';

@Component({
  selector: 'search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() transactions: Transaction[] = [];
  @Input() searchTerm: string = '';
  @Input() selectedCategory: string = 'all';
  @Input() selectedType: string = 'all';
  @Input() selectedYear: number = moment().year();
  @Input() selectedMonth: number = moment().month();
  @Input() selectedMonthOption: string = 'all';
  @Input() selectedDate: Date | null = null;
  @Input() selectedDateRange: { start: Date; end: Date } | null = null;
  @Input() filteredCount: number = 0;
  @Input() currentYearCount: number = 0;

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() selectedCategoryChange = new EventEmitter<string>();
  @Output() selectedTypeChange = new EventEmitter<string>();
  @Output() selectedYearChange = new EventEmitter<number>();
  @Output() addTransaction = new EventEmitter<void>();
  @Output() importTransactions = new EventEmitter<void>();
  @Output() openFilterDialog = new EventEmitter<void>();
  @Output() viewAnalytics = new EventEmitter<void>();
  @Output() expandTable = new EventEmitter<void>();
  @Output() clearAllFilters = new EventEmitter<void>();
  @Output() selectedDateRangeChange = new EventEmitter<{
    start: Date;
    end: Date;
  } | null>();

  categories: { id: string; name: string }[] = [];
  availableYears: number[] = [];
  months: { value: number; label: string }[] = [];
  currentYear: number;
  private subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private store: Store<AppState>
  ) {
    this.currentYear = moment().year();
  }

  ngOnInit() {
    this.loadCategoriesFromStore();
    this.updateAvailableYears();
    this.updateMonths();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Categories are now loaded from store, so no need to update based on transactions
    // Only update available years if needed
    if (changes['transactions']) {
      this.updateAvailableYears();
    }
  }

  private loadCategoriesFromStore() {
    this.subscription.add(
      this.store.select(CategoriesSelectors.selectAllCategories).subscribe((categories: Category[]) => {
        this.categories = categories.map(category => ({
          id: category.id || '',
          name: category.name
        })).sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  private updateCategories() {
    // This method is now deprecated in favor of loadCategoriesFromStore
    // Keeping it for backward compatibility
    if (this.transactions && this.transactions.length > 0) {
      const categoriesSet = new Set(this.transactions.map(tx => ({ id: tx.categoryId, name: tx.category })));
      this.categories = Array.from(categoriesSet).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.categories = [];
    }
  }

  private updateAvailableYears() {
    //check this year is coming as NaN
    if (isNaN(this.selectedYear)) {
      this.selectedYear = this.currentYear;
    }
    this.availableYears = Array.from({ length: 10 }, (_, i) => this.currentYear - i);
  }

  private updateMonths() {
    this.months = [
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
  }

  onSearchChange(event: any) {
    const searchValue = event.target.value;
    this.searchTermChange.emit(searchValue);
  }

  onCategoryChange(event: any) {
    const category = event.target.value;
    this.selectedCategoryChange.emit(category);
  }

  onTypeChange(event: any) {
    const type = event.target.value;
    this.selectedTypeChange.emit(type);
  }

  onSelectedYearChange(event: any) {
    const year = event.target.value;
    this.selectedYear = year;
    this.selectedYearChange.emit(year);
    
    // If a specific month is selected, update the date range for the new year
    if (this.selectedMonthOption !== 'all') {
      const month = parseInt(this.selectedMonthOption);
      this.selectedDateRange = {
        start: moment().year(year).month(month).startOf('month').toDate(),
        end: moment().year(year).month(month).endOf('month').toDate()
      };
      this.selectedDateRangeChange.emit(this.selectedDateRange);
    }
  }

  onSelectedMonthChange(monthValue: string) {
    this.selectedMonthOption = monthValue;
    if (monthValue !== 'all') {
      const month = parseInt(monthValue);
      this.selectedDateRange = {
        start: moment().year(this.selectedYear).month(month).startOf('month').toDate(),
        end: moment().year(this.selectedYear).month(month).endOf('month').toDate()
      };
      this.selectedDateRangeChange.emit(this.selectedDateRange);
    } else {
      // Clear date range when "all" is selected
      this.selectedDateRange = null;
      this.selectedDateRangeChange.emit(null);
    }
  }

  onAddTransaction() {
    this.addTransaction.emit();
  }

  onImportTransactions() {
    this.importTransactions.emit();
  }

  onOpenFilterDialog() {
    this.openFilterDialog.emit();
  }

  onViewAnalytics() {
    this.viewAnalytics.emit();
  }

  onExpandTable() {
    this.expandTable.emit();
  }

  onClearAllFilters() {
    this.selectedDateRange = null;
    this.selectedDate = null;
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedType = 'all';
    this.selectedYear = this.currentYear;
    this.selectedMonthOption = 'all';
    this.clearAllFilters.emit();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedDate || 
      this.selectedDateRange || 
      this.searchTerm || 
      this.selectedCategory !== 'all' || 
      this.selectedType !== 'all' ||
      this.selectedYear !== this.currentYear ||
      this.selectedMonthOption !== 'all'
    );
  }

  getCurrentYear(): number {
    return this.currentYear;
  }
} 