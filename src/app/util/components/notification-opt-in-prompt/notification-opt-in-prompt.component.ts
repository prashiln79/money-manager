import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseMessagingService } from '../../service/firebase-messaging.service';
import { UserService } from '../../service/db/user.service';
import { SsrService } from '../../service/ssr.service';
import { NotificationService } from '../../service/notification.service';
import { Subscription } from 'rxjs';

const DISMISS_KEY = 'group_notification_prompt_dismissed_at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Component({
  selector: 'app-notification-opt-in-prompt',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (isVisible()) {
      <div class="notification-prompt-banner animate-slide-up" role="region" aria-label="Notification opt-in">
        <div class="prompt-container">
          <div class="prompt-icon-wrapper">
            <div class="prompt-icon-badge">
              <mat-icon>notifications_active</mat-icon>
            </div>
          </div>
          <div class="prompt-text">
            <h4 class="prompt-title">Stay Updated on Group Activity</h4>
            <p class="prompt-subtitle">
              Receive instant alerts whenever your family members record a new expense or income.
            </p>
          </div>
          <div class="prompt-actions">
            <button
              mat-flat-button
              color="primary"
              class="enable-btn"
              [disabled]="isRequesting()"
              (click)="enableNotifications()">
              {{ isRequesting() ? 'Enabling...' : 'Enable Notifications' }}
            </button>
            <button
              mat-button
              class="dismiss-btn"
              [disabled]="isRequesting()"
              (click)="dismiss()">
              Not Now
            </button>
          </div>
          <button
            mat-icon-button
            class="close-btn"
            aria-label="Close notification prompt"
            (click)="dismiss()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .notification-prompt-banner {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      width: calc(100% - 32px);
      max-width: 600px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 18px;
      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.08);
      padding: 16px 20px;
      color: #1e293b;
      font-family: inherit;
    }

    :host-context(.dark-theme) .notification-prompt-banner,
    :host-context(.dark) .notification-prompt-banner {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(255, 255, 255, 0.12);
      color: #f8fafc;
      box-shadow: 0 14px 36px -4px rgba(0, 0, 0, 0.45);
    }

    .prompt-container {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .prompt-icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      flex-shrink: 0;
    }

    .prompt-text {
      flex: 1;
      min-width: 0;
    }

    .prompt-title {
      margin: 0 0 4px 0;
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.25;
    }

    .prompt-subtitle {
      margin: 0;
      font-size: 0.83rem;
      color: #64748b;
      line-height: 1.35;
    }

    :host-context(.dark-theme) .prompt-subtitle,
    :host-context(.dark) .prompt-subtitle {
      color: #94a3b8;
    }

    .prompt-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .enable-btn {
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.86rem;
      padding: 0 14px;
      height: 38px;
    }

    .dismiss-btn {
      border-radius: 10px;
      font-weight: 500;
      font-size: 0.86rem;
      color: #64748b;
      height: 38px;
    }

    :host-context(.dark-theme) .dismiss-btn,
    :host-context(.dark) .dismiss-btn {
      color: #cbd5e1;
    }

    .close-btn {
      position: absolute;
      top: -8px;
      right: -10px;
      color: #94a3b8;
      transform: scale(0.85);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translate(-50%, 20px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }

    .animate-slide-up {
      animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @media (max-width: 640px) {
      .notification-prompt-banner {
        bottom: 80px; /* Above mobile bottom navigation */
        padding: 14px;
        border-radius: 16px;
      }

      .prompt-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .prompt-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .enable-btn, .dismiss-btn {
        flex: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationOptInPromptComponent implements OnInit, OnDestroy {
  private messagingService = inject(FirebaseMessagingService);
  private userService = inject(UserService);
  private ssrService = inject(SsrService);
  private notificationService = inject(NotificationService);

  readonly isVisible = signal<boolean>(false);
  readonly isRequesting = signal<boolean>(false);

  private sub: Subscription | null = null;

  ngOnInit(): void {
    if (!this.ssrService.isClientSide()) return;

    // Check whether the platform supports notifications
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Check if user previously dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const timeElapsed = Date.now() - parseInt(dismissedAt, 10);
      if (timeElapsed < DISMISS_DURATION_MS) {
        return;
      }
    }

    // Only prompt when permission is still default (not yet requested, granted, or denied)
    if (Notification.permission !== 'default') {
      return;
    }

    // Prompt authenticated users
    this.sub = this.userService.userAuth$.subscribe((user) => {
      if (user && user.uid !== 'offline-guest' && Notification.permission === 'default') {
        // Delay slightly for smooth initial rendering
        setTimeout(() => {
          this.isVisible.set(true);
        }, 3000);
      } else {
        this.isVisible.set(false);
      }
    });
  }

  async enableNotifications(): Promise<void> {
    this.isRequesting.set(true);
    try {
      const permission = await this.messagingService.requestPermission();
      if (permission === 'granted') {
        this.notificationService.success('Push notifications enabled for family transactions!');
        this.isVisible.set(false);
      } else if (permission === 'denied') {
        this.notificationService.info('Notifications denied. You can re-enable them anytime in Settings.');
        this.dismiss();
      } else {
        this.dismiss();
      }
    } catch (err) {
      console.error('Failed to enable notifications from opt-in prompt:', err);
      this.dismiss();
    } finally {
      this.isRequesting.set(false);
    }
  }

  dismiss(): void {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (_) {}
    this.isVisible.set(false);
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }
}
