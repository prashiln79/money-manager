import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NotificationService } from '../service/notification.service';
import { LoaderService } from '../service/loader.service';
import { FilterService } from '../service/filter.service';
import { DateService } from '../service/date.service';
import { BreakpointService } from '../service/breakpoint.service';
import { TransactionsService } from '../service/db/transactions.service';
import { AccountsService } from '../service/db/accounts.service';
import { CategoryService } from '../service/db/category.service';
import { UserService } from '../service/db/user.service';
import { SubscriptionService } from '../service/subscription.service';
import { of } from 'rxjs';

export class TestSetup {
  static getMockAuth() {
    return jasmine.createSpyObj('Auth', [], {
      currentUser: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    });
  }

  static getMockFirestore() {
    return jasmine.createSpyObj('Firestore', ['collection', 'doc'], {
      collection: jasmine.createSpy('collection').and.returnValue({
        doc: jasmine.createSpy('doc').and.returnValue({
          get: jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: () => ({}) })),
          set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
          update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
          delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
        })
      })
    });
  }

  static getMockStore() {
    return jasmine.createSpyObj('Store', ['dispatch', 'select'], {
      select: of([]),
      dispatch: jasmine.createSpy('dispatch')
    });
  }

  static getMockMatDialog() {
    return jasmine.createSpyObj('MatDialog', ['open'], {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of(null)
      })
    });
  }

  static getMockRouter() {
    return jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl'], {
      url: '/test',
      navigate: jasmine.createSpy('navigate'),
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    });
  }

  static getMockActivatedRoute() {
    return {
      params: of({}),
      queryParams: of({}),
      snapshot: {
        params: {},
        queryParams: {}
      }
    };
  }

  static getMockBreakpointObserver() {
    return jasmine.createSpyObj('BreakpointObserver', ['observe'], {
      observe: of({ matches: false })
    });
  }

  static getMockNotificationService() {
    return jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);
  }

  static getMockLoaderService() {
    return jasmine.createSpyObj('LoaderService', ['show', 'hide']);
  }

  static getMockFilterService() {
    return jasmine.createSpyObj('FilterService', [
      'clearAllFilters',
      'hasActiveFilters',
      'getActiveFiltersCount',
      'getCurrentFilterState',
      'filterTransactions',
      'filterCurrentYearTransactions',
      'getSelectedCategory',
      'getSelectedType',
      'getSelectedDate',
      'getSelectedDateRange',
      'getCategoryFilter',
      'getAccountFilter',
      'getAmountRange',
      'getStatusFilter',
      'getTags'
    ], {
      filterState$: of({}),
      hasActiveFilters: false,
      getActiveFiltersCount: 0,
      getCurrentFilterState: {},
      filterTransactions: [],
      filterCurrentYearTransactions: []
    });
  }

  static getMockDateService() {
    return jasmine.createSpyObj('DateService', ['toDate', 'now', 'formatDate'], {
      toDate: new Date(),
      now: { toDate: () => new Date() },
      formatDate: '2024-01-01'
    });
  }

  static getMockBreakpointService() {
    return jasmine.createSpyObj('BreakpointService', ['isMobile', 'isTablet', 'isDesktop'], {
      device: {
        isMobile: false,
        isTablet: false,
        isDesktop: true
      },
      isMobile: false,
      isTablet: false,
      isDesktop: true
    });
  }

  static getMockTransactionsService() {
    return jasmine.createSpyObj('TransactionsService', [
      'getTransactions',
      'addTransaction',
      'updateTransaction',
      'deleteTransaction',
      'bulkUpdateCategory',
      'bulkDeleteTransactions'
    ], {
      getTransactions: of([]),
      addTransaction: Promise.resolve(),
      updateTransaction: Promise.resolve(),
      deleteTransaction: Promise.resolve(),
      bulkUpdateCategory: Promise.resolve(),
      bulkDeleteTransactions: Promise.resolve()
    });
  }

  static getMockAccountsService() {
    return jasmine.createSpyObj('AccountsService', [
      'getAccounts',
      'addAccount',
      'updateAccount',
      'deleteAccount'
    ], {
      getAccounts: of([]),
      addAccount: Promise.resolve(),
      updateAccount: Promise.resolve(),
      deleteAccount: Promise.resolve()
    });
  }

  static getMockCategoryService() {
    return jasmine.createSpyObj('CategoryService', [
      'getCategories',
      'addCategory',
      'updateCategory',
      'deleteCategory'
    ], {
      getCategories: of([]),
      addCategory: Promise.resolve(),
      updateCategory: Promise.resolve(),
      deleteCategory: Promise.resolve()
    });
  }

  static getMockUserService() {
    return jasmine.createSpyObj('UserService', [
      'getCurrentUser',
      'updateProfile',
      'deleteAccount'
    ], {
      getCurrentUser: of({}),
      updateProfile: Promise.resolve(),
      deleteAccount: Promise.resolve()
    });
  }

  static getMockSubscriptionService() {
    return jasmine.createSpyObj('SubscriptionService', [
      'getSubscription',
      'createSubscription',
      'cancelSubscription'
    ], {
      getSubscription: of({}),
      createSubscription: Promise.resolve(),
      cancelSubscription: Promise.resolve()
    });
  }

  static getCommonProviders() {
    return [
      { provide: Auth, useValue: TestSetup.getMockAuth() },
      { provide: Firestore, useValue: TestSetup.getMockFirestore() },
      { provide: Store, useValue: TestSetup.getMockStore() },
      { provide: MatDialog, useValue: TestSetup.getMockMatDialog() },
      { provide: Router, useValue: TestSetup.getMockRouter() },
      { provide: ActivatedRoute, useValue: TestSetup.getMockActivatedRoute() },
      { provide: BreakpointObserver, useValue: TestSetup.getMockBreakpointObserver() },
      { provide: NotificationService, useValue: TestSetup.getMockNotificationService() },
      { provide: LoaderService, useValue: TestSetup.getMockLoaderService() },
      { provide: FilterService, useValue: TestSetup.getMockFilterService() },
      { provide: DateService, useValue: TestSetup.getMockDateService() },
      { provide: BreakpointService, useValue: TestSetup.getMockBreakpointService() },
      { provide: TransactionsService, useValue: TestSetup.getMockTransactionsService() },
      { provide: AccountsService, useValue: TestSetup.getMockAccountsService() },
      { provide: CategoryService, useValue: TestSetup.getMockCategoryService() },
      { provide: UserService, useValue: TestSetup.getMockUserService() },
      { provide: SubscriptionService, useValue: TestSetup.getMockSubscriptionService() }
    ];
  }

  static configureTestingModule(declarations: any[] = [], imports: any[] = [], providers: any[] = []) {
    return TestBed.configureTestingModule({
      declarations,
      imports,
      providers: [...TestSetup.getCommonProviders(), ...providers]
    });
  }
} 