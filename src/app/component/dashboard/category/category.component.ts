import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from 'src/app/util/service/notification.service';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { MobileCategoryAddEditPopupComponent } from './mobile-category-add-edit-popup/mobile-category-add-edit-popup.component';

import { Category, Budget } from 'src/app/util/models';
import { CategoryBudgetService } from 'src/app/util/service/category-budget.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import * as CategoriesActions from '../../../store/categories/categories.actions';
import * as CategoriesSelectors from '../../../store/categories/categories.selectors';
import * as TransactionsActions from '../../../store/transactions/transactions.actions';
import * as TransactionsSelectors from '../../../store/transactions/transactions.selectors';
import { TransactionType } from 'src/app/util/config/enums';
import { Transaction } from 'src/app/util/models/transaction.model';
import { DateService } from 'src/app/util/service/date.service';
import moment from 'moment';
import { BreakpointService } from 'src/app/util/service/breakpoint.service';
import { CategoryService } from 'src/app/util/service/category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'user-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {

  @Input() isHome: boolean = false;

  public isLoading$: Observable<boolean>;
  // public error$: Observable<any>;
  public transactions$: Observable<Transaction[]>;
  public Math = Math; // Make Math available in template

  public categories!: Category[];
  public transactions: Transaction[] = [];
  public isLoading: boolean = false;
  public errorMessage: string = '';

  public isBudgetSummaryExpanded: boolean = false;
  public isListViewMode: boolean = false; // Add this property for list view toggle


  public userId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private auth: Auth,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private hapticFeedback: HapticFeedbackService,
    private breakpointObserver: BreakpointObserver,
    private store: Store<AppState>,
    private budgetService: CategoryBudgetService,
    public dateService: DateService,
    public breakpointService: BreakpointService,
    private categoryService: CategoryService,
  ) {

    this.isLoading$ = this.store.select(CategoriesSelectors.selectCategoriesLoading);
    // this.error$ = this.store.select(CategoriesSelectors.selectCategoriesError);
    this.transactions$ = this.store.select(TransactionsSelectors.selectAllTransactions);

  }

  ngOnInit(): void {
    this.initializeComponent();
    this.subscribeToStoreData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeComponent(): Promise<void> {
    const currentUser = await this.auth.currentUser;
    if (!currentUser) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.userId = currentUser.uid;
    this.loadUserCategories();
    this.loadUserTransactions();
  }

  private loadUserCategories(): void {
    this.store.dispatch(CategoriesActions.loadCategories({ userId: this.userId }));
  }

  private loadUserTransactions(): void {
    this.store.dispatch(TransactionsActions.loadTransactions({ userId: this.userId }));
  }

  private subscribeToStoreData(): void {
    this.store.select(CategoriesSelectors.selectAllCategories).subscribe(categories => {
      this.categories = categories.sort((a, b) => {
        // 1. Prioritize categories with budget
        const aHasBudget = a.budget?.hasBudget ?? false;
        const bHasBudget = b.budget?.hasBudget ?? false;
        if (aHasBudget !== bHasBudget) return aHasBudget ? -1 : 1;

        if (this.breakpointService.device.isDesktop) {
          const aHasSub = (a.subCategories?.length ?? 0) > 0;
          const bHasSub = (b.subCategories?.length ?? 0) > 0;
          if (aHasSub !== bHasSub) return aHasSub ? 1 : -1;
        } else {
          // 2. Prioritize categories with subcategories
          const aHasSub = (a.subCategories?.length ?? 0) > 0;
          const bHasSub = (b.subCategories?.length ?? 0) > 0;
          if (aHasSub !== bHasSub) return aHasSub ? -1 : 1;

        }


        // 3. Alphabetical order by name
        return a.name.localeCompare(b.name);
      });
    });

    this.transactions$.pipe(takeUntil(this.destroy$)).subscribe(transactions => {
      this.transactions = transactions;
    });

    this.isLoading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.isLoading = loading;
    });

    // this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
    //   if (error) {
    //     this.errorMessage = 'Failed to load categories';
    //     console.error('Error loading categories:', error);
    //     this.notificationService.error('Failed to load categories');
    //   }
    // });
  }







  public trackByCategoryId(index: number, category: Category): string | number {
    return category.id || index;
  }

  public clearError(): void {
    this.errorMessage = '';
  }



  public openMobileDialog(category?: Category): void {

    const dialogRef = this.dialog.open(MobileCategoryAddEditPopupComponent, {
      panelClass: this.breakpointService.device.isMobile ? 'mobile-dialog' : 'desktop-dialog',
      data: {
        category: category ? {...category} : null,
        isEdit: category ? true : false,
        allCategories: this.categories
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadUserCategories();
      }
    });
  }

  public openAddMobileDialog(): void {
    if (this.breakpointService.device.isMobile) {
      this.hapticFeedback.lightVibration();
    }
    this.openMobileDialog();
  }



  public getSubCategoriesForCategory(categoryId: string): Category[] {
    return this.categories.filter(cat =>
      cat.isSubCategory && cat.parentCategoryId === categoryId
    );
  }







  public getBudgetProgressColor(category: Category, budgetProgressPercentage?: number, budgetAlertThreshold?: number): string {
    const progress = budgetProgressPercentage ?? this.calculateBudgetProgressPercentage(category);
    const threshold = budgetAlertThreshold ?? (category.budget?.budgetAlertThreshold || 80);
    return this.budgetService.getBudgetProgressColor(category, progress, threshold);
  }

  public formatBudgetPeriod(period: string | undefined): string {
    return this.budgetService.formatBudgetPeriod(period);
  }





  /**
   * Toggle budget summary expansion to show/hide details
   */
  public toggleBudgetSummaryExpansion(): void {
    this.isBudgetSummaryExpanded = !this.isBudgetSummaryExpanded;
  }

  public toggleListViewMode(): void {
    this.isListViewMode = !this.isListViewMode;
  }

  /**
   * Get recent transactions for a category
   */
  public getRecentTransactions(category: Category): Transaction[] {
    if (!category || !category.name) return [];

    return this.transactions
      .filter(transaction =>
        transaction.categoryId === category.id &&
        moment(this.dateService.toDate(transaction.date)).isSame(moment(), 'month')
      )
  }

  /**
   * Get category statistics
   */
  public getCategoryStats(category: Category): any {
    if (!category || !category.name) {
      return {
        totalTransactions: 0,
        totalSpent: 0,
        averageTransaction: 0,
        largestTransaction: 0,
        thisMonth: 0,
        lastMonth: 0
      };
    }

    const categoryTransactions = this.transactions.filter(t => t.categoryId === category.id);

    if (categoryTransactions.length === 0) {
      return {
        totalTransactions: 0,
        totalSpent: 0,
        averageTransaction: 0,
        largestTransaction: 0,
        thisMonth: 0,
        lastMonth: 0
      };
    }

    // Calculate basic stats
    const totalTransactions = categoryTransactions.length;
    const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const averageTransaction = totalSpent / totalTransactions;
    const largestTransaction = Math.max(...categoryTransactions.map(t => Math.abs(t.amount)));

    // Calculate monthly stats
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthTransactions = categoryTransactions.filter(t => {
      const txDate = this.dateService.toDate(t.date) || new Date();
      return txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear;
    });

    const lastMonthTransactions = categoryTransactions.filter(t => {
      const txDate = this.dateService.toDate(t.date) || new Date();
      return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastYear;
    });

    const thisMonthTotal = thisMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalTransactions,
      totalSpent,
      averageTransaction,
      largestTransaction,
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal
    };
  }

  /**
   * Get budget status class for styling
   */
  public getBudgetStatusClass(category: Category, budgetProgressPercentage?: number): string {
    if (!category.budget?.hasBudget) return '';

    const percentage = budgetProgressPercentage ?? this.calculateBudgetProgressPercentage(category);
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'safe';
  }

  /**
   * Get remaining budget class for styling
   */
  public getRemainingBudgetClass(category: Category, budgetSpent?: number): string {
    if (!category.budget?.hasBudget) return '';

    const spent = budgetSpent ?? this.calculateBudgetSpent(category);
    const remaining = (category.budget?.budgetAmount || 0) - spent;
    if (remaining <= 0) return 'danger';
    if (remaining < (category.budget?.budgetAmount || 0) * 0.1) return 'warning';
    return 'safe';
  }

  public calculateTotalSpentPerMonth(category: Category): number {
    const categoryTransactions = this.transactions.filter(t => t.categoryId === category.id);
    const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return totalSpent;
  }

  public calculateTotalIncomePerMonth(category: Category): number {
    const categoryTransactions = this.transactions.filter(t => t.categoryId === category.id);
    const totalIncome = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    return totalIncome;
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

  public deleteCategory(category: Category): void {
    this.categoryService.performDelete(category, this.userId);
  }
}
