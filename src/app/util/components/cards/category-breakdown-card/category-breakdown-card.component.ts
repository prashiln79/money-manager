import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { AppState } from '../../../../store/app.state';
import * as TransactionsSelectors from '../../../../store/transactions/transactions.selectors';
import * as CategoriesSelectors from '../../../../store/categories/categories.selectors';
import { Transaction } from '../../../../util/models/transaction.model';
import { Category } from '../../../../util/models/category.model';
import { TransactionType } from '../../../../util/config/enums';

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
  count: number;
  averageAmount: number;
}

export interface CategoryBreakdownConfig {
  title?: string;
  subtitle?: string;
  currency?: string;
  showHeaderIcon?: boolean;
  headerIcon?: string;
  headerIconColor?: string;
  showFooter?: boolean;
  footerText?: string;
  cardHeight?: 'small' | 'medium' | 'large' | 'auto';
  theme?: 'light' | 'dark' | 'auto';
  animations?: boolean;
  clickable?: boolean;
  loading?: boolean;
  error?: string;
  emptyStateMessage?: string;
  showDebugInfo?: boolean;
  maxItems?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  transactionType?: 'all' | 'income' | 'expense';
  showProgressBar?: boolean;
  showPercentage?: boolean;
  showCount?: boolean;
  showAverage?: boolean;
  layout?: 'list' | 'grid' | 'compact';
  onCategoryClick?: (category: CategoryBreakdown) => void;
  onRefresh?: () => void;
}

@Component({
  selector: 'app-category-breakdown-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './category-breakdown-card.component.html',
  styleUrl: './category-breakdown-card.component.scss'
})
export class CategoryBreakdownCardComponent implements OnInit, OnDestroy {
  @Input() config: CategoryBreakdownConfig = {
    title: 'Category Breakdown',
    subtitle: 'Spending by category',
    currency: 'INR',
    showHeaderIcon: true,
    headerIcon: 'category',
    headerIconColor: 'blue',
    showFooter: false,
    footerText: 'Last updated',
    cardHeight: 'medium',
    theme: 'auto',
    animations: true,
    clickable: true,
    loading: false,
    error: '',
    emptyStateMessage: 'Add transactions to see category breakdown',
    showDebugInfo: false,
    maxItems: 8,
    period: 'monthly',
    transactionType: 'expense',
    showProgressBar: true,
    showPercentage: true,
    showCount: false,
    showAverage: false,
    layout: 'list'
  };

  // Store observables
  transactions$: Observable<Transaction[]>;
  categories$: Observable<Category[]>;
  transactionsLoading$: Observable<boolean>;
  categoriesLoading$: Observable<boolean>;

