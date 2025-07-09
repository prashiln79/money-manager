import { Timestamp } from 'firebase/firestore';
import { TransactionType, RecurringInterval, SyncStatus, TransactionStatus, PaymentMethod } from '../config/enums';

/**
 * Base transaction interface
 */
export interface Transaction {
  id?: string;
  userId: string;
  accountId: string;
  category: string;
  payee: string;
  amount: number;
  type: TransactionType;
  date: Date | Timestamp;
  notes?: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  
  // Recurring transaction properties
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  recurringEndDate?: Date | Timestamp;
  nextOccurrence?: Date | Timestamp;
  
  // Offline sync properties
  syncStatus: SyncStatus;
  isPending?: boolean;
  lastSyncedAt?: Date | Timestamp;
  
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
  updatedBy: string;
}

/**
 * Transaction creation request interface
 */
export interface CreateTransactionRequest {
  accountId: string;
  categoryId: string;
  payee: string;
  amount: number;
  type: TransactionType;
  date: Date;
  notes?: string;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  recurringEndDate?: Date;
}

/**
 * Transaction update request interface
 */
export interface UpdateTransactionRequest {
  accountId?: string;
  categoryId?: string;
  payee?: string;
  amount?: number;
  type?: TransactionType;
  date?: Date;
  notes?: string;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  recurringEndDate?: Date;
}

/**
 * Transaction filter interface
 */
export interface TransactionFilter {
  accountIds?: string[];
  categoryIds?: string[];
  types?: TransactionType[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  payee?: string;
  tags?: string[];
  status?: TransactionStatus[];
  paymentMethods?: PaymentMethod[];
  isRecurring?: boolean;
}

/**
 * Transaction sort options
 */
export interface TransactionSort {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}

/**
 * Transaction query parameters
 */
export interface TransactionQueryParams {
  filter?: TransactionFilter;
  sort?: TransactionSort;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

/**
 * Transaction summary statistics
 */
export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  averageAmount: number;
  largestTransaction: number;
  smallestTransaction: number;
}

/**
 * Transaction category summary
 */
export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

/**
 * Transaction trend data
 */
export interface TransactionTrend {
  period: string;
  income: number;
  expense: number;
  netAmount: number;
  transactionCount: number;
}

/**
 * Recurring transaction template
 */
export interface RecurringTransactionTemplate {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  payee: string;
  amount: number;
  type: TransactionType;
  interval: RecurringInterval;
  startDate: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
  lastProcessed?: Timestamp;
  nextOccurrence: Timestamp;
  notes?: string;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Bulk transaction import result
 */
export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  importedTransactions: Transaction[];
}

/**
 * Transaction export options
 */
export interface TransactionExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  filter?: TransactionFilter;
  sort?: TransactionSort;
  includeMetadata?: boolean;
  dateFormat?: string;
  currencyFormat?: string;
}

/**
 * Transaction reconciliation data
 */
export interface TransactionReconciliation {
  transactionId: string;
  reconciledAt: Timestamp;
  reconciledBy: string;
  reconciliationNotes?: string;
  bankStatementReference?: string;
}

/**
 * Transaction attachment
 */
export interface TransactionAttachment {
  id: string;
  transactionId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

/**
 * Transaction audit log entry
 */
export interface TransactionAuditLog {
  id: string;
  transactionId: string;
  action: 'created' | 'updated' | 'deleted' | 'reconciled';
  userId: string;
  timestamp: Timestamp;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
} 