import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetupWizardComponent } from './setup-wizard.component';
import { SetupWizardService } from './setup-wizard.service';
import { Store } from '@ngrx/store';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from 'src/app/util/service/notification.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AccountType } from 'src/app/util/config/enums';
import { UserService } from 'src/app/util/service/db/user.service';

describe('SetupWizardComponent', () => {
  let component: SetupWizardComponent;
  let fixture: ComponentFixture<SetupWizardComponent>;
  let mockStore: jasmine.SpyObj<Store>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSetupService: jasmine.SpyObj<SetupWizardService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('Store', ['dispatch', 'select', 'selectSignal']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockUserService = jasmine.createSpyObj('UserService', ['isGuestUser', 'exitGuestMode']);
    mockUserService.isGuestUser.and.returnValue(false);
    mockUserService.exitGuestMode.and.resolveTo();
    mockSetupService = jasmine.createSpyObj('SetupWizardService', [
      'getDefaultState',
      'loadSavedState',
      'saveState',
      'clearState',
      'isExistingUser',
      'previewGroup',
      'joinGroup',
      'createGroup',
      'completeWizard'
    ]);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info', 'warning']);

    mockStore.select.and.returnValue(of(null));
    mockStore.selectSignal.and.returnValue(signal({
      uid: 'test-user-id',
      email: 'test@example.com',
      role: 'free',
      createdAt: new Date(),
      preferences: { hasSeenWelcome: false }
    } as any) as any);

    mockSetupService.getDefaultState.and.returnValue({
      currentStep: 1,
      selectedMode: 'personal',
      groupOption: 'create',
      group: { name: '', type: 'Family', icon: 'family_restroom', currency: 'INR' },
      account: { name: 'Primary Bank Account', type: AccountType.BANK, balance: 0, currency: 'INR' },
      expenseCategories: [{ name: 'Food & Dining', type: 1 as any, icon: 'restaurant', color: '#F59E0B', selected: true }],
      incomeCategories: [{ name: 'Salary', type: 0 as any, icon: 'work', color: '#10B981', selected: true }],
      isCompleted: false
    });

    mockSetupService.loadSavedState.and.callFake(() => mockSetupService.getDefaultState());
    mockSetupService.isExistingUser.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [SetupWizardComponent, NoopAnimationsModule],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        { provide: SetupWizardService, useValue: mockSetupService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UserService, useValue: mockUserService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SetupWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize in step 1', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep()).toBe(1);
    expect(component.selectedMode()).toBe('personal');
  });

  it('should not allow family mode selection if user is a guest', () => {
    mockUserService.isGuestUser.and.returnValue(true);
    component.selectMode('family');
    expect(component.selectedMode()).toBe('personal');
    expect(mockNotificationService.warning).toHaveBeenCalled();
  });

  it('should navigate through steps on nextStep and prevStep', () => {
    expect(component.currentStep()).toBe(1);
    component.nextStep();
    expect(component.currentStep()).toBe(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should switch between personal and family mode', () => {
    component.selectMode('family');
    expect(component.selectedMode()).toBe('family');
    expect(component.totalSteps()).toBe(6);

    component.selectMode('personal');
    expect(component.selectedMode()).toBe('personal');
    expect(component.totalSteps()).toBe(4);
  });

  it('should validate group name on create group attempt', async () => {
    component.selectMode('family');
    component.currentStep.set(2);
    component.groupName.set('');

    await component.handleCreateGroup();
    expect(mockNotificationService.error).toHaveBeenCalledWith('Please enter a group name (at least 2 characters)');
    expect(mockSetupService.createGroup).not.toHaveBeenCalled();
  });

  it('should successfully create group and proceed to next step', async () => {
    component.selectMode('family');
    component.currentStep.set(2);
    component.groupName.set('Wadkar Family');

    mockSetupService.createGroup.and.resolveTo({
      familyId: 'fam-new-99',
      inviteCode: 'FAM-WDK1'
    });

    await component.handleCreateGroup();
    expect(component.createdFamilyId()).toBe('fam-new-99');
    expect(component.inviteCode()).toBe('FAM-WDK1');
    expect(component.currentStep()).toBe(3);
    expect(mockNotificationService.success).toHaveBeenCalled();
  });

  it('should preview and join group using valid invite code', async () => {
    component.selectMode('family');
    component.currentStep.set(2);
    component.selectGroupOption('join');
    component.joinInviteCodeInput.set('FAM-JOIN');

    mockSetupService.previewGroup.and.resolveTo({
      family: { id: 'fam-joined-1', name: 'Pune Flatmates', inviteCode: 'FAM-JOIN' },
      memberCount: 2,
      alreadyMember: false
    });

    await component.lookupGroup();
    expect(component.groupPreview()?.family.name).toBe('Pune Flatmates');
    expect(component.joinError()).toBeNull();

    mockSetupService.joinGroup.and.resolveTo({ id: 'fam-joined-1', name: 'Pune Flatmates' });
    await component.handleJoinGroup();

    expect(component.joinedFamilyId()).toBe('fam-joined-1');
    expect(component.joinedFamilyName()).toBe('Pune Flatmates');
    expect(component.currentStep()).toBe(3);
  });

  it('should allow skipping group setup and continuing in personal mode', () => {
    component.selectMode('family');
    component.currentStep.set(2);
    component.skipGroupSetup();

    expect(component.selectedMode()).toBe('personal');
    expect(component.currentStep()).toBe(3);
  });

  it('should toggle expense and income categories', () => {
    const initialSelected = component.expenseCategories()[0]?.selected;
    const catName = component.expenseCategories()[0]?.name;

    component.toggleExpenseCategory(catName);
    const updated = component.expenseCategories().find(c => c.name === catName)?.selected;
    expect(updated).toBe(!initialSelected);
  });

  it('should provide contextual guidance for desktop stepper rail', () => {
    component.selectMode('personal');
    const guidance1 = component.getStepGuidance(1);
    expect(guidance1.title).toBe('Choose Workspace Mode');

    const guidance2 = component.getStepGuidance(2);
    expect(guidance2.title).toBe('Initial Account');

    component.selectMode('family');
    const familyGuidance2 = component.getStepGuidance(2);
    expect(familyGuidance2.title).toBe('Family Workspace');
  });

  it('should switch mobile category tab between expense and income', () => {
    expect(component.mobileCategoryTab()).toBe('expense');
    component.mobileCategoryTab.set('income');
    expect(component.mobileCategoryTab()).toBe('income');
  });

  it('should navigate back on Escape key press when not in form input', () => {
    component.currentStep.set(2);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });

    component.handleKeyboardNav(event);
    expect(component.currentStep()).toBe(1);
  });

  it('should not navigate on Escape key press when typing inside input', () => {
    component.currentStep.set(2);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    Object.defineProperty(event, 'target', { value: document.createElement('input') });

    component.handleKeyboardNav(event);
    expect(component.currentStep()).toBe(2);
  });

  it('should call exitGuestMode when guest user clicks goToSignIn', async () => {
    mockUserService.isGuestUser.and.returnValue(true);
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

    await component.goToSignIn(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockUserService.exitGuestMode).toHaveBeenCalled();
  });

  it('should navigate to /sign-in when non-guest user clicks goToSignIn', async () => {
    mockUserService.isGuestUser.and.returnValue(false);
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

    await component.goToSignIn(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
  });
});

