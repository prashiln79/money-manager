import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface KeyMetric {
  title: string;
  value: number;
  period: string;
  icon: string;
  color: 'green' | 'red' | 'blue' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
  changeValue?: number;
  changePercentage?: number;
}

export interface KeyMetricsConfig {
  metrics: KeyMetric[];
  title?: string;
  subtitle?: string;
  currency?: string;
  showTrends?: boolean;
  showIcons?: boolean;
  showPeriod?: boolean;
  cardHeight?: 'small' | 'medium' | 'large';
  layout?: 'grid' | 'list';
  columns?: 1 | 2 | 3 | 4;
  theme?: 'light' | 'dark' | 'auto';
  animations?: boolean;
  clickable?: boolean;
  customColors?: {
    green?: string;
    red?: string;
    blue?: string;
    purple?: string;
  };
  onMetricClick?: (metric: KeyMetric) => void;
}

@Component({
  selector: 'app-key-metrics-summary-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './key-metrics-summary-card.component.html',
  styleUrls: ['./key-metrics-summary-card.component.scss']
})
export class KeyMetricsSummaryCardComponent {
  @Input() config: KeyMetricsConfig = {
    metrics: [],
    title: 'Key Metrics Summary',
    subtitle: 'Financial overview for this period',
    currency: 'INR',
    showTrends: true,
    showIcons: true,
    showPeriod: true,
    cardHeight: 'medium',
    layout: 'grid',
    columns: 4,
    theme: 'auto',
    animations: true,
    clickable: true
  };

  get effectiveConfig(): KeyMetricsConfig {
    return {
      metrics: this.config.metrics || [],
      title: this.config.title ?? 'Key Metrics Summary',
      subtitle: this.config.subtitle ?? 'Financial overview for this period',
      currency: this.config.currency ?? 'INR',
      showTrends: this.config.showTrends ?? true,
      showIcons: this.config.showIcons ?? true,
      showPeriod: this.config.showPeriod ?? true,
      cardHeight: this.config.cardHeight ?? 'medium',
      layout: this.config.layout ?? 'grid',
      columns: this.config.columns ?? 4,
      theme: this.config.theme ?? 'auto',
      animations: this.config.animations ?? true,
      clickable: this.config.clickable ?? true,
      customColors: this.config.customColors ?? {},
      onMetricClick: this.config.onMetricClick
    };
  }

  get gridColumns(): string {
    const columns = this.effectiveConfig.columns;
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 sm:grid-cols-2 xxl:grid-cols-4';
      default: return 'grid-cols-1 sm:grid-cols-2 xxl:grid-cols-4';
    }
  }

  get cardHeightClass(): string {
    switch (this.effectiveConfig.cardHeight) {
      case 'small': return 'h-24';
      case 'large': return 'h-32';
      default: return 'h-28';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.effectiveConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  getMetricClasses(metric: KeyMetric): { [key: string]: boolean } {
    return {
      'metric-green': metric.color === 'green',
      'metric-red': metric.color === 'red',
      'metric-blue': metric.color === 'blue',
      'metric-purple': metric.color === 'purple',
      'clickable': this.effectiveConfig.clickable ?? true,
      'no-animations': !(this.effectiveConfig.animations ?? true)
    };
  }

  getMetricColorClass(color: string, type: 'text' | 'value' | 'bg'): string {
    // Check for custom colors first
    const customColor = this.effectiveConfig.customColors?.[color as keyof typeof this.effectiveConfig.customColors];
    if (customColor && type === 'text') {
      return `color: ${customColor};`;
    }

    switch (color) {
      case 'green':
        return type === 'text' ? 'text-green' : type === 'value' ? 'value-green' : 'bg-green';
      case 'red':
        return type === 'text' ? 'text-red' : type === 'value' ? 'value-red' : 'bg-red';
      case 'blue':
        return type === 'text' ? 'text-blue' : type === 'value' ? 'value-blue' : 'bg-blue';
      case 'purple':
        return type === 'text' ? 'text-purple' : type === 'value' ? 'value-purple' : 'bg-purple';
      default:
        return '';
    }
  }

  getTrendIcon(metric: KeyMetric): string {
    if (!metric.trend) return '';
    
    switch (metric.trend) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  getTrendColor(metric: KeyMetric): string {
    if (!metric.trend) return '';
    
    switch (metric.trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  onMetricClick(metric: KeyMetric): void {
    if (this.effectiveConfig.clickable && this.effectiveConfig.onMetricClick) {
      this.effectiveConfig.onMetricClick(metric);
    }
  }

  getChangeDisplay(metric: KeyMetric): string {
    if (metric.changeValue === undefined || metric.changePercentage === undefined) {
      return '';
    }
    
    const sign = metric.changeValue >= 0 ? '+' : '';
    return `${sign}${this.formatCurrency(metric.changeValue)} (${sign}${metric.changePercentage.toFixed(1)}%)`;
  }
} 