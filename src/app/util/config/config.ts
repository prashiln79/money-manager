import { CurrencyCode, LanguageCode, ThemeType, DateRangePreset } from './enums';

/**
 * Application configuration constants
 */
export const APP_CONFIG = {
  // App metadata
  APP_NAME: 'Money Manager',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Personal finance management application',
  
  // Firebase configuration
  FIREBASE: {
    COLLECTIONS: {
      USERS: 'users',
      TRANSACTIONS: 'transactions',
      ACCOUNTS: 'accounts',
      CATEGORIES: 'categories',
      BUDGETS: 'budgets',
      GOALS: 'goals',
      TAXES: 'taxes',
      SUBSCRIPTIONS: 'subscriptions'
    },
    SUBCOLLECTIONS: {
      USER_TRANSACTIONS: 'transactions',
      USER_ACCOUNTS: 'accounts',
      USER_CATEGORIES: 'categories',
      USER_BUDGETS: 'budgets',
      USER_GOALS: 'goals',
      USER_TAXES: 'taxes'
    }
  },

  // Offline configuration
  OFFLINE: {
    MAX_RETRY_ATTEMPTS: 3,
    SYNC_INTERVAL: 30000, // 30 seconds
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    QUEUE_KEY: 'offline-queue',
    USER_DATA_PREFIX: 'user-data-'
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
  },

  // Validation
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 999999999.99,
    MIN_ACCOUNT_BALANCE: -999999999.99,
    MAX_ACCOUNT_BALANCE: 999999999.99
  },

  // Currency configuration
  CURRENCY: {
    DEFAULT: CurrencyCode.INR,
    SUPPORTED: [
      CurrencyCode.USD,
      CurrencyCode.EUR,
      CurrencyCode.GBP,
      CurrencyCode.INR,
      CurrencyCode.CAD,
      CurrencyCode.AUD,
      CurrencyCode.JPY,
      CurrencyCode.CNY
    ],
    SYMBOLS: {
      [CurrencyCode.USD]: '$',
      [CurrencyCode.EUR]: '€',
      [CurrencyCode.GBP]: '£',
      [CurrencyCode.INR]: '₹',
      [CurrencyCode.CAD]: 'C$',
      [CurrencyCode.AUD]: 'A$',
      [CurrencyCode.JPY]: '¥',
      [CurrencyCode.CNY]: '¥'
    },
    DECIMAL_PLACES: {
      [CurrencyCode.USD]: 2,
      [CurrencyCode.EUR]: 2,
      [CurrencyCode.GBP]: 2,
      [CurrencyCode.INR]: 2,
      [CurrencyCode.CAD]: 2,
      [CurrencyCode.AUD]: 2,
      [CurrencyCode.JPY]: 0,
      [CurrencyCode.CNY]: 2
    }
  },

  // Language configuration
  LANGUAGE: {
    DEFAULT: LanguageCode.IN_EN,
    SUPPORTED: [
      LanguageCode.EN,
      LanguageCode.ES,
      LanguageCode.FR,
      LanguageCode.DE,
      LanguageCode.HI,
      LanguageCode.ZH
    ],
    NAMES: {
      [LanguageCode.EN]: 'English',
      [LanguageCode.IN_EN]: 'English (India)',
      [LanguageCode.ES]: 'Español',
      [LanguageCode.FR]: 'Français',
      [LanguageCode.DE]: 'Deutsch',
      [LanguageCode.HI]: 'हिंदी',
      [LanguageCode.ZH]: '中文',
     
    }
  },

  // Theme configuration
  THEME: {
    DEFAULT: ThemeType.AUTO,
    SUPPORTED: [ThemeType.LIGHT, ThemeType.DARK, ThemeType.AUTO],
    STORAGE_KEY: 'app-theme'
  },

  // Date range presets
  DATE_RANGES: {
    [DateRangePreset.TODAY]: { label: 'Today', days: 0 },
    [DateRangePreset.YESTERDAY]: { label: 'Yesterday', days: -1 },
    [DateRangePreset.THIS_WEEK]: { label: 'This Week', days: -7 },
    [DateRangePreset.LAST_WEEK]: { label: 'Last Week', days: -14 },
    [DateRangePreset.THIS_MONTH]: { label: 'This Month', days: -30 },
    [DateRangePreset.LAST_MONTH]: { label: 'Last Month', days: -60 },
    [DateRangePreset.THIS_YEAR]: { label: 'This Year', days: -365 },
    [DateRangePreset.LAST_YEAR]: { label: 'Last Year', days: -730 }
  },

  // Notification configuration
  NOTIFICATIONS: {
    AUTO_HIDE_DELAY: 3000, // 5 seconds
    MAX_NOTIFICATIONS: 5,
    POSITION: 'top-right'
  },

  // Export configuration
  EXPORT: {
    MAX_RECORDS: 10000,
    BATCH_SIZE: 1000,
    DEFAULT_FORMAT: 'csv'
  },

  // Security configuration
  SECURITY: {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 1 day
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    PASSWORD_HISTORY_SIZE: 5
  },

  // Performance configuration
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300, // 300ms
    THROTTLE_DELAY: 100, // 100ms
    CACHE_SIZE: 100,
    MAX_CONCURRENT_REQUESTS: 5
  },

  // Feature flags
  FEATURES: {
    OFFLINE_MODE: true,
    PWA_SUPPORT: true,
    EXPORT_FUNCTIONALITY: true,
    ADVANCED_REPORTS: true,
    MULTI_CURRENCY: true,
    RECURRING_TRANSACTIONS: true,
    BUDGET_ALERTS: true,
    GOAL_TRACKING: true,
    TAX_CALCULATOR: true
  },

  // PWA configuration
  PWA: {
    SILENT_UPDATES: true, // Enable silent auto-updates without user notifications
    UPDATE_CHECK_INTERVAL: 30 * 60 * 1000, // 30 minutes
    MOBILE_UPDATE_INTERVAL: 30 * 60 * 1000, // 30 minutes for mobile
    DESKTOP_UPDATE_INTERVAL: 6 * 60 * 60 * 1000, // 6 hours for desktop
    AUTO_ACTIVATE_UPDATES: true, // Automatically activate updates when available
    PRESERVE_USER_DATA: true // Preserve user data during updates
  }
} as const;

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // User endpoints
  USER: {
    PROFILE: '/api/user/profile',
    PREFERENCES: '/api/user/preferences',
    SUBSCRIPTION: '/api/user/subscription'
  },

  // Transaction endpoints
  TRANSACTIONS: {
    LIST: '/api/transactions',
    CREATE: '/api/transactions',
    UPDATE: '/api/transactions/:id',
    DELETE: '/api/transactions/:id',
    BULK: '/api/transactions/bulk',
    EXPORT: '/api/transactions/export'
  },

  // Account endpoints
  ACCOUNTS: {
    LIST: '/api/accounts',
    CREATE: '/api/accounts',
    UPDATE: '/api/accounts/:id',
    DELETE: '/api/accounts/:id',
    BALANCE: '/api/accounts/:id/balance'
  },

  // Category endpoints
  CATEGORIES: {
    LIST: '/api/categories',
    CREATE: '/api/categories',
    UPDATE: '/api/categories/:id',
    DELETE: '/api/categories/:id'
  },

  // Budget endpoints
  BUDGETS: {
    LIST: '/api/budgets',
    CREATE: '/api/budgets',
    UPDATE: '/api/budgets/:id',
    DELETE: '/api/budgets/:id',
    PROGRESS: '/api/budgets/:id/progress'
  },

  // Goal endpoints
  GOALS: {
    LIST: '/api/goals',
    CREATE: '/api/goals',
    UPDATE: '/api/goals/:id',
    DELETE: '/api/goals/:id',
    PROGRESS: '/api/goals/:id/progress'
  },

  // Report endpoints
  REPORTS: {
    SUMMARY: '/api/reports/summary',
    EXPENSES: '/api/reports/expenses',
    INCOME: '/api/reports/income',
    TRENDS: '/api/reports/trends',
    CHARTS: '/api/reports/charts'
  }
} as const;

