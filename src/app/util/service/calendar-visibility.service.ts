import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalendarVisibilityService {
  private isCalendarVisibleSubject = new BehaviorSubject<boolean>(true);
  public isCalendarVisible$ = this.isCalendarVisibleSubject.asObservable();

  constructor() {}

  /**
   * Hide the calendar view
   */
  hideCalendar(): void {
    this.isCalendarVisibleSubject.next(false);
  }

  /**
   * Show the calendar view
   */
  showCalendar(): void {
    this.isCalendarVisibleSubject.next(true);
  }

  /**
   * Toggle the calendar view visibility
   */
  toggleCalendar(): void {
    const currentValue = this.isCalendarVisibleSubject.value;
    this.isCalendarVisibleSubject.next(!currentValue);
  }

  /**
   * Get current visibility state
   */
  get isCalendarVisible(): boolean {
    return this.isCalendarVisibleSubject.value;
  }
} 