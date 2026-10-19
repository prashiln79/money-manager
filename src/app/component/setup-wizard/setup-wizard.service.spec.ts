import { TestBed } from '@angular/core/testing';
import { SetupWizardService, SetupWizardState } from './setup-wizard.service';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { FamilyService } from 'src/app/modules/family/services/family.service';
import { AccountsService } from 'src/app/util/service/db/accounts.service';
import { CategoryService } from 'src/app/util/service/db/category.service';
import { UserService } from 'src/app/util/service/db/user.service';
import { AccountType, TransactionType } from 'src/app/util/config/enums';
import { User } from 'src/app/util/models';

describe('SetupWizardService', () => {
  let service: SetupWizardService;
  let mockStore: jasmine.SpyObj<Store>;
  let mockFamilyService: jasmine.SpyObj<FamilyService>;
  let mockAccountsService: jasmine.SpyObj<AccountsService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    mockStore = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    mockFamilyService = jasmine.createSpyObj('FamilyService', [
      'createFamily',
      'lookupGroupByCode',
      'checkUserMembership',
      'joinByCode',
      'setActiveFamily'
    ]);
    mockAccountsService = jasmine.createSpyObj('AccountsService', ['createAccount']);
    mockCategoryService = jasmine.createSpyObj('CategoryService', ['createCategory']);
    mockUserService = jasmine.createSpyObj('UserService', ['createOrUpdateUser']);

    mockStore.select.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        SetupWizardService,
        { provide: Store, useValue: mockStore },
        { provide: FamilyService, useValue: mockFamilyService },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: UserService, useValue: mockUserService }
      ]
    });

    service = TestBed.inject(SetupWizardService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Default State and User Type Detection', () => {
    it('should return initial default state with personal mode and default categories', () => {
      const state = service.getDefaultState();
      expect(state.currentStep).toBe(1);
      expect(state.selectedMode).toBe('personal');
      expect(state.expenseCategories.length).toBeGreaterThan(0);
      expect(state.incomeCategories.length).toBeGreaterThan(0);
      expect(state.account.name).toBe('Primary Bank Account');
      expect(state.account.currency).toBe('INR');
    });

    it('should recognize existing users who already saw welcome', () => {
      const existingUser: User = {
        uid: 'user-1',
        email: 'test@example.com',
        role: 'free',
        createdAt: new Date(),
        preferences: {
          defaultCurrency: 'INR',
          timezone: 'Asia/Kolkata',
          notifications: true,
          emailUpdates: true,
          hasSeenWelcome: true
        }
      };
      expect(service.isExistingUser(existingUser)).toBeTrue();

      const newUser: User = {
        uid: 'user-2',
        email: 'new@example.com',
        role: 'free',
        createdAt: new Date(),
        preferences: {
          defaultCurrency: 'INR',
          timezone: 'Asia/Kolkata',
          notifications: true,
          emailUpdates: true,
          hasSeenWelcome: false
        }
      };
      expect(service.isExistingUser(newUser)).toBeFalse();
    });
  });

  describe('Interrupted Setup & Persistence', () => {
    it('should save progress and safely resume incomplete setup', () => {
      const userId = 'user-test-resume';
      const draftState: SetupWizardState = {
        ...service.getDefaultState(),
        currentStep: 3,
        selectedMode: 'family',
        group: {
          name: 'Wadkar Family',
          type: 'Family',
          icon: 'family_restroom',
          currency: 'INR',
          createdFamilyId: 'fam-123',
          inviteCode: 'FAM-WDK1'
        },
        account: {
          name: 'HDFC Savings',
          type: AccountType.BANK,
          balance: 5000,
          currency: 'INR'
        }
      };

      service.saveState(userId, draftState);

      const resumed = service.loadSavedState(userId);
      expect(resumed.currentStep).toBe(3);
      expect(resumed.selectedMode).toBe('family');
      expect(resumed.group.name).toBe('Wadkar Family');
      expect(resumed.group.createdFamilyId).toBe('fam-123');
      expect(resumed.group.inviteCode).toBe('FAM-WDK1');
      expect(resumed.account.name).toBe('HDFC Savings');
      expect(resumed.account.balance).toBe(5000);
    });

    it('should clear persistent draft when setup finishes', () => {
      const userId = 'user-clear-test';
      service.saveState(userId, service.getDefaultState());
      service.clearState(userId);
      const loaded = localStorage.getItem(`money_manager_setup_draft_${userId}`);
      expect(loaded).toBeNull();
    });
  });

  describe('Group Creation & Idempotency / Duplicate Prevention', () => {
    it('should create group in family mode and return new familyId & inviteCode', async () => {
      mockFamilyService.createFamily.and.resolveTo({
        id: 'new-fam-777',
        name: 'Wadkar Family',
        inviteCode: 'FAM-9999',
        ownerUserId: 'owner-uid',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        memberIds: ['owner-uid']
      });

      const result = await service.createGroup({
        name: 'Wadkar Family',
        type: 'Family',
        icon: 'family_restroom',
        currency: 'INR'
      });

      expect(mockFamilyService.createFamily).toHaveBeenCalledWith({
        name: 'Wadkar Family',
        icon: 'family_restroom',
        mode: 'split'
      });
      expect(result.familyId).toBe('new-fam-777');
      expect(result.inviteCode).toBe('FAM-9999');
    });

    it('should prevent duplicate group creation on retries if createdFamilyId is present', async () => {
      const result = await service.createGroup({
        name: 'Wadkar Family',
        type: 'Family',
        icon: 'family_restroom',
        currency: 'INR',
        inviteCode: 'FAM-EXISTING'
      }, 'already-created-fam-id');

      // Must not call createFamily again
      expect(mockFamilyService.createFamily).not.toHaveBeenCalled();
      expect(result.familyId).toBe('already-created-fam-id');
      expect(result.inviteCode).toBe('FAM-EXISTING');
    });
  });

  describe('Group Preview & Joining Validation', () => {
    it('should preview valid group and verify membership status', async () => {
      mockFamilyService.lookupGroupByCode.and.resolveTo({
        family: { id: 'fam-preview-1', name: 'Sharma Circle', inviteCode: 'FAM-SHAR' } as any,
        memberCount: 3
      });
      mockFamilyService.checkUserMembership.and.resolveTo({ isMember: false, isActive: false });

      const preview = await service.previewGroup('FAM-SHAR', 'user-joining');
      expect(preview.family.name).toBe('Sharma Circle');
      expect(preview.memberCount).toBe(3);
      expect(preview.alreadyMember).toBeFalse();
    });

    it('should detect when user is already an active member of the group', async () => {
      mockFamilyService.lookupGroupByCode.and.resolveTo({
        family: { id: 'fam-preview-2', name: 'Existing Family', inviteCode: 'FAM-EXST' } as any,
        memberCount: 4
      });
      mockFamilyService.checkUserMembership.and.resolveTo({ isMember: true, isActive: true, role: 'member' });

      const preview = await service.previewGroup('FAM-EXST', 'user-already-in');
      expect(preview.alreadyMember).toBeTrue();
    });

    it('should throw an error for invalid invite codes', async () => {
      mockFamilyService.lookupGroupByCode.and.resolveTo(null);

      await expectAsync(service.previewGroup('INVALID', 'user-1')).toBeRejectedWithError(
        'Invalid invitation code. Please check the code and try again.'
      );
    });
  });

  describe('Personal Mode & Setup Finalization', () => {
    it('should finalize personal mode setup and route to personal home', async () => {
      const user: User = {
        uid: 'user-personal-1',
        email: 'solo@example.com',
        role: 'free',
        createdAt: new Date(),
        preferences: {
          defaultCurrency: 'INR',
          timezone: 'Asia/Kolkata',
          notifications: false,
          emailUpdates: false
        }
      };

      mockUserService.createOrUpdateUser.and.resolveTo();

      const route = await service.completeWizard(
        user,
        'personal',
        null,
        {
          name: 'Cash Wallet',
          type: AccountType.CASH,
          balance: 1000,
          currency: 'INR'
        },
        [{ name: 'Groceries', type: TransactionType.EXPENSE, icon: 'local_grocery_store', color: '#10B981', selected: true }],
        [{ name: 'Salary', type: TransactionType.INCOME, icon: 'work', color: '#10B981', selected: true }]
      );

      expect(mockUserService.createOrUpdateUser).toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalled();
      expect(route).toBe('/dashboard/home');
    });

    it('should finalize family mode setup and route to family dashboard', async () => {
      const user: User = {
        uid: 'user-family-1',
        email: 'family@example.com',
        role: 'free',
        createdAt: new Date(),
        preferences: {
          defaultCurrency: 'INR',
          timezone: 'Asia/Kolkata',
          notifications: true,
          emailUpdates: true
        }
      };

      mockUserService.createOrUpdateUser.and.resolveTo();

      const route = await service.completeWizard(
        user,
        'family',
        'fam-active-123',
        {
          name: 'Joint Bank Account',
          type: AccountType.BANK,
          balance: 25000,
          currency: 'INR'
        },
        [{ name: 'Bills & Utilities', type: TransactionType.EXPENSE, icon: 'receipt_long', color: '#EF4444', selected: true }],
        []
      );

      expect(mockFamilyService.setActiveFamily).toHaveBeenCalledWith('fam-active-123');
      expect(route).toBe('/dashboard/family/dashboard/fam-active-123');
    });
  });
});
