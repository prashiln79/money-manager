import { Timestamp } from '@angular/fire/firestore';
import { GoalType, GoalStatus, SyncStatus } from '../config/enums';

/**
 * Goal interface representing a financial goal in the system
 */
export interface Goal {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  status: GoalStatus;
  
  // Timeline
  startDate: Timestamp;
  targetDate?: Timestamp;
  completedDate?: Timestamp;
  
  // Progress tracking
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining?: number;
  isOnTrack: boolean;
  
  // Contribution settings
  monthlyContribution?: number;
  contributionFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  autoContribution: boolean;
  contributionAccountId?: string;
  
  // Milestones
  milestones: GoalMilestone[];
  nextMilestone?: GoalMilestone;
  
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
 * Goal milestone interface
 */
export interface GoalMilestone {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: Timestamp;
  isCompleted: boolean;
  completedDate?: Timestamp;
  reward?: string;
}

/**
 * Goal creation request interface
 */
export interface CreateGoalRequest {
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  startDate: Date;
  targetDate?: Date;
  monthlyContribution?: number;
  contributionFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  autoContribution?: boolean;
  contributionAccountId?: string;
  alertThreshold?: number;
  isAlertEnabled?: boolean;
  milestones?: Omit<GoalMilestone, 'id' | 'isCompleted' | 'completedDate'>[];
}

/**
 * Goal update request interface
 */
export interface UpdateGoalRequest {
  name?: string;
  description?: string;
  type?: GoalType;
  targetAmount?: number;
  targetDate?: Date;
  status?: GoalStatus;
  monthlyContribution?: number;
  contributionFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  autoContribution?: boolean;
  contributionAccountId?: string;
  alertThreshold?: number;
  isAlertEnabled?: boolean;
}

/**
 * Goal filter interface
 */
export interface GoalFilter {
  types?: GoalType[];
  statuses?: GoalStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  isOnTrack?: boolean;
}

/**
 * Goal progress interface
 */
export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining?: number;
  isOnTrack: boolean;
  monthlyContribution: number;
  projectedCompletionDate?: Date;
  lastUpdated: Timestamp;
}

/**
 * Goal contribution interface
 */
export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: Timestamp;
  description?: string;
  transactionId?: string;
  isAutomatic: boolean;
  createdAt: Timestamp;
  createdBy: string;
}

/**
 * Goal alert interface
 */
export interface GoalAlert {
  id: string;
  goalId: string;
  goalName: string;
  type: 'milestone' | 'threshold' | 'deadline' | 'off_track';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Timestamp;
}

/**
 * Goal summary statistics
 */
export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  averageProgressPercentage: number;
  onTrackGoals: number;
  upcomingMilestones: number;
  totalContributions: number;
}

/**
 * Goal category breakdown
 */
export interface GoalCategoryBreakdown {
  type: GoalType;
  count: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  averageProgressPercentage: number;
}

/**
 * Goal trend data
 */
export interface GoalTrend {
  period: string;
  totalContributions: number;
  averageContribution: number;
  goalsCompleted: number;
  totalProgress: number;
}

/**
 * Goal template interface
 */
export interface GoalTemplate {
  id: string;
  name: string;
  description?: string;
  type: GoalType;
  defaultTargetAmount: number;
  defaultMonthlyContribution: number;
  defaultContributionFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  defaultTimeline: number; // in months
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Goal import result
 */
export interface GoalImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  importedGoals: Goal[];
}

/**
 * Goal export options
 */
export interface GoalExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  filter?: GoalFilter;
  includeProgress?: boolean;
  includeContributions?: boolean;
  includeMilestones?: boolean;
  dateFormat?: string;
  currencyFormat?: string;
}

/**
 * Goal recommendation interface
 */
export interface GoalRecommendation {
  id: string;
  type: GoalType;
  name: string;
  description: string;
  suggestedTargetAmount: number;
  suggestedMonthlyContribution: number;
  suggestedTimeline: number; // in months
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
  isPersonalized: boolean;
} 