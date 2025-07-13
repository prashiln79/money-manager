import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import moment from 'moment';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CategoryFilter {
  categoryName: string;
  year: number;
  month: number;
  monthName: string;
}

export interface TransactionFilter {
  searchTerm: string;
  selectedCategory: string[];
  selectedType: string;
  selectedDate: Date | null;
  selectedDateRange: DateRange | null;
  categoryFilter: CategoryFilter | null;
  accountFilter: string[];
  amountRange: { min: number | null; max: number | null };
  statusFilter: string[];
  tags: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filter: Partial<TransactionFilter>;
  isDefault?: boolean;
}

export interface FilterHistory {
  timestamp: Date;
  filter: TransactionFilter;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  // Core filter subjects
  private selectedDateSubject = new BehaviorSubject<Date | null>(null);
  private selectedDateRangeSubject = new BehaviorSubject<DateRange | null>(null);
  private categoryFilterSubject = new BehaviorSubject<CategoryFilter | null>(null);
  private searchTermSubject = new BehaviorSubject<string>('');
  private selectedCategorySubject = new BehaviorSubject<string[]>(['all']);
  private selectedTypeSubject = new BehaviorSubject<string>('all');
  private accountFilterSubject = new BehaviorSubject<string[]>([]);
  private amountRangeSubject = new BehaviorSubject<{ min: number | null; max: number | null }>({ min: null, max: null });
  private statusFilterSubject = new BehaviorSubject<string[]>([]);
  private tagsSubject = new BehaviorSubject<string[]>([]);

  // Combined filter state
  private filterStateSubject = new BehaviorSubject<TransactionFilter>(this.getDefaultFilterState());
  
  // Filter history and presets
  private filterHistorySubject = new BehaviorSubject<FilterHistory[]>([]);
  private filterPresetsSubject = new BehaviorSubject<FilterPreset[]>([]);
  private activePresetSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public selectedDate$ = this.selectedDateSubject.asObservable();
  public selectedDateRange$ = this.selectedDateRangeSubject.asObservable();
  public categoryFilter$ = this.categoryFilterSubject.asObservable();
  public searchTerm$ = this.searchTermSubject.asObservable();
  public selectedCategory$ = this.selectedCategorySubject.asObservable();
  public selectedType$ = this.selectedTypeSubject.asObservable();
  public accountFilter$ = this.accountFilterSubject.asObservable();
  public amountRange$ = this.amountRangeSubject.asObservable();
  public statusFilter$ = this.statusFilterSubject.asObservable();
  public tags$ = this.tagsSubject.asObservable();
  public filterState$ = this.filterStateSubject.asObservable();
  public filterHistory$ = this.filterHistorySubject.asObservable();
  public filterPresets$ = this.filterPresetsSubject.asObservable();
  public activePreset$ = this.activePresetSubject.asObservable();

  // Computed observables
  public hasActiveFilters$ = this.filterState$.pipe(
    map(state => this.hasActiveFilters(state)),
    distinctUntilChanged()
  );

  public activeFiltersCount$ = this.filterState$.pipe(
    map(state => this.getActiveFiltersCount(state)),
    distinctUntilChanged()
  );

  constructor() {
    // Initialize presets from localStorage
    this.initializePresets();
    // Subscribe to all filter changes to update combined state
    this.setupFilterStateUpdates();
  }

  // ===== DATE FILTER METHODS =====
  setSelectedDate(date: Date | null): void {
    this.selectedDateSubject.next(date);
    this.selectedDateRangeSubject.next(null);
  }

  getSelectedDate(): Date | null {
    return this.selectedDateSubject.value;
  }

  setSelectedDateRange(startDate: Date, endDate: Date): void {
    if (!startDate || !endDate) {
      console.warn('Invalid date range provided');
      return;
    }
    this.selectedDateRangeSubject.next({ startDate, endDate });
    this.selectedDateSubject.next(null);
  }

