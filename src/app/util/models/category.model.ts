export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  createdAt: number;
}

// Available icons for category selection
export const AVAILABLE_ICONS: string[] = [
  'shopping_cart', 'restaurant', 'local_gas_station', 'home', 'directions_car',
  'flight', 'hotel', 'local_hospital', 'school', 'work', 'sports_esports',
  'movie', 'music_note', 'fitness_center', 'pets', 'child_care', 'elderly',
  'celebration', 'card_giftcard', 'local_offer', 'account_balance', 'trending_up',
  'attach_money', 'account_balance_wallet', 'credit_card', 'savings', 'payments',
  'receipt', 'receipt_long', 'description', 'category', 'label', 'bookmark',
  'favorite', 'star', 'thumb_up', 'thumb_down', 'check_circle', 'cancel',
  'warning', 'info', 'help', 'settings', 'build', 'tune', 'filter_list',
  'add', 'remove', 'edit', 'delete', 'save', 'cancel', 'close', 'check',
  'arrow_back', 'arrow_forward', 'arrow_upward', 'arrow_downward', 'arrow_drop_up',
  'arrow_drop_down', 'arrow_drop_left', 'arrow_drop_right', 'arrow_back_ios',
  'arrow_forward_ios', 'arrow_upward_ios', 'arrow_downward_ios', 'arrow_drop_up_ios',
  'arrow_drop_down_ios', 'arrow_drop_left_ios', 'arrow_drop_right_ios', 'arrow_back_ios_new',
  'arrow_forward_ios_new', 'arrow_upward_ios_new', 'arrow_downward_ios_new', 'arrow_drop_up_ios_new',
  'home', 'favorite', 'bookmark', 'star', 'thumb_up', 'thumb_down',
  'check_circle', 'cancel', 'warning', 'info', 'help', 'settings', 'build', 'tune', 'filter_list',
  'add', 'remove', 'edit', 'delete', 'save', 'cancel', 'close', 'check',
  'arrow_back', 'arrow_forward',
];

// Available colors for category selection
export const AVAILABLE_COLORS: string[] = [
  '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FF5722', '#795548',
  '#607D8B', '#E91E63', '#3F51B5', '#009688', '#FFC107', '#8BC34A', '#FFEB3B', '#CDDC39',
  '#FF4081', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE',
  '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40', '#FF3D00', '#D50000'
]; 

export const defaultCategoriesForNewUser: Category[] = [
	{ name: "Salary", type: "income", color: "#4CAF50", icon: "work", createdAt: Date.now() },
	{ name: "Freelance", type: "income", color: "#2196F3", icon: "computer", createdAt: Date.now() },
	{ name: "Investment", type: "income", color: "#FF9800", icon: "trending_up", createdAt: Date.now() },
	{ name: "Food & Dining", type: "expense", color: "#F44336", icon: "restaurant", createdAt: Date.now() },
	{ name: "Transportation", type: "expense", color: "#9C27B0", icon: "directions_car", createdAt: Date.now() },
	{ name: "Shopping", type: "expense", color: "#E91E63", icon: "shopping_cart", createdAt: Date.now() },
	{ name: "Bills & Utilities", type: "expense", color: "#607D8B", icon: "receipt", createdAt: Date.now() },
	{ name: "Healthcare", type: "expense", color: "#00BCD4", icon: "local_hospital", createdAt: Date.now() },
	{ name: "Entertainment", type: "expense", color: "#FF5722", icon: "movie", createdAt: Date.now() },
	{ name: "Education", type: "expense", color: "#3F51B5", icon: "school", createdAt: Date.now() },
];
