import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import { selectProfile } from 'src/app/store/profile/profile.selectors';
import { User } from 'src/app/util/models';
import { AccountType, TransactionType } from 'src/app/util/config/enums';
import { NotificationService } from 'src/app/util/service/notification.service';
import { BreakpointService } from 'src/app/util/service/breakpoint.service';
import {
  SetupWizardService,
  SetupWizardState,
  SetupMode,
  GroupOption,
  GROUP_TYPE_OPTIONS,
  CategorySelectionItem
} from './setup-wizard.service';

export interface AccountTypeOption {
  value: AccountType;
  label: string;
  icon: string;
  defaultName: string;
}

@Component({
  selector: 'app-setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRippleModule
  ],
  templateUrl: './setup-wizard.component.html',
  styleUrls: ['./setup-wizard.component.scss']
})
export class SetupWizardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppState>);
  private readonly setupService = inject(SetupWizardService);
  private readonly notificationService = inject(NotificationService);
  readonly breakpointService = inject(BreakpointService);

  readonly isDesktopLayout = this.breakpointService.isDesktopLayout;
  readonly isMobile = this.breakpointService.isMobile;
  readonly isMobileOrTablet = this.breakpointService.isMobileOrTablet;

  readonly userProfile = this.store.selectSignal(selectProfile);

  // Wizard state signals
  readonly currentStep = signal<number>(1);
  readonly selectedMode = signal<SetupMode>('personal');
  readonly groupOption = signal<GroupOption>('create');

  // Group Details
  readonly groupName = signal<string>('');
  readonly groupType = signal<string>('Family');
  readonly groupCurrency = signal<string>('INR');
  readonly createdFamilyId = signal<string | null>(null);
  readonly inviteCode = signal<string>('');

  // Join Group Details
  readonly joinInviteCodeInput = signal<string>('');
  readonly isLookingUpGroup = signal<boolean>(false);
  readonly groupPreview = signal<{
    family: any;
    memberCount: number;
    alreadyMember: boolean;
  } | null>(null);
  readonly joinError = signal<string | null>(null);
  readonly joinedFamilyId = signal<string | null>(null);
  readonly joinedFamilyName = signal<string | null>(null);

  // Account Details
  readonly accountType = signal<AccountType>(AccountType.BANK);
  readonly accountName = signal<string>('Primary Bank Account');
  readonly accountBalance = signal<number>(0);
  readonly accountCurrency = signal<string>('INR');
  readonly createdAccountId = signal<string | null>(null);

  // Categories Details
  readonly expenseCategories = signal<CategorySelectionItem[]>([]);
  readonly incomeCategories = signal<CategorySelectionItem[]>([]);
  readonly mobileCategoryTab = signal<'expense' | 'income'>('expense');

  // Flow State
  readonly isLoading = signal<boolean>(false);
  readonly isFinishing = signal<boolean>(false);
  readonly setupSuccess = signal<boolean>(false);
  readonly destinationRoute = signal<string>('/dashboard/home');
  readonly Math = Math;
  readonly groupTypeOptions = GROUP_TYPE_OPTIONS;

  readonly accountTypeOptions: AccountTypeOption[] = [
    { value: AccountType.BANK, label: 'Bank Account', icon: 'account_balance', defaultName: 'Primary Bank Account' },
    { value: AccountType.UPI, label: 'UPI Wallet / App', icon: 'qr_code_2', defaultName: 'UPI Account' },
    { value: AccountType.CASH, label: 'Cash Wallet', icon: 'payments', defaultName: 'Cash Wallet' },
    { value: AccountType.CREDIT, label: 'Credit Card', icon: 'credit_card', defaultName: 'Credit Card' },
    { value: AccountType.OTHER, label: 'Other Account', icon: 'wallet', defaultName: 'General Wallet' }
  ];

  // Dynamic step titles based on mode
  readonly stepTitles = computed(() => {
    if (this.selectedMode() === 'family') {
      return [
        'Welcome',
        'Group Workspace',
        'Initial Account',
        'Categories',
        'Invite Members',
        'Review & Summary'
      ];
    }
    return [
      'Welcome',
      'Initial Account',
      'Categories',
      'Review & Summary'
    ];
  });

  readonly totalSteps = computed(() => this.stepTitles().length);

  readonly shareableInviteLink = computed(() => {
    const code = this.inviteCode();
    if (!code) return '';
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/setup?code=${encodeURIComponent(code)}`;
  });

  ngOnInit(): void {
    // Check if query params contain an invite code
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) {
      this.joinInviteCodeInput.set(codeParam.trim().toUpperCase());
      this.selectedMode.set('family');
      this.groupOption.set('join');
    }

    // Load user and check existing state
    const currentUser = this.userProfile();
    const uid = currentUser?.uid || 'guest';

    // If existing user already finished setup and didn't pass an invite code, navigate to dashboard
    if (this.setupService.isExistingUser(currentUser) && !codeParam) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Load saved draft state to resume seamlessly
    const saved = this.setupService.loadSavedState(uid);
    this.hydrateFromState(saved);

    // If code parameter was passed in URL, force join mode and preview
    if (codeParam) {
      this.selectedMode.set('family');
      this.groupOption.set('join');
      this.currentStep.set(2);
      this.lookupGroup();
    }
  }

  private hydrateFromState(state: SetupWizardState): void {
    this.currentStep.set(state.currentStep || 1);
    this.selectedMode.set(state.selectedMode || 'personal');
    this.groupOption.set(state.groupOption || 'create');

    if (state.group) {
      this.groupName.set(state.group.name || '');
      this.groupType.set(state.group.type || 'Family');
      this.groupCurrency.set(state.group.currency || 'INR');
      this.createdFamilyId.set(state.group.createdFamilyId || null);
      this.inviteCode.set(state.group.inviteCode || '');
      this.joinedFamilyId.set(state.group.joinedFamilyId || null);
      this.joinedFamilyName.set(state.group.joinedFamilyName || null);
    }

    if (state.account) {
      this.accountName.set(state.account.name || 'Primary Bank Account');
      this.accountType.set(state.account.type || AccountType.BANK);
      this.accountBalance.set(state.account.balance || 0);
      this.accountCurrency.set(state.account.currency || 'INR');
      this.createdAccountId.set(state.account.createdAccountId || null);
    }

    if (state.expenseCategories?.length) {
      this.expenseCategories.set(state.expenseCategories);
    } else {
      this.expenseCategories.set(this.setupService.getDefaultState().expenseCategories);
    }

    if (state.incomeCategories?.length) {
      this.incomeCategories.set(state.incomeCategories);
    } else {
      this.incomeCategories.set(this.setupService.getDefaultState().incomeCategories);
    }
  }

  private persistCurrentState(): void {
    const user = this.userProfile();
    const uid = user?.uid || 'guest';
    const state: SetupWizardState = {
      currentStep: this.currentStep(),
      selectedMode: this.selectedMode(),
      groupOption: this.groupOption(),
      group: {
        name: this.groupName(),
        type: this.groupType(),
        icon: this.getIconForGroupType(this.groupType()),
        currency: this.groupCurrency(),
        createdFamilyId: this.createdFamilyId() || undefined,
        inviteCode: this.inviteCode() || undefined,
        joinedFamilyId: this.joinedFamilyId() || undefined,
        joinedFamilyName: this.joinedFamilyName() || undefined
      },
      account: {
        name: this.accountName(),
        type: this.accountType(),
        balance: this.accountBalance(),
        currency: this.accountCurrency(),
        createdAccountId: this.createdAccountId() || undefined
      },
      expenseCategories: this.expenseCategories(),
      incomeCategories: this.incomeCategories(),
      isCompleted: false
    };
    this.setupService.saveState(uid, state);
  }

  getIconForGroupType(type: string): string {
    const found = this.groupTypeOptions.find(opt => opt.value.toLowerCase() === type.toLowerCase());
    return found ? found.icon : 'family_restroom';
  }

  getStepGuidance(step: number): { title: string; desc: string; tip: string; icon: string } {
    const isFamily = this.selectedMode() === 'family';
    if (step === 1) {
      return {
        title: 'Choose Workspace Mode',
        desc: 'Decide whether you want to manage individual personal finances or collaborate with family members in a shared workspace.',
        tip: 'You can switch between personal and family workspaces anytime.',
        icon: 'auto_awesome'
      };
    }
    if (isFamily) {
      switch (step) {
        case 2:
          return {
            title: 'Family Workspace',
            desc: 'Create a new group workspace or enter an invitation code to join an existing family group.',
            tip: 'Group members can split bills, track collective budgets, and view shared reports.',
            icon: 'groups'
          };
        case 3:
          return {
            title: 'Initial Account',
            desc: 'Set up your primary bank account, digital UPI wallet, or cash fund with its starting balance.',
            tip: 'Setting an accurate opening balance ensures correct net worth tracking from day one.',
            icon: 'account_balance'
          };
        case 4:
          return {
            title: 'Customize Categories',
            desc: 'Pick the expense and income categories you use daily. Categories power your charts and spending analytics.',
            tip: 'You can add, edit, or customize category icons and colors later in Settings.',
            icon: 'category'
          };
        case 5:
          return {
            title: 'Invite Family Members',
            desc: 'Share your unique invite code or link so other family members can join and log their expenses.',
            tip: 'Members can join anytime using the code from their own device.',
            icon: 'person_add'
          };
        case 6:
        default:
          return {
            title: 'Review & Confirm',
            desc: 'Double-check your setup details. Once confirmed, your financial workspace will be ready immediately.',
            tip: 'Everything you configure here can be modified later in your profile and settings.',
            icon: 'verified'
          };
      }
    } else {
      switch (step) {
        case 2:
          return {
            title: 'Initial Account',
            desc: 'Set up your primary bank account, digital UPI wallet, or cash fund with its starting balance.',
            tip: 'Setting an accurate opening balance ensures correct net worth tracking from day one.',
            icon: 'account_balance'
          };
        case 3:
          return {
            title: 'Customize Categories',
            desc: 'Pick the expense and income categories you use daily. Categories power your charts and spending analytics.',
            tip: 'You can add, edit, or customize category icons and colors later in Settings.',
            icon: 'category'
          };
        case 4:
        default:
          return {
            title: 'Review & Confirm',
            desc: 'Double-check your setup details. Once confirmed, your financial workspace will be ready immediately.',
            tip: 'Everything you configure here can be modified later in your profile and settings.',
            icon: 'verified'
          };
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardNav(event: KeyboardEvent): void {
    if (this.setupSuccess() || this.isFinishing()) return;
    const target = event.target as HTMLElement;
    const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
    if (event.key === 'Escape' && !isEditing) {
      if (this.currentStep() > 1) {
        this.prevStep();
      }
    }
  }

  // Navigation & Step transitions
  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps()) return;
    this.currentStep.set(step);
    this.persistCurrentState();
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current < this.totalSteps()) {
      this.currentStep.set(current + 1);
      this.persistCurrentState();
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
      this.persistCurrentState();
    }
  }

  // Screen 1: Welcome Mode Selection
  selectMode(mode: SetupMode): void {
    this.selectedMode.set(mode);
    this.persistCurrentState();
  }

  // Screen 2: Group Workspace Options
  selectGroupOption(option: GroupOption): void {
    this.groupOption.set(option);
    this.joinError.set(null);
    this.persistCurrentState();
  }

  selectGroupType(type: string): void {
    this.groupType.set(type);
    if (!this.groupName() || this.groupName() === 'My Family' || this.groupName() === 'Our Home' || this.groupName() === 'Friends Group') {
      if (type === 'Family') this.groupName.set('Wadkar Family');
      else if (type === 'Friends') this.groupName.set('Friends Circle');
      else if (type === 'Roommates') this.groupName.set('Apartment Roommates');
      else this.groupName.set('Shared Expenses');
    }
    this.persistCurrentState();
  }

  async handleCreateGroup(): Promise<void> {
    const name = this.groupName().trim();
    if (!name || name.length < 2) {
      this.notificationService.error('Please enter a group name (at least 2 characters)');
      return;
    }

    this.isLoading.set(true);
    try {
      const res = await this.setupService.createGroup({
        name,
        type: this.groupType(),
        icon: this.getIconForGroupType(this.groupType()),
        currency: 'INR',
        createdFamilyId: this.createdFamilyId() || undefined,
        inviteCode: this.inviteCode() || undefined
      }, this.createdFamilyId() || undefined);

      this.createdFamilyId.set(res.familyId);
      this.inviteCode.set(res.inviteCode);
      this.notificationService.success(`Group "${name}" created successfully!`);
      this.persistCurrentState();
      this.nextStep();
    } catch (e: any) {
      console.error('Group creation error:', e);
      this.notificationService.error(e?.message || 'Failed to create group. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async lookupGroup(): Promise<void> {
    const code = this.joinInviteCodeInput().trim().toUpperCase();
    if (!code) {
      this.joinError.set('Please enter an invitation code');
      return;
    }

    this.isLookingUpGroup.set(true);
    this.joinError.set(null);
    this.groupPreview.set(null);

    const currentUser = this.userProfile();
    const uid = currentUser?.uid || '';

    try {
      const preview = await this.setupService.previewGroup(code, uid);
      this.groupPreview.set(preview);
      if (preview.alreadyMember) {
        this.joinError.set('You are already a member of this group.');
      }
    } catch (e: any) {
      this.joinError.set(e?.message || 'Invalid or expired invitation code.');
    } finally {
      this.isLookingUpGroup.set(false);
    }
  }

  async handleJoinGroup(): Promise<void> {
    const preview = this.groupPreview();
    if (!preview || preview.alreadyMember) return;

    this.isLoading.set(true);
    try {
      const joined = await this.setupService.joinGroup(preview.family.inviteCode);
      this.joinedFamilyId.set(joined.id);
      this.joinedFamilyName.set(joined.name);
      this.notificationService.success(`Joined "${joined.name}" successfully!`);
      this.persistCurrentState();
      this.nextStep();
    } catch (e: any) {
      console.error('Group join error:', e);
      this.notificationService.error(e?.message || 'Failed to join group.');
    } finally {
      this.isLoading.set(false);
    }
  }

  skipGroupSetup(): void {
    this.selectedMode.set('personal');
    this.persistCurrentState();
    this.nextStep();
  }

  // Screen 3: Account Configuration
  selectAccountType(type: AccountType): void {
    this.accountType.set(type);
    const found = this.accountTypeOptions.find(opt => opt.value === type);
    if (found) {
      this.accountName.set(found.defaultName);
    }
    this.persistCurrentState();
  }

  // Screen 4: Category Configuration
  toggleExpenseCategory(catName: string): void {
    this.expenseCategories.update(cats =>
      cats.map(c => c.name === catName ? { ...c, selected: !c.selected } : c)
    );
    this.persistCurrentState();
  }

  toggleIncomeCategory(catName: string): void {
    this.incomeCategories.update(cats =>
      cats.map(c => c.name === catName ? { ...c, selected: !c.selected } : c)
    );
    this.persistCurrentState();
  }

  toggleAllExpense(selected: boolean): void {
    this.expenseCategories.update(cats => cats.map(c => ({ ...c, selected })));
    this.persistCurrentState();
  }

  toggleAllIncome(selected: boolean): void {
    this.incomeCategories.update(cats => cats.map(c => ({ ...c, selected })));
    this.persistCurrentState();
  }

  // Screen 5: Member Invitations
  copyInviteCode(): void {
    const code = this.inviteCode();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.notificationService.success('Invitation code copied to clipboard!');
    }).catch(() => {
      this.notificationService.info(`Invite Code: ${code}`);
    });
  }

  copyInviteLink(): void {
    const link = this.shareableInviteLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.notificationService.success('Invite link copied to clipboard!');
    }).catch(() => {
      this.notificationService.info(`Invite Link: ${link}`);
    });
  }

  async shareInvitation(): Promise<void> {
    const code = this.inviteCode();
    const link = this.shareableInviteLink();
    const text = `Join my family workspace on MoneyManager to track and share expenses easily! Code: ${code}\nLink: ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MoneyManager Family Invitation',
          text,
          url: link
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fallback to copy
      }
    }
    this.copyInviteLink();
  }

  // Screen 6 & 7: Summary & Complete
  getEffectiveGroupName(): string {
    if (this.selectedMode() === 'personal') return 'Personal Workspace';
    if (this.joinedFamilyName()) return this.joinedFamilyName()!;
    if (this.groupName()) return this.groupName();
    return 'Family Workspace';
  }

  getEffectiveRole(): string {
    if (this.selectedMode() === 'personal') return 'Individual';
    if (this.joinedFamilyId()) return 'Member';
    return 'Admin & Creator';
  }

  getSelectedExpenseCount(): number {
    return this.expenseCategories().filter(c => c.selected).length;
  }

  getSelectedIncomeCount(): number {
    return this.incomeCategories().filter(c => c.selected).length;
  }

  async finishSetup(): Promise<void> {
    const user = this.userProfile();
    if (!user) {
      this.notificationService.error('Session not found. Please sign in again.');
      this.router.navigate(['/sign-in']);
      return;
    }

    this.isFinishing.set(true);
    try {
      const activeFamilyId = this.selectedMode() === 'family'
        ? (this.createdFamilyId() || this.joinedFamilyId() || null)
        : null;

      const targetRoute = await this.setupService.completeWizard(
        user,
        this.selectedMode(),
        activeFamilyId,
        {
          name: this.accountName(),
          type: this.accountType(),
          balance: this.accountBalance(),
          currency: this.accountCurrency(),
          createdAccountId: this.createdAccountId() || undefined
        },
        this.expenseCategories(),
        this.incomeCategories()
      );

      this.destinationRoute.set(targetRoute);
      this.setupSuccess.set(true);
    } catch (e: any) {
      console.error('Failed to complete setup wizard:', e);
      this.notificationService.error(e?.message || 'Failed to complete setup. Please try again.');
    } finally {
      this.isFinishing.set(false);
    }
  }

  navigateToDashboard(): void {
    this.router.navigate([this.destinationRoute()]);
  }
}
