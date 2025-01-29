import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatCardModule } from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { IconModule } from './util/icon.module';
import { provideHttpClient } from '@angular/common/http';
import { TotalBalanceComponent } from './component/dashboard/total-balance/total-balance.component';
import { CalendarViewComponent } from './component/dashboard/calendar-view/calendar-view.component';
import { TransactionListComponent } from './component/dashboard/transaction-list/transaction-list.component';
import { AddTransactionComponent } from './component/dashboard/transaction-list/add-transaction/add-transaction.component';
import { HeaderComponent } from './component/dashboard/header/header.component';
import { SideBarComponent } from './component/dashboard/side-bar/side-bar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { TransactionComponent } from './component/dashboard/transaction-list/add-transaction/transaction/transaction.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { environment } from '@env/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { SignInComponent } from './component/auth/sign-in/sign-in.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { UserComponent } from './component/dashboard/header/user/user.component';

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
    UserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    IconModule,
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
    AngularFireModule.initializeApp(environment.firebaseConfig),

     AngularFireAuthModule, // Firebase Authentication
    // AngularFireDatabaseModule, // Firebase Realtime Database
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    provideAnimationsAsync(),
    MatDatepickerModule,
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
