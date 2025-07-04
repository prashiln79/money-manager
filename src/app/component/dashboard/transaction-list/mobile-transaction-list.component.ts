import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TransactionsService, Transaction } from '../../../util/service/transactions.service';
import { UserService } from '../../../util/service/user.service';
import { DateSelectionService } from '../../../util/service/date-selection.service';
import { Subscription } from 'rxjs';
import moment from 'moment';

@Component({
  selector: 'mobile-transaction-list',
  templateUrl: './mobile-transaction-list.component.html',
  styleUrls: ['./mobile-transaction-list.component.scss']
})
export class MobileTransactionListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() searchTerm: string = '';
  @Input() selectedCategory: string = 'all';
  @Input() selectedType: string = 'all';
  @Input() selectedDate: Date | null = null;
  @Input() selectedDateRange: { start: Date; end: Date } | null = null;

  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() addTransaction = new EventEmitter<void>();
  @Output() importTransactions = new EventEmitter<void>();

  selectedTx: Transaction | null = null;
  filteredTransactions: Transaction[] = [];

  private subscription = new Subscription();

  constructor(
    private transactionsService: TransactionsService,
    private userService: UserService,
    private dateSelectionService: DateSelectionService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.filterTransactions();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filterTransactions();
  }

  filterTransactions() {
    let filtered = [...this.transactions];

    // Filter to show only current year transactions
    const currentYear = moment().year();
    filtered = filtered.filter(tx => {
      const txYear = moment(tx.date.toDate()).year();
      return txYear === currentYear;
    });

    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.payee.toLowerCase().includes(searchLower) ||
        tx.category.toLowerCase().includes(searchLower) ||
        tx.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === this.selectedCategory);
    }

    // Type filter
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(tx => tx.type === this.selectedType);
    }

    // Date filter
    if (this.selectedDate) {
      const selectedMoment = moment(this.selectedDate).startOf('day');
      filtered = filtered.filter(tx => {
        const txMoment = moment(tx.date.toDate()).startOf('day');
        return txMoment.isSame(selectedMoment, 'day');
      });
    }

    // Date range filter
    if (this.selectedDateRange) {
      const startMoment = moment(this.selectedDateRange.start).startOf('day');
      const endMoment = moment(this.selectedDateRange.end).endOf('day');
      filtered = filtered.filter(tx => {
        const txMoment = moment(tx.date.toDate());
        return txMoment.isBetween(startMoment, endMoment, 'day', '[]');
      });
    }

    this.filteredTransactions = filtered;
  }

  onLongPress(transaction: Transaction) {
    this.selectedTx = this.selectedTx?.id === transaction.id ? null : transaction;
  }

  onEditTransaction(transaction: Transaction) {
    this.editTransaction.emit(transaction);
    this.selectedTx = null;
  }

  onDeleteTransaction(transaction: Transaction) {
    this.deleteTransaction.emit(transaction);
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
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpenses(): number {
    return this.filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getNetAmount(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  getCategoriesList(): string[] {
    const categories = new Set(this.transactions.map(tx => tx.category));
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

  clearAllFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedType = 'all';
    this.selectedDate = null;
    this.selectedDateRange = null;
    this.filterTransactions();
  }
} 