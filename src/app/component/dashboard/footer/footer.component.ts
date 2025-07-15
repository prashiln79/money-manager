import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { OfflineService } from '../../../util/service/offline.service';
import { Subscription, interval } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { HapticFeedbackService } from '../../../util/service/haptic-feedback.service';
import { filter } from 'rxjs/operators';
import { MobileAddTransactionComponent } from '../transaction-list/add-transaction/mobile-add-transaction/mobile-add-transaction.component';
import { APP_CONFIG } from '../../../util/config/config';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  private timeSubscription?: Subscription;
  private batterySubscription?: Subscription;
  private routeSubscription?: Subscription;
  currentTime = '';
  batteryLevel = 0;

  constructor(
    private offlineService: OfflineService,
    private router: Router,
    private _dialog: MatDialog,
    private hapticFeedback: HapticFeedbackService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.updateTime();
    this.updateBatteryLevel();
    
    // Update time every minute
    this.timeSubscription = interval(60000).subscribe(() => {
      this.updateTime();
    });

    // Update battery level every 5 minutes
    this.batterySubscription = interval(APP_CONFIG.OFFLINE.SYNC_INTERVAL).subscribe(() => {
      this.updateBatteryLevel();
    });

    // Listen to route changes for highlighting
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Trigger change detection
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.timeSubscription?.unsubscribe();
    this.batterySubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  // Route checking methods for highlighting
  isHomeActive(): boolean {
    return this.router.url === '/dashboard' || this.router.url === '/dashboard/home';
  }

  isExpenseActive(): boolean {
    return this.router.url === '/dashboard/transactions'
  }

  isReportsActive(): boolean {
    return this.router.url === '/dashboard/reports';
  }

  isCategoryActive(): boolean {
    return this.router.url === '/dashboard/category';
  }

  isMoreActive(): boolean {
    const moreRoutes = [
      '/dashboard/accounts',
      '/dashboard/budgets', 
      '/dashboard/goals',
      '/dashboard/notes',
      '/dashboard/tax',
      '/dashboard/subscription'
    ];
    return moreRoutes.includes(this.router.url);
  }

  // Toolbar Action Methods
  addTransaction() {
    const dialogRef = this._dialog.open(MobileAddTransactionComponent, {
      width: '600px',
      maxWidth: '100vw',
    });
  }

  home() {
    this.router.navigate(['/dashboard/home']);
  }

  quickExpense() {
    this.router.navigate(['/dashboard/transactions']);
  }

  reports() {
    console.log('Quick transfer clicked');
    this.router.navigate(['/dashboard/reports']);
  }

  scanReceipt() {
    console.log('Scan receipt clicked');
    // TODO: Implement receipt scanning functionality
    alert('Receipt scanning feature coming soon!');
  }

  openAddTransactionModal() {
    console.log('Open add transaction modal clicked');
    this.router.navigate(['/dashboard/add-transaction']);
  }

  openSettings() {
    console.log('Settings clicked');
    this.router.navigate(['/dashboard/settings']);
  }

  openReports() {
    console.log('Reports clicked');
    this.router.navigate(['/dashboard/reports']);
  }

  openSearch() {
    console.log('Search clicked');
    // TODO: Implement search functionality
    alert('Search feature coming soon!');
  }

  onMoreMenuClick() {
    this.hapticFeedback.buttonClick();
    console.log('More menu clicked');
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  sharePWA() {
    this.hapticFeedback.buttonClick();
    
    const shareData = {
      title: 'Money Manager',
      text: 'Check out this amazing money management app!',
      url: 'https://prashiln79.github.io/wallet/#/sign-in'
    };

    // Try to use Web Share API first
    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => {
          console.log('Shared successfully');
        })
        .catch((error) => {
          console.log('Error sharing:', error);
          this.fallbackShare(shareData.url);
        });
    } else {
      // Fallback to clipboard copy
      this.fallbackShare(shareData.url);
    }
  }

  private fallbackShare(url: string) {
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      // Show success message (you might want to use a toast service here)
      alert('PWA link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('PWA link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link. Please copy manually: ' + url);
      }
      document.body.removeChild(textArea);
    });
  }

  getAppVersion(): string {
    return new Date().toISOString().split('T')[0];
  }

  getNetworkStatusClass(): string {
    const status = this.offlineService.getCurrentNetworkStatus();
    if (!status.online) return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
    if (status.effectiveType === '4g') return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    if (status.effectiveType === '3g') return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  }

  getNetworkIndicatorClass(): string {
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
    return 'Online';
  }

  getCurrentTime(): string {
    return this.currentTime;
  }

  getBatteryLevel(): number {
    return this.batteryLevel;
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString(APP_CONFIG.LANGUAGE.DEFAULT, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  private updateBatteryLevel(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryLevel = Math.round(battery.level * 100);
      }).catch(() => {
        this.batteryLevel = 0;
      });
    } else {
      // Fallback for browsers that don't support battery API
      this.batteryLevel = 0;
    }
  }
} 