import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TransactionListComponent } from './transaction-list.component';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { NotificationService } from 'src/app/util/service/notification.service';
import { LoaderService } from 'src/app/util/service/loader.service';
import { FilterService } from 'src/app/util/service/filter.service';
import { DateService } from 'src/app/util/service/date.service';
import { BreakpointService } from 'src/app/util/service/breakpoint.service';
import { Router } from '@angular/router';
import { TransactionsService } from 'src/app/util/service/transactions.service';
import { of } from 'rxjs';
import { Transaction } from 'src/app/util/models/transaction.model';
import { TransactionType, TransactionStatus, SyncStatus } from 'src/app/util/config/enums';
import * as TransactionsActions from '../../../store/transactions/transactions.actions';
import * as CategoriesActions from '../../../store/categories/categories.actions';

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockStore: jasmine.SpyObj<Store>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockLoaderService: jasmine.SpyObj<LoaderService>;
  let mockFilterService: jasmine.SpyObj<FilterService>;
  let mockDateService: jasmine.SpyObj<DateService>;
  let mockBreakpointService: jasmine.SpyObj<BreakpointService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTransactionsService: jasmine.SpyObj<TransactionsService>;

  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com'
  };

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      amount: 50,
      payee: 'Grocery Store',
      categoryId: '1',
      category: 'Food',
      accountId: 'account1',
      userId: 'test-user-id',
      type: TransactionType.EXPENSE,
      date: new Date('2024-01-15'),
      status: TransactionStatus.COMPLETED,
      syncStatus: SyncStatus.SYNCED,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id'
    },
    {
      id: '2',
      amount: 1000,
      payee: 'Salary',
      categoryId: '2',
      category: 'Income',
      accountId: 'account1',
      userId: 'test-user-id',
      type: TransactionType.INCOME,
      date: new Date('2024-01-01'),
      status: TransactionStatus.COMPLETED,
      syncStatus: SyncStatus.SYNCED,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id'
    },
    {
      id: '3',
      amount: 30,
      payee: 'Gas Station',
      categoryId: '3',
      category: 'Transport',
      accountId: 'account1',
      userId: 'test-user-id',
      type: TransactionType.EXPENSE,
      date: new Date('2024-01-16'),
      status: TransactionStatus.COMPLETED,
      syncStatus: SyncStatus.SYNCED,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id'
    }
  ];

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('Auth', [], { currentUser: mockUser });
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const filterSpy = jasmine.createSpyObj('FilterService', ['clearAllFilters', 'hasActiveFilters']);
    const dateSpy = jasmine.createSpyObj('DateService', ['toDate', 'now']);
    const breakpointServiceSpy = jasmine.createSpyObj('BreakpointService', ['isMobile']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/transactions' });
    const transactionsServiceSpy = jasmine.createSpyObj('TransactionsService', ['deleteTransaction', 'updateTransaction']);

    await TestBed.configureTestingModule({
      declarations: [TransactionListComponent],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Store, useValue: storeSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: LoaderService, useValue: loaderSpy },
        { provide: FilterService, useValue: filterSpy },
        { provide: DateService, useValue: dateSpy },
        { provide: BreakpointService, useValue: breakpointServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TransactionsService, useValue: transactionsServiceSpy }
      ]
    }).compileComponents();

    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockStore = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockLoaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    mockFilterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    mockDateService = TestBed.inject(DateService) as jasmine.SpyObj<DateService>;
    mockBreakpointService = TestBed.inject(BreakpointService) as jasmine.SpyObj<BreakpointService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTransactionsService = TestBed.inject(TransactionsService) as jasmine.SpyObj<TransactionsService>;

    // Setup store selectors
    mockStore.select.and.returnValues(
      of(mockTransactions), // transactions$
      of(false), // transactionsLoading$
      of(null) // transactionsError$
    );

    // Setup filter service
    mockFilterService.hasActiveFilters.and.returnValue(false);

    // Setup date service
    mockDateService.toDate.and.returnValue(new Date());
    mockDateService.now.and.returnValue({ toDate: () => new Date() } as any);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize component and load transactions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockLoaderService.show).toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        TransactionsActions.loadTransactions({ userId: 'test-user-id' })
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        CategoriesActions.loadCategories({ userId: 'test-user-id' })
      );
    }));

    it('should detect transactions page correctly', () => {
      expect(component.isTransactionsPage).toBe(true);
    });

    it('should setup data source with paginator and sort', () => {
      component.ngAfterViewInit();
      
      expect(component.dataSource.paginator).toBeDefined();
      expect(component.dataSource.sort).toBeDefined();
    });
  });

  describe('CRUD Operations - Add Transaction', () => {
    it('should open add transaction dialog', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.addTransactionDialog();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should handle successful transaction creation', () => {
      const newTransaction = { ...mockTransactions[0], id: '4', payee: 'New Transaction' };
      mockDialog.open.and.returnValue({
        afterClosed: () => of(newTransaction)
      } as any);

      component.addTransactionDialog();

      expect(mockNotificationService.success).toHaveBeenCalled();
    });
  });

  describe('CRUD Operations - Edit Transaction', () => {
    it('should open edit transaction dialog', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.editTransaction(mockTransactions[0]);

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should handle inline row editing', () => {
      const element = { ...mockTransactions[0], isEditing: false };
      
      component.startRowEdit(element);
      expect(element.isEditing).toBe(true);

      component.saveRowEdit(element);
      expect(element.isEditing).toBe(false);
    });

    it('should cancel row editing', () => {
      const element = { ...mockTransactions[0], isEditing: true };
      
      component.cancelRowEdit(element);
      expect(element.isEditing).toBe(false);
    });
  });

  describe('CRUD Operations - Delete Transaction', () => {
    it('should open delete confirmation dialog', async () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(true)
      } as any);

      await component.deleteTransaction(mockTransactions[0]);

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should handle successful transaction deletion', async () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(true)
      } as any);

      await component.deleteTransaction(mockTransactions[0]);

      expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should handle deletion cancellation', async () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(false)
      } as any);

      await component.deleteTransaction(mockTransactions[0]);

      expect(mockNotificationService.success).not.toHaveBeenCalled();
    });
  });

  describe('Import/Export Operations', () => {
    it('should open import dialog', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.openImportDialog();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should export transactions to Excel', () => {
      component.exportToExcel();

      expect(mockNotificationService.success).toHaveBeenCalled();
    });
  });

  describe('Filtering and Search', () => {
    it('should open filter dialog', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.openFilterDialog();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should clear all filters', () => {
      component.clearAllFilters();

      expect(mockFilterService.clearAllFilters).toHaveBeenCalled();
    });

    it('should check for active filters', () => {
      const result = component.hasActiveFilters();
      expect(result).toBe(false);
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get current month transactions count', () => {
      const result = component.getCurrentMonthTransactions();
      expect(result).toBe(3);
    });

    it('should get unique categories count', () => {
      const result = component.getUniqueCategories();
      expect(result).toBe(3);
    });

    it('should get filtered count', () => {
      const result = component.getFilteredCount();
      expect(result).toBe(3);
    });

    it('should get total count', () => {
      const result = component.getTotalCount();
      expect(result).toBe(3);
    });

    it('should get current year count', () => {
      const result = component.getCurrentYearCount();
      expect(result).toBe(3);
    });

    it('should get current year', () => {
      const result = component.getCurrentYear();
      expect(result).toBe(new Date().getFullYear());
    });

    it('should get categories list', () => {
      const result = component.getCategoriesList();
      expect(result).toEqual(['Food', 'Income', 'Transport']);
    });

    it('should get types list', () => {
      const result = component.getTypesList();
      expect(result).toEqual(['expense', 'income']);
    });
  });

  describe('UI Interactions', () => {
    it('should handle long press on transaction', () => {
      const tx = { ...mockTransactions[0] };
      
      component.onLongPress(tx);
      
      expect(component.selectedTx).toEqual(tx);
    });

    it('should expand table view', () => {
      expect(component.showFullTable).toBe(false);
      
      component.expandTable();
      
      expect(component.showFullTable).toBe(true);
    });

    it('should refresh transactions', () => {
      component.refreshTransactions();

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        TransactionsActions.loadTransactions({ userId: 'test-user-id' })
      );
    });

    it('should view analytics', () => {
      component.viewAnalytics();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/analytics']);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk category update', async () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of({ transactions: mockTransactions, categoryId: '1' })
      } as any);

      await component.bulkUpdateCategory({ transactions: mockTransactions, categoryId: '1' });

      expect(mockNotificationService.success).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle transaction loading errors', () => {
      mockStore.select.and.returnValue(of('Error loading transactions'));
      
      component.transactionsError$ = of('Error loading transactions');
      
      expect(component.transactionsError$).toBeDefined();
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on destroy', () => {
      spyOn(component, 'ngOnDestroy');
      
      component.ngOnDestroy();
      
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });
  });
}); 