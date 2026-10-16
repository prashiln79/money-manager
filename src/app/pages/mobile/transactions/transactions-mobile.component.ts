import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileTransactionListComponent } from 'src/app/component/dashboard/transaction-list/mobile-transaction-list/mobile-transaction-list.component';
import { Transaction } from 'src/app/util/models/transaction.model';

@Component({
  selector: 'app-transactions-mobile',
  templateUrl: './transactions-mobile.component.html',
  styleUrls: ['./transactions-mobile.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MobileTransactionListComponent]
})
export class TransactionsMobileComponent {
  @Input() isRecurring = false;

  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() bulkDeleteTransactions = new EventEmitter<Transaction[]>();
  @Output() adjustTransaction = new EventEmitter<Transaction>();
  @Output() addTransaction = new EventEmitter<void>();
  @Output() importTransactions = new EventEmitter<void>();
}
