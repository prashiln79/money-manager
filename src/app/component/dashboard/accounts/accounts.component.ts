import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Account, AccountsService } from 'src/app/util/service/accounts.service';

@Component({
  selector: 'user-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit {
  userId: string = '';
  accounts: Account[] = [];
  newAccount: Account = {
    accountId: '',
    userId: '',
    name: '',
    type: 'bank',
    balance: 0,
    createdAt: ''
  };

  constructor(
    private accountsService: AccountsService,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  // Load accounts for the logged-in user
  async loadAccounts() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.accountsService.getAccounts(this.userId).subscribe(accounts => {
        this.accounts = accounts;
      });
    }
  }

  // Create a new account
  async createAccount() {
    const user = this.auth.currentUser;
    if (user) {
      this.newAccount.userId = user.uid;
      this.newAccount.accountId = `${this.newAccount.userId}-${new Date().getTime()}`;
      this.newAccount.createdAt = new Date().toISOString();
      await this.accountsService.createAccount(user.uid, this.newAccount);
      this.loadAccounts();  // Reload accounts after adding
    }
  }
}
