import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../../../store/app.state';
import * as CategoriesSelectors from '../../../../store/categories/categories.selectors';
import * as TransactionsSelectors from '../../../../store/transactions/transactions.selectors';
import { Category } from '../../../models/category.model';
import { Transaction } from '../../../models/transaction.model';
import { TransactionType } from '../../../config/enums';
import { DateService } from '../../../service/date.service';
import { BreakpointService } from '../../../service/breakpoint.service';

@Component({
  selector: 'app-budget-card',
  templateUrl: './budget-card.component.html',
  styleUrls: ['./budget-card.component.scss']
})
export class BudgetCardComponent implements OnInit, OnDestroy {

  @Input() isHomeView: boolean = false;
  @Input() isChildView: boolean = false;

  // Observables from store
  categories$: Observable<Category[]>;
  transactions$: Observable<Transaction[]>;

  // Local properties
  categories: Category[] = [];
  transactions: Transaction[] = [];
  isBudgetSummaryExpanded: boolean = false;
  Math = Math; // Make Math available in template

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    public dateService: DateService,
    public breakpointService: BreakpointService
  ) {
    // Initialize selectors
    this.categories$ = this.store.select(CategoriesSelectors.selectAllCategories);
    this.transactions$ = this.store.select(TransactionsSelectors.selectAllTransactions);
  }

  ngOnInit(): void {
    this.subscribeToStoreData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToStoreData(): void {
    this.categories$.pipe(takeUntil(this.destroy$)).subscribe(categories => {
      this.categories = categories;
    });

    this.transactions$.pipe(takeUntil(this.destroy$)).subscribe(transactions => {
      this.transactions = transactions;
    });
  }

  /**
   * Toggle budget summary expansion
   */
  public toggleBudgetSummaryExpansion(): void {
    this.isBudgetSummaryExpanded = !this.isBudgetSummaryExpanded;
  }

  /**
   * Calculate budget spent for a category based on transactions
   */
  public calculateBudgetSpent(category: Category): number {
    if (!category.budget?.hasBudget || !category.budget?.budgetAmount) {
      return 0;
    }

    const categoryTransactions = this.transactions.filter(t => 
      t.categoryId === category.id && 
      t.type === TransactionType.EXPENSE
    );

    // Filter transactions within the budget period
    const budgetStartDate = category.budget.budgetStartDate;
    const budgetEndDate = category.budget.budgetEndDate;
    
    let filteredTransactions = categoryTransactions;
    
    if (budgetStartDate) {
      const startDate = this.dateService.toDate(budgetStartDate);
      if (!startDate) {
        return 0;
      }
      filteredTransactions = filteredTransactions.filter(t => {
        const txDate = this.dateService.toDate(t.date);
        return txDate && txDate >= startDate;
      });
    }
    
    if (budgetEndDate) {
      const endDate = this.dateService.toDate(budgetEndDate);
      if (!endDate) {
        return 0;
      }
      filteredTransactions = filteredTransactions.filter(t => {
        const txDate = this.dateService.toDate(t.date);
        return txDate && txDate <= endDate;
      });
    }

    return filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  /**
   * Calculate budget remaining for a category
   */
  public calculateBudgetRemaining(category: Category): number {
    if (!category.budget?.hasBudget || !category.budget?.budgetAmount) {
      return 0;
    }
    
    const spent = this.calculateBudgetSpent(category);
    return Math.max(0, (category.budget.budgetAmount || 0) - spent);
  }

  /**
   * Calculate budget progress percentage for a category
   */
  public calculateBudgetProgressPercentage(category: Category): number {
    if (!category.budget?.hasBudget || !category.budget?.budgetAmount) {
      return 0;
    }
    
    const spent = this.calculateBudgetSpent(category);
    const budgetAmount = category.budget.budgetAmount || 0;
    
    if (budgetAmount === 0) return 0;
    
    return Math.min(100, (spent / budgetAmount) * 100);
  }

  /**
   * Calculate overall budget statistics for all categories
   */
  public getOverallBudgetStats(): any {
    const categoriesWithBudget = this.categories.filter(cat =>
      cat.budget?.hasBudget && cat.type === TransactionType.EXPENSE
    );

    if (categoriesWithBudget.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallProgress: 0,
        categoriesWithBudget: 0,
        averageBudget: 0
      };
    }

    const totalBudget = categoriesWithBudget.reduce((sum, cat) =>
      sum + (cat.budget?.budgetAmount || 0), 0
    );

    const totalSpent = categoriesWithBudget.reduce((sum, cat) =>
      sum + this.calculateBudgetSpent(cat), 0
    );

    const totalRemaining = totalBudget - totalSpent;
    const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const averageBudget = totalBudget / categoriesWithBudget.length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallProgress,
      categoriesWithBudget: categoriesWithBudget.length,
      averageBudget
    };
  }

  /**
   * Get overall budget status class for styling
   */
  public getOverallBudgetStatusClass(): string {
    const stats = this.getOverallBudgetStats();
    if (stats.overallProgress >= 90) return 'danger';
    if (stats.overallProgress >= 75) return 'warning';
    return 'safe';
  }

  /**
   * Get overall budget progress color
   */
  public getOverallBudgetProgressColor(): string {
    const stats = this.getOverallBudgetStats();
    if (stats.overallProgress >= 100) {
      return '#ef4444'; // red - over budget
    } else if (stats.overallProgress >= 80) {
      return '#f59e0b'; // amber - warning
    } else if (stats.overallProgress >= 60) {
      return '#3b82f6'; // blue - good progress
    } else {
      return '#10b981'; // green - safe
    }
  }

  /**
   * Get detailed budget statistics for expanded view
   */
  public getDetailedBudgetStats(): any {
    const categoriesWithBudget = this.categories.filter(cat =>
      cat.budget?.hasBudget && cat.type === TransactionType.EXPENSE
    );

    if (categoriesWithBudget.length === 0) {
      return {
        categories: [],
        totalCategories: 0,
        averageSpentPerCategory: 0,
        mostExpensiveCategory: null,
        leastExpensiveCategory: null
      };
    }

    const categoryStats = categoriesWithBudget.map(cat => ({
      id: cat.id,
      name: cat.name,
      budget: cat.budget?.budgetAmount || 0,
      spent: this.calculateBudgetSpent(cat),
      remaining: this.calculateBudgetRemaining(cat),
      progress: this.calculateBudgetProgressPercentage(cat),
      color: cat.color,
      icon: cat.icon
    }));

    const totalSpent = categoryStats.reduce((sum, cat) => sum + cat.spent, 0);
    const averageSpentPerCategory = totalSpent / categoryStats.length;

    const mostExpensiveCategory = categoryStats.reduce((max, cat) =>
      cat.spent > max.spent ? cat : max, categoryStats[0]);

    const leastExpensiveCategory = categoryStats.reduce((min, cat) =>
      cat.spent < min.spent ? cat : min, categoryStats[0]);

    return {
      categories: categoryStats.sort((a, b) => b.spent - a.spent),
      totalCategories: categoryStats.length,
      averageSpentPerCategory,
      mostExpensiveCategory,
      leastExpensiveCategory
    };
  }
} 