/**
 * Error messages configuration
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    WEAK_PASSWORD: 'Password is too weak',
    TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again later',
    SESSION_EXPIRED: 'Session expired. Please login again'
  },

  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_AMOUNT: 'Please enter a valid amount',
    INVALID_DATE: 'Please enter a valid date',
    MIN_LENGTH: 'Minimum length is {min} characters',
    MAX_LENGTH: 'Maximum length is {max} characters',
    INVALID_FORMAT: 'Invalid format'
  },

  // Network errors
  NETWORK: {
    CONNECTION_ERROR: 'Connection error. Please check your internet connection',
    TIMEOUT: 'Request timeout. Please try again',
    SERVER_ERROR: 'Server error. Please try again later',
    OFFLINE: 'You are offline. Changes will be saved locally'
  },

  // Permission errors
  PERMISSION: {
    ACCESS_DENIED: 'Access denied',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    FEATURE_NOT_AVAILABLE: 'This feature is not available in your plan'
  }
} as const;

/**
 * Success messages configuration
 */
export const SUCCESS_MESSAGES = {
  // General success messages
  GENERAL: {
    SAVED: 'Changes saved successfully',
    DELETED: 'Item deleted successfully',
    CREATED: 'Item created successfully',
    UPDATED: 'Item updated successfully'
  },

  // Authentication success messages
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTRATION_SUCCESS: 'Registration successful',
    PASSWORD_CHANGED: 'Password changed successfully'
  },

  // Transaction success messages
  TRANSACTIONS: {
    CREATED: 'Transaction created successfully',
    UPDATED: 'Transaction updated successfully',
    DELETED: 'Transaction deleted successfully',
    BULK_IMPORTED: 'Transactions imported successfully'
  }
} as const; 



export const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];


// Available icons for category selection
export const CATEGORY_ICONS: string[] = [
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
export const CATEGORY_COLORS: string[] = [
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