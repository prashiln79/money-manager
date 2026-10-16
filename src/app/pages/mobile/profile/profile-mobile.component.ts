import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { ImageFallbackDirective } from 'src/app/util/directives/image-fallback.directive';
import { ProfileComponent } from 'src/app/component/dashboard/profile/profile.component';

@Component({
  selector: 'app-profile-mobile',
  templateUrl: './profile-mobile.component.html',
  styleUrls: ['./profile-mobile.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatMenuModule,
    MatDividerModule,
    TranslateModule,
    ImageFallbackDirective
  ]
})
export class ProfileMobileComponent {
  @Input({ required: true }) c!: ProfileComponent;

  // Signal / method delegates (calling through this.c so 'this' remains intact inside ProfileComponent)
  userProfile() { return this.c?.userProfile(); }
  fullName() { return this.c?.fullName(); }
  isGuestMode(): boolean { return this.c ? this.c.isGuestMode() : false; }
  isFamilyMode() { return this.c?.isFamilyMode(); }
  activeFamilyName() { return this.c?.activeFamilyName(); }
  activeFamilyId() { return this.c?.activeFamilyId(); }
  familyGroups() { return this.c?.familyGroups() || []; }
  sortedFamilyGroups() { return this.c?.sortedFamilyGroups() || []; }
  memberCount() { return this.c?.memberCount() || 0; }
  isFamilyLoading() { return this.c?.isFamilyLoading(); }
  isLoading() { return this.c?.isLoading(); }
  isGoogleLoading() { return this.c?.isGoogleLoading(); }
  isLogoutLoading() { return this.c?.isLogoutLoading(); }
  isEditingPersonal() { return this.c?.isEditingPersonal(); }
  isEditingPreferences() { return this.c?.isEditingPreferences(); }
  themePreference() { return this.c?.themePreference(); }
  isSpecialTheme() { return this.c?.isSpecialTheme(); }
  quickActionsFabConfig() { return this.c?.quickActionsFabConfig(); }

  // Property accessors
  get profileForm() { return this.c.profileForm; }
  get showPinSetup() { return this.c.showPinSetup; }
  get newPinControl() { return this.c.newPinControl; }
  get currencies() { return this.c.currencies; }
  get timezones() { return this.c.timezones; }
  get languages() { return this.c.languages; }
  get countries() { return this.c.countries; }
  get appViewOptions() { return this.c.appViewOptions; }
  get breakpointService() { return this.c.breakpointService; }

  // Action delegates
  onProfileImageSelected(event: any) { this.c.onProfileImageSelected(event); }
  switchToPersonalMode() { this.c.switchToPersonalMode(); }
  switchActiveFamily(id: string) { if (id) this.c.switchActiveFamily(id); }
  copyFamilyCode(code: string) { this.c.copyFamilyCode(code); }
  deleteFamilyGroup(family: any) { this.c.deleteFamilyGroup(family); }
  createFamilyGroup() { this.c.createFamilyGroup(); }
  joinFamilyGroup() { this.c.joinFamilyGroup(); }
  signInWithGoogle() { this.c.signInWithGoogle(); }
  logout() { this.c.logout(); }
  toggleEdit(section: 'preferences' | 'personal') { this.c.toggleEdit(section); }
  cancelEdit(section: 'preferences' | 'personal') { this.c.cancelEdit(section); }
  saveProfile(section: 'preferences' | 'personal') { this.c.saveProfile(section); }
  onlyNumbers(event: any) { this.c.onlyNumbers(event); }
  updatePin() { this.c.updatePin(); }
  selectTheme(theme: any) { this.c.selectTheme(theme); }
  exportData() { this.c.exportData(); }
  importData() { this.c.importData(); }
  deleteAccount() { this.c.deleteAccount(); }
  onFileSelected(event: any) { this.c.onFileSelected(event); }
}
