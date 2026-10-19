import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import { AccountType, TransactionType } from 'src/app/util/config/enums';
import { Category, Account, User } from 'src/app/util/models';
import { FamilyService } from 'src/app/modules/family/services/family.service';
import { AccountsService } from 'src/app/util/service/db/accounts.service';
import { CategoryService } from 'src/app/util/service/db/category.service';
import { UserService } from 'src/app/util/service/db/user.service';
import * as ProfileActions from 'src/app/store/profile/profile.actions';
import * as AccountsActions from 'src/app/store/accounts/accounts.actions';
import * as CategoriesActions from 'src/app/store/categories/categories.actions';
import { selectAllAccounts } from 'src/app/store/accounts/accounts.selectors';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import { selectProfile } from 'src/app/store/profile/profile.selectors';

export type SetupMode = 'personal' | 'family';
export type GroupOption = 'create' | 'join' | 'skip';

export interface GroupTypeOption {
  value: string;
  label: string;
  icon: string;
}

export const GROUP_TYPE_OPTIONS: GroupTypeOption[] = [
  { value: 'Family', label: 'Family', icon: 'family_restroom' },
  { value: 'Friends', label: 'Friends', icon: 'groups' },
  { value: 'Roommates', label: 'Roommates', icon: 'home' },
  { value: 'Other', label: 'Other', icon: 'category' }
];

export interface SetupDraftGroup {
  name: string;
  type: string;
  icon: string;
  currency: string;
  createdFamilyId?: string;
  inviteCode?: string;
  joinedFamilyId?: string;
  joinedFamilyName?: string;
}

export interface SetupDraftAccount {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  createdAccountId?: string;
}

export interface CategorySelectionItem {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  selected: boolean;
}

export interface SetupWizardState {
  currentStep: number;
  selectedMode: SetupMode;
  groupOption: GroupOption;
  group: SetupDraftGroup;
  account: SetupDraftAccount;
  expenseCategories: CategorySelectionItem[];
  incomeCategories: CategorySelectionItem[];
  createdAccountName?: string;
  isCompleted: boolean;
}

export const DEFAULT_EXPENSE_CATEGORIES: Omit<CategorySelectionItem, 'selected'>[] = [
  { name: 'Food & Dining', type: TransactionType.EXPENSE, icon: 'restaurant', color: '#F59E0B' },
  { name: 'Groceries', type: TransactionType.EXPENSE, icon: 'local_grocery_store', color: '#10B981' },
  { name: 'Bills & Utilities', type: TransactionType.EXPENSE, icon: 'receipt_long', color: '#EF4444' },
  { name: 'Travel', type: TransactionType.EXPENSE, icon: 'flight', color: '#3B82F6' },
  { name: 'Shopping', type: TransactionType.EXPENSE, icon: 'shopping_cart', color: '#EC4899' },
  { name: 'Healthcare', type: TransactionType.EXPENSE, icon: 'local_hospital', color: '#06B6D4' },
  { name: 'Education', type: TransactionType.EXPENSE, icon: 'school', color: '#6366F1' },
  { name: 'Other Expenses', type: TransactionType.EXPENSE, icon: 'category', color: '#64748B' }
];

export const DEFAULT_INCOME_CATEGORIES: Omit<CategorySelectionItem, 'selected'>[] = [
  { name: 'Salary', type: TransactionType.INCOME, icon: 'work', color: '#10B981' },
  { name: 'Freelancing', type: TransactionType.INCOME, icon: 'computer', color: '#14B8A6' },
  { name: 'Business', type: TransactionType.INCOME, icon: 'store', color: '#8B5CF6' },
  { name: 'Other Income', type: TransactionType.INCOME, icon: 'attach_money', color: '#F59E0B' }
];

@Injectable({
  providedIn: 'root'
})
export class SetupWizardService {
  private readonly store = inject(Store<AppState>);
  private readonly familyService = inject(FamilyService);
  private readonly accountsService = inject(AccountsService);
  private readonly categoryService = inject(CategoryService);
  private readonly userService = inject(UserService);

  private readonly DRAFT_STORAGE_PREFIX = 'money_manager_setup_draft_';

