import { AccountType } from './enums';

export interface AccountGroup {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  color: string;
  description: string;
  accountTypes: AccountType[];
}

export const ACCOUNT_GROUPS: AccountGroup[] = [
  {
    id: 'cash_bank',
    name: 'Cash & Bank',
    icon: 'account_balance',
    emoji: '💰',
    color: '#10B981', // Green
    description: 'Savings Account, Checking Account, e-Wallets',
    accountTypes: [AccountType.BANK, AccountType.CASH]
  },
  {
    id: 'credit_accounts',
    name: 'Credit Accounts',
    icon: 'credit_card',
    emoji: '💳',
    color: '#F59E0B', // Amber
    description: 'Credit Cards, BNPL (Buy Now Pay Later)',
    accountTypes: [AccountType.CREDIT]
  },
  {
    id: 'liabilities',
    name: 'Liabilities',
    icon: 'trending_down',
    emoji: '📉',
    color: '#EF4444', // Red
    description: 'Personal Loans, Car Loans, Home Loans, Student Loans',
    accountTypes: [AccountType.LOAN]
  },
  {
    id: 'assets',
    name: 'Assets',
    icon: 'trending_up',
    emoji: '📈',
    color: '#3B82F6', // Blue
    description: 'Investment Accounts, Fixed Deposits, Retirement Funds',
    accountTypes: [AccountType.INVESTMENT]
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'more_horiz',
    emoji: '🔄',
    color: '#8B5CF6', // Purple
    description: 'Expense Accounts, Income Accounts, Petty Cash',
    accountTypes: []
  }
];

/**
 * Get account group by account type
 */
export function getAccountGroup(accountType: AccountType): AccountGroup | undefined {
  return ACCOUNT_GROUPS.find(group => group.accountTypes.includes(accountType));
}

/**
 * Get all account groups
 */
export function getAllAccountGroups(): AccountGroup[] {
  return ACCOUNT_GROUPS;
} 