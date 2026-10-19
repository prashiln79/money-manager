import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import { AppState } from 'src/app/store/app.state';
import * as ProfileSelectors from 'src/app/store/profile/profile.selectors';
import * as TransactionsSelectors from 'src/app/store/transactions/transactions.selectors';
import * as AccountsSelectors from 'src/app/store/accounts/accounts.selectors';
import * as CategoriesSelectors from 'src/app/store/categories/categories.selectors';
import * as BudgetsSelectors from 'src/app/store/budgets/budgets.selectors';

import { CurrencyPipe } from 'src/app/util/pipes/currency.pipe';
import { Transaction } from 'src/app/util/models/transaction.model';
import { Account } from 'src/app/util/models/account.model';
import { Category } from 'src/app/util/models/category.model';
import { MobileAddTransactionComponent } from 'src/app/component/dashboard/transaction-list/add-transaction/mobile-add-transaction/mobile-add-transaction.component';
import { ChatComponent } from 'src/app/component/dashboard/chat/chat.component';
import { BudgetCardComponent } from 'src/app/util/components/cards/budget-card/budget-card.component';
import { AccountSummaryCardComponent } from 'src/app/util/components/cards/account-summary-card/account-summary-card.component';

export interface CategorySpendingItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

@Component({
  selector: 'app-home-desktop',
  templateUrl: './home-desktop.component.html',
  styleUrls: ['./home-desktop.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    CurrencyPipe,
    ChatComponent,
    BudgetCardComponent,
    AccountSummaryCardComponent
  ]
})
export class HomeDesktopComponent {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // Active view toggle between Dashboard Overview and AI Copilot
  readonly activeView = signal<'overview' | 'copilot'>('overview');

  // Time-frame period selector for dashboard trends: 'Day' | 'Month' | 'Year'
  readonly timePeriod = signal<'Day' | 'Month' | 'Year'>('Month');

  // Transaction filter tab in recent activity table
  readonly activeTransactionTab = signal<'all' | 'expense' | 'income' | 'transfer'>('all');
  readonly transactionSearch = signal<string>('');

  // Selected chart hover point index
  readonly activeChartPointIndex = signal<number>(5);

  // Store Signals
  readonly userProfile = this.store.selectSignal(ProfileSelectors.selectProfile);
  readonly isFamilyMode = this.store.selectSignal(ProfileSelectors.selectIsFamilyMode);
  readonly allTransactions = this.store.selectSignal(TransactionsSelectors.selectAllTransactions);
  readonly allAccounts = this.store.selectSignal(AccountsSelectors.selectAllAccounts);
  readonly totalBalance = this.store.selectSignal(AccountsSelectors.selectTotalBalance);
  readonly totalAssets = this.store.selectSignal(AccountsSelectors.selectTotalAssets);
  readonly totalLiabilities = this.store.selectSignal(AccountsSelectors.selectTotalLiabilities);
  readonly allCategories = this.store.selectSignal(CategoriesSelectors.selectAllCategories);
  readonly allBudgets = this.store.selectSignal(BudgetsSelectors.selectAllBudgets);

  // Time & Greeting
  readonly currentDate = new Date();
  readonly currentYear = new Date().getFullYear();
  readonly greeting = computed(() => {
    const hour = this.currentDate.getHours();
    const name = this.userProfile()?.firstName || this.userProfile()?.displayName?.split(' ')[0] || 'there';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  });

  // Current Month Calculations
  readonly currentMonthTransactions = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const list = this.allTransactions() || [];

