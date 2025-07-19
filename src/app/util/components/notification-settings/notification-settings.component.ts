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
  debugInfo: any = {};

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
      icon: '🔊',
      value: true
    },
    {
      key: 'vibrationEnabled',
      title: 'Vibration',
      description: 'Vibrate device for notifications',
      icon: '📳',
      value: true
    },
    {
      key: 'requireInteraction',
      title: 'Require Interaction',
      description: 'Keep notifications until user interacts',
      icon: '👆',
      value: false
    }
  ];

  constructor(
    private messagingService: FirebaseMessagingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.subscribeToMessagingEvents();
    this.collectDebugInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSettings(): void {
    // Load notification types settings
    this.notificationTypes.forEach(type => {
      const stored = localStorage.getItem(`notification_${type.key}`);
      type.enabled = stored ? JSON.parse(stored) : true;
    });

    // Load advanced settings
    this.advancedSettings.forEach(setting => {
      const stored = localStorage.getItem(`notification_advanced_${setting.key}`);
      setting.value = stored ? JSON.parse(stored) : setting.value;
    });

    // Load master toggle state
    const masterState = localStorage.getItem('notifications_enabled');
    this.notificationsEnabled = masterState ? JSON.parse(masterState) : true;
  }

  private saveSettings(): void {
    // Save notification types settings
    this.notificationTypes.forEach(type => {
      localStorage.setItem(`notification_${type.key}`, JSON.stringify(type.enabled));
    });

    // Save advanced settings
    this.advancedSettings.forEach(setting => {
      localStorage.setItem(`notification_advanced_${setting.key}`, JSON.stringify(setting.value));
    });

    // Save master toggle state
    localStorage.setItem('notifications_enabled', JSON.stringify(this.notificationsEnabled));
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
        this.collectDebugInfo();
      });
  }

  private collectDebugInfo(): void {
    this.debugInfo = {
      browser: navigator.userAgent,
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      permission: Notification.permission,
      fcmToken: this.fcmToken,
      swRegistration: this.messagingService.getServiceWorkerRegistration(),
      isSupported: this.messagingService.isSupported(),
      storedToken: this.messagingService.getStoredToken(),
      timestamp: new Date().toISOString()
    };
  }

  async requestPermission(): Promise<void> {
    this.isLoading = true;
    try {
      const permission = await this.messagingService.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission === 'granted') {
        this.notificationsEnabled = true;
        this.saveNotificationsEnabled();
        this.notificationService.success('Notifications enabled successfully!');
      } else {
        this.notificationService.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      this.notificationService.error('Failed to request notification permission');
    } finally {
      this.isLoading = false;
    }
  }

  async testNotification(): Promise<void> {
    this.isLoading = true;
    try {
      this.messagingService.sendTestNotification();
      this.notificationService.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      this.notificationService.error('Failed to send test notification');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshToken(): Promise<void> {
    this.isLoading = true;
    try {
      const token = await this.messagingService.refreshToken();
      if (token) {
        this.notificationService.success('Token refreshed successfully!');
      } else {
        this.notificationService.error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.notificationService.error('Failed to refresh token');
    } finally {
      this.isLoading = false;
    }
  }

  copyToken(): void {
    if (this.fcmToken) {
      navigator.clipboard.writeText(this.fcmToken).then(() => {
        this.notificationService.success('Token copied to clipboard!');
      }).catch(() => {
        this.notificationService.error('Failed to copy token');
      });
    }
  }

  toggleMasterNotifications(event: MatSlideToggleChange): void {
    this.notificationsEnabled = event.checked;
    this.saveNotificationsEnabled();
    
    if (this.notificationsEnabled && this.permissionStatus === 'default') {
      this.requestPermission();
    }
  }

  toggleNotificationType(typeKey: string, event: MatSlideToggleChange): void {
    const type = this.notificationTypes.find(t => t.key === typeKey);
    if (type) {
      type.enabled = event.checked;
      this.saveSettings();
    }
  }

  updateSetting(settingKey: string, event: MatSlideToggleChange): void {
    const setting = this.advancedSettings.find(s => s.key === settingKey);
    if (setting) {
      setting.value = event.checked;
      this.saveSettings();
    }
  }

  getSettingValue(settingKey: string): boolean {
    const setting = this.advancedSettings.find(s => s.key === settingKey);
    return setting ? setting.value : false;
  }

  private saveNotificationsEnabled(): void {
    localStorage.setItem('notifications_enabled', JSON.stringify(this.notificationsEnabled));
  }

  getStatusIcon(): string {
    switch (this.permissionStatus) {
      case 'granted': return '✅';
      case 'denied': return '❌';
      default: return '❓';
    }
  }

  getPermissionText(): string {
    switch (this.permissionStatus) {
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      default: return 'Not Set';
    }
  }

  openPermissionHelp(): void {
    const helpText = `
To enable notifications:
1. Click the lock/info icon in your browser's address bar
2. Find "Notifications" in the site settings
3. Change it from "Block" to "Allow"
4. Refresh the page
    `;
    alert(helpText);
  }

  // Debug methods
  async debugServiceWorker(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('All service worker registrations:', registrations);
      
      const firebaseSW = registrations.find(reg => 
        reg.scope.includes('https://prashiln79.github.io/wallet/firebase-cloud-messaging-push-scope') ||
        reg.active?.scriptURL.includes('https://prashiln79.github.io/wallet/firebase-messaging-sw.js')
      );
      
      if (firebaseSW) {
        console.log('Firebase SW found:', firebaseSW);
        console.log('Firebase SW state:', firebaseSW.active?.state);
        console.log('Firebase SW script URL:', firebaseSW.active?.scriptURL);
      } else {
        console.log('No Firebase service worker found');
      }
      
      this.collectDebugInfo();
      console.log('Debug info:', this.debugInfo);
    } catch (error) {
      console.error('Debug error:', error);
    }
  }

  async forceServiceWorkerRegistration(): Promise<void> {
    try {
      // Force re-registration of Firebase messaging service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      const firebaseSW = registrations.find(reg => 
        reg.scope.includes('firebase-cloud-messaging-push-scope')
      );
      
      if (firebaseSW) {
        await firebaseSW.unregister();
        console.log('Unregistered existing Firebase SW');
      }
      
      // Wait a bit then try to get token again
      setTimeout(async () => {
        await this.messagingService.refreshToken();
        this.collectDebugInfo();
      }, 1000);
      
    } catch (error) {
      console.error('Force registration error:', error);
    }
  }
} 
