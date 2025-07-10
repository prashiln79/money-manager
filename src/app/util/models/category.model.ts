import { Timestamp } from 'firebase/firestore';

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  createdAt: number;
  budget?: Budget;
}

export interface Budget {
  hasBudget?: boolean;
  budgetAmount?: number;
  budgetPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  budgetStartDate?: Date | Timestamp; // timestamp
  budgetEndDate?: Date | Timestamp; // timestamp
  budgetSpent?: number;
  budgetRemaining?: number;
  budgetProgressPercentage?: number;
  budgetAlertThreshold?: number; // percentage (e.g., 80 for 80%)
  budgetAlertEnabled?: boolean;
}

// Available icons for category selection
export const AVAILABLE_ICONS: string[] = [
  // 💰 Finance & Budgeting
  'attach_money',
  'savings',
  'account_balance',
  'payments',
  'credit_card',
  'account_balance_wallet',
  'trending_up',
  'receipt',
  'receipt_long',
  'monetization_on',
  'request_quote',
  'price_check',

  // 🛒 Expenses & Purchases
  'shopping_cart',
  'local_offer',
  'card_giftcard',
  'store',
  'shopping_bag',

  // 🍽️ Food & Dining
  'restaurant',
  'fastfood',
  'local_cafe',
  'liquor',

  // 🚗 Transportation & Travel
  'local_gas_station',
  'directions_car',
  'commute',
  'flight',
  'airport_shuttle',
  'two_wheeler',
  'train',

  // 🏠 Home & Bills
  'home',
  'electrical_services',
  'water_drop',
  'lightbulb',
  'wifi',
  'cable',
  'phone',

  // 🧾 Utilities & Services
  'plumbing',
  'build',
  'tune',
  'settings',
  'support',

  // 🏥 Health & Insurance
  'local_hospital',
  'medication',
  'vaccines',
  'health_and_safety',

  // 🎓 Education
  'school',
  'menu_book',
  'backpack',

  // 🧘‍♂️ Fitness & Lifestyle
  'fitness_center',
  'self_improvement',
  'spa',
  'emoji_people',

  // 🧒 Family & Children
  'child_friendly',
  'family_restroom',
  'child_care',

  // 🎉 Entertainment & Leisure
  'celebration',
  'sports_esports',
  'movie',
  'music_note',
  'theaters',
  'event',

  // 📈 Investment & Income
  'show_chart',
  'insights',
  'bar_chart',
  'stacked_line_chart',
  'pie_chart',

  // 💼 Work & Business
  'work',
  'business_center',
  'badge',

  // 🤝 Charity & Giving
  'volunteer_activism',
  'diversity_1',
  'redeem',

  // 🧾 Tax & Legal
  'gavel',
  'policy',
  'description',
  'fact_check',

  // 🧠 Personal Growth
  'psychology',
  'lightbulb',
  'star',
  'bookmark',
  'category',
  'label',

  // 🔧 Actions & Management
  'add',
  'remove',
  'edit',
  'delete',
  'save',
  'check',
  'cancel',
  'close',
  'done',
  'refresh',

  // 🔔 Notifications & Status
  'check_circle',
  'warning',
  'info',
  'help',
  'notifications',
  'notifications_active',

  // 🔽 Navigation
  'arrow_back',
  'arrow_forward',
  'arrow_upward',
  'arrow_downward',
  'keyboard_arrow_up',
  'keyboard_arrow_down',
  'expand_more',
  'expand_less',
];

// Available colors for category selection
export const AVAILABLE_COLORS: string[] = [
  '#46777f',
  '#4CAF50',
  '#FF9800',
  '#F44336',
  '#9C27B0',
  '#00BCD4',
  '#FF5722',
  '#795548',
  '#607D8B',
  '#E91E63',
  '#3F51B5',
  '#009688',
  '#FFC107',
  '#8BC34A',
  '#FFEB3B',
  '#CDDC39',
  '#FF4081',
  '#7C4DFF',
  '#536DFE',
  '#448AFF',
  '#40C4FF',
  '#18FFFF',
  '#64FFDA',
  '#69F0AE',
  '#B2FF59',
  '#EEFF41',
  '#FFFF00',
  '#FFD740',
  '#FFAB40',
  '#FF6E40',
  '#FF3D00',
  '#D50000',
];

export const defaultCategoriesForNewUser: Category[] = [
  // Income Categories
  {
    name: 'Salary',
    type: 'income',
    color: '#4CAF50',
    icon: 'work',
    createdAt: Date.now(),
  },
  {
    name: 'Freelance',
    type: 'income',
    color: '#00BCD4',
    icon: 'computer',
    createdAt: Date.now(),
  },
  {
    name: 'Investments',
    type: 'income',
    color: '#FFC107',
    icon: 'trending_up',
    createdAt: Date.now(),
  },
  {
    name: 'Gifts & Rewards',
    type: 'income',
    color: '#8BC34A',
    icon: 'card_giftcard',
    createdAt: Date.now(),
  },
  {
    name: 'Other Income',
    type: 'income',
    color: '#9E9E9E',
    icon: 'attach_money',
    createdAt: Date.now(),
  },

  // Expense Categories
  {
    name: 'Food & Dining',
    type: 'expense',
    color: '#F44336',
    icon: 'restaurant',
    createdAt: Date.now(),
  },
  {
    name: 'Transport & Fuel',
    type: 'expense',
    color: '#9C27B0',
    icon: 'directions_car',
    createdAt: Date.now(),
  },
  {
    name: 'Shopping',
    type: 'expense',
    color: '#E91E63',
    icon: 'shopping_cart',
    createdAt: Date.now(),
  },
  {
    name: 'Bills & Utilities',
    type: 'expense',
    color: '#607D8B',
    icon: 'receipt_long',
    createdAt: Date.now(),
  },
  {
    name: 'Healthcare',
    type: 'expense',
    color: '#03A9F4',
    icon: 'local_hospital',
    createdAt: Date.now(),
  },
  {
    name: 'Entertainment',
    type: 'expense',
    color: '#FF5722',
    icon: 'sports_esports',
    createdAt: Date.now(),
  },
  {
    name: 'Education',
    type: 'expense',
    color: '#3F51B5',
    icon: 'school',
    createdAt: Date.now(),
  },
  {
    name: 'Travel',
    type: 'expense',
    color: '#009688',
    icon: 'flight',
    createdAt: Date.now(),
  },
  {
    name: 'Family & Kids',
    type: 'expense',
    color: '#CDDC39',
    icon: 'family_restroom',
    createdAt: Date.now(),
  },
  {
    name: 'Charity',
    type: 'expense',
    color: '#795548',
    icon: 'volunteer_activism',
    createdAt: Date.now(),
  },
  {
    name: 'Other Expenses',
    type: 'expense',
    color: '#9E9E9E',
    icon: 'category',
    createdAt: Date.now(),
  },
];
