import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { TransactionsService } from 'src/app/util/service/transactions.service';

@Component({
  selector: 'total-balance',
  templateUrl: './total-balance.component.html',
  styleUrl: './total-balance.component.scss'
})
export class TotalBalanceComponent {

  totalAmt = 0;
  constructor(private transactionsService: TransactionsService, private auth: Auth) {

    this.getTotalAmount();

  }

  getTotalAmount() {
    // Get total amount from transactions
    this.transactionsService.getTransactions(this.auth.currentUser?.uid || '').subscribe((transactions) => {
      this.totalAmt = Math.abs(
        transactions.reduce((acc, curr) => acc + (curr.type === 'income' ? curr.amount || 0 : -(curr.amount || 0)), 0)
      );
    });
  }

}