  /**
   * Builds the default state for fresh setup
   */
  getDefaultState(): SetupWizardState {
    return {
      currentStep: 1,
      selectedMode: 'personal',
      groupOption: 'create',
      group: {
        name: '',
        type: 'Family',
        icon: 'family_restroom',
        currency: 'INR'
      },
      account: {
        name: 'Primary Bank Account',
        type: AccountType.BANK,
        balance: 0,
        currency: 'INR'
      },
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES.map(c => ({ ...c, selected: true })),
      incomeCategories: DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, selected: true })),
      isCompleted: false
    };
  }

  /**
   * Loads saved setup progress for the current user
   */
  loadSavedState(userId: string): SetupWizardState {
    try {
      const saved = localStorage.getItem(`${this.DRAFT_STORAGE_PREFIX}${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure complete schema
        const defaults = this.getDefaultState();
        return {
          ...defaults,
          ...parsed,
          group: { ...defaults.group, ...parsed.group },
          account: { ...defaults.account, ...parsed.account }
        };
      }
    } catch (e) {
      console.warn('[SetupWizardService] Could not parse saved setup state:', e);
    }
    return this.getDefaultState();
  }

  /**
   * Saves current setup progress persistently
   */
  saveState(userId: string, state: SetupWizardState): void {
    if (!userId) return;
    try {
      localStorage.setItem(`${this.DRAFT_STORAGE_PREFIX}${userId}`, JSON.stringify(state));
    } catch (e) {
      console.warn('[SetupWizardService] Error saving setup state:', e);
    }
  }

  /**
   * Clears saved progress when wizard completes
   */
  clearState(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(`${this.DRAFT_STORAGE_PREFIX}${userId}`);
    } catch (e) {
      console.warn('[SetupWizardService] Error removing setup draft:', e);
    }
  }

  /**
   * Check if a user is considered an existing user who should bypass the wizard
   */
  isExistingUser(user: User | null): boolean {
    if (!user) return false;
    return !!user.preferences?.hasSeenWelcome;
  }

  /**
   * Previews a family group before joining
   */
  async previewGroup(inviteCode: string, currentUserId: string): Promise<{
    family: any;
    memberCount: number;
    alreadyMember: boolean;
  }> {
    const lookup = await this.familyService.lookupGroupByCode(inviteCode);
    if (!lookup) {
      throw new Error('Invalid invitation code. Please check the code and try again.');
    }

    const membership = await this.familyService.checkUserMembership(lookup.family.id!, currentUserId);
    return {
      family: lookup.family,
      memberCount: lookup.memberCount,
      alreadyMember: membership.isMember && membership.isActive
    };
  }

  /**
   * Joins an existing family group
   */
  async joinGroup(inviteCode: string): Promise<any> {
    return await this.familyService.joinByCode(inviteCode);
  }

  /**
   * Creates a new family group with idempotency guard
   */
  async createGroup(draft: SetupDraftGroup, existingCreatedId?: string): Promise<{ familyId: string; inviteCode: string }> {
    // Prevent duplicate creation on retries
    if (existingCreatedId) {
      return {
        familyId: existingCreatedId,
        inviteCode: draft.inviteCode || ''
      };
    }

    const created = await this.familyService.createFamily({
      name: draft.name.trim(),
      icon: draft.icon || 'family_restroom',
      mode: 'split'
    });

    return {
      familyId: created.id!,
      inviteCode: created.inviteCode
    };
  }

  /**
   * Commits the initial account and categories to the workspace
   */
  async commitAccountsAndCategories(
    userId: string,
    mode: SetupMode,
    activeFamilyId: string | null,
    accountDraft: SetupDraftAccount,
    expenseCategories: CategorySelectionItem[],
    incomeCategories: CategorySelectionItem[]
  ): Promise<void> {
    const isFamily = mode === 'family' && !!activeFamilyId;
    const targetUserId = isFamily ? activeFamilyId! : userId;

    // 1. Account Creation (Idempotent: Avoid duplicate accounts)
    if (accountDraft.name?.trim()) {
      const existingAccounts = await firstValueFrom(this.store.select(selectAllAccounts));
      const alreadyExists = (existingAccounts || []).some(
        a => a.name.toLowerCase().trim() === accountDraft.name.toLowerCase().trim()
      );

      if (!alreadyExists && !accountDraft.createdAccountId) {
        this.store.dispatch(AccountsActions.createAccount({
          userId: targetUserId,
          accountData: {
            name: accountDraft.name.trim(),
            type: accountDraft.type,
            balance: Number(accountDraft.balance) || 0,
            currency: accountDraft.currency || 'INR',
            description: `Initial ${accountDraft.type} account`,
            institution: accountDraft.type === AccountType.CASH ? 'Cash Wallet' : 'Bank'
          }
        }));
      }
    }

    // 2. Categories Creation (Only selected and missing ones)
    const existingCats = await firstValueFrom(this.store.select(selectAllCategories));
    const existingCatNames = new Set((existingCats || []).map(c => c.name.toLowerCase().trim()));

    const categoriesToCreate = [
      ...expenseCategories.filter(c => c.selected),
      ...incomeCategories.filter(c => c.selected)
    ];

    for (const cat of categoriesToCreate) {
      if (!existingCatNames.has(cat.name.toLowerCase().trim())) {
        this.store.dispatch(CategoriesActions.createCategory({
          userId: targetUserId,
          name: cat.name,
          categoryType: cat.type,
          icon: cat.icon,
          color: cat.color
        }));
      }
    }
  }

  /**
   * Finalizes the onboarding setup wizard
   */
  async completeWizard(
    user: User,
    mode: SetupMode,
    activeFamilyId: string | null,
    accountDraft: SetupDraftAccount,
    expenseCategories: CategorySelectionItem[],
    incomeCategories: CategorySelectionItem[]
  ): Promise<string> {
    const isFamily = mode === 'family' && !!activeFamilyId;

    // 1. Commit accounts & categories
    await this.commitAccountsAndCategories(
      user.uid,
      mode,
      activeFamilyId,
      accountDraft,
      expenseCategories,
      incomeCategories
    );

    // 2. Update user profile preferences persistently
    const updatedPreferences: any = {
      ...(user.preferences || {}),
      isFamilyMode: isFamily,
      activeFamilyId: isFamily ? activeFamilyId : null,
      hasSeenWelcome: true
    };

    const updatedUser: User = {
      ...user,
      preferences: updatedPreferences
    };

    await this.userService.createOrUpdateUser(updatedUser);
    this.store.dispatch(ProfileActions.updatePreferences({
      userId: user.uid,
      preferences: updatedPreferences
    }));

    if (isFamily && activeFamilyId) {
      this.familyService.setActiveFamily(activeFamilyId);
    }

    // 3. Clear wizard draft storage
    this.clearState(user.uid);

    // 4. Return target navigation route
    if (isFamily && activeFamilyId) {
      return `/dashboard/family/dashboard/${activeFamilyId}`;
    }
    return '/dashboard/home';
  }
}
