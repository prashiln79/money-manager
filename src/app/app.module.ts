import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';

// Firebase Imports
import { environment } from '@env/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// Service Worker
import { ServiceWorkerModule } from '@angular/service-worker';

// Utility Modules
import { IconModule } from './util/icon.module';

// Components
import { TotalBalanceComponent } from './component/dashboard/total-balance/total-balance.component';
import { CalendarViewComponent } from './component/dashboard/calendar-view/calendar-view.component';
import { TransactionListComponent } from './component/dashboard/transaction-list/transaction-list.component';
import { AddTransactionComponent } from './component/dashboard/transaction-list/add-transaction/add-transaction.component';
import { HeaderComponent } from './component/dashboard/header/header.component';
import { SideBarComponent } from './component/dashboard/side-bar/side-bar.component';
import { TransactionComponent } from './component/dashboard/transaction-list/add-transaction/transaction/transaction.component';
import { SignInComponent } from './component/auth/sign-in/sign-in.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { UserComponent } from './component/dashboard/header/user/user.component';
import { AccountsComponent } from './component/dashboard/accounts/accounts.component';
import { BudgetsComponent } from './component/dashboard/budgets/budgets.component';
import { GoalsComponent } from './component/dashboard/goals/goals.component';
import { SubscriptionComponent } from './component/dashboard/subscription/subscription.component';

@NgModule({
  declarations: [
    AppComponent,
    TotalBalanceComponent,
    CalendarViewComponent,
    TransactionListComponent,
    AddTransactionComponent,
    HeaderComponent,
    SideBarComponent,
    TransactionComponent,
    SignInComponent,
    DashboardComponent,
    UserComponent,
    AccountsComponent,
    BudgetsComponent,
    GoalsComponent,
    SubscriptionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,

    // Material Modules
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatSelectModule,
    MatToolbarModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
    MatDatepickerModule,

    // Utility
    IconModule,

    // Service Worker
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
