import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Account } from 'src/app/util/service/accounts.service';

@Component({
	selector: "mobile-accounts-list",
	templateUrl: "./mobile-accounts-list.component.html",
	styleUrls: ["./mobile-accounts-list.component.scss"],
})
export class MobileAccountsListComponent implements OnInit, OnDestroy {
	@Input() accounts: Account[] = [];
	@Output() editAccount = new EventEmitter<Account>();
	@Output() deleteAccount = new EventEmitter<Account>();
	@Output() addAccount = new EventEmitter<void>();

	public selectedAccount: Account | null = null;
	private destroy$ = new Subject<void>();

	constructor() {}

	ngOnInit(): void {}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	onAccountClick(account: Account): void {
		if (this.selectedAccount?.accountId === account.accountId) {
			this.selectedAccount = null;
		} else {
			this.selectedAccount = account;
		}
	}

	onEditAccount(account: Account): void {
		this.editAccount.emit(account);
		this.selectedAccount = null;
	}

	onDeleteAccount(account: Account): void {
		this.deleteAccount.emit(account);
		this.selectedAccount = null;
	}

	onAddAccount(): void {
		this.addAccount.emit();
	}

	trackByAccountId(index: number, account: Account): string {
		return account.accountId;
	}

	getAccountIcon(type: string): string {
		switch (type) {
			case 'bank':
				return 'account_balance';
			case 'cash':
				return 'payments';
			case 'credit':
				return 'credit_card';
			case 'loan':
				return 'account_balance_wallet';
			default:
				return 'account_balance';
		}
	}

	getBalanceClass(account: Account): string {
		if (account.type === 'loan') {
			return 'loan-account';
		}
		return account.balance >= 0 ? 'positive-balance' : 'negative-balance';
	}
} 