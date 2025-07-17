import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

// ngx-papaparse
import { Papa } from 'ngx-papaparse';

// ngx-echarts
import { NgxEchartsModule } from 'ngx-echarts';

// Firebase Imports
import { environment } from '@env/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, indexedDBLocalPersistence } from '@angular/fire/auth';
import { provideFirestore, getFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';

// Service Worker
import { ServiceWorkerModule } from '@angular/service-worker';

// Utility Modules
import { IconModule } from './util/icon.module';

// Directives
import { ClickOutsideDirective } from './util/directives/click-outside.directive';

// Components
import { TotalBalanceComponent } from './component/dashboard/total-balance/total-balance.component';
import { CalendarViewComponent } from './component/dashboard/calendar-view/calendar-view.component';
import { TransactionListComponent } from './component/dashboard/transaction-list/transaction-list.component';
import { HeaderComponent } from './component/dashboard/header/header.component';
import { SideBarComponent } from './component/dashboard/side-bar/side-bar.component';
import { MobileAddTransactionComponent } from './component/dashboard/transaction-list/add-transaction/mobile-add-transaction/mobile-add-transaction.component';
import { MobileCategoryAddEditPopupComponent } from './component/dashboard/category/mobile-category-add-edit-popup/mobile-category-add-edit-popup.component';
import { IconSelectorDialogComponent } from './component/dashboard/category/icon-selector-dialog/icon-selector-dialog.component';
import { ColorSelectorDialogComponent } from './component/dashboard/category/color-selector-dialog/color-selector-dialog.component';
import { CategoryBudgetDialogComponent } from './component/dashboard/category/category-budget-dialog/category-budget-dialog.component';
import { SignInComponent } from './component/auth/sign-in/sign-in.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { UserComponent } from './component/dashboard/header/user/user.component';
import { AccountsComponent } from './component/dashboard/accounts/accounts.component';
import { BudgetsComponent } from './component/dashboard/budgets/budgets.component';
import { GoalsComponent } from './component/dashboard/goals/goals.component';
import { SubscriptionComponent } from './component/dashboard/subscription/subscription.component';
import { CategoryComponent } from './component/dashboard/category/category.component';
import { LoaderComponent } from './util/components/loader/loader.component';
import { HomeComponent } from './component/dashboard/home/home.component';
import { ConfirmDialogComponent } from './util/components/confirm-dialog/confirm-dialog.component';
import { ImportTransactionsComponent } from './component/dashboard/transaction-list/add-transaction/import-transactions.component';
import { ReportsComponent } from './component/dashboard/reports/reports.component';
import { TaxComponent } from './component/dashboard/tax/tax.component';
import { NotesComponent } from './component/dashboard/notes/notes.component';
import { LanguageSwitcherComponent } from './util/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from './util/components/theme-toggle/theme-toggle.component';
import { TranslatePipe } from './util/pipes/translate.pipe';
import { MobileTransactionListComponent } from './component/dashboard/transaction-list/mobile-transaction-list/mobile-transaction-list.component';
import { SearchFilterComponent } from './component/dashboard/transaction-list/search-filter/search-filter.component';
import { TransactionTableComponent } from './component/dashboard/transaction-list/transaction-table/transaction-table.component';
import { RegistrationComponent } from './component/auth/registration/registration.component';
import { OfflineIndicatorComponent } from './util/components/offline-indicator/offline-indicator.component';
import { OfflinePageComponent } from './util/components/offline-page/offline-page.component';
import { FooterComponent } from './component/dashboard/footer/footer.component';
import { MobileAccountComponent } from './component/dashboard/accounts/mobile-account/mobile-account.component';
import { AddAccountDialogComponent } from './component/dashboard/accounts/add-account-dialog/add-account-dialog.component';
import { MobileAccountsListComponent } from './component/dashboard/accounts/mobile-accounts-list/mobile-accounts-list.component';
import { LandingComponent } from './component/landing/landing.component';
import { CustomDateRangeDialogComponent } from './util/components/custom-date-range-dialog';
import { ProfileComponent } from './component/dashboard/profile/profile.component';
import { FeedbackComponent } from './component/feedback/feedback.component';

// Notification Components
import { NotificationSettingsComponent } from './util/components/notification-settings/notification-settings.component';

// Splitwise Module
import { SplitwiseModule } from './modules/splitwise/splitwise.module';

// PWA Components
import { PwaBackButtonComponent } from './util/components/pwa-back-button/pwa-back-button.component';
import { PwaNavigationBarComponent } from './util/components/pwa-navigation-bar/pwa-navigation-bar.component';
import { PwaInstallPromptComponent } from './util/components/pwa-install-prompt/pwa-install-prompt.component';


// NgRx Store
import { AppStoreModule } from './store';
import { CurrencyPipe } from './util/pipes';

// Security
import { securityInterceptor } from './util/interceptors/security.interceptor';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    AppComponent,
    TotalBalanceComponent,
    CalendarViewComponent,
    TransactionListComponent,
    HeaderComponent,
    SideBarComponent,
    MobileAddTransactionComponent,
    MobileCategoryAddEditPopupComponent,
    IconSelectorDialogComponent,
    ColorSelectorDialogComponent,
    CategoryBudgetDialogComponent,
    SignInComponent,
    RegistrationComponent,
    DashboardComponent,
    UserComponent,
    AccountsComponent,
    BudgetsComponent,
    GoalsComponent,
    SubscriptionComponent,
    CategoryComponent,
    HomeComponent,
    ConfirmDialogComponent,
    ImportTransactionsComponent,
    ReportsComponent,
    TaxComponent,
    NotesComponent,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
    MobileTransactionListComponent,
    TransactionTableComponent,
    SearchFilterComponent,
    OfflineIndicatorComponent,
    OfflinePageComponent,
    FooterComponent,
    ClickOutsideDirective,
    PwaBackButtonComponent,
    PwaNavigationBarComponent,
    PwaInstallPromptComponent,
    MobileAccountComponent,
    AddAccountDialogComponent,
    MobileAccountsListComponent,
    LandingComponent,
    CustomDateRangeDialogComponent,
    ProfileComponent,
    NotificationSettingsComponent,
    FeedbackComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,

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
    MatSortModule,
    MatPaginatorModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatExpansionModule,
    MatDividerModule,

    // Utility
    IconModule,
    TranslatePipe,
    CurrencyPipe,
    
    // Charts
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    
    // NgRx Store
    AppStoreModule,
    
    // Splitwise Module
    SplitwiseModule,
    
    // Enhanced Service Worker with offline support
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
      scope: './'
    }),
         RouterModule,
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([securityInterceptor])),
    Papa,
    provideClientHydration(),

    // Firebase Initialization
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),

    // Auth with IndexedDB Persistence
    provideAuth(() => {
      const auth = getAuth();
      auth.setPersistence(indexedDBLocalPersistence)
        .then(() => console.log("✅ Auth persistence enabled"))
        .catch((error) => console.warn("⚠️ Auth persistence error:", error.message));
      return auth;
    }),

    // Firestore with IndexedDB Persistence (Improved)
    provideFirestore(() => {
      const firestore = getFirestore();

      enableIndexedDbPersistence(firestore).then(() => {
        console.log("✅ Firestore offline persistence enabled");
      }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("⚠️ Multiple tabs detected. Persistence disabled to avoid conflicts.");
        } else if (err.code === 'unimplemented') {
          console.warn("⚠️ IndexedDB persistence not supported. Falling back to cache.");
        }
      });

      return firestore;
    }),

    // Firebase Cloud Messaging
    provideMessaging(() => {
      const messaging = getMessaging();
      console.log("✅ Firebase Cloud Messaging initialized");
      return messaging;
    }),

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
