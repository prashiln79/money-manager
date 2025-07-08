import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from 'src/app/util/service/notification.service';
import { CurrencyService } from 'src/app/util/service/currency.service';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AppState } from '../../../store/app.state';
import * as TransactionsActions from '../../../store/transactions/transactions.actions';
import * as TransactionsSelectors from '../../../store/transactions/transactions.selectors';

@Component({
  selector: 'total-balance',
  templateUrl: './total-balance.component.html',
  styleUrl: './total-balance.component.scss'
})
export class TotalBalanceComponent implements OnInit, OnDestroy {

  // Observables from store
  totalIncome$: Observable<number>;
  totalExpenses$: Observable<number>;
  netBalance$: Observable<number>;
  transactionsLoading$: Observable<boolean>;
  transactionsError$: Observable<any>;
  
  // Local properties
  totalSpendAmt = 0;
  totalIncomeAmt = 0;
  userCurrency = this.currencyService.getDefaultCurrency();
  private subscriptions = new Subscription();
  
  constructor( 
    private auth: Auth,
    private notificationService: NotificationService,
    private currencyService: CurrencyService,
    private store: Store<AppState>
  ) {
    // Initialize selectors
    this.totalIncome$ = this.store.select(TransactionsSelectors.selectTotalIncome);
    this.totalExpenses$ = this.store.select(TransactionsSelectors.selectTotalExpenses);
    this.netBalance$ = this.store.select(TransactionsSelectors.selectNetBalance);
    this.transactionsLoading$ = this.store.select(TransactionsSelectors.selectTransactionsLoading);
    this.transactionsError$ = this.store.select(TransactionsSelectors.selectTransactionsError);
  }

  ngOnInit() {
    // Subscribe to currency changes
    this.subscriptions.add(
      this.currencyService.currentCurrency$.subscribe(currency => {
        this.userCurrency = currency;
      })
    );

    // Load transactions from store
    const userId = this.auth.currentUser?.uid;
    if (userId) {
      this.store.dispatch(TransactionsActions.loadTransactions({ userId }));
    }

    // Subscribe to store data for backward compatibility
    this.subscriptions.add(
      this.totalIncome$.subscribe(income => {
        this.totalIncomeAmt = income;
      })
    );

    this.subscriptions.add(
      this.totalExpenses$.subscribe(expenses => {
        this.totalSpendAmt = expenses;
      })
    );

    // Handle errors
    this.subscriptions.add(
      this.transactionsError$.subscribe(error => {
        if (error) {
          console.error('Error loading balance data:', error);
          this.notificationService.error('Failed to load balance data');
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
