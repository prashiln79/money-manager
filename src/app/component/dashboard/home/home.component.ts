import { Component } from '@angular/core';
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
  constructor(
    public breakpointService: BreakpointService,
  ) { }
}