  // Computed data
  categoryBreakdown$: Observable<CategoryBreakdown[]>;
  isLoading$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>) {
    // Initialize store selectors
    this.transactions$ = this.store.select(TransactionsSelectors.selectAllTransactions);
    this.categories$ = this.store.select(CategoriesSelectors.selectAllCategories);
    this.transactionsLoading$ = this.store.select(TransactionsSelectors.selectTransactionsLoading);
    this.categoriesLoading$ = this.store.select(CategoriesSelectors.selectCategoriesLoading);

    // Combine loading states
    this.isLoading$ = combineLatest([
      this.transactionsLoading$,
      this.categoriesLoading$
    ]).pipe(
      map(([transactionsLoading, categoriesLoading]) => 
        transactionsLoading || categoriesLoading
      )
    );

    // Calculate category breakdown
    this.categoryBreakdown$ = this.calculateCategoryBreakdown();
  }

  ngOnInit(): void {
    // Component initialization if needed
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateCategoryBreakdown(): Observable<CategoryBreakdown[]> {
    return combineLatest([this.transactions$, this.categories$]).pipe(
      map(([transactions, categories]) => {
        const currentDate = new Date();
        let startDate: Date;

        // Filter transactions based on period
        switch (this.effectiveConfig.period) {
          case 'daily':
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            break;
          case 'weekly':
            const dayOfWeek = currentDate.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - daysToSubtract);
            break;
          case 'yearly':
            startDate = new Date(currentDate.getFullYear(), 0, 1);
            break;
          default: // monthly
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            break;
        }

        // Filter transactions by date and type
        const filteredTransactions = transactions.filter(t => {
          const txDate = this.convertToDate(t.date);
          const matchesDate = txDate >= startDate && txDate <= currentDate;
          const matchesType = this.effectiveConfig.transactionType === 'all' || 
                             t.type === (this.effectiveConfig.transactionType === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE);
          return matchesDate && matchesType;
        });

        // Calculate category totals
        const categoryMap = new Map<string, { amount: number; count: number; category: Category }>();

        filteredTransactions.forEach(t => {
          const category = categories.find(c => c.id === t.categoryId);
          if (category) {
            const existing = categoryMap.get(t.categoryId) || { amount: 0, count: 0, category };
            existing.amount += t.amount;
            existing.count += 1;
            categoryMap.set(t.categoryId, existing);
          }
        });

        // Calculate total for percentage
        const totalAmount = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.amount, 0);

        // Convert to category breakdown
        const breakdown: CategoryBreakdown[] = Array.from(categoryMap.values())
          .filter(item => item.amount > 0)
          .map(item => ({
            category: item.category.name,
            amount: item.amount,
            percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
            icon: item.category.icon || 'category',
            color: item.category.color || '#6B7280',
            count: item.count,
            averageAmount: item.count > 0 ? item.amount / item.count : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, this.effectiveConfig.maxItems || 8);

        return breakdown;
      })
    );
  }

  private convertToDate(date: Date | any): Date {
    if (date instanceof Date) return date;
    if (date?.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
  }

  get effectiveConfig(): CategoryBreakdownConfig {
    return {
      title: this.config.title ?? 'Category Breakdown',
      subtitle: this.config.subtitle ?? 'Spending by category',
      currency: this.config.currency ?? 'INR',
      showHeaderIcon: this.config.showHeaderIcon ?? true,
      headerIcon: this.config.headerIcon ?? 'category',
      headerIconColor: this.config.headerIconColor ?? 'blue',
      showFooter: this.config.showFooter ?? false,
      footerText: this.config.footerText ?? 'Last updated',
      cardHeight: this.config.cardHeight ?? 'medium',
      theme: this.config.theme ?? 'auto',
      animations: this.config.animations ?? true,
      clickable: this.config.clickable ?? true,
      loading: this.config.loading ?? false,
      error: this.config.error ?? '',
      emptyStateMessage: this.config.emptyStateMessage ?? 'Add transactions to see category breakdown',
      showDebugInfo: this.config.showDebugInfo ?? false,
      maxItems: this.config.maxItems ?? 8,
      period: this.config.period ?? 'monthly',
      transactionType: this.config.transactionType ?? 'expense',
      showProgressBar: this.config.showProgressBar ?? true,
      showPercentage: this.config.showPercentage ?? true,
      showCount: this.config.showCount ?? false,
      showAverage: this.config.showAverage ?? false,
      layout: this.config.layout ?? 'list',
      onCategoryClick: this.config.onCategoryClick,
      onRefresh: this.config.onRefresh
    };
  }

  get cardHeightClass(): string {
    switch (this.effectiveConfig.cardHeight) {
      case 'small': return 'min-h-20';
      case 'large': return 'min-h-32';
      case 'auto': return 'min-h-0';
      default: return 'min-h-24';
    }
  }

  get headerIconColorClass(): string {
    const color = this.effectiveConfig.headerIconColor || 'blue';
    return `bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.effectiveConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  getProgressBarColor(percentage: number): string {
    if (percentage > 50) return 'bg-red-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-blue-500';
  }

  onCategoryClick(category: CategoryBreakdown): void {
    if (this.effectiveConfig.clickable && this.effectiveConfig.onCategoryClick) {
      this.effectiveConfig.onCategoryClick(category);
    }
  }

  getLastUpdatedTime(): string {
    return new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onRefreshClick(): void {
    if (this.effectiveConfig.onRefresh) {
      this.effectiveConfig.onRefresh();
    }
  }

  get isEmpty(): Observable<boolean> {
    return this.categoryBreakdown$.pipe(
      map(breakdown => breakdown.length === 0)
    );
  }

  get hasError(): boolean {
    return !!(this.effectiveConfig.error && this.effectiveConfig.error.trim());
  }
} 