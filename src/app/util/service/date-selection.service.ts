import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DateSelectionService {
  private selectedDateSubject = new BehaviorSubject<Date | null>(null);
  public selectedDate$ = this.selectedDateSubject.asObservable();

  private selectedDateRangeSubject = new BehaviorSubject<DateRange | null>(null);
  public selectedDateRange$ = this.selectedDateRangeSubject.asObservable();

  constructor() { }

  setSelectedDate(date: Date | null): void {
    this.selectedDateSubject.next(date);
    this.selectedDateRangeSubject.next(null); // Clear range when single date is set
  }

  getSelectedDate(): Date | null {
    return this.selectedDateSubject.value;
  }

  setSelectedDateRange(startDate: Date, endDate: Date): void {
    this.selectedDateRangeSubject.next({ startDate, endDate });
    this.selectedDateSubject.next(null); // Clear single date when range is set
  }

  getSelectedDateRange(): DateRange | null {
    return this.selectedDateRangeSubject.value;
  }

  clearSelectedDate(): void {
    this.selectedDateSubject.next(null);
    this.selectedDateRangeSubject.next(null);
  }
} 