import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription, Observable } from 'rxjs';
import { Transaction } from '../../../util/models/transaction.model';
import { Account } from '../../../util/models/account.model';
import { NotificationService } from '../../../util/service/notification.service';
import { Category } from 'src/app/util/models';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import * as TransactionsSelectors from '../../../store/transactions/transactions.selectors';
import * as AccountsSelectors from '../../../store/accounts/accounts.selectors';
import * as CategoriesSelectors from '../../../store/categories/categories.selectors';
import { DateService } from 'src/app/util/service/date.service';
import { APP_CONFIG } from 'src/app/util/config/config';
import { EChartsOption } from 'echarts';

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
  // Observables from store
  transactions$: Observable<Transaction[]>;
  accounts$: Observable<Account[]>;
  categories$: Observable<Category[]>;
  transactionsLoading$: Observable<boolean>;
  accountsLoading$: Observable<boolean>;
  categoriesLoading$: Observable<boolean>;
  
  // Financial metrics
  totalIncome: number = 0;
  totalExpenses: number = 0;
  netSavings: number = 0;
  monthlyChange: number = 0;
  monthlyChangePercentage: number = 0;

  // Data arrays
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  categories: Category[] = [];
  topCategories: CategorySpending[] = [];
  recentTransactions: Transaction[] = [];
  monthlyTrends: MonthlyData[] = [];

  // Time period
  selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';

  // Loading states
  isLoading: boolean = true;
  hasData: boolean = false;

  // Chart options
  pieChartOption: EChartsOption = {};
  barChartOption: EChartsOption = {};
  
  // Theme detection
  isDarkMode: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private auth: Auth,
    private notificationService: NotificationService,
    private store: Store<AppState>,
    public dateService: DateService
  ) {
    // Initialize selectors
    this.transactions$ = this.store.select(TransactionsSelectors.selectAllTransactions);
    this.accounts$ = this.store.select(AccountsSelectors.selectAllAccounts);
    this.categories$ = this.store.select(CategoriesSelectors.selectAllCategories);
    this.transactionsLoading$ = this.store.select(TransactionsSelectors.selectTransactionsLoading);
    this.accountsLoading$ = this.store.select(AccountsSelectors.selectAccountsLoading);
    this.categoriesLoading$ = this.store.select(CategoriesSelectors.selectCategoriesLoading);
  }

  ngOnInit(): void {
    this.detectTheme();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadData(): void {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.isLoading = false;
      this.notificationService.error('User not authenticated');
      return;
    }

    // Subscribe to store data
    const transactionsSub = this.transactions$.subscribe(transactions => {
      this.transactions = transactions;
      this.calculateFinancialMetrics();
      this.calculateTopCategories();
      this.getRecentTransactions();
      this.calculateMonthlyTrends();
      this.updateCharts(); // Initialize charts with new data
      this.isLoading = false;
      this.hasData = this.transactions.length > 0;
    });

    const accountsSub = this.accounts$.subscribe(accounts => {
      this.accounts = accounts;
    });

    const categoriesSub = this.categories$.subscribe(categories => {
      this.categories = categories;
    });

    this.subscriptions.push(transactionsSub, accountsSub, categoriesSub);
  }

  private calculateFinancialMetrics(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter transactions for current month
    const currentMonthTransactions = this.transactions.filter(t => {
      const transactionDate = this.dateService.toDate(t.date);
      return transactionDate?.getMonth() === currentMonth && 
             transactionDate?.getFullYear() === currentYear;
    });

    // Filter transactions for last month
    const lastMonthTransactions = this.transactions.filter(t => {
      const transactionDate = this.dateService.toDate(t.date);
      return transactionDate?.getMonth() === lastMonth && 
             transactionDate?.getFullYear() === lastYear;
    });

    // Calculate current month metrics
    this.totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    this.netSavings = this.totalIncome - this.totalExpenses;

    // Calculate last month metrics for comparison
    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthSavings = lastMonthIncome - lastMonthExpenses;

    // Calculate monthly change
    this.monthlyChange = this.netSavings - lastMonthSavings;
    this.monthlyChangePercentage = lastMonthSavings !== 0 
      ? ((this.monthlyChange / lastMonthSavings) * 100) 
      : 0;
  }

  private calculateTopCategories(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter current month expense transactions
    const currentMonthExpenses = this.transactions.filter(t => {
      const transactionDate = this.dateService.toDate(t.date);
      return t.type === 'expense' &&
             transactionDate?.getMonth() === currentMonth && 
             transactionDate?.getFullYear() === currentYear;
    });

    // Group by category and calculate totals
    const categoryTotals = new Map<string, number>();
    
    currentMonthExpenses.forEach(transaction => {
      const current = categoryTotals.get(transaction.category) || 0;
      categoryTotals.set(transaction.category, current + transaction.amount);
    });

    // Convert to array and sort by amount
    const totalExpenses = this.totalExpenses;
    this.topCategories = Array.from(categoryTotals.entries())
      .map(([category, amount]) => {
        const categoryData = this.categories.find(c => c.name === category);
        return {
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          icon: categoryData?.icon || 'category',
          color: categoryData?.color || '#46777f'
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  }

  private getRecentTransactions(): void {
    this.recentTransactions = this.transactions
      .sort((a, b) => (this.dateService.toDate(b.date)?.getTime() ?? 0) - (this.dateService.toDate(a.date)?.getTime() ?? 0))
      .slice(0, 5); // Last 5 transactions
  }

  private calculateMonthlyTrends(): void {
    const now = new Date();
    const months: MonthlyData[] = [];

    // Calculate data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString(APP_CONFIG.LANGUAGE.DEFAULT, { month: 'short' });
      
      const monthTransactions = this.transactions.filter(t => {
        const transactionDate = this.dateService.toDate(t.date);
        return transactionDate?.getMonth() === month.getMonth() && 
               transactionDate?.getFullYear() === month.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: monthName,
        income,
        expenses,
        savings: income - expenses
      });
    }

    this.monthlyTrends = months;
  }

  onPeriodChange(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): void {
    this.selectedPeriod = period;
    this.notificationService.info(`Report period changed to ${period}`);
    // TODO: Implement period-specific calculations
    console.log('Period changed to:', period);
    // Update charts with new period data
    this.updateCharts();
  }

  exportReport(): void {
    try {
      // TODO: Implement export functionality
      console.log('Export report clicked');
      this.notificationService.info('Export feature coming soon');
    } catch (error) {
      console.error('Error exporting report:', error);
      this.notificationService.error('Failed to export report');
    }
  }

  generateReport(): void {
    try {
      // TODO: Implement report generation
      console.log('Generate report clicked');
      this.notificationService.info('Report generation feature coming soon');
    } catch (error) {
      console.error('Error generating report:', error);
      this.notificationService.error('Failed to generate report');
    }
  }

  addTransaction(): void {
    this.router.navigate(['/dashboard/transaction-list/add-transaction']);
  }

  // Helper methods for template
  getMonthlyChangeDisplay(): string {
    const sign = this.monthlyChange >= 0 ? '+' : '';
    return `${sign}${this.monthlyChangePercentage.toFixed(1)}%`;
  }

  getMonthlyChangeColor(): string {
    return this.monthlyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }

  getMonthlyChangeIcon(): string {
    return this.monthlyChange >= 0 ? 'trending_up' : 'trending_down';
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  getTransactionIcon(transaction: Transaction): string {
    return transaction.type === 'income' ? 'trending_up' : 'trending_down';
  }

  getTransactionColor(transaction: Transaction): string {
    return transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  }

  // Chart initialization methods
  private initializePieChart(): void {
    if (this.topCategories.length === 0) {
      this.pieChartOption = {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: this.isDarkMode ? '#9CA3AF' : '#666',
            fontSize: 16
          }
        }
      };
      return;
    }

    const data = this.topCategories.map(category => ({
      name: category.category,
      value: category.amount,
      itemStyle: { color: category.color }
    }));

    this.pieChartOption = {
      title: {
        text: 'Spending by Category',
        left: 'center',
        textStyle: {
          color: this.isDarkMode ? '#F9FAFB' : '#333',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: this.isDarkMode ? '#374151' : '#FFFFFF',
        borderColor: this.isDarkMode ? '#4B5563' : '#E5E7EB',
        textStyle: {
          color: this.isDarkMode ? '#F9FAFB' : '#374151'
        },
        formatter: (params: any) => {
          const percentage = ((params.value / this.totalExpenses) * 100).toFixed(1);
          return `${params.name}<br/>${this.formatCurrency(params.value)} (${percentage}%)`;
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          color: this.isDarkMode ? '#F9FAFB' : '#333'
        }
      },
      series: [
        {
          name: 'Spending',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              color: this.isDarkMode ? '#F9FAFB' : '#333'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  }

  private initializeBarChart(): void {
    if (this.monthlyTrends.length === 0) {
      this.barChartOption = {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: this.isDarkMode ? '#9CA3AF' : '#666',
            fontSize: 16
          }
        }
      };
      return;
    }

    const months = this.monthlyTrends.map(item => item.month);
    const incomeData = this.monthlyTrends.map(item => item.income);
    const expenseData = this.monthlyTrends.map(item => item.expenses);
    const savingsData = this.monthlyTrends.map(item => item.savings);

    this.barChartOption = {
      title: {
        text: 'Monthly Financial Trends',
        left: 'center',
        textStyle: {
          color: this.isDarkMode ? '#F9FAFB' : '#333',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: this.isDarkMode ? '#374151' : '#FFFFFF',
        borderColor: this.isDarkMode ? '#4B5563' : '#E5E7EB',
        textStyle: {
          color: this.isDarkMode ? '#F9FAFB' : '#374151'
        },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            result += `${param.marker} ${param.seriesName}: ${this.formatCurrency(param.value)}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Income', 'Expenses', 'Savings'],
        top: 'bottom',
        textStyle: {
          color: this.isDarkMode ? '#F9FAFB' : '#333'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          color: this.isDarkMode ? '#F9FAFB' : '#333'
        },
        axisLine: {
          lineStyle: {
            color: this.isDarkMode ? '#4B5563' : '#E5E7EB'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: this.isDarkMode ? '#F9FAFB' : '#333',
          formatter: (value: number) => this.formatCurrency(value)
        },
        axisLine: {
          lineStyle: {
            color: this.isDarkMode ? '#4B5563' : '#E5E7EB'
          }
        },
        splitLine: {
          lineStyle: {
            color: this.isDarkMode ? '#4B5563' : '#E5E7EB'
          }
        }
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: incomeData,
          itemStyle: {
            color: '#10B981'
          },
          emphasis: {
            itemStyle: {
              color: '#059669'
            }
          }
        },
        {
          name: 'Expenses',
          type: 'bar',
          data: expenseData,
          itemStyle: {
            color: '#EF4444'
          },
          emphasis: {
            itemStyle: {
              color: '#DC2626'
            }
          }
        },
        {
          name: 'Savings',
          type: 'bar',
          data: savingsData,
          itemStyle: {
            color: '#3B82F6'
          },
          emphasis: {
            itemStyle: {
              color: '#2563EB'
            }
          }
        }
      ]
    };
  }

  // Update charts when data changes
  private updateCharts(): void {
    this.initializePieChart();
    this.initializeBarChart();
  }

  // Detect current theme
  private detectTheme(): void {
    this.isDarkMode = document.documentElement.classList.contains('dark');
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      this.isDarkMode = document.documentElement.classList.contains('dark');
      this.updateCharts(); // Re-initialize charts with new theme
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for window resize to handle chart resizing
    window.addEventListener('resize', () => {
      setTimeout(() => this.updateCharts(), 100);
    });
  }
} 