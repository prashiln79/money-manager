export interface SidebarNavChild {
  label: string;
  route: string;
  icon: string;
  order: number;
}

export interface SidebarNavParent {
  label: string;
  icon: string;
  order: number;
  children: SidebarNavChild[];
  isExpanded?: boolean;
  isCollapsible?: boolean;
}

export const SIDEBAR_NAVIGATION_CONFIG: SidebarNavParent[] = [
  {
    label: 'Navigation',
    icon: 'navigation',
    order: 1,
    isExpanded: true,
    isCollapsible: true,
    children: [
      {
        label: 'dashboard',
        route: 'home',
        icon: 'dashboard',
        order: 1
      },
      {
        label: 'accounts',
        route: 'accounts',
        icon: 'account_balance',
        order: 2
      },
      {
        label: 'transactions',
        route: 'transactions',
        icon: 'receipt_long',
        order: 3
      },
      {
        label: 'categories',
        route: 'category',
        icon: 'category',
        order: 4
      },
      {
        label: 'budgets',
        route: 'budgets',
        icon: 'pie_chart',
        order: 5
      },
      // {
      //   label: 'goals',
      //   route: 'goals',
      //   icon: 'flag',
      //   order: 6
      // },
      {
        label: 'reports',
        route: 'reports',
        icon: 'analytics',
        order: 7
      }
    ]
  },
  {
    label: 'Tools',
    icon: 'build',
    order: 2,
    isExpanded: true,
    isCollapsible: true,
    children: [
      {
        label: 'calendar',
        route: 'calendar-view',
        icon: 'calendar_today',
        order: 1
      },
      {
        label: 'notes',
        route: 'notes',
        icon: 'note',
        order: 2
      },
      {
        label: 'tax',
        route: 'tax',
        icon: 'calculate',
        order: 3
      }
    ]
  },
  {
    label: 'Account',
    icon: 'person',
    order: 3,
    isExpanded: true,
    isCollapsible: true,
    children: [
      {
        label: 'profile',
        route: 'profile',
        icon: 'account_circle',
        order: 1
      },
      {
        label: 'subscription',
        route: 'subscription',
        icon: 'card_membership',
        order: 2
      }
    ]
  }
];

export const getAllNavigationItems = (): SidebarNavParent[] => {
  return SIDEBAR_NAVIGATION_CONFIG.sort((a, b) => a.order - b.order);
};

export const getNavigationSection = (): SidebarNavParent | undefined => {
  return SIDEBAR_NAVIGATION_CONFIG.find(section => section.label === 'Navigation');
};

export const getToolsSection = (): SidebarNavParent | undefined => {
  return SIDEBAR_NAVIGATION_CONFIG.find(section => section.label === 'Tools');
}; 