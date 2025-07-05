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
  isMobile = false;
  isCalendarVisible = true;
  private calendarSubscription?: Subscription;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private calendarVisibilityService: CalendarVisibilityService
  ) {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
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
