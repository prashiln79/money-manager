# Currency Configuration

This document explains how to use the centralized currency configuration in the Money Manager application.

## Overview

The currency configuration has been centralized to maintain consistency across the entire application. All currency-related data and functionality are now managed through a single source of truth.

## Files

### 1. Currency Model (`src/app/util/models/currency.model.ts`)
- **Currency Interface**: Defines the structure of a currency object
- **CURRENCIES Array**: Contains all supported currencies
- **DEFAULT_CURRENCY**: The default currency code (USD)
- **Utility Functions**: Helper functions for currency operations

### 2. Currency Service (`src/app/util/service/currency.service.ts`)
- **CurrencyService**: Injectable service for currency management
- **Reactive Currency**: Observable for current currency changes
- **Formatting**: Methods for currency formatting and validation

## Usage

### In Components

#### 1. Import the currency configuration
```typescript
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencySymbol } from 'src/app/util/models';
```

#### 2. Use in component class
```typescript
export class MyComponent {
  currencies = CURRENCIES;
  defaultCurrency = DEFAULT_CURRENCY;
  
  getSymbol(code: string): string {
    return getCurrencySymbol(code);
  }
}
```

#### 3. Use the Currency Service (Recommended)
```typescript
import { CurrencyService } from 'src/app/util/service/currency.service';

export class MyComponent implements OnInit {
  userCurrency = this.currencyService.getDefaultCurrency();
  
  constructor(private currencyService: CurrencyService) {}
  
  ngOnInit() {
    this.currencyService.currentCurrency$.subscribe(currency => {
      this.userCurrency = currency;
    });
  }
  
  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }
}
```

### In Templates

#### 1. Using currency pipe with dynamic currency
```html
<div>{{ amount | currency:userCurrency:'symbol':'1.0-0' }}</div>
```

#### 2. Displaying currency symbol
```html
<span>{{ getCurrencySymbol(currencyCode) }}</span>
```

#### 3. Currency selection dropdown
```html
<mat-select formControlName="currency">
  <mat-option *ngFor="let currency of currencies" [value]="currency.code">
    {{ currency.symbol }} {{ currency.name }} ({{ currency.code }})
  </mat-option>
</mat-select>
```

## Supported Currencies

The application currently supports the following currencies:

- **USD** ($) - US Dollar
- **EUR** (€) - Euro
- **GBP** (£) - British Pound
- **JPY** (¥) - Japanese Yen
- **CAD** (C$) - Canadian Dollar
- **AUD** (A$) - Australian Dollar
- **INR** (₹) - Indian Rupee

## Adding New Currencies

To add a new currency:

1. **Update the CURRENCIES array** in `src/app/util/models/currency.model.ts`:
```typescript
export const CURRENCIES: Currency[] = [
  // ... existing currencies
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
];
```

2. **The change will automatically be available** throughout the application.

## Best Practices

1. **Always use the centralized configuration** instead of hardcoding currency values
2. **Use the CurrencyService** for reactive currency management
3. **Use DEFAULT_CURRENCY** instead of hardcoded "USD" strings
4. **Use getCurrencySymbol()** for consistent symbol display
5. **Subscribe to currentCurrency$** for reactive currency updates

## Migration Notes

The following components have been updated to use the centralized configuration:

- ✅ Profile Component (`profile.component.ts`)
- ✅ Registration Component (`registration.component.ts`)
- ✅ Total Balance Component (`total-balance.component.ts`)

All hardcoded currency arrays and "USD" strings have been replaced with the centralized configuration. 