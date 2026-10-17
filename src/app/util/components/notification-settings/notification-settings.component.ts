import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { LocalIndexDBStorageService } from 'src/app/util/service/indexdb-storage.service';
import { LocalStorageKey } from 'src/app/util/models/local-storage.model';
import { Subject, takeUntil } from 'rxjs';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseMessagingService } from '../../service/firebase-messaging.service';
import { APP_CONFIG } from '../../config/config';
import { NotificationService } from '../../service/notification.service';
import { UserService } from '../../service/db/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  APP_CONFIG = APP_CONFIG;

  permissionStatus: NotificationPermission = 'default';
  fcmToken: string | null = null;
  isLoading = false;
  notificationsEnabled = true;

  constructor(
    private messagingService: FirebaseMessagingService,
    private notificationService: NotificationService,
    private storageService: LocalIndexDBStorageService,
    private cdr: ChangeDetectorRef,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadSettings();
    this.subscribeToMessagingEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSettings(): void {
    const masterState = this.storageService.getItem<string>(LocalStorageKey.NOTIFICATIONS_ENABLED);
    this.notificationsEnabled = masterState !== null ? JSON.parse(masterState) : true;
  }

  private subscribeToMessagingEvents(): void {
    this.messagingService.permission$
      .pipe(takeUntil(this.destroy$))
      .subscribe(permission => {
        this.permissionStatus = permission;
        if (permission === 'denied') {
          this.notificationsEnabled = false;
          this.saveNotificationsEnabled();
        }
        this.cdr.markForCheck();
      });

    this.messagingService.token$
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        this.fcmToken = token;
        if (token) {
          this.userService.updateFcmToken(token);
        }
        this.cdr.markForCheck();
      });
  }

  async toggleNotifications(event: MatSlideToggleChange): Promise<void> {
    this.notificationsEnabled = event.checked;
    this.saveNotificationsEnabled();

    // If user is turning notifications ON and permission hasn't been requested yet, request it
    if (this.notificationsEnabled && this.permissionStatus === 'default') {
      await this.requestPermission();
    }

    // Sync preference with user profile in Firestore
    try {
      await this.userService.updateUserPreferences({
        notifications: this.notificationsEnabled
      });
    } catch (e) {
      console.warn('Could not sync notification preference to user profile:', e);
    }

    if (this.notificationsEnabled) {
      this.notificationService.info('Notifications turned on');
    } else {
      this.notificationService.info('Notifications turned off');
    }

    this.cdr.markForCheck();
  }

  async requestPermission(): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      await this.messagingService.initializeMessagingWithPermission();
      const permission = await this.messagingService.requestPermission();

      if (permission === 'granted') {
        this.notificationsEnabled = true;
        this.saveNotificationsEnabled();
        await this.userService.updateUserPreferences({ notifications: true });
        this.notificationService.info('Notifications enabled successfully!');
      } else {
        this.notificationsEnabled = false;
        this.saveNotificationsEnabled();
        this.notificationService.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      this.notificationService.error('Failed to request notification permission');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async testNotification(): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const user = this.userService.getCurrentUserSnapshot();
      const userName = user?.displayName || user?.firstName || 'Prashil Wadkar';
      const userPhoto = user?.photoURL || '';

      await this.messagingService.sendTestNotification({
        userName,
        icon: userPhoto || undefined
      });
      this.notificationService.info('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      this.notificationService.error('Failed to send test notification');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private saveNotificationsEnabled(): void {
    this.storageService.setItem(LocalStorageKey.NOTIFICATIONS_ENABLED, JSON.stringify(this.notificationsEnabled));
  }

  openPermissionHelp(): void {
    const helpText = 'To enable notifications:\n1. Click the lock or tune icon in your browser\'s address bar\n2. Find "Notifications" in site settings\n3. Change it from "Block" to "Allow"\n4. Refresh the page';
    alert(helpText);
  }
}
