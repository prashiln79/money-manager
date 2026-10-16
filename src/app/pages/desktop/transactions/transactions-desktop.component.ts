import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchFilterComponent } from 'src/app/component/dashboard/transaction-list/search-filter/search-filter.component';
import { TransactionTableComponent } from 'src/app/component/dashboard/transaction-list/transaction-table/transaction-table.component';
import { CalendarViewComponent } from 'src/app/component/dashboard/calendar-view/calendar-view.component';
import { MonthlyExpenditureCardComponent } from 'src/app/util/components/cards/monthly-expenditure-card/monthly-expenditure-card.component';
import { Transaction } from 'src/app/util/models/transaction.model';

@Component({
  selector: 'app-transactions-desktop',
  templateUrl: './transactions-desktop.component.html',
  styleUrls: ['./transactions-desktop.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SearchFilterComponent,
    TransactionTableComponent,
    CalendarViewComponent,
    MonthlyExpenditureCardComponent
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
}