  getSelectedDateRange(): DateRange | null {
    return this.selectedDateRangeSubject.value;
  }

  // ===== CATEGORY FILTER METHODS =====
  setCategoryFilter(categoryName: string, year: number, month: number, monthName: string): void {
    if (!categoryName || year === undefined || month === undefined || !monthName) {
      console.warn('Invalid category filter parameters provided');
      return;
    }
    const filter: CategoryFilter = { categoryName, year, month, monthName };
    this.categoryFilterSubject.next(filter);
  }

  getCategoryFilter(): CategoryFilter | null {
    return this.categoryFilterSubject.value;
  }

  // ===== TRANSACTION FILTER METHODS =====
  setSearchTerm(searchTerm: string): void {
    this.searchTermSubject.next(searchTerm || '');
  }

  getSearchTerm(): string {
    return this.searchTermSubject.value;
  }

  setSelectedCategory(categories: string[]): void {
    if (!Array.isArray(categories) || categories.length === 0) {
      console.warn('Invalid categories array provided');
      return;
    }
    this.selectedCategorySubject.next(categories);
  }

  getSelectedCategory(): string[] {
    return this.selectedCategorySubject.value;
  }

  setSelectedType(type: string): void {
    this.selectedTypeSubject.next(type || 'all');
  }

  getSelectedType(): string {
    return this.selectedTypeSubject.value;
  }

  // ===== ACCOUNT FILTER METHODS =====
  setAccountFilter(accounts: string[]): void {
    if (!Array.isArray(accounts)) {
      console.warn('Invalid accounts array provided');
      return;
    }
    this.accountFilterSubject.next(accounts);
  }

  getAccountFilter(): string[] {
    return this.accountFilterSubject.value;
  }

  // ===== AMOUNT RANGE FILTER METHODS =====
  setAmountRange(min: number | null, max: number | null): void {
    this.amountRangeSubject.next({ min, max });
  }

  getAmountRange(): { min: number | null; max: number | null } {
    return this.amountRangeSubject.value;
  }

  // ===== STATUS FILTER METHODS =====
  setStatusFilter(statuses: string[]): void {
    if (!Array.isArray(statuses)) {
      console.warn('Invalid statuses array provided');
      return;
    }
    this.statusFilterSubject.next(statuses);
  }

  getStatusFilter(): string[] {
    return this.statusFilterSubject.value;
  }

  // ===== TAGS FILTER METHODS =====
  setTags(tags: string[]): void {
    if (!Array.isArray(tags)) {
      console.warn('Invalid tags array provided');
      return;
    }
    this.tagsSubject.next(tags);
  }

  getTags(): string[] {
    return this.tagsSubject.value;
  }

  // ===== CLEAR METHODS =====
  clearSelectedDate(): void {
    this.selectedDateSubject.next(null);
    this.selectedDateRangeSubject.next(null);
  }

  clearCategoryFilter(): void {
    this.categoryFilterSubject.next(null);
  }

  clearSearchTerm(): void {
    this.searchTermSubject.next('');
  }

  clearSelectedCategory(): void {
    this.selectedCategorySubject.next(['all']);
  }

  clearSelectedType(): void {
    this.selectedTypeSubject.next('all');
  }

  clearAccountFilter(): void {
    this.accountFilterSubject.next([]);
  }

  clearAmountRange(): void {
    this.amountRangeSubject.next({ min: null, max: null });
  }

  clearStatusFilter(): void {
    this.statusFilterSubject.next([]);
  }

  clearTags(): void {
    this.tagsSubject.next([]);
  }

  // ===== CLEAR ALL FILTERS =====
  clearAllFilters(): void {
    this.clearSelectedDate();
    this.clearCategoryFilter();
    this.clearSearchTerm();
    this.clearSelectedCategory();
    this.clearSelectedType();
    this.clearAccountFilter();
    this.clearAmountRange();
    this.clearStatusFilter();
    this.clearTags();
    this.activePresetSubject.next(null);
  }

