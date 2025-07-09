import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject, Observable, Subscription } from 'rxjs';
import {
  User,
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
import { 
  APP_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  TIMEZONES
} from 'src/app/util/config/config';
import { 
  UserRole, 
  CurrencyCode, 
  LanguageCode 
} from 'src/app/util/config/enums';
import { BreakpointObserver } from '@angular/cdk/layout';

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

  // Use configurations from config.ts
  currencies = Object.values(CurrencyCode);
  defaultCurrency = APP_CONFIG.CURRENCY.DEFAULT;

 

  languages = Object.entries(APP_CONFIG.LANGUAGE.NAMES).map(([code, name]) => ({
    code,
    name
  }));

  // Validation constants from config
  validation = APP_CONFIG.VALIDATION;
  timezones = TIMEZONES;
  isMobile = false;

  private destroy$ = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private dateService: DateService,
    private store: Store<AppState>,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile = this.breakpointObserver.isMatched('(max-width: 600px)');
    // Initialize selectors
    this.profile$ = this.store.select(ProfileSelectors.selectProfile);
    this.profileLoading$ = this.store.select(ProfileSelectors.selectProfileLoading);
    this.profileError$ = this.store.select(ProfileSelectors.selectProfileError);
    
    this.profileForm = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(this.validation.MIN_NAME_LENGTH),
          Validators.maxLength(this.validation.MAX_NAME_LENGTH),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(this.validation.MIN_NAME_LENGTH),
          Validators.maxLength(this.validation.MAX_NAME_LENGTH),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      dateOfBirth: [''],
      occupation: ['', [Validators.maxLength(100)]],
      monthlyIncome: [0, [Validators.min(this.validation.MIN_AMOUNT)]],
      preferences: this.fb.group({
        defaultCurrency: [this.defaultCurrency, Validators.required],
        timezone: ['UTC', Validators.required],
        language: [APP_CONFIG.LANGUAGE.DEFAULT, Validators.required],
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
        this.notificationService.error(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
        this.router.navigate(['/sign-in']);
        return;
      }

      // Load user profile from store
      this.store.dispatch(ProfileActions.loadProfile({ userId: this.currentUser.uid }));
    } catch (error) {
      console.error('Error loading profile:', error);
      this.notificationService.error(ERROR_MESSAGES.NETWORK.SERVER_ERROR);
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
          this.notificationService.error(ERROR_MESSAGES.NETWORK.SERVER_ERROR);
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
        defaultCurrency: user.preferences?.defaultCurrency || this.defaultCurrency,
        timezone: user.preferences?.timezone || 'UTC',
        language: user.preferences?.language || APP_CONFIG.LANGUAGE.DEFAULT,
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
        defaultCurrency: this.defaultCurrency,
        timezone: 'UTC',
        language: APP_CONFIG.LANGUAGE.DEFAULT,
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
          defaultCurrency: this.userProfile.preferences?.defaultCurrency || this.defaultCurrency,
          timezone: this.userProfile.preferences?.timezone || 'UTC',
          language: this.userProfile.preferences?.language || APP_CONFIG.LANGUAGE.DEFAULT,
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
      this.saveProfile();
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.notificationService.warning(
        ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
      );
      return;
    }

    try {
      this.isLoading = true;
      const formValue = this.profileForm.value;

      if (this.userProfile) {
        const updatedUser: User = {
          uid: this.userProfile.uid,
          email: formValue.email,
          role: UserRole.FREE, // Keep existing role
          createdAt: this.userProfile.createdAt,
          preferences: formValue.preferences,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phone: formValue.phone,
          dateOfBirth: formValue.dateOfBirth,
          occupation: formValue.occupation,
          monthlyIncome: formValue.monthlyIncome,
          updatedAt: new Date(),
        };

        this.store.dispatch(ProfileActions.updateProfile({ 
          userId: this.currentUser.uid, 
          profile: updatedUser 
        }));

        this.notificationService.success(SUCCESS_MESSAGES.GENERAL.UPDATED);
        this.isEditing = false;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      this.notificationService.error(ERROR_MESSAGES.NETWORK.SERVER_ERROR);
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
          this.notificationService.error(ERROR_MESSAGES.NETWORK.SERVER_ERROR);
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
      // Check if export functionality is enabled
      if (!APP_CONFIG.FEATURES.EXPORT_FUNCTIONALITY) {
        this.notificationService.warning(ERROR_MESSAGES.PERMISSION.FEATURE_NOT_AVAILABLE);
        return;
      }
      
      // TODO: Implement data export functionality
      this.notificationService.info('Data export feature coming soon');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.notificationService.error(ERROR_MESSAGES.NETWORK.SERVER_ERROR);
    }
  }

  getFullName(): string {
    if (this.userProfile) {
      return `${this.userProfile.firstName} ${this.userProfile.lastName}`.trim();
    }
    return 'User';
  }

  // getCurrencySymbol(currencyCode: string): string {
  //   return CurrencyPipe.getCurrencySymbol(currencyCode);
  // }

  getTimezoneLabel(timezoneValue: string): string {
    const timezone = this.timezones.find((t) => t.value === timezoneValue);
    return timezone ? timezone.label : timezoneValue;
  }

  getLanguageName(languageCode: string): string {
    return APP_CONFIG.LANGUAGE.NAMES[languageCode as LanguageCode] || languageCode;
  }

  getFormattedDate(date: any): string {
    if (!date) {
      return 'N/A';
    }
    return moment(date?.seconds * 1000).format('MMM DD, YYYY');
  }

}
