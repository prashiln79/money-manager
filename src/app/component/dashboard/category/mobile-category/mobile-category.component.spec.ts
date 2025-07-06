import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import { MobileCategoryComponent } from './mobile-category.component';
import { CategoryService } from 'src/app/util/service/category.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { ClickOutsideDirective } from 'src/app/util/directives/click-outside.directive';

describe('MobileCategoryComponent', () => {
  let component: MobileCategoryComponent;
  let fixture: ComponentFixture<MobileCategoryComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockCategoryService = {
    createCategory: jasmine.createSpy('createCategory').and.returnValue(Promise.resolve()),
    updateCategory: jasmine.createSpy('updateCategory').and.returnValue(Promise.resolve())
  };

  const mockNotificationService = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error')
  };

  const mockHapticFeedbackService = {
    successVibration: jasmine.createSpy('successVibration')
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockAuth = {
    currentUser: { uid: 'test-user-id' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MobileCategoryComponent,
        ClickOutsideDirective
      ],
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: HapticFeedbackService, useValue: mockHapticFeedbackService },
        { provide: Router, useValue: mockRouter },
        { provide: Auth, useValue: mockAuth }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default form values', () => {
    expect(component.categoryForm.get('name')?.value).toBe('');
    expect(component.categoryForm.get('type')?.value).toBe('expense');
    expect(component.categoryForm.get('icon')?.value).toBe('category');
  });

  it('should populate form when editing existing category', () => {
    const mockCategory = {
      id: 'test-id',
      name: 'Test Category',
      type: 'income' as const,
      icon: 'star',
      createdAt: Date.now()
    };

    component.dialogData = mockCategory;
    component.ngOnInit();

    expect(component.categoryForm.get('name')?.value).toBe('Test Category');
    expect(component.categoryForm.get('type')?.value).toBe('income');
    expect(component.categoryForm.get('icon')?.value).toBe('star');
  });

  it('should toggle icon picker', () => {
    expect(component.showIconPicker).toBeFalse();
    
    component.toggleIconPicker();
    expect(component.showIconPicker).toBeTrue();
    
    component.toggleIconPicker();
    expect(component.showIconPicker).toBeFalse();
  });

  it('should select icon and close picker', () => {
    component.showIconPicker = true;
    component.selectIcon('star');
    
    expect(component.categoryForm.get('icon')?.value).toBe('star');
    expect(component.showIconPicker).toBeFalse();
  });

  it('should close dialog', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
}); 