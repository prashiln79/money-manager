import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeDesktopComponent } from './home-desktop.component';
import { provideMockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';

import { ChatComponent } from 'src/app/component/dashboard/chat/chat.component';
import { Component } from '@angular/core';
import { CurrencyService } from 'src/app/util/service/currency.service';
import { UserService } from 'src/app/util/service/db/user.service';

import { provideRouter } from '@angular/router';

import { BudgetCardComponent } from 'src/app/util/components/cards/budget-card/budget-card.component';
import { AccountSummaryCardComponent } from 'src/app/util/components/cards/account-summary-card/account-summary-card.component';

import { Input } from '@angular/core';

@Component({
  selector: 'app-chat',
  standalone: true,
  template: '<div>Mock Chat</div>'
})
class MockChatComponent {}

@Component({
  selector: 'app-budget-card',
  standalone: true,
  template: '<div>Mock Budget Card</div>'
})
class MockBudgetCardComponent {
  @Input() isHomeView: boolean = false;
  @Input() isChildView: boolean = false;
}

@Component({
  selector: 'app-account-summary-card',
  standalone: true,
  template: '<div>Mock Account Summary Card</div>'
})
class MockAccountSummaryCardComponent {}

describe('HomeDesktopComponent', () => {
  let component: HomeDesktopComponent;
  let fixture: ComponentFixture<HomeDesktopComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const initialState = {
    profile: {
      profile: {
        uid: 'user-123',
        firstName: 'Alex',
        email: 'alex@example.com',
        preferences: { isFamilyMode: false }
      }
    },
    transactions: {
      ids: ['tx-1', 'tx-2'],
      entities: {
        'tx-1': { id: 'tx-1', amount: 500, type: 'income', category: 'Salary', date: new Date() },
        'tx-2': { id: 'tx-2', amount: 150, type: 'expense', category: 'Food', date: new Date() }
      }
    },
    accounts: {
      activeContext: 'personal',
      personal: {
        ids: ['acc-1'],
        entities: {
          'acc-1': { accountId: 'acc-1', name: 'Main Checking', balance: 5000, type: 'bank' }
        }
      },
      family: { ids: [], entities: {} }
    },
    categories: {
      activeContext: 'personal',
      personal: {
        ids: ['cat-1'],
        entities: {
          'cat-1': { id: 'cat-1', name: 'Food', icon: 'restaurant', color: '#10b981' }
        }
      },
      family: { ids: [], entities: {} }
    },
    budgets: {
      budgets: [{ budgetId: 'b-1', limit: 1000, spent: 200, category: 'Food', userId: 'user-123', startDate: new Date() as any }]
    }
  };

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [HomeDesktopComponent],
      providers: [
        provideMockStore({ initialState }),
        provideRouter([]),
        { provide: MatDialog, useValue: mockDialog },
        { provide: CurrencyService, useValue: { formatAmount: (v: any) => '₹' + (v ?? 0) } },
        { provide: UserService, useValue: { isGuestUser: () => false, isAdmin: false } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(HomeDesktopComponent, {
      remove: { imports: [ChatComponent, BudgetCardComponent, AccountSummaryCardComponent] },
      add: { imports: [MockChatComponent, MockBudgetCardComponent, MockAccountSummaryCardComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeDesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create HomeDesktopComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should compute greeting accurately', () => {
    expect(component.greeting()).toContain('Alex');
  });

  it('should switch between overview and copilot views', () => {
    expect(component.activeView()).toBe('overview');
    component.activeView.set('copilot');
    expect(component.activeView()).toBe('copilot');
  });

  it('should filter transactions by tab', () => {
    component.activeTransactionTab.set('expense');
    expect(component.activeTransactionTab()).toBe('expense');
  });

  it('should open Add Transaction dialog', () => {
    component.openAddTransaction();
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should navigate to given route', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    component.navigateTo('/dashboard/reports');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/reports']);
  });
});
