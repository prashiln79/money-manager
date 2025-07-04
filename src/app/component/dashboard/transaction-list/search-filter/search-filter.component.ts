import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Transaction } from '../../../../util/service/transactions.service';
import moment from 'moment';

@Component({
  selector: 'search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnInit, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() searchTerm: string = '';
  @Input() selectedCategory: string = 'all';
  @Input() selectedType: string = 'all';
  @Input() selectedYear: number = moment().year();
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

  categories: string[] = [];
  availableYears: number[] = [];
  currentYear: number;

  constructor() {
    this.currentYear = moment().year();
  }

  ngOnInit() {
    this.updateCategories();
    this.updateAvailableYears();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transactions']) {
      this.updateCategories();
      this.updateAvailableYears();
    }
  }

  private updateCategories() {
    if (this.transactions && this.transactions.length > 0) {
      const categoriesSet = new Set(this.transactions.map(tx => tx.category));
      this.categories = Array.from(categoriesSet).sort();
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

  onSearchChange(event: any) {
    this.searchTermChange.emit(event.target.value);
  }

  onCategoryChange(event: any) {
    this.selectedCategoryChange.emit(event.target.value);
  }

  onTypeChange(event: any) {
    this.selectedTypeChange.emit(event.target.value);
  }

  onSelectedYearChange(event: any) {
    this.selectedYearChange.emit(event.target.value);
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
    this.clearAllFilters.emit();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedDate || 
      this.selectedDateRange || 
      this.searchTerm || 
      this.selectedCategory !== 'all' || 
      this.selectedType !== 'all' ||
      this.selectedYear !== this.currentYear
    );
  }

  getCurrentYear(): number {
    return this.currentYear;
  }
} 