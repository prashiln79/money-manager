# Analytics Summary Card Component

A reactive Angular component that automatically calculates and displays financial analytics data from the NgRx app state.

## Features

- **Automatic Data Calculation**: Calculates analytics from transactions, categories, and accounts in the app state
- **Real-time Updates**: Reactively updates when store data changes
- **Configurable Display**: Customizable appearance and behavior through configuration
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Automatic theme adaptation
- **Interactive Elements**: Clickable items with customizable event handlers

## Data Sources

The component automatically calculates analytics from:

- **Transactions**: Spending trends, category analysis
- **Categories**: Category-wise spending trends with icons and colors
- **Accounts**: Account balances and overview

## Analytics Calculated

### Category Trends
- Compares current month vs previous month spending by category
- Shows percentage change and trend direction
- Includes category icons and colors
- Sorted by spending change magnitude

### Spending Trends
- Monthly spending over the last 6 months
- Shows spending amounts and month-over-month changes
- Calculates percentage changes between periods

### Account Balances
- Current balance for all active accounts
- Account type-specific icons
- Color-coded positive/negative balances
- Sorted by balance magnitude

## Usage

### Basic Usage

```html
<app-analytics-summary-card
  [config]="analyticsConfig">
</app-analytics-summary-card>
```

### Configuration

```typescript
import { AnalyticsSummaryConfig } from './analytics-summary-card.component';

const config: AnalyticsSummaryConfig = {
  title: 'Financial Analytics',
  subtitle: 'Monthly insights and trends',
  currency: 'INR',
  showHeaderIcon: true,
  headerIcon: 'analytics',
  cardHeight: 'medium',
  maxItems: {
    categoryTrends: 3,
    spendingTrends: 4,
    accountBalances: 3
  },
  onCategoryClick: (trend) => {
    // Handle category click
  },
  onSpendingClick: (trend) => {
    // Handle spending click
  },
  onAccountClick: (account) => {
    // Handle account click
  }
};
```

## Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | 'Analytics Summary' | Card title |
| `subtitle` | string | 'Key insights and trends' | Card subtitle |
| `currency` | string | 'INR' | Currency for formatting |
| `showHeaderIcon` | boolean | true | Show header icon |
| `headerIcon` | string | 'insights' | Material icon name |
| `showFooter` | boolean | false | Show footer with timestamp |
| `cardHeight` | 'small' \| 'medium' \| 'large' \| 'auto' | 'medium' | Card height |
| `theme` | 'light' \| 'dark' \| 'auto' | 'auto' | Theme mode |
| `animations` | boolean | true | Enable animations |
| `clickable` | boolean | true | Make items clickable |
| `maxItems` | object | { categoryTrends: 3, spendingTrends: 3, accountBalances: 3 } | Max items to show |
| `onCategoryClick` | function | undefined | Category click handler |
| `onSpendingClick` | function | undefined | Spending click handler |
| `onAccountClick` | function | undefined | Account click handler |

## Event Handlers

### Category Click
```typescript
onCategoryClick: (trend: CategoryTrend) => void
```

### Spending Click
```typescript
onSpendingClick: (trend: SpendingTrend) => void
```

### Account Click
```typescript
onAccountClick: (account: AccountBalance) => void
```

## Data Interfaces

### CategoryTrend
```typescript
interface CategoryTrend {
  category: string;
  change: number;
  percentage: number;
  color?: string;
  icon?: string;
}
```

### SpendingTrend
```typescript
interface SpendingTrend {
  period: string;
  amount: number;
  change?: number;
  percentage?: number;
}
```

### AccountBalance
```typescript
interface AccountBalance {
  account: string;
  balance: number;
  change?: number;
  percentage?: number;
  color?: string;
  icon?: string;
}
```

## Dependencies

- Angular Material (MatCardModule, MatIconModule)
- NgRx Store
- RxJS

## State Requirements

The component expects the following NgRx state structure:

```typescript
interface AppState {
  transactions: TransactionsState;
  categories: CategoriesState;
  accounts: AccountsState;
}
```

## Performance

- Uses reactive observables for efficient updates
- Implements OnDestroy for proper cleanup
- Calculates data only when store changes
- Limits displayed items through configuration

## Examples

See `example-usage.ts` for complete usage examples including:
- Basic configuration
- Advanced configuration with event handlers
- Mobile-optimized settings
- Dashboard and reports configurations 