  // ===== FILTER STATE MANAGEMENT =====
  private setupFilterStateUpdates(): void {
    // Combine all filter observables to update the main state
    combineLatest([
      this.selectedDate$,
      this.selectedDateRange$,
      this.categoryFilter$,
      this.searchTerm$,
      this.selectedCategory$,
      this.selectedType$,
      this.accountFilter$,
      this.amountRange$,
      this.statusFilter$,
      this.tags$
    ]).subscribe(([date, dateRange, categoryFilter, searchTerm, categories, type, accounts, amountRange, statuses, tags]) => {
      const filterState: TransactionFilter = {
        searchTerm,
        selectedCategory: categories,
        selectedType: type,
        selectedDate: date,
        selectedDateRange: dateRange,
        categoryFilter,
        accountFilter: accounts,
        amountRange,
        statusFilter: statuses,
        tags
      };
      this.filterStateSubject.next(filterState);
      this.addToHistory(filterState);
    });
  }

  // ===== FILTER PRESETS =====
  saveAsPreset(name: string, description: string): void {
    if (!name || !description) {
      console.warn('Preset name and description are required');
      return;
    }
    
    const currentState = this.getCurrentFilterState();
    const preset: FilterPreset = {
      id: this.generatePresetId(),
      name,
      description,
      filter: currentState
    };
    
    const presets = [...this.filterPresetsSubject.value, preset];
    this.filterPresetsSubject.next(presets);
    this.savePresetsToStorage(presets);
  }

  applyPreset(presetId: string): void {
    const presets = this.filterPresetsSubject.value;
    const preset = presets.find(p => p.id === presetId);
    
    if (preset) {
      this.applyFilterState(preset.filter);
      this.activePresetSubject.next(presetId);
    } else {
      console.warn(`Preset with id ${presetId} not found`);
    }
  }

  deletePreset(presetId: string): void {
    const presets = this.filterPresetsSubject.value.filter(p => p.id !== presetId);
    this.filterPresetsSubject.next(presets);
    this.savePresetsToStorage(presets);
  }

  // ===== FILTER HISTORY =====
  private addToHistory(filterState: TransactionFilter): void {
    const history: FilterHistory = {
      timestamp: new Date(),
      filter: filterState,
      description: this.generateFilterDescription(filterState)
    };
    
    const currentHistory = this.filterHistorySubject.value;
    const newHistory = [history, ...currentHistory.slice(0, 9)]; // Keep last 10 entries
    this.filterHistorySubject.next(newHistory);
  }

  getFilterHistory(): FilterHistory[] {
    return this.filterHistorySubject.value;
  }

  clearFilterHistory(): void {
    this.filterHistorySubject.next([]);
  }

  // ===== UTILITY METHODS =====
  getCurrentFilterState(): TransactionFilter {
    return this.filterStateSubject.value;
  }

  hasActiveFilters(filterState?: TransactionFilter): boolean {
    const state = filterState || this.getCurrentFilterState();
    return !!(
      state.searchTerm ||
      !state.selectedCategory.includes('all') ||
      state.selectedType !== 'all' ||
      state.selectedDate ||
      state.selectedDateRange ||
      state.categoryFilter ||
      state.accountFilter.length > 0 ||
      state.amountRange.min !== null ||
      state.amountRange.max !== null ||
      state.statusFilter.length > 0 ||
      state.tags.length > 0
    );
  }

  getActiveFiltersCount(filterState?: TransactionFilter): number {
    const state = filterState || this.getCurrentFilterState();
    let count = 0;
    
    if (state.searchTerm) count++;
    if (!state.selectedCategory.includes('all')) count++;
    if (state.selectedType !== 'all') count++;
    if (state.selectedDate) count++;
    if (state.selectedDateRange) count++;
    if (state.categoryFilter) count++;
    if (state.accountFilter.length > 0) count++;
    if (state.amountRange.min !== null || state.amountRange.max !== null) count++;
    if (state.statusFilter.length > 0) count++;
    if (state.tags.length > 0) count++;
    
    return count;
  }

