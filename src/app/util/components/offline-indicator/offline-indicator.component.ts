import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { OfflineService, NetworkStatus } from '../../service/offline.service';

@Component({
  selector: 'app-offline-indicator',
  template: `
    <div 
      *ngIf="!isOnline" 
      class="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center shadow-lg"
      [@slideDown]
    >
      <div class="flex items-center justify-center space-x-2">
        <mat-icon class="text-white">wifi_off</mat-icon>
        <span class="text-sm font-medium">You're offline. Changes will be saved locally.</span>
        <button 
          mat-icon-button 
          class="text-white hover:bg-yellow-600 rounded-full"
          (click)="dismissOfflineBanner()"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <div 
      *ngIf="showOnlineBanner" 
      class="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-center shadow-lg"
      [@slideDown]
    >
      <div class="flex items-center justify-center space-x-2">
        <mat-icon class="text-white">wifi</mat-icon>
        <span class="text-sm font-medium">Connection restored. Syncing data...</span>
        <button 
          mat-icon-button 
          class="text-white hover:bg-green-600 rounded-full"
          (click)="dismissOnlineBanner()"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <!-- Connection Quality Indicator (Optional) -->
    <div 
      *ngIf="showConnectionQuality && isOnline" 
      class="fixed top-16 right-4 z-40 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg"
      [@fadeIn]
    >
      <div class="flex items-center space-x-2">
        <div 
          class="w-2 h-2 rounded-full"
          [class]="getConnectionQualityClass()"
        ></div>
        <span class="text-xs">{{ getConnectionQualityText() }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  animations: [
    trigger('slideDown', [
      state('void', style({
        transform: 'translateY(-100%)',
        opacity: 0
      })),
      transition('void => *', [
        animate('0.3s ease-out')
      ])
    ]),
    trigger('fadeIn', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.9)'
      })),
      transition('void => *', [
        animate('0.2s ease-out')
      ])
    ])
  ]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  isOnline = true;
  showOnlineBanner = false;
  showConnectionQuality = false;
  private subscriptions: Subscription[] = [];

  constructor(private offlineService: OfflineService) {}

  ngOnInit(): void {
    // Subscribe to network status changes
    this.subscriptions.push(
      this.offlineService.networkStatus$.subscribe(status => {
        const wasOnline = this.isOnline;
        this.isOnline = status.online;
        
        // Show online banner when connection is restored
        if (!wasOnline && this.isOnline) {
          this.showOnlineBanner = true;
          setTimeout(() => {
            this.showOnlineBanner = false;
          }, 5000); // Hide after 5 seconds
        }
      })
    );

    // Show connection quality indicator on mobile
    if (window.innerWidth <= 768) {
      this.showConnectionQuality = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  dismissOfflineBanner(): void {
    // This will be handled by the service
  }

  dismissOnlineBanner(): void {
    this.showOnlineBanner = false;
  }

  getConnectionQualityClass(): string {
    const quality = this.offlineService.getConnectionQuality();
    switch (quality) {
      case 'excellent': return 'bg-green-400';
      case 'good': return 'bg-yellow-400';
      case 'poor': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  }

  getConnectionQualityText(): string {
    const quality = this.offlineService.getConnectionQuality();
    switch (quality) {
      case 'excellent': return '4G';
      case 'good': return '3G';
      case 'poor': return '2G';
      default: return 'Unknown';
    }
  }
} 