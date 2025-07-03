import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DateSelectionService {
  private selectedDateSubject = new BehaviorSubject<Date | null>(null);
  public selectedDate$ = this.selectedDateSubject.asObservable();

  constructor() { }

  setSelectedDate(date: Date | null): void {
    this.selectedDateSubject.next(date);
  }

  getSelectedDate(): Date | null {
    return this.selectedDateSubject.value;
  }

  clearSelectedDate(): void {
    this.selectedDateSubject.next(null);
  }
} 