  applyFilterState(filterState: Partial<TransactionFilter>): void {
    if (filterState.searchTerm !== undefined) this.setSearchTerm(filterState.searchTerm);
    if (filterState.selectedCategory !== undefined) this.setSelectedCategory(filterState.selectedCategory);
    if (filterState.selectedType !== undefined) this.setSelectedType(filterState.selectedType);
    if (filterState.selectedDate !== undefined) this.setSelectedDate(filterState.selectedDate);
    if (filterState.selectedDateRange !== undefined && filterState.selectedDateRange) {
      this.setSelectedDateRange(filterState.selectedDateRange.startDate, filterState.selectedDateRange.endDate);
    }
    if (filterState.categoryFilter !== undefined) this.categoryFilterSubject.next(filterState.categoryFilter);
    if (filterState.accountFilter !== undefined) this.setAccountFilter(filterState.accountFilter);
    if (filterState.amountRange !== undefined) this.setAmountRange(filterState.amountRange.min, filterState.amountRange.max);
    if (filterState.statusFilter !== undefined) this.setStatusFilter(filterState.statusFilter);
    if (filterState.tags !== undefined) this.setTags(filterState.tags);
  }

  resetToDefaults(): void {
    this.applyFilterState(this.getDefaultFilterState());
  }

  // ===== PRIVATE HELPER METHODS =====
  private getDefaultFilterState(): TransactionFilter {
    return {
      searchTerm: '',
      selectedCategory: ['all'],
      selectedType: 'all',
      selectedDate: null,
      selectedDateRange: null,
      categoryFilter: null,
      accountFilter: [],
      amountRange: { min: null, max: null },
      statusFilter: [],
      tags: []
    };
  }

  private getDefaultPresets(): FilterPreset[] {
    return [
      {
        id: 'default-all',
        name: 'All Transactions',
        description: 'Show all transactions without filters',
        filter: this.getDefaultFilterState(),
        isDefault: true
      },
      {
        id: 'default-current-month',
        name: 'Current Month',
        description: 'Show transactions from current month',
        filter: {
          ...this.getDefaultFilterState(),
          selectedDateRange: {
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
          }
        }
      }
    ];
  }

  private initializePresets(): void {
    const presets = this.loadPresetsFromStorage();
    this.filterPresetsSubject.next(presets);
  }

