import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { OfflineService } from '../../service/offline.service';

@Component({
  selector: 'app-cache-manager',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="p-4 bg-white rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Cache Management</h3>
      
      <div class="space-y-4">
        <!-- Cache Status -->
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <h4 class="font-medium text-gray-900">Cache Status</h4>
            <p class="text-sm text-gray-600">Manage app cache and updates</p>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span class="text-sm text-gray-600">Active</span>
          </div>
        </div>

        <!-- Clear Cache Button -->
        <button 
          (click)="clearCache()"
          [disabled]="isClearing"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <mat-icon class="text-sm">{{ isClearing ? 'hourglass_empty' : 'clear_all' }}</mat-icon>
          <span>{{ isClearing ? 'Clearing Cache...' : 'Clear Cache' }}</span>
        </button>

        <!-- Force Update Button -->
        <button 
          (click)="forceUpdate()"
          [disabled]="isUpdating"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <mat-icon class="text-sm">{{ isUpdating ? 'hourglass_empty' : 'system_update' }}</mat-icon>
          <span>{{ isUpdating ? 'Updating...' : 'Force Update' }}</span>
        </button>

        <!-- Check for Updates Button -->
        <button 
          (click)="checkForUpdates()"
          [disabled]="isChecking"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <mat-icon class="text-sm">{{ isChecking ? 'hourglass_empty' : 'refresh' }}</mat-icon>
          <span>{{ isChecking ? 'Checking...' : 'Check for Updates' }}</span>
        </button>

        <!-- Network Status -->
        <div class="p-3 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2">Network Status</h4>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Connection:</span>
            <div class="flex items-center space-x-2">
              <div 
                class="w-2 h-2 rounded-full"
                [class]="getNetworkStatusClass()"
              ></div>
              <span class="text-sm font-medium">{{ getNetworkStatusText() }}</span>
            </div>
          </div>
        </div>

        <!-- App Version -->
        <div class="p-3 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2">App Information</h4>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Version:</span>
              <span class="text-sm font-medium">{{ getAppVersion() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Last Updated:</span>
              <span class="text-sm font-medium">{{ getLastUpdated() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CacheManagerComponent {
  isClearing = false;
  isUpdating = false;
  isChecking = false;

  constructor(private offlineService: OfflineService) {}

  async clearCache(): Promise<void> {
    this.isClearing = true;
    try {
      await this.offlineService.clearAllCaches();
      alert('Cache cleared successfully!');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      this.isClearing = false;
    }
  }

  async forceUpdate(): Promise<void> {
    this.isUpdating = true;
    try {
      this.offlineService.forceUpdate();
    } catch (error) {
      console.error('Failed to force update:', error);
      alert('Failed to force update. Please try again.');
      this.isUpdating = false;
    }
  }

  async checkForUpdates(): Promise<void> {
    this.isChecking = true;
    try {
      // This will trigger the service worker update check
      window.location.reload();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      alert('Failed to check for updates. Please try again.');
    } finally {
      this.isChecking = false;
    }
  }

  getNetworkStatusClass(): string {
    const status = this.offlineService.getCurrentNetworkStatus();
    if (!status.online) return 'bg-red-500';
    if (status.effectiveType === '4g') return 'bg-green-500';
    if (status.effectiveType === '3g') return 'bg-yellow-500';
    return 'bg-gray-500';
  }

  getNetworkStatusText(): string {
    const status = this.offlineService.getCurrentNetworkStatus();
    if (!status.online) return 'Offline';
    if (status.effectiveType === '4g') return '4G';
    if (status.effectiveType === '3g') return '3G';
    if (status.effectiveType === '2g') return '2G';
    return 'Unknown';
  }

  getAppVersion(): string {
    return new Date().toISOString().split('T')[0];
  }

  getLastUpdated(): string {
    const lastUpdated = localStorage.getItem('app-version') || this.getAppVersion();
    return new Date(lastUpdated).toLocaleDateString();
  }
} 