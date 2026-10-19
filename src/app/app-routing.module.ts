import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './util/guard/auth.guard';
import { familyModeGuard } from './util/guard/family-mode.guard';
import { rootGuard } from './util/guard/root.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootGuard],
    children: []
  },
  {
    path: 'shell',
    loadComponent: () => import('./app-shell/app-shell.component').then(m => m.AppShellComponent),
    title: 'App Shell',
    data: {
      seo: {
        title: 'Family Expense Tracker Shell',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'feedback',
    loadComponent: () => import('./component/landing/contact-form/contact-form.component').then(m => m.ContactFormComponent),
    title: 'Feedback',
    data: {
      seo: {
        title: 'Feedback & Support | Family Expense Tracker',
        description: 'Send feedback, ask questions, or request support for the Family Expense Tracker app.',
        robots: 'index, follow',
        canonicalPath: 'feedback'
      }
    }
  },
  {
    path: 'landing',
    loadComponent: () => import('./component/landing/landing.component').then(m => m.LandingComponent),
    title: 'Welcome',
    data: {
      seo: {
        title: 'Family Expense Tracker - Personal Finance & Budget Planner',
        description: 'Free, privacy-focused family expense tracker and personal finance manager. Track daily expenses, plan budgets, analyze spending trends, and organize accounts offline and online.',
        keywords: 'family expense tracker, personal finance app, budget planner, expense manager, financial analytics, offline finance app, PWA expense tracker',
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        canonicalPath: 'landing'
      }
    }
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./component/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
    title: 'Privacy Policy',
    data: {
      seo: {
        title: 'Privacy Policy | Family Expense Tracker',
        description: 'Learn how Family Expense Tracker protects your personal financial data. Transparent privacy practices, local-first storage, and secure encryption.',
        robots: 'index, follow',
        canonicalPath: 'privacy-policy'
      }
    }
  },
  {
    path: 'terms-conditions',
    loadComponent: () => import('./component/terms-conditions/terms-conditions.component').then(m => m.TermsConditionsComponent),
    title: 'Terms & Conditions',
    data: {
      seo: {
        title: 'Terms & Conditions | Family Expense Tracker',
        description: 'Review the terms and conditions for using Family Expense Tracker app.',
        robots: 'index, follow',
        canonicalPath: 'terms-conditions'
      }
    }
  },
  {
    path: 'offline',
    loadComponent: () => import('./util/components/offline-page/offline-page.component').then(m => m.OfflinePageComponent),
    title: 'Offline',
    data: {
      seo: {
        title: 'Offline | Family Expense Tracker',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'data-deletion',
    loadComponent: () => import('./component/data-deletion/data-deletion.component').then(m => m.DataDeletionComponent),
    title: 'Data Deletion',
    data: {
      seo: {
        title: 'Data Deletion Instructions | Family Expense Tracker',
        description: 'Instructions for requesting permanent account and financial data deletion from Family Expense Tracker in compliance with privacy regulations.',
        robots: 'index, follow',
        canonicalPath: 'data-deletion'
      }
    }
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./component/auth/sign-in/sign-in.component').then(m => m.SignInComponent),
    title: 'Sign In',
    data: {
      seo: {
        title: 'Sign In | Family Expense Tracker',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./component/auth/sign-in/sign-in.component').then(m => m.SignInComponent),
    title: 'Sign Up',
    data: {
      seo: {
        title: 'Sign Up | Family Expense Tracker',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./component/auth/registration/registration.component').then(m => m.RegistrationComponent),
    title: 'Register',
    data: {
      seo: {
        title: 'Create Account | Family Expense Tracker',
        robots: 'noindex, nofollow'
      }
    }
  },

  {
    path: 'setup',
    loadComponent: () => import('./component/setup-wizard/setup-wizard.component').then(m => m.SetupWizardComponent),
    title: 'Setup Wizard',
    canActivate: [authGuard],
    data: {
      seo: {
        title: 'Setup Wizard | Family Expense Tracker',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./component/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard',
    canActivate: [authGuard],
    data: {
      requireEmailVerification: true,
      requireActiveSession: true,
      title: 'Dashboard'
    },

    children: [
      {
        path: '',
        loadComponent: () => import('./component/dashboard/home/home.component').then(m => m.HomeComponent),
        title: 'Home',
        canActivate: [familyModeGuard]
      },
      {
        path: 'sync-to-cloud',
        loadComponent: () => import('./component/sync-to-cloud/sync-to-cloud.component').then(m => m.SyncToCloudComponent),
        title: 'Sync to Cloud'
      },
      {
        path: 'home',
        loadComponent: () => import('./component/dashboard/home/home.component').then(m => m.HomeComponent),
        title: 'Home',
        canActivate: [familyModeGuard]
      },
      {
        path: 'accounts',
        loadComponent: () => import('./component/dashboard/accounts/accounts.component').then(m => m.AccountsComponent),
        title: 'Accounts',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Accounts'
        }
      },
      {
        path: 'category',
        loadComponent: () => import('./component/dashboard/category/category.component').then(m => m.CategoryComponent),
        title: 'Categories',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Categories'
        }
      },
      {
        path: 'transactions',
        loadComponent: () => import('./component/dashboard/transaction-list/transaction-list.component').then(m => m.TransactionListComponent),
        title: 'Transactions',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Transactions'
        }
      },
      {
        path: 'subscription',
        loadComponent: () => import('./component/dashboard/subscription/subscription.component').then(m => m.SubscriptionComponent),
        title: 'Subscriptions',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Subscriptions'
        }
      },
      {
        path: 'goals',
        loadComponent: () => import('./component/dashboard/goals/goals.component').then(m => m.GoalsComponent),
        title: 'Goals',
        data: {
          roles: ['premium', 'admin'],
          requireEmailVerification: true,
          title: 'Goals'
        }
      },
      {
        path: 'family',
        loadChildren: () => import('./modules/family/family.module').then(m => m.FamilyModule),
        title: 'Family',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Family'
        }
      },
      {
        path: 'import',
        loadComponent: () => import('./component/dashboard/transaction-list/add-transaction/import-transactions.component')
          .then(m => m.ImportTransactionsComponent),
        title: 'Import Transactions',
        data: {
          roles: ['premium', 'admin'],
          requireEmailVerification: true,
          title: 'Import Transactions'
        }
      },
      {
        path: 'profile',
        loadComponent: () => import('./component/dashboard/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Profile'
        }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./util/components/notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
        title: 'Notifications',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Notifications'
        }
      },
      {
        path: 'feedback',
        loadComponent: () => import('./component/feedback/feedback.component').then(m => m.FeedbackComponent),
        title: 'Feedback',
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true,
          title: 'Feedback'
        }
      },
      {
        path: '',
        loadChildren: () => import('./modules/features/features.module').then(m => m.FeaturesModule)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
