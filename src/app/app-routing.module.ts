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

const routes: Routes = [
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: RegistrationComponent },
  { path: 'register', component: RegistrationComponent },

  {
    path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard],

    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'accounts', component: AccountsComponent },
      { path: 'category', component: CategoryComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'transactions', component: TransactionListComponent },
    ]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' } // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
