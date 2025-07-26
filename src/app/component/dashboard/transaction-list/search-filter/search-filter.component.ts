import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Transaction } from '../../../../util/models/transaction.model';
import { NotificationService } from '../../../../util/service/notification.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app.state';
import * as CategoriesSelectors from '../../../../store/categories/categories.selectors';
import { Category } from '../../../../util/models';
import { Subscription } from 'rxjs';
import moment from 'moment';
import { DateService } from 'src/app/util/service/date.service';

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
    private store: Store<AppState>,
    public dateService: DateService
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
    // Update available years and categories when transactions change
    if (changes['transactions']) {
      this.updateAvailableYears();
      this.updateCategoriesFromTransactions();
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

  private updateCategoriesFromTransactions() {
    // Update categories based on actual transaction data
    if (this.transactions && this.transactions.length > 0) {
      const categoriesSet = new Set<string>();
      const categoryMap = new Map<string, string>();
      
      this.transactions.forEach(tx => {
        if (tx.categoryId && tx.category) {
          categoriesSet.add(tx.categoryId);
          categoryMap.set(tx.categoryId, tx.category);
        }
      });
      
      // Convert to array and sort
      this.categories = Array.from(categoriesSet).map(id => ({
        id: id,
        name: categoryMap.get(id) || 'Unknown'
      })).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.categories = [];
    }
  }

  private updateAvailableYears() {
    // Extract unique years from transaction data
    if (this.transactions && this.transactions.length > 0) {
      const yearsSet = new Set<number>();
      
      this.transactions.forEach(tx => {
        if (tx.date) {
          const year = moment(this.dateService.toDate(tx.date)).year();
          yearsSet.add(year);
        }
      });
      
      // Add current year if not present in transactions
      yearsSet.add(this.currentYear);
      
      // Convert to array, sort in descending order (newest first)
      this.availableYears = Array.from(yearsSet).sort((a, b) => b - a);
    } else {
      // Fallback to current year if no transactions
      this.availableYears = [this.currentYear];
    }
    
    // Ensure selected year is valid
    if (isNaN(this.selectedYear) || !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears.length > 0 ? this.availableYears[0] : this.currentYear;
    }
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

  onSelectedYearChange(value: any) {
    const year = value;
    this.selectedYear = year;
    this.selectedYearChange.emit(year);
    
    // If a specific month is selected, update the date range for the new year
    if (this.selectedMonthOption !== 'all') {
      const month = parseInt(this.selectedMonthOption);
      this.selectedDateRange = {
        start: moment().year(year).month(month).startOf('month').toDate(),
        end: moment().year(year).month(month).endOf('month').toDate()
      };

    }else{
      this.selectedDateRange = {
        start: moment().year(year).startOf('year').toDate(),
        end: moment().year(year).endOf('year').toDate()
      };
    }
    this.selectedDateRangeChange.emit(this.selectedDateRange);
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
    // Reset to current year or first available year
    this.selectedYear = this.availableYears.length > 0 ? this.availableYears[0] : this.currentYear;
    this.selectedMonthOption = 'all';
    this.clearAllFilters.emit();
  }

  onClearSearchFilter() {
    this.searchTerm = '';
    this.searchTermChange.emit('');
  }

  onClearYearFilter() {
    // Reset to current year or first available year
    const resetYear = this.availableYears.length > 0 ? this.availableYears[0] : this.currentYear;
    this.selectedYear = resetYear;
    this.selectedYearChange.emit(resetYear);
  }

  onClearMonthFilter() {
    this.selectedMonthOption = 'all';
    this.onSelectedMonthChange('all');
  }

  onClearCategoryFilter() {
    this.selectedCategory = 'all';
    this.selectedCategoryChange.emit('all');
  }

  onClearTypeFilter() {
    this.selectedType = 'all';
    this.selectedTypeChange.emit('all');
  }

  getActiveFilters() {
    const filters = [];
    const defaultYear = this.availableYears.length > 0 ? this.availableYears[0] : this.currentYear;
    
    if (this.searchTerm) {
      filters.push({
        type: 'search',
        label: `Search: "${this.searchTerm}"`,
        onRemove: () => this.onClearSearchFilter()
      });
    }
    
    if (this.selectedYear !== defaultYear) {
      filters.push({
        type: 'year',
        label: `Year: ${this.selectedYear}`,
        onRemove: () => this.onClearYearFilter()
      });
    }
    
    if (this.selectedMonthOption !== 'all') {
      const monthLabel = this.months.find(m => m.value === parseInt(this.selectedMonthOption))?.label;
      filters.push({
        type: 'month',
        label: `Month: ${monthLabel}`,
        onRemove: () => this.onClearMonthFilter()
      });
    }
    
    if (this.selectedCategory !== 'all') {
      const categoryName = this.categories.find(c => c.id === this.selectedCategory)?.name;
      filters.push({
        type: 'category',
        label: `Category: ${categoryName || 'Unknown'}`,
        onRemove: () => this.onClearCategoryFilter()
      });
    }
    
    if (this.selectedType !== 'all') {
      filters.push({
        type: 'type',
        label: `Type: ${this.selectedType}`,
        onRemove: () => this.onClearTypeFilter()
      });
    }
    
    return filters;
  }

  hasActiveFilters(): boolean {
    const defaultYear = this.availableYears.length > 0 ? this.availableYears[0] : this.currentYear;
    return !!(
      this.selectedDate || 
      this.selectedDateRange || 
      this.searchTerm || 
      this.selectedCategory !== 'all' || 
      this.selectedType !== 'all' ||
      this.selectedYear !== defaultYear ||
      this.selectedMonthOption !== 'all'
    );
  }


} 