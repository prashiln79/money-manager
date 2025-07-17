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
        route: '/dashboard/home',
        icon: 'dashboard',
        order: 1
      },
      {
        label: 'accounts',
        route: '/dashboard/accounts',
        icon: 'account_balance',
        order: 2
      },
      {
        label: 'transactions',
        route: '/dashboard/transactions',
        icon: 'receipt_long',
        order: 3
      },
      {
        label: 'categories',
        route: '/dashboard/category',
        icon: 'category',
        order: 4
      },
      // {
      //   label: 'budgets',
      //   route: '/dashboard/budgets',
      //   icon: 'pie_chart',
      //   order: 5
      // },
      // {
      //   label: 'goals',
      //   route: '/dashboard/goals',
      //   icon: 'flag',
      //   order: 6
      // },
      {
        label: 'reports',
        route: '/dashboard/reports',
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
      // {
      //   label: 'calendar',
      //   route: '/dashboard/calendar-view',
      //   icon: 'calendar_today',
      //   order: 1
      // },
      // {
      //   label: 'notes',
      //   route: '/dashboard/notes',
      //   icon: 'note',
      //   order: 2
      // },
      {
        label: 'tax',
        route: '/dashboard/tax',
        icon: 'calculate',
        order: 3
      },
      {
        label: 'Splitwise',
        route: '/dashboard/splitwise',
        icon: 'group',
        order: 4
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
        label: 'Profile',
        route: '/dashboard/profile',
        icon: 'account_circle',
        order: 1
      },
      // {
      //   label: 'subscription',
      //   route: '/dashboard/subscription',
      //   icon: 'card_membership',
      //   order: 2
      // },
      {
        label: 'Notifications',
        route: '/dashboard/notifications',
        icon: 'notifications',
        order: 3
      },
      {
        label: 'Feedback',
        route: '/dashboard/feedback',
        icon: 'feedback',
        order: 4
      }
    ]
  },
  {
    label: 'Admin',
    icon: 'admin_panel_settings',
    order: 4,
    isExpanded: false,
    isCollapsible: true,
    children: [
      {
        label: 'admin_panel',
        route: '/admin',
        icon: 'admin_panel_settings',
        order: 1
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