import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AccountSummaryCardComponent } from 'src/app/util/components/cards/account-summary-card/account-summary-card.component';
import { CurrencyPipe } from 'src/app/util/pipes/currency.pipe';
import { Account } from 'src/app/util/models/account.model';
import { Transaction } from 'src/app/util/models/transaction.model';

@Component({
  selector: 'app-accounts-desktop',
  templateUrl: './accounts-desktop.component.html',
  styleUrls: ['./accounts-desktop.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    TranslateModule,
    AccountSummaryCardComponent,
    CurrencyPipe
  ]
})
export class AccountsDesktopComponent {
  @Input() errorMessage: string | null = null;
  @Input() bankBalance: number | null = 0;
  @Input() cashBalance: number | null = 0;
  @Input() creditBalance: number | null = 0;
  @Input() investmentBalance: number | null = 0;
  @Input() groupedAccountsViewModel: any[] = [];
  @Input() transactions: Transaction[] = [];
  @Input() accountsLength = 0;
  @Input() expandedAccount: Account | null = null;

  @Output() addAccount = new EventEmitter<void>();
  @Output() clearError = new EventEmitter<void>();
  @Output() toggleGroupCollapse = new EventEmitter<string>();
  @Output() toggleAccountExpansion = new EventEmitter<Account>();
  @Output() viewAccountStatement = new EventEmitter<Account>();
  @Output() editAccount = new EventEmitter<Account>();
  @Output() deleteAccount = new EventEmitter<Account>();
}
