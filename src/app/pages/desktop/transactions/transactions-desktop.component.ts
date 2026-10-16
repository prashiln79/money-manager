import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import { FilterService } from 'src/app/util/service/filter.service';
import { selectAllTransactions } from 'src/app/store/transactions/transactions.selectors';
import * as ProfileSelectors from 'src/app/store/profile/profile.selectors';
import { CurrencyPipe } from 'src/app/util/pipes/currency.pipe';
import { Transaction } from 'src/app/util/models/transaction.model';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { TransactionTableComponent } from './transaction-table/transaction-table.component';



@Component({
  selector: 'app-transactions-desktop',
  templateUrl: './transactions-desktop.component.html',
  styleUrls: ['./transactions-desktop.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CurrencyPipe,
    SearchFilterComponent,
    TransactionTableComponent
  ]
})
export class TransactionsDesktopComponent {
  @Input() isHome = false;

  @Output() addTransaction = new EventEmitter<void>();
  @Output() importTransactions = new EventEmitter<void>();
  @Output() openFilterDialog = new EventEmitter<void>();
  @Output() viewAnalytics = new EventEmitter<void>();
  @Output() expandTable = new EventEmitter<void>();

  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() startRowEdit = new EventEmitter<Transaction>();
  @Output() saveRowEdit = new EventEmitter<Transaction>();
  @Output() cancelRowEdit = new EventEmitter<Transaction>();
  @Output() bulkDeleteTransactions = new EventEmitter<Transaction[]>();
  @Output() bulkUpdateCategory = new EventEmitter<{ transactions: Transaction[]; categoryId: string }>();

  private readonly store = inject(Store<AppState>);
  public readonly filterService = inject(FilterService);

  private readonly transactions = this.store.selectSignal(selectAllTransactions);
  private readonly isFamilyMode = this.store.selectSignal(ProfileSelectors.selectIsFamilyMode);

  // Filtered transactions adhering to family mode and active filter state
  readonly filteredTransactions = computed(() => {
    let txs = this.transactions() || [];
    if (this.isFamilyMode()) {
      txs = txs.filter(tx => !!(tx as any).familyId || !!(tx as any).splitData || !!(tx as any).settlementFamilyId);
    } else {
      txs = txs.filter(tx => !(tx as any).familyId && !(tx as any).splitData && !(tx as any).settlementFamilyId);
    }
    return this.filterService.filterTransactions(txs, this.filterService.filterState());
  });

  readonly totalIncome = computed(() =>
    this.filteredTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  );

  readonly totalExpenses = computed(() =>
    this.filteredTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  );

  readonly netCashFlow = computed(() => this.totalIncome() - this.totalExpenses());
  readonly transactionCount = computed(() => this.filteredTransactions().length);
}

