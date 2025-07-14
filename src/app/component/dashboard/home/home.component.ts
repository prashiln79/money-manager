import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CalendarVisibilityService } from '../../../util/service/calendar-visibility.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  deviceType = {
    mobile: false,
    tablet: false,
    desktop: false
  };
  isCalendarVisible = true;
  private calendarSubscription?: Subscription;



  constructor(
    private breakpointObserver: BreakpointObserver,
    private calendarVisibilityService: CalendarVisibilityService
  ) {
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet,
      Breakpoints.Web
    ]).subscribe(result => {
      if (result.breakpoints[Breakpoints.HandsetPortrait] || result.breakpoints[Breakpoints.HandsetLandscape]) {
        this.deviceType = { mobile: true, tablet: false, desktop: false };
      } else if (result.breakpoints[Breakpoints.TabletPortrait] || result.breakpoints[Breakpoints.TabletLandscape]) {
        this.deviceType = { mobile: false, tablet: true, desktop: false };
      } else if (result.breakpoints[Breakpoints.WebPortrait]) {
        this.deviceType = { mobile: false, tablet: false, desktop: true };
      }
    });
  }

  ngOnInit() {
    // Show calendar when home component is initialized
    this.calendarVisibilityService.showCalendar();
    
    // Subscribe to calendar visibility changes
    this.calendarSubscription = this.calendarVisibilityService.isCalendarVisible$.subscribe(
      (visible: boolean) => {
        this.isCalendarVisible = visible;
      }
    );
  }

  ngOnDestroy() {
    this.calendarSubscription?.unsubscribe();
  }

}
