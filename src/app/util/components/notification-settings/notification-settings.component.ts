import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { FirebaseMessagingService, NotificationPayload } from '../../service/firebase-messaging.service';
import { APP_CONFIG } from '../../config/config';
import { NotificationService } from '../../service/notification.service';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss']
})
export class NotificationSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  APP_CONFIG = APP_CONFIG;
  
  permissionStatus: NotificationPermission = 'default';
  fcmToken: string | null = null;
  isLoading = false;
  notificationsEnabled = true;

  notificationTypes = [
    {
      key: 'transactions',
      title: 'Transaction Alerts',
      description: 'Get notified about new transactions and spending limits',
      icon: '💰',
      enabled: true
    },
    {
      key: 'budgets',
      title: 'Budget Reminders',
      description: 'Receive alerts when approaching budget limits',
      icon: '💳',
      enabled: true
    },
    {
      key: 'goals',
      title: 'Goal Updates',
      description: 'Track progress on your financial goals',
      icon: '🎯',
      enabled: true
    },
    {
      key: 'bills',
      title: 'Bill Reminders',
      description: 'Never miss a bill payment',
      icon: '📅',
      enabled: true
    },
    {
      key: 'security',
      title: 'Security Alerts',
      description: 'Important security notifications',
      icon: '🔒',
      enabled: true
    }
  ];

  advancedSettings = [
    {
      key: 'soundEnabled',
      title: 'Sound',
      description: 'Play sound for notifications',
      icon: '🔊'
    },
    {
      key: 'vibrationEnabled',
      title: 'Vibration',
      description: 'Vibrate device for notifications',
      icon: '📳'
    },
    {
      key: 'requireInteraction',
      title: 'Require Interaction',
      description: 'Keep notifications until manually dismissed',
      icon: '👆'
    }
  ];

  settings = {
    soundEnabled: true,
    vibrationEnabled: true,
    requireInteraction: false
  };

  constructor(
    private messagingService: FirebaseMessagingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.subscribeToMessagingEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSettings(): void {
    // Load notification settings from localStorage
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }

    const savedTypes = localStorage.getItem('notification-types');
    if (savedTypes) {
      this.notificationTypes = JSON.parse(savedTypes);
    }

    const savedEnabled = localStorage.getItem('notifications-enabled');
    if (savedEnabled !== null) {
      this.notificationsEnabled = JSON.parse(savedEnabled);
    }
  }

  private subscribeToMessagingEvents(): void {
    this.messagingService.permission$
      .pipe(takeUntil(this.destroy$))
      .subscribe(permission => {
        this.permissionStatus = permission;
        // Auto-disable if permission is denied
        if (permission === 'denied') {
          this.notificationsEnabled = false;
          this.saveNotificationsEnabled();
        }
      });

    this.messagingService.token$
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        this.fcmToken = token;
      });
  }

  toggleMasterNotifications(event: MatSlideToggleChange): void {
    this.notificationsEnabled = event.checked;
    this.saveNotificationsEnabled();
    
    if (this.notificationsEnabled && this.permissionStatus === 'default') {
      this.requestPermission();
    }
    
    this.showMessage(
      `Notifications ${this.notificationsEnabled ? 'enabled' : 'disabled'}`,
      'success'
    );
  }

  async requestPermission(): Promise<void> {
    this.isLoading = true;
    try {
      const permission = await this.messagingService.requestPermission();
      if (permission === 'granted') {
        this.showMessage('Notifications enabled successfully!', 'success');
      } else {
        this.notificationsEnabled = false;
        this.saveNotificationsEnabled();
        this.showMessage('Notification permission denied', 'error');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      this.notificationsEnabled = false;
      this.saveNotificationsEnabled();
      this.showMessage('Failed to enable notifications', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async testNotification(): Promise<void> {
    this.isLoading = true;
    try {
      this.messagingService.sendTestNotification();
      this.showMessage('Test notification sent!', 'success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      this.showMessage('Failed to send test notification', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshToken(): Promise<void> {
    this.isLoading = true;
    try {
      const token = await this.messagingService.refreshToken();
      if (token) {
        this.showMessage('Token refreshed successfully!', 'success');
      } else {
        this.showMessage('Failed to refresh token', 'error');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.showMessage('Failed to refresh token', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  copyToken(): void {
    if (this.fcmToken) {
      navigator.clipboard.writeText(this.fcmToken).then(() => {
        this.showMessage('Token copied to clipboard!', 'success');
      }).catch(() => {
        this.showMessage('Failed to copy token', 'error');
      });
    }
  }

  toggleNotificationType(key: string, event: MatSlideToggleChange): void {
    const type = this.notificationTypes.find(t => t.key === key);
    if (type) {
      type.enabled = event.checked;
      this.saveNotificationTypes();
      this.showMessage(`${type.title} ${event.checked ? 'enabled' : 'disabled'}`, 'success');
    }
  }

  updateSetting(key: string, event: MatSlideToggleChange): void {
    this.settings[key as keyof typeof this.settings] = event.checked;
    this.saveSettings();
    this.showMessage('Settings updated', 'success');
  }

  getSettingValue(key: string): boolean {
    return this.settings[key as keyof typeof this.settings] || false;
  }

  private saveSettings(): void {
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
  }

  private saveNotificationTypes(): void {
    localStorage.setItem('notification-types', JSON.stringify(this.notificationTypes));
  }

  private saveNotificationsEnabled(): void {
    localStorage.setItem('notifications-enabled', JSON.stringify(this.notificationsEnabled));
  }

  openPermissionHelp(): void {
    this.showMessage('Check browser settings to enable notifications', 'info');
  }

  getPermissionText(): string {
    switch (this.permissionStatus) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Blocked';
      case 'default':
        return 'Not Set';
      default:
        return 'Unknown';
    }
  }

  getStatusIcon(): string {
    switch (this.permissionStatus) {
      case 'granted':
        return '✅';
      case 'denied':
        return '❌';
      case 'default':
        return '⏳';
      default:
        return '❓';
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.notificationService[type](message);
  }
} 
