import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { UserService } from './user.service';
import { APP_CONFIG } from '../config/config';

export interface NetworkStatus {
  online: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private networkStatusSubject = new BehaviorSubject<NetworkStatus>({
    online: navigator.onLine
  });

  public networkStatus$: Observable<NetworkStatus> = this.networkStatusSubject.asObservable();
  public isOnline$: Observable<boolean> = this.networkStatus$.pipe(
    map(status => status.online)
  );

  constructor(private swUpdate: SwUpdate, private userService: UserService) {
    this.initializeNetworkMonitoring();
    this.initializeServiceWorkerUpdates();
    this.checkForAppUpdates();
  }

  private initializeNetworkMonitoring(): void {
    // Monitor online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    // Combine online/offline events with initial state
    merge(online$, offline$)
      .pipe(startWith(navigator.onLine))
      .subscribe(online => {
        this.updateNetworkStatus({ online });
        this.handleNetworkChange(online);
      });

    // Monitor connection quality if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.updateNetworkStatus({
            online: navigator.onLine,
            connectionType: connection.effectiveType,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          });
        });
      }
    }
  }

  private initializeServiceWorkerUpdates(): void {
    // Check for service worker updates
    if (this.swUpdate.isEnabled) {
      // Check for updates more frequently on mobile
      const updateInterval = this.isMobileDevice() ? 30 * 60 * 1000 : 6 * 60 * 60 * 1000; // 30 min on mobile, 6 hours on desktop
      
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, updateInterval);

      // Handle available updates
      this.swUpdate.versionUpdates.subscribe(event => {
        console.log('Service worker update event:', event);
        
        if (event.type === 'VERSION_READY') {
          console.log('New version available:', event);
          this.handleUpdateAvailable();
        } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
          console.error('Service worker installation failed:', event);
          this.handleUpdateFailure();
        }
      });
    }
  }

  private checkForAppUpdates(): void {
    // Check for app version changes on startup
    const currentVersion = this.getAppVersion();
    const storedVersion = localStorage.getItem('app-version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log('App version changed, performing smart cache update');
      this.performSmartCacheUpdate(storedVersion, currentVersion);
    } else {
      localStorage.setItem('app-version', currentVersion);
    }

    // Check for updates immediately on mobile
    if (this.isMobileDevice() && this.swUpdate.isEnabled) {
      setTimeout(() => {
        this.swUpdate.checkForUpdate();
      }, 2000); // Check after 2 seconds
    }
  }

  private getAppVersion(): string {
    // Use a more stable versioning strategy - only change when there's a significant update
    // For now, we'll use a weekly version to reduce unnecessary cache clears
    const now = new Date();
    const weekNumber = Math.ceil(now.getDate() / 7);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `${year}-${month.toString().padStart(2, '0')}-W${weekNumber}`;
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private async performSmartCacheUpdate(oldVersion: string, newVersion: string): Promise<void> {
    try {
      console.log(`Performing smart cache update from ${oldVersion} to ${newVersion}`);
      
      // Preserve authentication state
      const authData = this.preserveAuthData();
      
      // Clear only application caches, not authentication data
      await this.clearApplicationCaches();
      
      // Restore authentication state
      this.restoreAuthData(authData);
      
      // Update version
      localStorage.setItem('app-version', newVersion);
      
      console.log('Smart cache update completed successfully');
    } catch (error) {
      console.error('Smart cache update failed:', error);
      // Fallback to full cache clear if smart update fails
      this.forceAppUpdate();
    }
  }

  private preserveAuthData(): any {
    const authData: any = {};
    
    // Preserve Firebase Auth state
    if (localStorage.getItem('firebase:authUser:')) {
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('firebase:authUser:') || 
        key.startsWith('firebase:persistence:')
      );
      authKeys.forEach(key => {
        authData[key] = localStorage.getItem(key);
      });
    }
    
    // Preserve user preferences
    const userPrefs = ['theme', 'language', 'user-settings'];
    userPrefs.forEach(pref => {
      const value = localStorage.getItem(pref);
      if (value) authData[pref] = value;
    });
    
    return authData;
  }

  private restoreAuthData(authData: any): void {
    // Restore preserved data
    Object.keys(authData).forEach(key => {
      localStorage.setItem(key, authData[key]);
    });
  }

  private async clearApplicationCaches(): Promise<void> {
    try {
      // Clear service worker caches (excluding auth-related caches)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const appCaches = cacheNames.filter(name => 
          !name.includes('firebase') && 
          !name.includes('auth') && 
          !name.includes('user')
        );
        
        await Promise.all(
          appCaches.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear application-specific localStorage items
      const keysToRemove = Object.keys(localStorage).filter(key => 
        !key.startsWith('firebase:') &&
        !key.startsWith('user') &&
        !key.startsWith('theme') &&
        !key.startsWith('language') &&
        key !== 'app-version'
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('Application caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear application caches:', error);
      throw error;
    }
  }

  private handleUpdateAvailable(): void {
    if (this.isMobileDevice()) {
      // On mobile, show a more prominent update notification
      this.showMobileUpdateNotification();
    } else {
      // On desktop, use the standard prompt
      this.promptUserForUpdate();
    }
  }

  private showMobileUpdateNotification(): void {
    // Create a custom update notification for mobile
    const updateBanner = document.createElement('div');
    updateBanner.className = 'fixed top-0 left-0 right-0 z-[9999] bg-blue-600 text-white px-4 py-3 text-center shadow-lg';
    updateBanner.innerHTML = `
      <div class="flex items-center justify-center space-x-3">
        <mat-icon class="text-white">system_update</mat-icon>
        <span class="text-sm font-medium">New version available</span>
        <button 
          class="bg-white text-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          id="update-now-btn"
        >
          Update Now
        </button>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
    
    // Add click event listener to the update button
    const updateButton = document.getElementById('update-now-btn');
    if (updateButton) {
      updateButton.addEventListener('click', async () => {
        try {
          // Check if user is logged in and sign out if they are
          if (this.userService.isAuthenticated()) {
            await this.userService.signOut();
            console.log('User signed out before app update');
          }
          
          // Remove the banner and reload the app
          updateBanner.remove();
          window.location.reload();
        } catch (error) {
          console.error('Error during update process:', error);
          // Still reload even if sign out fails
          updateBanner.remove();
          window.location.reload();
        }
      });
    }
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (updateBanner.parentElement) {
        updateBanner.remove();
      }
    }, 10000);
  }

  private handleUpdateFailure(): void {
    console.error('Update failed, performing smart cache update');
    this.performSmartCacheUpdate('', this.getAppVersion());
  }

  private forceAppUpdate(): void {
    // This should only be used as a last resort
    console.warn('Force app update triggered - this will clear all data including auth');
    this.clearAllCaches().then(() => {
      console.log('Cache cleared, reloading app');
      window.location.reload();
    }).catch(error => {
      console.error('Failed to clear cache:', error);
      // Fallback: reload anyway
      window.location.reload();
    });
  }

  private updateNetworkStatus(status: Partial<NetworkStatus>): void {
    const currentStatus = this.networkStatusSubject.value;
    this.networkStatusSubject.next({ ...currentStatus, ...status });
  }

  private handleNetworkChange(online: boolean): void {
    if (online) {
      console.log('🌐 Network connection restored');
      this.showOnlineNotification();
      // Check for updates when back online
      if (this.swUpdate.isEnabled) {
        this.swUpdate.checkForUpdate();
      }
    } else {
      console.log('📴 Network connection lost');
      this.showOfflineNotification();
    }
  }

  private showOnlineNotification(): void {
    // You can integrate this with your notification service
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${APP_CONFIG.APP_NAME}`, {
        body: 'Network connection restored. Your data will sync automatically.',
        icon: '/icons/icon-192x192.png'
      });
    }
  }

  private showOfflineNotification(): void {
    // You can integrate this with your notification service
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${APP_CONFIG.APP_NAME}`, {
        body: 'You\'re offline. Changes will be saved locally and synced when connection is restored.',
        icon: '/icons/icon-192x192.png'
      });
    }
  }

  private promptUserForUpdate(): void {
    if (confirm(`A new version of ${APP_CONFIG.APP_NAME} is available. Would you like to update now?`)) {
      // Activate the new version
      this.swUpdate.activateUpdate().then(() => {
        window.location.reload();
      }).catch(error => {
        console.error('Failed to activate update:', error);
        // Fallback to simple reload
        window.location.reload();
      });
    }
  }

  // Public methods
  public getCurrentNetworkStatus(): NetworkStatus {
    return this.networkStatusSubject.value;
  }

  public isCurrentlyOnline(): boolean {
    return this.networkStatusSubject.value.online;
  }

  public getConnectionQuality(): string {
    const status = this.networkStatusSubject.value;
    if (!status.online) return 'offline';
    if (status.effectiveType === '4g') return 'excellent';
    if (status.effectiveType === '3g') return 'good';
    if (status.effectiveType === '2g') return 'poor';
    return 'unknown';
  }

  public requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied' as NotificationPermission);
  }

  public async cacheData(key: string, data: any): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open('money-manager-data');
        const response = new Response(JSON.stringify(data));
        await cache.put(key, response);
      }
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  public async getCachedData(key: string): Promise<any> {
    try {
      if ('caches' in window) {
        const cache = await caches.open('money-manager-data');
        const response = await cache.match(key);
        if (response) {
          return await response.json();
        }
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
    }
    return null;
  }

  public async clearCache(): Promise<void> {
    try {
      await this.clearApplicationCaches();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  public async clearAllCaches(): Promise<void> {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      }

      // Clear localStorage (optional - be careful with this)
      // localStorage.clear();

      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear all caches:', error);
    }
  }

  public forceUpdate(): void {
    this.forceAppUpdate();
  }
} 