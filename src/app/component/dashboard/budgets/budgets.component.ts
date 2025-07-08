import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Budget, BudgetsService } from 'src/app/util/service/budgets.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import * as BudgetsActions from '../../../store/budgets/budgets.actions';
import * as BudgetsSelectors from '../../../store/budgets/budgets.selectors';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DateService } from 'src/app/util/service/date.service';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.component.html',
  styleUrls: ['./budgets.component.scss']
})
export class BudgetsComponent implements OnInit, OnDestroy {
  // Observables from store
  budgets$: Observable<Budget[]>;
  budgetsLoading$: Observable<boolean>;
  budgetsError$: Observable<any>;
  
  userId: string = '';
  budgets: Budget[] = [];
  newBudget: Budget = {
    budgetId: '',
    userId: '',
    category: 'Groceries',
    limit: 0,
    spent: 0,
    startDate: Timestamp.fromDate(new Date()),
    endDate: Timestamp.fromDate(new Date()),
  };
  
  private destroy$ = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private budgetsService: BudgetsService,
    private auth: Auth,
    private router: Router,
    private notificationService: NotificationService,
    private store: Store<AppState>,
    public dateService: DateService
  ) {
    // Initialize selectors
    this.budgets$ = this.store.select(BudgetsSelectors.selectAllBudgets);
    this.budgetsLoading$ = this.store.select(BudgetsSelectors.selectBudgetsLoading);
    this.budgetsError$ = this.store.select(BudgetsSelectors.selectBudgetsError);
  }

  ngOnInit(): void {
    this.loadBudgets();
    this.subscribeToStoreData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load budgets for the logged-in user
  loadBudgets() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.store.dispatch(BudgetsActions.loadBudgets({ userId: this.userId }));
    }
  }

  // Subscribe to store data for backward compatibility
  subscribeToStoreData() {
    this.subscriptions.add(
      this.budgets$.subscribe(budgets => {
        this.budgets = budgets;
      })
    );

    this.subscriptions.add(
      this.budgetsError$.subscribe(error => {
        if (error) {
          console.error('Error loading budgets:', error);
          this.notificationService.error('Failed to load budgets');
        }
      })
    );
  }

  // Create a new budget
  createBudget() {
    if (!this.newBudget.category || !this.newBudget.limit) {
      this.notificationService.warning('Please fill in all required fields');
      return;
    }

    if (this.newBudget.limit <= 0) {
      this.notificationService.warning('Budget limit must be greater than 0');
      return;
    }

    const user = this.auth.currentUser;
    if (user) {
      this.newBudget.userId = user.uid;
      this.newBudget.budgetId = `${this.newBudget.userId}-${new Date().getTime()}`;
      
      this.store.dispatch(BudgetsActions.createBudget({ 
        userId: user.uid, 
        budget: this.newBudget 
      }));
      
      this.notificationService.success('Budget created successfully');
      
      // Reset form
      this.newBudget = {
        budgetId: '',
        userId: '',
        category: 'Groceries',
        limit: 0,
        spent: 0,
        startDate: Timestamp.fromDate(new Date()),
        endDate: Timestamp.fromDate(new Date()),
      };
    }
  }

  // Delete a budget
  deleteBudget(budgetId: string) {
    const user = this.auth.currentUser;
    if (user) {
      this.store.dispatch(BudgetsActions.deleteBudget({ userId: user.uid, budgetId }));
      this.notificationService.success('Budget deleted successfully');
    }
  }

  // Update the spent amount for a budget
  updateSpent(budgetId: string, amount: number) {
    if (amount < 0) {
      this.notificationService.warning('Spent amount cannot be negative');
      return;
    }

    const user = this.auth.currentUser;
    if (user) {
      this.store.dispatch(BudgetsActions.updateSpent({ userId: user.uid, budgetId, amount }));
      this.notificationService.success('Budget spent amount updated successfully');
    }
  }
}
