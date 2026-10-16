import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AccountSummaryCardComponent } from 'src/app/util/components/cards/account-summary-card/account-summary-card.component';
import { AccountStatsPipe } from 'src/app/util/pipes/account-stats.pipe';
import { CurrencyPipe } from 'src/app/util/pipes/currency.pipe';
import { AccountsComponent } from 'src/app/component/dashboard/accounts/accounts.component';

@Component({
  selector: 'app-accounts-mobile',
  templateUrl: './accounts-mobile.component.html',
  styleUrls: ['./accounts-mobile.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    TranslateModule,
    AccountSummaryCardComponent,
    AccountStatsPipe,
    CurrencyPipe
  ]
})
export class AccountsMobileComponent {
  @Input({ required: true }) c!: AccountsComponent;

  get breakpointService() { return this.c?.breakpointService; }
  get errorMessage() { return this.c?.errorMessage; }
  get bankBalance$() { return this.c?.bankBalance$; }
  get cashBalance$() { return this.c?.cashBalance$; }
  get creditBalance$() { return this.c?.creditBalance$; }
  get investmentBalance$() { return this.c?.investmentBalance$; }
  get groupedAccountsViewModel() { return this.c?.groupedAccountsViewModel || []; }
  get expandedAccount() { return this.c?.expandedAccount; }
  get transactions() { return this.c?.transactions || []; }
  get accounts$() { return this.c?.accounts$; }

  addAccount() { this.c?.addAccount(); }
  clearError() { this.c?.clearError(); }
  toggleGroupCollapse(id: string) { this.c?.toggleGroupCollapse(id); }
  toggleAccountExpansion(account: any) { this.c?.toggleAccountExpansion(account); }
  editAccount(account: any) { this.c?.editAccount(account); }
  deleteAccount(account: any) { this.c?.deleteAccount(account); }
  viewAccountStatement(account: any) { this.c?.viewAccountStatement(account); }
}
