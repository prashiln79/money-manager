import { Component } from '@angular/core';
import { CategoryBreakdownConfig } from 'src/app/util/components/cards/category-breakdown-card/category-breakdown-card.component';
import { MonthlyTrendsConfig } from 'src/app/util/components/cards/monthly-trends-card/monthly-trends-card.component';
import { RecentActivityConfig } from 'src/app/util/components/cards/recent-activity-card/recent-activity-card.component';
import { TopCategoriesConfig } from 'src/app/util/components/cards/top-categories-card/top-categories-card.component';
import { BreakpointService } from 'src/app/util/service/breakpoint.service';

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
  };
  constructor(
    public breakpointService: BreakpointService,
  ) { }
}
