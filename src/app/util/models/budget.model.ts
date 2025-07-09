import { Timestamp } from 'firebase/firestore';
import { BudgetPeriod, SyncStatus } from '../config/enums';

/**
 * Budget interface representing a budget in the system
 */
export interface Budget {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  period: BudgetPeriod;
  categoryIds: string[];
  startDate: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
  
  // Progress tracking
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  
  // Alerts
  alertThreshold: number; // Percentage (e.g., 80 for 80%)
  isAlertEnabled: boolean;
  
  // Offline sync properties
  syncStatus: SyncStatus;
  lastSyncedAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

/**
 * Budget creation request interface
 */
export interface CreateBudgetRequest {
  name: string;
  description?: string;
  amount: number;
  period: BudgetPeriod;
  categoryIds: string[];
  startDate: Date;
  endDate?: Date;
  alertThreshold?: number;
  isAlertEnabled?: boolean;
}

/**
 * Budget update request interface
 */
export interface UpdateBudgetRequest {
  name?: string;
  description?: string;
  amount?: number;
  period?: BudgetPeriod;
  categoryIds?: string[];
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  alertThreshold?: number;
  isAlertEnabled?: boolean;
}

/**
 * Budget filter interface
 */
export interface BudgetFilter {
  categoryIds?: string[];
  periods?: BudgetPeriod[];
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

/**
 * Budget progress interface
 */
export interface BudgetProgress {
  budgetId: string;
  budgetName: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isOverBudget: boolean;
  daysRemaining: number;
  dailyAverage: number;
  projectedOverspend?: number;
  lastUpdated: Timestamp;
}

/**
 * Budget alert interface
 */
export interface BudgetAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  type: 'threshold' | 'overspend' | 'ending_soon';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Timestamp;
}

/**
 * Budget summary statistics
 */
export interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
  averageProgressPercentage: number;
  overBudgetCount: number;
  upcomingAlerts: number;
}

/**
 * Budget category breakdown
 */
export interface BudgetCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  transactionCount: number;
}

/**
 * Budget trend data
 */
export interface BudgetTrend {
  period: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
}

/**
 * Budget template interface
 */
export interface BudgetTemplate {
  id: string;
  name: string;
  description?: string;
  categoryIds: string[];
  defaultAmount: number;
  defaultPeriod: BudgetPeriod;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Budget import result
 */
export interface BudgetImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  importedBudgets: Budget[];
}

/**
 * Budget export options
 */
export interface BudgetExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  filter?: BudgetFilter;
  includeProgress?: boolean;
  includeAlerts?: boolean;
  dateFormat?: string;
  currencyFormat?: string;
} 