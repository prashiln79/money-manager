import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { OfflineService } from '../../../util/service/offline.service';
import { Subscription, interval } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TransactionComponent } from '../transaction-list/add-transaction/transaction/transaction.component';
import { CalendarVisibilityService } from '../../../util/service/calendar-visibility.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  private timeSubscription?: Subscription;
  private batterySubscription?: Subscription;
  currentTime = '';
  batteryLevel = 0;

  constructor(
    private offlineService: OfflineService,
    private router: Router,
    private _dialog: MatDialog,
    private calendarVisibilityService: CalendarVisibilityService
  ) {}

  ngOnInit() {
    this.updateTime();
    this.updateBatteryLevel();
    
    // Update time every minute
    this.timeSubscription = interval(60000).subscribe(() => {
      this.updateTime();
    });

    // Update battery level every 5 minutes
    this.batterySubscription = interval(300000).subscribe(() => {
      this.updateBatteryLevel();
    });
  }

  ngOnDestroy() {
    this.timeSubscription?.unsubscribe();
    this.batterySubscription?.unsubscribe();
  }

  // Toolbar Action Methods
  addTransaction() {
    const dialogRef = this._dialog.open(TransactionComponent, {
      width: '600px',
      maxWidth: '95vw',
    });
  }

  home() {
    console.log('Quick income clicked');
    // Show calendar view when home button is clicked
    this.calendarVisibilityService.showCalendar();
  }

  quickExpense() {
    console.log('Quick expense clicked');
    // Hide calendar view when expense button is clicked
    this.calendarVisibilityService.hideCalendar();
  }

  quickTransfer() {
    console.log('Quick transfer clicked');
    this.router.navigate(['/dashboard/add-transaction'], { 
      queryParams: { type: 'transfer' } 
    });
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

  openMoreMenu() {
    console.log('More menu clicked');
    this.showMoreMenu();
  }

  private showMoreMenu() {
    // Create a bottom sheet or modal for more options
    const menu = document.createElement('div');
    menu.className = 'fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-end';
    menu.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-t-xl w-full max-h-[60vh] overflow-y-auto">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">More Options</h3>
        </div>
        <div class="p-2">
          <button onclick="this.closest('.fixed').remove(); window.location.href='/dashboard/accounts'" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <mat-icon class="text-gray-600 dark:text-gray-400">account_balance</mat-icon>
            <span class="text-gray-700 dark:text-gray-300">Accounts</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.location.href='/dashboard/budgets'" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <mat-icon class="text-gray-600 dark:text-gray-400">pie_chart</mat-icon>
            <span class="text-gray-700 dark:text-gray-300">Budgets</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.location.href='/dashboard/goals'" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <mat-icon class="text-gray-600 dark:text-gray-400">flag</mat-icon>
            <span class="text-gray-700 dark:text-gray-300">Goals</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.location.href='/dashboard/notes'" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <mat-icon class="text-gray-600 dark:text-gray-400">note</mat-icon>
            <span class="text-gray-700 dark:text-gray-300">Notes</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.location.href='/dashboard/tax'" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <mat-icon class="text-gray-600 dark:text-gray-400">receipt</mat-icon>
            <span class="text-gray-700 dark:text-gray-300">Tax</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.location.href='/dashboard/subscription'" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <mat-icon class="text-gray-600 dark:text-gray-400">subscriptions</mat-icon>
            <span class="text-gray-700 dark:text-gray-300">Subscriptions</span>
          </button>
        </div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onclick="this.closest('.fixed').remove()" class="w-full py-2 text-gray-500 dark:text-gray-400">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(menu);

    // Close menu when clicking outside
    menu.addEventListener('click', (e) => {
      if (e.target === menu) {
        menu.remove();
      }
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
    this.currentTime = now.toLocaleTimeString('en-US', { 
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