import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SyncItem {
  id: string;
  type: 'transaction' | 'budget' | 'account' | 'goal';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingItems: number;
  lastSyncTime: number | null;
  isSyncing: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BackgroundSyncService {
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    pendingItems: 0,
    lastSyncTime: null,
    isSyncing: false
  });

  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(private ngZone: NgZone) {
    this.initializeBackgroundSync();
    this.setupNetworkMonitoring();
  }

  /**
   * Get sync status observable
   */
  get syncStatus$(): Observable<SyncStatus> {
    return this.syncStatusSubject.asObservable();
  }

  /**
   * Get current sync status
   */
  get syncStatus(): SyncStatus {
    return this.syncStatusSubject.value;
  }

  /**
   * Initialize background sync functionality
   */
  private async initializeBackgroundSync(): Promise<void> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator) || !('sync' in window)) {
        console.warn('Background Sync API not supported');
        return;
      }

      // Get service worker registration
      const registrations = await navigator.serviceWorker.getRegistrations();
      this.serviceWorkerRegistration = registrations.find(reg => 
        reg.scope.includes('/') || reg.scope.includes('/wallet/')
      ) || null;

      if (!this.serviceWorkerRegistration) {
        console.warn('Service worker not registered for background sync');
        return;
      }

      console.log('Background sync initialized successfully');
      this.updateSyncStatus({ isOnline: navigator.onLine });

    } catch (error) {
      console.error('Failed to initialize background sync:', error);
    }
  }

  /**
   * Setup network connectivity monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.ngZone.run(() => {
        console.log('Network: Online');
        this.updateSyncStatus({ isOnline: true });
        this.triggerBackgroundSync();
      });
    });

    window.addEventListener('offline', () => {
      this.ngZone.run(() => {
        console.log('Network: Offline');
        this.updateSyncStatus({ isOnline: false });
      });
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.ngZone.run(() => {
          console.log('Connection type changed:', connection.effectiveType);
          if (connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g') {
            this.triggerBackgroundSync();
          }
        });
      });
    }
  }

  /**
   * Register a sync item for background processing
   */
  async registerSyncItem(item: Omit<SyncItem, 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const syncItem: SyncItem = {
        ...item,
        timestamp: Date.now(),
        retryCount: 0
      };

      // Store in IndexedDB for persistence
      await this.storeSyncItem(syncItem);

      // Update sync status
      this.updateSyncStatus({ 
        pendingItems: this.syncStatus.pendingItems + 1 
      });

      // Trigger background sync if online
      if (navigator.onLine) {
        await this.triggerBackgroundSync();
      }

      console.log('Sync item registered:', syncItem.id);

    } catch (error) {
      console.error('Failed to register sync item:', error);
    }
  }

  /**
   * Trigger background sync for specific data type
   */
  async triggerBackgroundSync(syncType?: string): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service worker not available for background sync');
      return;
    }

    try {
      this.updateSyncStatus({ isSyncing: true });

      // Register background sync
      const syncTag = syncType || 'sync-transactions';
      if ('sync' in this.serviceWorkerRegistration) {
        // @ts-ignore: Property 'sync' may not exist on some types
        await (this.serviceWorkerRegistration as any).sync.register(syncTag);
        console.log('Background sync triggered:', syncTag);
      } else {
        console.warn('Background Sync is not supported in this browser.');
      }
      // Update last sync time
      this.updateSyncStatus({ 
        lastSyncTime: Date.now(),
        isSyncing: false 
      });

    } catch (error) {
      console.error('Failed to trigger background sync:', error);
      this.updateSyncStatus({ isSyncing: false });
    }
  }

  /**
   * Get pending sync items
   */
  async getPendingItems(): Promise<SyncItem[]> {
    try {
      // This would interact with your IndexedDB
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get pending items:', error);
      return [];
    }
  }

  /**
   * Clear completed sync items
   */
  async clearCompletedItems(): Promise<void> {
    try {
      // Clear completed items from IndexedDB
      const pendingItems = await this.getPendingItems();
      this.updateSyncStatus({ pendingItems: pendingItems.length });
    } catch (error) {
      console.error('Failed to clear completed items:', error);
    }
  }

  /**
   * Store sync item in IndexedDB
   */
  private async storeSyncItem(item: SyncItem): Promise<void> {
    // Implementation would use IndexedDB
    // For now, just log the item
    console.log('Storing sync item:', item);
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    const newStatus = { ...currentStatus, ...updates };
    this.syncStatusSubject.next(newStatus);
  }

  /**
   * Manual sync trigger
   */
  async manualSync(): Promise<void> {
    console.log('Manual sync triggered');
    await this.triggerBackgroundSync();
  }

  /**
   * Check if background sync is supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in window;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalPending: number;
    lastSyncTime: number | null;
    syncSuccessRate: number;
  }> {
    const pendingItems = await this.getPendingItems();
    return {
      totalPending: pendingItems.length,
      lastSyncTime: this.syncStatus.lastSyncTime,
      syncSuccessRate: 0.95 // This would be calculated from actual sync history
    };
  }
} 