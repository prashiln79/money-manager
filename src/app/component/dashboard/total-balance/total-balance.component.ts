import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Transaction, TransactionsService } from 'src/app/util/service/transactions.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { CurrencyService } from 'src/app/util/service/currency.service';

@Component({
  selector: 'total-balance',
  templateUrl: './total-balance.component.html',
  styleUrl: './total-balance.component.scss'
})
export class TotalBalanceComponent implements OnInit {

  totalSpendAmt = 0;
  totalIncomeAmt = 0;
  userCurrency = this.currencyService.getDefaultCurrency();
  
  constructor(
    private transactionsService: TransactionsService, 
    private auth: Auth,
    private notificationService: NotificationService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.currencyService.currentCurrency$.subscribe(currency => {
      this.userCurrency = currency;
    });
    this.getTotalAmount();
  }

  getTotalAmount() {
    // Get total amount from transactions
    this.transactionsService.getTransactions(this.auth.currentUser?.uid || '').subscribe({
      next: (transactions: Transaction[]) => {
        this.totalSpendAmt = Math.abs(
          transactions.reduce((acc, curr) => acc + (curr.type === 'income' ?  0 : -(curr.amount || 0)), 0)
        );
        
        this.totalIncomeAmt = Math.abs(
          transactions.reduce((acc, curr) => acc + (curr.type === 'income' ? (curr.amount || 0) : 0), 0)
        );
        
      },
      error: (error) => {
        console.error('Error loading balance data:', error);
        this.notificationService.error('Failed to load balance data');
      }
    });
  }

}
