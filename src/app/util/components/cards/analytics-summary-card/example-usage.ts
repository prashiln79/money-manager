import { AnalyticsSummaryConfig } from './analytics-summary-card.component';

/**
 * Example usage of the AnalyticsSummaryCardComponent
 * 
 * The component now automatically calculates analytics data from the app state
 * using NgRx selectors. You only need to provide configuration options.
 */

// Basic usage - minimal configuration
export const basicConfig: AnalyticsSummaryConfig = {
  title: 'Analytics Summary',
  subtitle: 'Key insights and trends',
  currency: 'INR'
};

// Advanced usage with custom configuration
export const advancedConfig: AnalyticsSummaryConfig = {
  title: 'Financial Analytics',
  subtitle: 'Monthly spending insights and account overview',
  currency: 'INR',
  showHeaderIcon: true,
  headerIcon: 'analytics',
  showFooter: true,
  footerText: 'Last updated',
  cardHeight: 'large',
  theme: 'auto',
  animations: true,
  clickable: true,
  showDebugInfo: false,
  maxItems: {
    categoryTrends: 5,
    spendingTrends: 6,
    accountBalances: 4
  },
  onCategoryClick: (trend) => {
    console.log('Category trend clicked:', trend);
    // Navigate to category details or show more information
  },
  onSpendingClick: (trend) => {
    console.log('Spending trend clicked:', trend);
    // Navigate to spending details or show chart
  },
  onAccountClick: (account) => {
    console.log('Account clicked:', account);
    // Navigate to account details
  },
  onRefresh: () => {
    console.log('Refresh requested');
    // Trigger data refresh
  }
};

// Mobile-optimized configuration
export const mobileConfig: AnalyticsSummaryConfig = {
  title: 'Quick Analytics',
  subtitle: 'Essential insights',
  currency: 'INR',
  showHeaderIcon: false,
  cardHeight: 'small',
  maxItems: {
    categoryTrends: 2,
    spendingTrends: 3,
    accountBalances: 2
  }
};

// Dashboard configuration
export const dashboardConfig: AnalyticsSummaryConfig = {
  title: 'Dashboard Analytics',
  subtitle: 'Real-time financial overview',
  currency: 'INR',
  showHeaderIcon: true,
  headerIcon: 'dashboard',
  showFooter: true,
  cardHeight: 'medium',
  maxItems: {
    categoryTrends: 3,
    spendingTrends: 4,
    accountBalances: 3
  }
};

// Reports configuration
export const reportsConfig: AnalyticsSummaryConfig = {
  title: 'Detailed Analytics',
  subtitle: 'Comprehensive financial analysis',
  currency: 'INR',
  showHeaderIcon: true,
  headerIcon: 'assessment',
  showFooter: true,
  cardHeight: 'large',
  maxItems: {
    categoryTrends: 8,
    spendingTrends: 12,
    accountBalances: 6
  }
};

/**
 * Usage in template:
 * 
 * ```html
 * <!-- Basic usage -->
 * <app-analytics-summary-card
 *   [config]="basicConfig">
 * </app-analytics-summary-card>
 * 
 * <!-- With event handlers -->
 * <app-analytics-summary-card
 *   [config]="advancedConfig">
 * </app-analytics-summary-card>
 * 
 * <!-- In a grid layout -->
 * <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
 *   <app-analytics-summary-card
 *     [config]="dashboardConfig">
 *   </app-analytics-summary-card>
 *   
 *   <app-analytics-summary-card
 *     [config]="mobileConfig">
 *   </app-analytics-summary-card>
 * </div>
 * ```
 * 
 * Usage in component:
 * 
 * ```typescript
 * import { Component } from '@angular/core';
 * import { AnalyticsSummaryConfig } from './analytics-summary-card.component';
 * 
 * @Component({
 *   selector: 'app-dashboard',
 *   templateUrl: './dashboard.component.html'
 * })
 * export class DashboardComponent {
 *   analyticsConfig: AnalyticsSummaryConfig = {
 *     title: 'My Analytics',
 *     subtitle: 'Personal financial insights',
 *     currency: 'INR',
 *     onCategoryClick: (trend) => {
 *       // Handle category click
 *       this.router.navigate(['/category', trend.category]);
 *     },
 *     onSpendingClick: (trend) => {
 *       // Handle spending click
 *       this.showSpendingDetails(trend);
 *     },
 *     onAccountClick: (account) => {
 *       // Handle account click
 *       this.router.navigate(['/accounts', account.account]);
 *     }
 *   };
 * }
 * ```
 */ 