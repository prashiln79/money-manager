import { Component } from '@angular/core';
import { CategoryBreakdownConfig } from 'src/app/util/components/cards/category-breakdown-card/category-breakdown-card.component';
import { KeyMetricsConfig } from 'src/app/util/components/cards/key-metrics-summary-card/key-metrics-summary-card.component';
import { MonthlyTrendsConfig } from 'src/app/util/components/cards/monthly-trends-card/monthly-trends-card.component';
import { RecentActivityConfig } from 'src/app/util/components/cards/recent-activity-card/recent-activity-card.component';
import { TopCategoriesConfig } from 'src/app/util/components/cards/top-categories-card/top-categories-card.component';

import { QuickAction, QuickActionsFabConfig } from 'src/app/util/components/floating-action-buttons/quick-actions-fab/quick-actions-fab.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  topCategoriesConfig: TopCategoriesConfig = {
    title: 'Top Categories',
    subtitle: 'Top categories by spending',
    currency: 'INR',
    showHeaderIcon: true,
    headerIcon: 'category',
    headerIconColor: 'blue',
    showFooter: true,
    footerText: 'Last updated',
    cardHeight: 'small',
    theme: 'auto',
    animations: true,
    clickable: true,
  };
  recentActivityConfig: RecentActivityConfig = {
    title: 'Recent Activity',
    subtitle: 'Recent activity',
    currency: 'INR',
    showHeaderIcon: true,
  };
  monthlyTrendsConfig: MonthlyTrendsConfig = {
    title: 'Monthly Trends',
    subtitle: 'Monthly trends',
    currency: 'INR',
    showHeaderIcon: true,
  };
  categoryBreakdownConfig: CategoryBreakdownConfig = {
    title: 'Category Breakdown',
    subtitle: 'Spending by category',
    currency: 'INR',
    showHeaderIcon: true,
    headerIcon: 'category',
    headerIconColor: 'blue',
    maxItems: 5,
    chartType: 'bar',
  };
  categoryPieBreakdownConfig: CategoryBreakdownConfig = {
    title: 'Category Breakdown',
    subtitle: 'Spending by category',
    currency: 'INR',
    showHeaderIcon: true,
    headerIcon: 'category',
    headerIconColor: 'blue',
    maxItems: 5,
    chartType: 'pie',
  };
  quickActionsFabConfig: QuickActionsFabConfig = {
    title: 'Quick Actions',
    mainButtonIcon: 'add',
    mainButtonColor: 'primary',
    mainButtonTooltip: 'Quick Actions',
    showLabels: false,
    animations: true,
    autoHide: false,
    autoHideDelay: 3000,
    theme: 'auto',
    actions: [
      {
        id: 'add-transaction',
        label: 'Add Transaction',
        icon: 'receipt',
        color: 'accent',
        tooltip: 'Add Transaction'
      },
      {
        id: 'export-report',
        label: 'Export Report',
        icon: 'file_download',
        color: 'warn',
        tooltip: 'Export Report'
      },
      {
        id: 'refresh-data',
        label: 'Refresh Data',
        icon: 'refresh',
        color: 'primary',
        tooltip: 'Refresh Data',
        loading: false
      }
    ],
    onActionClick: (action: QuickAction) => {
      console.log('Quick action clicked:', action);
      switch (action.id) {
        case 'add-transaction':
          break;
        case 'export-report':
          break;
        case 'refresh-data':
          break;
      }
    },
    onMainButtonClick: () => {
      console.log('Main FAB clicked');
    }
  };

  keyMetricsConfig: KeyMetricsConfig = {
    title: '',
    subtitle: '',
    currency: 'INR',
    showHeaderIcon: false ,
    columns: 3,
    cardsPerRow: {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 5,
      xl: 6,
    },
    showPeriod: false,
  };



  constructor() { }
}
