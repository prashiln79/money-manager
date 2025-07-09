import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { OfflineService, NetworkStatus } from '../../service/offline.service';
import { NotificationService } from '../../service/notification.service';
import { APP_CONFIG } from '../../config/config';

@Component({
  selector: 'app-offline-indicator',
  templateUrl: './offline-indicator.component.html',
  styleUrls: ['./offline-indicator.component.scss'],
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
  private subscriptions: Subscription[] = [];

  constructor(private offlineService: OfflineService, private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Subscribe to network status changes
    this.subscriptions.push(
      this.offlineService.networkStatus$.subscribe(status => {
        const wasOnline = this.isOnline;
        this.isOnline = status.online;

        if(!this.isOnline){
          this.notificationService.info('You are offline. Please check your internet connection.');
        }
        
        // Show online banner when connection is restored
        if (!wasOnline && this.isOnline) {
          this.showOnlineBanner = true;
          this.notificationService.info('Connection restored. Syncing data...');
          setTimeout(() => {
            this.showOnlineBanner = false;
          }, APP_CONFIG.NOTIFICATIONS.AUTO_HIDE_DELAY); // Use config duration
        }
      })
    );

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

  
} 