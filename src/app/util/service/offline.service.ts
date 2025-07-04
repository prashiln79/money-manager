import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';

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

  constructor(private swUpdate: SwUpdate) {
    this.initializeNetworkMonitoring();
    this.initializeServiceWorkerUpdates();
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
      // Check for updates every 6 hours
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 6 * 60 * 60 * 1000);

      // Handle available updates
      this.swUpdate.versionUpdates.subscribe(event => {
        console.log('Service worker update event:', event);
        
        if (event.type === 'VERSION_READY') {
          console.log('New version available:', event);
          this.promptUserForUpdate();
        } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
          console.error('Service worker installation failed:', event);
        }
      });

      // Handle activated updates (deprecated in newer versions)
      // this.swUpdate.activated.subscribe(event => {
      //   console.log('Service worker activated:', event);
      // });
    }
  }

  private updateNetworkStatus(status: Partial<NetworkStatus>): void {
    const currentStatus = this.networkStatusSubject.value;
    this.networkStatusSubject.next({ ...currentStatus, ...status });
  }

  private handleNetworkChange(online: boolean): void {
    if (online) {
      console.log('🌐 Network connection restored');
      this.showOnlineNotification();
    } else {
      console.log('📴 Network connection lost');
      this.showOfflineNotification();
    }
  }

  private showOnlineNotification(): void {
    // You can integrate this with your notification service
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Money Manager', {
        body: 'Network connection restored. Your data will sync automatically.',
        icon: '/icons/icon-192x192.png'
      });
    }
  }

  private showOfflineNotification(): void {
    // You can integrate this with your notification service
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Money Manager', {
        body: 'You\'re offline. Changes will be saved locally and synced when connection is restored.',
        icon: '/icons/icon-192x192.png'
      });
    }
  }

  private promptUserForUpdate(): void {
    if (confirm('A new version of Money Manager is available. Would you like to update now?')) {
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
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
} 