  private generatePresetId(): string {
    return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFilterDescription(filterState: TransactionFilter): string {
    const parts: string[] = [];
    
    if (filterState.searchTerm) parts.push(`Search: "${filterState.searchTerm}"`);
    if (!filterState.selectedCategory.includes('all')) parts.push(`Category: ${filterState.selectedCategory.join(', ')}`);
    if (filterState.selectedType !== 'all') parts.push(`Type: ${filterState.selectedType}`);
    if (filterState.selectedDate) parts.push(`Date: ${filterState.selectedDate.toLocaleDateString()}`);
    if (filterState.selectedDateRange) parts.push(`Date Range: ${filterState.selectedDateRange.startDate.toLocaleDateString()} - ${filterState.selectedDateRange.endDate.toLocaleDateString()}`);
    if (filterState.categoryFilter) parts.push(`Category Filter: ${filterState.categoryFilter.categoryName} (${filterState.categoryFilter.monthName} ${filterState.categoryFilter.year})`);
    
    return parts.length > 0 ? parts.join(', ') : 'No filters applied';
  }

  private savePresetsToStorage(presets: FilterPreset[]): void {
    try {
      localStorage.setItem('money-manager-filter-presets', JSON.stringify(presets));
    } catch (error) {
      console.warn('Failed to save filter presets to localStorage:', error);
    }
  }

  private loadPresetsFromStorage(): FilterPreset[] {
    try {
      const stored = localStorage.getItem('money-manager-filter-presets');
      return stored ? JSON.parse(stored) : this.getDefaultPresets();
    } catch (error) {
      console.warn('Failed to load filter presets from localStorage:', error);
      return this.getDefaultPresets();
    }
  }

  // ===== COMMON FILTERING LOGIC =====
  
  /**
   * Apply filters to a transaction array using the current filter state
   * @param transactions Array of transactions to filter
   * @param filterState Optional filter state (uses current state if not provided)
   * @returns Filtered transaction array
   */
  filterTransactions(transactions: any[], filterState?: TransactionFilter): any[] {
    const state = filterState || this.getCurrentFilterState();
    let filtered = [...transactions];

    // Apply search filter
    if (state.searchTerm && state.searchTerm.trim()) {
      const searchLower = state.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(transaction => 
        transaction.payee?.toLowerCase().includes(searchLower) ||
        transaction.category?.toLowerCase().includes(searchLower) ||
        (transaction.notes && transaction.notes.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter - handle multi-select
    if (state.selectedCategory && !state.selectedCategory.includes('all')) {
      filtered = filtered.filter(transaction => 
        state.selectedCategory.includes(transaction.category)
      );
    }

    // Apply type filter
    if (state.selectedType && state.selectedType !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.type === state.selectedType
      );
    }

    // Apply date filter
    if (state.selectedDate) {
      const selectedMoment = moment(state.selectedDate).startOf('day');
      filtered = filtered.filter(transaction => {
        const transactionDate = this.getTransactionDate(transaction.date);
        if (!transactionDate) return false;
        const txMoment = moment(transactionDate).startOf('day');
        return txMoment.isSame(selectedMoment, 'day');
      });
    }

    // Apply date range filter
    if (state.selectedDateRange && state.selectedDateRange.startDate && state.selectedDateRange.endDate) {
      const startMoment = moment(state.selectedDateRange.startDate).startOf('day');
      const endMoment = moment(state.selectedDateRange.endDate).endOf('day');
      filtered = filtered.filter(transaction => {
        const transactionDate = this.getTransactionDate(transaction.date);
        if (!transactionDate) return false;
        const txMoment = moment(transactionDate);
        return txMoment.isBetween(startMoment, endMoment, 'day', '[]');
      });
    }

    // Apply account filter
    if (state.accountFilter && state.accountFilter.length > 0) {
      filtered = filtered.filter(transaction => 
        state.accountFilter.includes(transaction.accountId)
      );
    }

    // Apply amount range filter
    if (state.amountRange) {
      if (state.amountRange.min !== null) {
        filtered = filtered.filter(transaction => transaction.amount >= (state.amountRange.min || 0));
      }
      if (state.amountRange.max !== null) {
        filtered = filtered.filter(transaction => transaction.amount <= (state.amountRange.max || 0)); 
      }
    }

    // Apply status filter
    if (state.statusFilter && state.statusFilter.length > 0) {
      filtered = filtered.filter(transaction => 
        state.statusFilter.includes(transaction.status)
      );
    }

    // Apply tags filter
    if (state.tags && state.tags.length > 0) {
      filtered = filtered.filter(transaction => 
        transaction.tags && state.tags.some(tag => transaction.tags.includes(tag))
      );
    }

    return filtered;
  }

  /**
   * Apply filters to a transaction array using custom filter parameters
   * @param transactions Array of transactions to filter
   * @param filters Custom filter parameters
   * @returns Filtered transaction array
   */
  filterTransactionsWithCustomFilters(transactions: any[], filters: {
    searchTerm?: string;
    selectedCategory?: string[];
    selectedType?: string;
    selectedDate?: Date | null;
    selectedDateRange?: { startDate: Date; endDate: Date } | null;
    accountFilter?: string[];
    amountRange?: { min: number | null; max: number | null };
    statusFilter?: string[];
    tags?: string[];
  }): any[] {
    const filterState: TransactionFilter = {
      searchTerm: filters.searchTerm || '',
      selectedCategory: filters.selectedCategory || ['all'],
      selectedType: filters.selectedType || 'all',
      selectedDate: filters.selectedDate || null,
      selectedDateRange: filters.selectedDateRange || null,
      categoryFilter: null,
      accountFilter: filters.accountFilter || [],
      amountRange: filters.amountRange || { min: null, max: null },
      statusFilter: filters.statusFilter || [],
      tags: filters.tags || []
    };

    return this.filterTransactions(transactions, filterState);
  }

  /**
   * Sort transactions by various criteria
   * @param transactions Array of transactions to sort
   * @param sortBy Sort criteria ('date-desc', 'date-asc', 'amount-desc', 'amount-asc', 'payee-asc', 'category-asc')
   * @returns Sorted transaction array
   */
  sortTransactions(transactions: any[], sortBy: string = 'date-desc'): any[] {
    const sorted = [...transactions];

    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => {
          const dateA = this.getTransactionDate(a.date);
          const dateB = this.getTransactionDate(b.date);
          return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
        });
      case 'date-asc':
        return sorted.sort((a, b) => {
          const dateA = this.getTransactionDate(a.date);
          const dateB = this.getTransactionDate(b.date);
          return (dateA?.getTime() ?? 0) - (dateB?.getTime() ?? 0);
        });
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'payee-asc':
        return sorted.sort((a, b) => a.payee.localeCompare(b.payee));
      case 'category-asc':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return sorted.sort((a, b) => {
          const dateA = this.getTransactionDate(a.date);
          const dateB = this.getTransactionDate(b.date);
          return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
        });
    }
  }

  /**
   * Filter and sort transactions in one operation
   * @param transactions Array of transactions to filter and sort
   * @param filterState Optional filter state
   * @param sortBy Sort criteria
   * @returns Filtered and sorted transaction array
   */
  filterAndSortTransactions(
    transactions: any[], 
    filterState?: TransactionFilter, 
    sortBy: string = 'date-desc'
  ): any[] {
    const filtered = this.filterTransactions(transactions, filterState);
    return this.sortTransactions(filtered, sortBy);
  }

  /**
   * Get transaction date from various date formats (Timestamp, Date, string)
   * @param date Transaction date in any format
   * @returns Date object or null
   */
  private getTransactionDate(date: any): Date | null {
    if (!date) return null;
    
    if (date && typeof date === 'object' && 'seconds' in date) {
      // Handle Firestore Timestamp
      return new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      // Handle Date object
      return date;
    } else if (typeof date === 'string') {
      // Handle date string
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    } else if (typeof date === 'number') {
      // Handle timestamp
      return new Date(date);
    }
    
    return null;
  }

  /**
   * Get filtered transactions for current year only
   * @param transactions Array of transactions
   * @param filterState Optional filter state
   * @returns Filtered transactions for current year
   */
  filterCurrentYearTransactions(transactions: any[], filterState?: TransactionFilter): any[] {
    const currentYear = moment().year();
    const yearFiltered = transactions.filter(tx => {
      const txDate = this.getTransactionDate(tx.date);
      if (!txDate) return false;
      return moment(txDate).year() === currentYear;
    });
    
    return this.filterTransactions(yearFiltered, filterState);
  }

  /**
   * Get filtered transactions for a specific year
   * @param transactions Array of transactions
   * @param year Year to filter for
   * @param filterState Optional filter state
   * @returns Filtered transactions for specified year
   */
  filterYearTransactions(transactions: any[], year: number, filterState?: TransactionFilter): any[] {
    const yearFiltered = transactions.filter(tx => {
      const txDate = this.getTransactionDate(tx.date);
      if (!txDate) return false;
      return moment(txDate).year() === year;
    });
    
    return this.filterTransactions(yearFiltered, filterState);
  }
} 