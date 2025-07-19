import { Injectable, NgZone } from '@angular/core';
import { getMessaging, getToken, onMessage, Messaging } from '@angular/fire/messaging';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { APP_CONFIG } from '../config/config';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: { [key: string]: string };
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
}

// Use the built-in NotificationPermission type instead of custom interface

@Injectable({
  providedIn: 'root'
})
export class FirebaseMessagingService {
  private messaging!: Messaging;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private permissionSubject = new BehaviorSubject<NotificationPermission>('default');
  private notificationSubject = new BehaviorSubject<NotificationPayload | null>(null);
  private swRegistration: ServiceWorkerRegistration | null = null;

  public token$: Observable<string | null> = this.tokenSubject.asObservable();
  public permission$: Observable<NotificationPermission> = this.permissionSubject.asObservable();
  public notifications$: Observable<NotificationPayload | null> = this.notificationSubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.initializeMessaging();
  }

  private async initializeMessaging(): Promise<void> {
    try {
      // Check if messaging is supported
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      // Register Firebase messaging service worker first
      await this.registerFirebaseMessagingSW();

      // Initialize Firebase messaging
      this.messaging = getMessaging();
      
      // Set up permission observer
      this.permissionSubject.next(Notification.permission);
      
      // Listen for permission changes
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' as PermissionName }).then(permission => {
          permission.onchange = () => {
            this.ngZone.run(() => {
              this.permissionSubject.next(Notification.permission);
            });
          };
        });
      }

      // Set up foreground message handler
      onMessage(this.messaging, (payload) => {
        this.ngZone.run(() => {
          console.log('Foreground message received:', payload);
          this.handleForegroundMessage(payload);
        });
      });

      // Request permission and get token
      await this.requestPermission();
      
    } catch (error) {
      console.error('Failed to initialize Firebase messaging:', error);
    }
  }

  private async registerFirebaseMessagingSW(): Promise<void> {
    try {
      // Check if Firebase messaging service worker is already registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      const firebaseSW = registrations.find(reg => 
        reg.scope.includes('firebase-cloud-messaging-push-scope') ||
        reg.active?.scriptURL.includes('firebase-messaging-sw.js')
      );

      if (firebaseSW) {
        console.log('Firebase messaging service worker already registered');
        this.swRegistration = firebaseSW;
        return;
      }

      // Register Firebase messaging service worker
      console.log('Registering Firebase messaging service worker...');
      this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      });

      console.log('Firebase messaging service worker registered successfully:', this.swRegistration);
      
      // Wait for the service worker to be ready
      await this.swRegistration.update();
      
    } catch (error) {
      console.error('Failed to register Firebase messaging service worker:', error);
      throw error;
    }
  }

  private handleForegroundMessage(payload: any): void {
    const notification: NotificationPayload = {
      title: payload.notification?.title || 'New Notification',
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      badge: payload.notification?.badge || '/icons/icon-72x72.png',
      image: payload.notification?.image,
      data: payload.data || {},
      tag: payload.notification?.tag,
      requireInteraction: payload.notification?.requireInteraction || false,
      silent: payload.notification?.silent || false,
      timestamp: payload.notification?.timestamp || Date.now()
    };

    this.notificationSubject.next(notification);
    this.showNotification(notification);
  }

  public async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      const permission = await Notification.requestPermission();
      this.permissionSubject.next(permission);

      if (permission === 'granted') {
        await this.getToken();
      }

      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  public async getToken(): Promise<string | null> {
    try {
      if (!this.messaging) {
        console.warn('Messaging not initialized');
        return null;
      }

      // Ensure service worker is ready
      if (this.swRegistration) {
        await this.swRegistration.update();
      }

      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: this.swRegistration || undefined
      });

      if (token) {
        this.tokenSubject.next(token);
        
        // Store token in localStorage for persistence
        localStorage.setItem('fcm-token', token);
        
        return token;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  public async refreshToken(): Promise<string | null> {
    try {
      if (!this.messaging) {
        return null;
      }

      // Force token refresh
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: this.swRegistration || undefined
      });

      if (token) {
        this.tokenSubject.next(token);
        localStorage.setItem('fcm-token', token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }

  public showNotification(notification: NotificationPayload): void {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction,
      silent: notification.silent
    };

    const nativeNotification = new Notification(notification.title, options);

    // Handle notification click
    nativeNotification.onclick = (event) => {
      event.preventDefault();
      this.handleNotificationClick(notification, event);
      nativeNotification.close();
    };

    // Auto-close notification after 5 seconds (unless requireInteraction is true)
    if (!notification.requireInteraction) {
      setTimeout(() => {
        nativeNotification.close();
      }, 5000);
    }
  }

  private handleNotificationClick(notification: NotificationPayload, event: Event): void {
    console.log('Notification clicked:', notification);
    
    // Focus the window if it's not focused
    if (window.focus) {
      window.focus();
    }

    // Handle custom click logic based on notification data
    if (notification.data?.['url']) {
      window.open(notification.data['url'], '_blank');
    } else if (notification.data?.['route']) {
      // Navigate to specific route in the app
      window.location.href = notification.data['route'];
    }

    // Emit click event for components to handle
    this.notificationSubject.next({
      ...notification,
      data: { ...notification.data, action: 'click' }
    });
  }

  private handleNotificationAction(notification: NotificationPayload, event: any): void {
    console.log('Notification action clicked:', event.action, notification);
    
    // Handle specific actions
    switch (event.action) {
      case 'view':
        this.handleNotificationClick(notification, event);
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Handle custom actions
        if (notification.data?.['actionUrl']) {
          window.open(notification.data['actionUrl'], '_blank');
        }
    }

    // Emit action event for components to handle
    this.notificationSubject.next({
      ...notification,
      data: { ...notification.data, action: event.action }
    });
  }

  public getStoredToken(): string | null {
    return localStorage.getItem('fcm-token');
  }

  public clearStoredToken(): void {
    localStorage.removeItem('fcm-token');
    this.tokenSubject.next(null);
  }

  public isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  public getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }

  // Method to send test notification
  public sendTestNotification(): void {
    const testNotification: NotificationPayload = {
      title: 'Test Notification',
      body: 'This is a test notification from Money Manager',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        type: 'test',
        timestamp: Date.now().toString()
      },
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    this.showNotification(testNotification);
  }

  listenForMessages() {
    const messaging = getMessaging();

    onMessage(messaging, (payload) => {
      console.log('Message received: ', payload);
      // Show toast or notification manually if needed
      alert('Message received: ' + payload);
    });
  }
} 