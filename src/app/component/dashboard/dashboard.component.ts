import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import { UserService } from 'src/app/util/service/user.service';
import { loadProfile } from 'src/app/store/profile/profile.actions';
import { loadAccounts } from 'src/app/store/accounts/accounts.actions';
import { loadCategories } from 'src/app/store/categories/categories.actions';
import { loadBudgets } from 'src/app/store/budgets/budgets.actions';
import { loadGoals } from 'src/app/store/goals/goals.actions';
import { loadTransactions } from 'src/app/store/transactions/transactions.actions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  isMobile = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private store: Store<AppState>,
    private userService: UserService
  ) {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  ngOnInit() {
    this.store.dispatch(
      loadProfile({ userId: this.userService.getUser()?.uid })
    );
    this.store.dispatch(
      loadAccounts({ userId: this.userService.getUser()?.uid })
    );
    this.store.dispatch(
      loadCategories({ userId: this.userService.getUser()?.uid })
    );
    this.store.dispatch(
      loadBudgets({ userId: this.userService.getUser()?.uid })
    );
    this.store.dispatch(loadGoals({ userId: this.userService.getUser()?.uid }));
    this.store.dispatch(
      loadTransactions({ userId: this.userService.getUser()?.uid })
    );
  }
}
