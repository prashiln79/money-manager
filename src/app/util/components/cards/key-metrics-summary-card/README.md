# Key Metrics Summary Card Component

A reactive Angular component that automatically calculates and displays key financial metrics from the NgRx app state.

## Features

- **Automatic Metrics Calculation**: Calculates key financial metrics from transactions, categories, and accounts in the app state
- **Real-time Updates**: Reactively updates when store data changes
- **Configurable Display**: Customizable appearance and behavior through configuration
- **Responsive Design**: Works on all screen sizes with flexible grid layouts
- **Dark Mode Support**: Automatic theme adaptation
- **Interactive Elements**: Clickable metrics with customizable event handlers
- **Multiple Layouts**: Grid, list, and compact layouts
- **Trend Indicators**: Shows trends and percentage changes

## Data Sources

The component automatically calculates metrics from:

- **Transactions**: Income, expenses, savings, transaction counts
- **Categories**: Category-wise spending analysis
- **Accounts**: Total balance across all accounts

## Metrics Calculated

### Core Metrics (Always Available)
1. **Total Income** - Current month income with trend
2. **Total Expenses** - Current month expenses with trend  
3. **Net Savings** - Current month savings (income - expenses)
4. **Total Balance** - Total balance across all accounts

### Additional Metrics (When columns > 4)
5. **Avg Daily Spending** - Average daily spending for the current month
6. **Transactions** - Number of transactions this month

## Usage

### Basic Usage

```html
<app-key-metrics-summary-card
  [config]="metricsConfig">
</app-key-metrics-summary-card>
```

### Configuration

```typescript
import { KeyMetricsConfig } from './key-metrics-summary-card.component';

const config: KeyMetricsConfig = {
  title: 'Financial Metrics',
  subtitle: 'Key performance indicators',
  currency: 'INR',
  showHeaderIcon: true,
  headerIcon: 'analytics',
  cardHeight: 'medium',
  layout: 'grid',
  columns: 4,
  showTrends: true,
  showIcons: true,
  showPeriod: true,
  onMetricClick: (metric) => {
    // Handle metric click
  },
  onRefresh: () => {
    // Handle refresh
  }
};
```

## Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | 'Key Metrics Summary' | Card title |
| `subtitle` | string | 'Financial overview for this period' | Card subtitle |
| `currency` | string | 'INR' | Currency for formatting |
| `showHeaderIcon` | boolean | true | Show header icon |
| `headerIcon` | string | 'analytics' | Material icon name |
| `showFooter` | boolean | false | Show footer with timestamp |
| `cardHeight` | 'small' \| 'medium' \| 'large' \| 'auto' | 'medium' | Card height |
| `layout` | 'grid' \| 'list' \| 'compact' | 'grid' | Layout type |
| `columns` | 1-6 | 4 | Number of metrics to display |
| `showTrends` | boolean | true | Show trend indicators |
| `showIcons` | boolean | true | Show metric icons |
| `showPeriod` | boolean | true | Show time period labels |
| `theme` | 'light' \| 'dark' \| 'auto' | 'auto' | Theme mode |
| `animations` | boolean | true | Enable animations |
| `clickable` | boolean | true | Make metrics clickable |
| `onMetricClick` | function | undefined | Metric click handler |
| `onRefresh` | function | undefined | Refresh handler |

## Layout Options

### Grid Layout
```typescript
{
  layout: 'grid',
  columns: 4,
  cardsPerRow: {
    xs: 1,  // Mobile
    sm: 2,  // Small tablet
    md: 2,  // Tablet
    lg: 4,  // Desktop
    xl: 4,  // Large desktop
    xxl: 4  // Extra large
  }
}
```

### List Layout
```typescript
{
  layout: 'list',
  cardHeight: 'medium'
}
```

### Compact Layout
```typescript
{
  layout: 'compact',
  cardHeight: 'small',
  showTrends: false,
  showPeriod: false
}
```

## Event Handlers

### Metric Click
```typescript
onMetricClick: (metric: KeyMetric) => void
```

## Data Interfaces

### KeyMetric
```typescript
interface KeyMetric {
  id?: string;
  title: string;
  value: number;
  period?: string;
  icon?: string;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'yellow' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
  changeValue?: number;
  changePercentage?: number;
  description?: string;
  customData?: any;
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
- Calculates metrics only when store changes
- Responsive grid system for optimal performance

## Examples

See `example-usage.ts` for complete usage examples including:
- Basic configuration
- Advanced configuration with event handlers
- Mobile-optimized settings
- Dashboard and reports configurations
- Different layout options (grid, list, compact)

## Metrics Calculation Logic

### Income & Expenses
- Calculates current month vs previous month
- Shows percentage changes and trends
- Handles edge cases (zero values, month transitions)

### Net Savings
- Income - Expenses for current month
- Shows positive/negative trends
- Calculates month-over-month changes

### Total Balance
- Sums all account balances
- Handles loan accounts (subtracts remaining balance)
- Shows positive/negative indicators

### Additional Metrics
- **Avg Daily Spending**: Current month expenses / days in month
- **Transaction Count**: Number of transactions this month
- Both include month-over-month comparisons 