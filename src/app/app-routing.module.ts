import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignInComponent } from './component/auth/sign-in/sign-in.component';
import { RegistrationComponent } from './component/auth/registration/registration.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { AuthGuard } from './util/guard/auth.guard';
import { AccountsComponent } from './component/dashboard/accounts/accounts.component';
import { CategoryComponent } from './component/dashboard/category/category.component';
import { HomeComponent } from './component/dashboard/home/home.component';
import { ReportsComponent } from './component/dashboard/reports/reports.component';
import { TransactionListComponent } from './component/dashboard/transaction-list/transaction-list.component';
import { LandingComponent } from './component/landing/landing.component';
import { TaxComponent } from './component/dashboard/tax/tax.component';
import { SubscriptionComponent } from './component/dashboard/subscription/subscription.component';
import { GoalsComponent } from './component/dashboard/goals/goals.component';
import { BudgetsComponent } from './component/dashboard/budgets/budgets.component';
import { NotesComponent } from './component/dashboard/notes/notes.component';
import { ImportTransactionsComponent } from './component/dashboard/transaction-list/add-transaction';
import { ProfileComponent } from './component/dashboard/profile/profile.component';

const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignInComponent },
  { path: 'register', component: RegistrationComponent },

  {
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    data: {
      requireEmailVerification: true,
      requireActiveSession: true
    },

    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { 
        path: 'accounts', 
        component: AccountsComponent,
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'category', 
        component: CategoryComponent,
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'reports', 
        component: ReportsComponent,
        data: {
          roles: ['premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'transactions', 
        component: TransactionListComponent,
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'tax', 
        component: TaxComponent,
        data: {
          roles: ['premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'subscription', 
        component: SubscriptionComponent,
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'goals', 
        component: GoalsComponent,
        data: {
          roles: ['premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'budgets', 
        component: BudgetsComponent,
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'notes', 
        component: NotesComponent,
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'import', 
        component: ImportTransactionsComponent,
        data: {
          roles: ['premium', 'admin'],
          requireEmailVerification: true
        }
      },
      { 
        path: 'profile', 
        component: ProfileComponent,
        data: {
          roles: ['free', 'premium', 'admin'],
          requireEmailVerification: true
        }
      }
    ]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
