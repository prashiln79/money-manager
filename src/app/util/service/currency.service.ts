import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CURRENCIES, Currency, DEFAULT_CURRENCY, getCurrencyByCode, getCurrencySymbol } from '../models/currency.model';
import { UserService } from './user.service';
import { APP_CONFIG } from '../config/config';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private currentCurrencySubject = new BehaviorSubject<string>(DEFAULT_CURRENCY);
  public currentCurrency$ = this.currentCurrencySubject.asObservable();

  constructor(private userService: UserService) {
    this.initializeCurrency();
  }

  private async initializeCurrency(): Promise<void> {
    try {
      const user = await this.userService.getCurrentUser();
      if (user?.preferences?.defaultCurrency) {
        this.setCurrentCurrency(user.preferences.defaultCurrency);
      }
    } catch (error) {
      console.error('Error initializing currency:', error);
    }
  }

  getCurrencies(): Currency[] {
    return CURRENCIES;
  }

  getCurrentCurrency(): string {
    return this.currentCurrencySubject.value;
  }

  setCurrentCurrency(currencyCode: string): void {
    if (this.isValidCurrency(currencyCode)) {
      this.currentCurrencySubject.next(currencyCode);
    }
  }

  getCurrencySymbol(currencyCode?: string): string {
    const code = currencyCode || this.getCurrentCurrency();
    return getCurrencySymbol(code);
  }

  getCurrencyByCode(currencyCode: string): Currency | undefined {
    return getCurrencyByCode(currencyCode);
  }

  isValidCurrency(currencyCode: string): boolean {
    return CURRENCIES.some(currency => currency.code === currencyCode);
  }

  getDefaultCurrency(): string {
    return DEFAULT_CURRENCY;
  }

  formatAmount(amount: number, currencyCode?: string): string {
    const code = currencyCode || this.getCurrentCurrency();
    return new Intl.NumberFormat(APP_CONFIG.LANGUAGE.DEFAULT, {
      style: 'currency',
      currency: code,
    }).format(amount);
  }
} 