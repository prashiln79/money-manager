import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject, Observable, Subscription } from 'rxjs';
import {
  User,
  CURRENCIES,
  getCurrencySymbol,
  DEFAULT_CURRENCY,
} from 'src/app/util/models';
import { NotificationService } from 'src/app/util/service/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';
import moment from 'moment';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import * as ProfileActions from '../../../store/profile/profile.actions';
import * as ProfileSelectors from '../../../store/profile/profile.selectors';
import { DateService } from 'src/app/util/service/date.service';
import { UserRole } from 'src/app/util/models/enums';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  // Observables from store
  profile$: Observable<User | null>;
  profileLoading$: Observable<boolean>;
  profileError$: Observable<any>;
  
  profileForm: FormGroup;
  isLoading = false;
  isEditing = false;
  currentUser: any;
  userProfile: User | null = null;

  currencies = CURRENCIES;

  timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  ];

  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  private destroy$ = new Subject<void>();
  private subscriptions = new Subscription();

    constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private notificationService: NotificationService,
    private dialog: MatDialog,
	private dateService: DateService,
    private store: Store<AppState>
  ) {
    // Initialize selectors
    this.profile$ = this.store.select(ProfileSelectors.selectProfile);
    this.profileLoading$ = this.store.select(ProfileSelectors.selectProfileLoading);
    this.profileError$ = this.store.select(ProfileSelectors.selectProfileError);
    
    this.profileForm = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      dateOfBirth: [''],
      occupation: ['', [Validators.maxLength(100)]],
      monthlyIncome: [0, [Validators.min(0)]],
      preferences: this.fb.group({
        defaultCurrency: [DEFAULT_CURRENCY, Validators.required],
        timezone: ['UTC', Validators.required],
        language: ['en', Validators.required],
        notifications: [true],
        emailUpdates: [true],
        budgetAlerts: [true],
      }),
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.subscribeToStoreData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadUserProfile(): Promise<void> {
    try {
      this.isLoading = true;
      this.currentUser = this.auth.currentUser;

      if (!this.currentUser) {
        this.notificationService.error('User not authenticated');
        this.router.navigate(['/sign-in']);
        return;
      }

      // Load user profile from store
      this.store.dispatch(ProfileActions.loadProfile({ userId: this.currentUser.uid }));
    } catch (error) {
      console.error('Error loading profile:', error);
      this.notificationService.error('Failed to load profile');
    } finally {
      this.isLoading = false;
    }
  }

  // Subscribe to store data for backward compatibility
  private subscribeToStoreData(): void {
    this.subscriptions.add(
      this.profile$.subscribe(profile => {
        if (profile) {
          this.userProfile = this.mapUserToProfile(profile);
          this.populateForm();
        }
      })
    );

    this.subscriptions.add(
      this.profileLoading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    this.subscriptions.add(
      this.profileError$.subscribe(error => {
        if (error) {
          console.error('Error loading profile:', error);
          this.notificationService.error('Failed to load profile');
        }
      })
    );
  }

  private mapUserToProfile(user: User): User {
    return {
      uid: user.uid,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || '',
      dateOfBirth: this.dateService.toDate(user.dateOfBirth || 0 ) || new Date(),
      occupation: user.occupation || '',
      monthlyIncome: user.monthlyIncome || 0,
      preferences: {
        defaultCurrency: user.preferences?.defaultCurrency || DEFAULT_CURRENCY,
        timezone: user.preferences?.timezone || 'UTC',
        language: user.preferences?.language || 'en',
        notifications: user.preferences?.notifications || true,
        emailUpdates: user.preferences?.emailUpdates || true,
        budgetAlerts: user.preferences?.budgetAlerts || true,
      },
	  role: user.role,
      createdAt: user.createdAt,
      updatedAt: this.dateService.toTimestamp(user.updatedAt) || new Date(),
    };
  }

  private createDefaultProfile(): User {
    return {
      uid: this.currentUser.uid,
      firstName: this.currentUser.displayName?.split(' ')[0] || '',
      lastName:
        this.currentUser.displayName?.split(' ').slice(1).join(' ') || '',
      email: this.currentUser.email || '',
      phone: '',
      dateOfBirth: undefined,
      occupation: '',
      monthlyIncome: 0,
      preferences: {
        defaultCurrency: DEFAULT_CURRENCY,
        timezone: 'UTC',
        language: 'en',
        notifications: true,
        emailUpdates: true,
        budgetAlerts: true,
      },
	  role: UserRole.FREE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private populateForm(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        email: this.userProfile.email,
        phone: this.userProfile.phone || '',
        dateOfBirth: this.userProfile.dateOfBirth || '',
        occupation: this.userProfile.occupation || '',
        monthlyIncome: this.userProfile.monthlyIncome || 0,
        preferences: {
          defaultCurrency: this.userProfile.preferences?.defaultCurrency || DEFAULT_CURRENCY,
          timezone: this.userProfile.preferences?.timezone || 'UTC',
          language: this.userProfile.preferences?.language || 'en',
          notifications: this.userProfile.preferences?.notifications || true,
          emailUpdates: this.userProfile.preferences?.emailUpdates || true,
          budgetAlerts: this.userProfile.preferences?.budgetAlerts || true,
        },
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.notificationService.info('Edit mode enabled');
    } else {
      this.notificationService.info('Edit mode disabled');
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.notificationService.warning(
        'Please fill in all required fields correctly'
      );
      return;
    }

    try {
      this.isLoading = true;
      const formValue = this.profileForm.value;

      if (this.userProfile) {
        const updatedUser = {
          uid: this.userProfile.uid,
          name: `${formValue.firstName} ${formValue.lastName}`.trim(),
          email: formValue.email,
          role: 'free' as any, // Keep existing role
          createdAt: this.dateService.toTimestamp(this.userProfile.createdAt) || new Date(),
          preferences: formValue.preferences,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phone: formValue.phone,
          dateOfBirth: formValue.dateOfBirth,
          occupation: formValue.occupation,
          monthlyIncome: formValue.monthlyIncome,
		  updatedAt: this.dateService.toTimestamp(new Date()) || new Date(),
		  
        };

        this.store.dispatch(ProfileActions.updateProfile({ 
          userId: this.currentUser.uid, 
          profile: updatedUser 
        }));

        this.notificationService.success('Profile updated successfully');
        this.isEditing = false;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      this.notificationService.error('Failed to save profile');
    } finally {
      this.isLoading = false;
    }
  }

  cancelEdit(): void {
    this.populateForm();
    this.isEditing = false;
    this.notificationService.info('Changes cancelled');
  }

  async deleteAccount(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Account',
        message:
          'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
        confirmText: 'Delete Account',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          this.isLoading = true;
          // Delete user account from Firebase Auth
          await this.currentUser.delete();
          this.notificationService.success('Account deleted successfully');
          this.router.navigate(['/sign-in']);
        } catch (error) {
          console.error('Error deleting account:', error);
          this.notificationService.error('Failed to delete account');
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  async changePassword(): Promise<void> {
    this.notificationService.info('Password change feature coming soon');
  }

  async exportData(): Promise<void> {
    try {
      // TODO: Implement data export functionality
      this.notificationService.info('Data export feature coming soon');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.notificationService.error('Failed to export data');
    }
  }

  getFullName(): string {
    if (this.userProfile) {
      return `${this.userProfile.firstName} ${this.userProfile.lastName}`.trim();
    }
    return 'User';
  }

  getCurrencySymbol(currencyCode: string): string {
    return getCurrencySymbol(currencyCode);
  }

  getTimezoneLabel(timezoneValue: string): string {
    const timezone = this.timezones.find((t) => t.value === timezoneValue);
    return timezone ? timezone.label : timezoneValue;
  }

  getLanguageName(languageCode: string): string {
    const language = this.languages.find((l) => l.code === languageCode);
    return language ? language.name : languageCode;
  }

  getFormattedDate(date: any): string {
    if (!date) {
      return 'N/A';
    }
    return moment(date?.seconds * 1000).format('MMM DD, YYYY');
  }

  getFormattedIncome(income: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency:
        this.userProfile?.preferences?.defaultCurrency || DEFAULT_CURRENCY,
    }).format(income);
  }
}