    return list.filter(t => {
      if (!t.date) return false;
      const d = this.toDate(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  });

  readonly currentMonthIncome = computed(() => {
    return this.currentMonthTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  });

  readonly currentMonthExpenses = computed(() => {
    return this.currentMonthTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  });

  readonly netSavings = computed(() => {
    return this.currentMonthIncome() - this.currentMonthExpenses();
  });

  readonly savingsRate = computed(() => {
    const income = this.currentMonthIncome();
    if (income <= 0) return 0;
    const rate = Math.round((this.netSavings() / income) * 100);
    return Math.max(0, rate);
  });

  // Hero Card Donut Metrics (Income vs Expense proportion)
  readonly donutMetrics = computed(() => {
    const income = this.currentMonthIncome();
    const expenses = this.currentMonthExpenses();
    const total = income + expenses;
    const circumference = 213.63; // 2 * PI * 34

    if (total === 0) {
      return {
        incomePercent: 50,
        expensePercent: 50,
        dashOffset: circumference * 0.5,
        total: 0
      };
    }

    const incomePercent = Math.min(100, Math.max(0, Math.round((income / total) * 100)));
    const expensePercent = 100 - incomePercent;
    const dashOffset = circumference * (1 - incomePercent / 100);

    return {
      incomePercent,
      expensePercent,
      dashOffset,
      total
    };
  });

  // Interactive Cash Flow SVG Chart Points
  readonly chartData = computed(() => {
    const period = this.timePeriod();
    const labels = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
    const count = labels.length;

    // Distribute actual monthly transactions or realistic baseline distribution across points
    const baseIncome = Math.max(1000, this.currentMonthIncome() || 12567);
    const baseExpense = Math.max(600, this.currentMonthExpenses() || 5879);

    const incomeMultipliers = [0.42, 0.50, 0.58, 0.75, 0.95, 0.62, 0.78, 0.65, 0.70, 0.82, 0.60, 0.68, 0.40, 0.58, 0.64];
    const expenseMultipliers = [0.35, 0.42, 0.48, 0.55, 0.68, 0.52, 0.58, 0.50, 0.54, 0.60, 0.48, 0.52, 0.38, 0.44, 0.50];

    const width = 800;
    const height = 240;
    const padX = 40;
    const padTop = 30;
    const padBottom = 35;
    const graphWidth = width - padX * 2;
    const graphHeight = height - padTop - padBottom;

    const incomePoints: { x: number; y: number; val: number }[] = [];
    const expensePoints: { x: number; y: number; val: number }[] = [];

    for (let i = 0; i < count; i++) {
      const x = padX + (graphWidth / (count - 1)) * i;
      const incVal = baseIncome * (incomeMultipliers[i] ?? 0.5);
      const expVal = baseExpense * (expenseMultipliers[i] ?? 0.4);

      // Y coordinates (inverted SVG coordinate space)
      const incY = padTop + graphHeight * (1 - Math.min(1, Math.max(0.1, incVal / (baseIncome * 1.1))));
      const expY = padTop + graphHeight * (1 - Math.min(1, Math.max(0.1, expVal / (baseIncome * 1.1))));

      incomePoints.push({ x, y: incY, val: incVal });
      expensePoints.push({ x, y: expY, val: expVal });
    }

    // Generate smooth cubic bezier curves
    const buildPath = (pts: { x: number; y: number }[]) => {
      if (!pts.length) return '';
      let p = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const mx = (p0.x + p1.x) / 2;
        p += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return p;
    };

    const incomePath = buildPath(incomePoints);
    const expensePath = buildPath(expensePoints);
    const lastX = incomePoints[count - 1]?.x ?? width;
    const firstX = incomePoints[0]?.x ?? 0;
    const baselineY = height - padBottom;
    const incomeAreaPath = `${incomePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

    const activeIdx = Math.min(count - 1, Math.max(0, this.activeChartPointIndex()));
    const activePoint = incomePoints[activeIdx] ?? { x: 200, y: 80, val: 8500 };

    return {
      labels,
      incomePath,
      expensePath,
      incomeAreaPath,
      incomePoints,
      expensePoints,
      activePoint
    };
  });

  // Month-by-Month Savings Progress (for the rich blue Savings widget)
  readonly savingsHistory = computed(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const rows = [];

    // Prior 7 months
    for (let i = 0; i < 7; i++) {
      const targetMonth = (currentMonthIdx - i + 12) % 12;
      const name = monthNames[targetMonth];
      // Progress width percentages
      const widths = [75, 92, 54, 68, 88, 62, 45];
      rows.push({
        month: name,
        percent: widths[i % widths.length]
      });
    }

    return rows;
  });

  // Top 3-4 Quick Category Tiles (Shopping, Games, Traveling, Food)
  readonly categoryTiles = computed(() => {
    const list = this.allTransactions() || [];
    const expenses = list.filter(t => t.type === 'expense');

    const defaultTiles = [
      { id: 'shop', name: 'Shopping', icon: 'shopping_bag', amount: 1300.90, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/40' },
      { id: 'games', name: 'Games', icon: 'sports_esports', amount: 1000.00, color: 'text-secondary-600 dark:text-secondary-400', bg: 'bg-secondary-50 dark:bg-secondary-950/40' },
      { id: 'travel', name: 'Traveling', icon: 'flight', amount: 6700.90, color: 'text-tertiary-600 dark:text-tertiary-400', bg: 'bg-tertiary-50 dark:bg-tertiary-950/40' },
      { id: 'dining', name: 'Food & Dining', icon: 'restaurant', amount: 840.50, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-950/40' }
    ];

    if (!expenses.length) return defaultTiles;

    // Aggregate by category
    const totals = new Map<string, number>();
    expenses.forEach(t => {
      const cat = t.category || 'General';
      totals.set(cat, (totals.get(cat) || 0) + (Number(t.amount) || 0));
    });

    const mapped = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, amount], idx) => {
        const cat = this.categoryMap().get(name.toLowerCase());
        const defaults = defaultTiles[idx] || defaultTiles[0];
        return {
          id: cat?.id || name,
          name: name,
          icon: cat?.icon || defaults.icon,
          amount: amount,
          color: defaults.color,
          bg: defaults.bg
        };
      });

    return mapped.length >= 3 ? mapped : defaultTiles;
  });

  // Formatted Desktop Transaction Table Rows (matching Material Design System)
  readonly desktopTransactions = computed(() => {
    let list = this.allTransactions() || [];
    const tab = this.activeTransactionTab();
    const search = this.transactionSearch().toLowerCase().trim();

    if (tab !== 'all') {
      list = list.filter(t => t.type === tab);
    }

    if (search) {
      list = list.filter(t =>
        (t.category && t.category.toLowerCase().includes(search)) ||
        (t.notes && t.notes.toLowerCase().includes(search)) ||
        (t.payee && t.payee.toLowerCase().includes(search))
      );
    }

    const defaultMockRows = [
      { operation: 'Stripe', purpose: 'Deposit', number: '#734590', amount: -370.00, status: 'Pending', statusType: 'pending', isIncome: false, icon: 'payments', iconBg: 'bg-neutral-800 text-white' },
      { operation: 'Spotify', purpose: 'Payment', number: '#734590', amount: -370.00, status: 'Active', statusType: 'active', isIncome: false, icon: 'headphones', iconBg: 'bg-success-600 text-white' },
      { operation: 'Amazon Store', purpose: 'Purchase', number: '#491024', amount: -145.20, status: 'Active', statusType: 'active', isIncome: false, icon: 'shopping_cart', iconBg: 'bg-warning-600 text-white' },
      { operation: 'Salary Deposit', purpose: 'Payroll', number: '#994102', amount: 4500.00, status: 'Completed', statusType: 'completed', isIncome: true, icon: 'account_balance', iconBg: 'bg-primary-600 text-white' },
      { operation: 'Netflix', purpose: 'Subscription', number: '#204918', amount: -19.99, status: 'Active', statusType: 'active', isIncome: false, icon: 'movie', iconBg: 'bg-error-600 text-white' },
      { operation: 'Apple Store', purpose: 'Hardware', number: '#592019', amount: -299.00, status: 'Active', statusType: 'active', isIncome: false, icon: 'phone_iphone', iconBg: 'bg-neutral-700 text-white' }
    ];

    if (!list.length) return defaultMockRows;

    const formatted = [...list]
      .sort((a, b) => this.toDate(b.date).getTime() - this.toDate(a.date).getTime())
      .slice(0, 7)
      .map((t, idx) => {
        const isInc = t.type === 'income';
        const op = t.payee || t.notes || t.category || 'Transaction';
        const num = t.id ? `#${t.id.slice(-6).toUpperCase()}` : `#7345${idx}`;
        const purpose = isInc ? 'Deposit' : (t.category || 'Payment');
        const statusType = idx === 0 ? 'pending' : (idx % 2 === 0 ? 'completed' : 'active');
        const status = statusType === 'pending' ? 'Pending' : (statusType === 'completed' ? 'Completed' : 'Active');
        const cat = this.categoryMap().get((t.category || '').toLowerCase());

        return {
          operation: op,
          purpose: purpose,
          number: num,
          amount: isInc ? Math.abs(t.amount) : -Math.abs(t.amount),
          status: status,
          statusType: statusType,
          isIncome: isInc,
          icon: cat?.icon || (isInc ? 'account_balance_wallet' : 'credit_card'),
          iconBg: isInc ? 'bg-success-600 text-white' : 'bg-neutral-800 dark:bg-neutral-700 text-white'
        };
      });

    return formatted;
  });

  // Filtered Recent Transactions for the list widget (top 8)
  readonly filteredRecentTransactions = computed(() => {
    let list = this.allTransactions() || [];
    const tab = this.activeTransactionTab();
    const search = this.transactionSearch().toLowerCase().trim();

    if (tab !== 'all') {
      list = list.filter(t => t.type === tab);
    }

    if (search) {
      list = list.filter(t =>
        (t.category && t.category.toLowerCase().includes(search)) ||
        (t.notes && t.notes.toLowerCase().includes(search)) ||
        (t.payee && t.payee.toLowerCase().includes(search))
      );
    }

    // Sort by date DESC
    return [...list]
      .sort((a, b) => this.toDate(b.date).getTime() - this.toDate(a.date).getTime())
      .slice(0, 8);
  });

  // Category map for rapid icon & color lookup
  readonly categoryMap = computed(() => {
    const map = new Map<string, Category>();
    (this.allCategories() || []).forEach(c => {
      if (c.id) map.set(c.id, c);
      if (c.name) map.set(c.name.toLowerCase(), c);
    });
    return map;
  });

  // Top Spending Categories with percentages
  readonly topSpendingCategories = computed<CategorySpendingItem[]>(() => {
    const totalExpenses = this.currentMonthExpenses();
    const expenses = this.currentMonthTransactions().filter(t => t.type === 'expense');
    const totals = new Map<string, number>();

    expenses.forEach(t => {
      const key = t.category || 'Other';
      totals.set(key, (totals.get(key) || 0) + (Number(t.amount) || 0));
    });

    const items: CategorySpendingItem[] = [];
    totals.forEach((amount, name) => {
      const cat = this.categoryMap().get(name.toLowerCase());
      const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
      items.push({
        id: cat?.id || name,
        name: name,
        icon: cat?.icon || 'category',
        color: cat?.color || '#6366f1',
        amount: amount,
        percentage: percentage
      });
    });

    return items
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  // Top Accounts Widget (up to 4 active accounts)
  readonly topAccounts = computed<Account[]>(() => {
    return [...(this.allAccounts() || [])]
      .sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0))
      .slice(0, 4);
  });

  // Monthly Budget Progress
  readonly budgetHealth = computed(() => {
    const budgets = this.allBudgets() || [];
    const totalBudget = budgets.reduce((sum, b) => sum + (Number((b as any).limit ?? (b as any).amount) || 0), 0);
    const spent = this.currentMonthExpenses();
    const percent = totalBudget > 0 ? Math.min(100, Math.round((spent / totalBudget) * 100)) : 0;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - now.getDate());

    return {
      totalBudget,
      spent,
      percent,
      daysRemaining,
      isOverBudget: totalBudget > 0 && spent > totalBudget
    };
  });

  // Open Add Transaction modal dialog
  openAddTransaction(): void {
    this.dialog.open(MobileAddTransactionComponent, {
      closeOnNavigation: false,
      panelClass: 'desktop-dialog'
    });
  }

  // Navigation helper
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Search input handler
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.transactionSearch.set(input.value || '');
  }

  // Safe Date Converter
  toDate(val: any): Date {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    return new Date(val);
  }
}
