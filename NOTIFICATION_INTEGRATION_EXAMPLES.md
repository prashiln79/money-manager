# Notification Integration Examples

This guide shows how to integrate the push notification system into existing components of the Money Manager application.

## 🔧 Basic Integration

### 1. Import the Notification Manager

```typescript
import { NotificationManagerService } from '../../util/service/notification-manager.service';

export class MyComponent {
  constructor(
    private notificationManager: NotificationManagerService
  ) {}
}
```

### 2. Check Notification Support

```typescript
ngOnInit() {
  if (this.notificationManager.isSupported()) {
    console.log('Notifications are supported');
    
    // Check permission status
    const permission = this.notificationManager.getPermissionStatus();
    if (permission === 'default') {
      // Request permission when appropriate
      this.requestNotificationPermission();
    }
  }
}

async requestNotificationPermission() {
  const permission = await this.notificationManager.requestPermission();
  if (permission === 'granted') {
    console.log('Notification permission granted');
  }
}
```

## 📱 Component Integration Examples

### Transaction List Component

```typescript
// src/app/component/dashboard/transaction-list/transaction-list.component.ts

import { NotificationManagerService } from '../../../util/service/notification-manager.service';

export class TransactionListComponent {
  constructor(
    private notificationManager: NotificationManagerService,
    // ... other dependencies
  ) {}

  // Send notification when new transaction is added
  async onTransactionAdded(transaction: any) {
    // Save transaction logic...
    
    // Send notification
    await this.notificationManager.sendTransactionAlert(transaction);
  }

  // Send notification for large transactions
  async onLargeTransaction(transaction: any) {
    if (transaction.amount > 1000) {
      await this.notificationManager.sendCustomNotification({
        key: 'large-transaction',
        title: 'Large Transaction Alert',
        body: `Large transaction detected: ${transaction.description} - $${transaction.amount}`,
        data: { transactionId: transaction.id }
      });
    }
  }
}
```

### Budget Component

```typescript
// src/app/component/dashboard/budgets/budgets.component.ts

import { NotificationManagerService } from '../../../util/service/notification-manager.service';

export class BudgetsComponent {
  constructor(
    private notificationManager: NotificationManagerService,
    // ... other dependencies
  ) {}

  // Send notification when budget limit is reached
  async checkBudgetLimits(budget: any, currentSpending: number) {
    const limit = budget.limit;
    const percentage = (currentSpending / limit) * 100;

    if (percentage >= 80) {
      await this.notificationManager.sendBudgetReminder(
        budget, 
        currentSpending, 
        limit
      );
    }
  }

  // Send notification when budget is exceeded
  async onBudgetExceeded(budget: any, currentSpending: number) {
    await this.notificationManager.sendCustomNotification({
      key: 'budget-exceeded',
      title: 'Budget Exceeded!',
      body: `${budget.name} budget has been exceeded by ${this.formatCurrency(currentSpending - budget.limit)}`,
      data: { budgetId: budget.id },
      requireInteraction: true // Important notification
    });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
```

### Goals Component

```typescript
// src/app/component/dashboard/goals/goals.component.ts

import { NotificationManagerService } from '../../../util/service/notification-manager.service';

export class GoalsComponent {
  constructor(
    private notificationManager: NotificationManagerService,
    // ... other dependencies
  ) {}

  // Send notification when goal progress is updated
  async onGoalProgressUpdated(goal: any, newProgress: number) {
    const percentage = (newProgress / goal.targetAmount) * 100;
    
    // Send progress update
    await this.notificationManager.sendGoalUpdate(goal, newProgress);

    // Send special notification for milestone achievements
    if (percentage >= 100) {
      await this.notificationManager.sendCustomNotification({
        key: 'goal-achieved',
        title: '🎉 Goal Achieved!',
        body: `Congratulations! You've reached your goal: ${goal.name}`,
        data: { goalId: goal.id },
        requireInteraction: false,
        silent: false // Celebrate with sound!
      });
    } else if (percentage >= 50 && percentage < 51) {
      // Halfway milestone
      await this.notificationManager.sendCustomNotification({
        key: 'goal-halfway',
        title: 'Halfway There!',
        body: `You're 50% of the way to your goal: ${goal.name}`,
        data: { goalId: goal.id }
      });
    }
  }
}
```

### User Registration/Sign-in Component

```typescript
// src/app/component/auth/sign-in/sign-in.component.ts

import { NotificationManagerService } from '../../../util/service/notification-manager.service';

export class SignInComponent {
  constructor(
    private notificationManager: NotificationManagerService,
    // ... other dependencies
  ) {}

  // Send welcome notification for new users
  async onUserRegistered(user: any) {
    // Registration logic...
    
    // Send welcome notification
    await this.notificationManager.sendWelcomeNotification(user.displayName || user.email);
  }

  // Request notification permission after successful sign-in
  async onSignInSuccess(user: any) {
    // Sign-in logic...
    
    // Check if this is the first sign-in
    const isFirstSignIn = !localStorage.getItem('has-signed-in-before');
    
    if (isFirstSignIn) {
      localStorage.setItem('has-signed-in-before', 'true');
      
      // Request notification permission
      const permission = await this.notificationManager.requestPermission();
      
      if (permission === 'granted') {
        // Send welcome notification
        await this.notificationManager.sendWelcomeNotification(user.displayName || user.email);
      }
    }
  }
}
```

### Security/Profile Component

```typescript
// src/app/component/dashboard/profile/profile.component.ts

import { NotificationManagerService } from '../../../util/service/notification-manager.service';

export class ProfileComponent {
  constructor(
    private notificationManager: NotificationManagerService,
    // ... other dependencies
  ) {}

  // Send security alert for suspicious activity
  async onSuspiciousActivity(activity: any) {
    await this.notificationManager.sendSecurityAlert({
      id: activity.id,
      message: `Suspicious activity detected: ${activity.description}. Please review your account.`
    });
  }

  // Send notification for password change
  async onPasswordChanged() {
    await this.notificationManager.sendCustomNotification({
      key: 'password-changed',
      title: 'Password Updated',
      body: 'Your password has been successfully changed.',
      data: { type: 'security' }
    });
  }

  // Send notification for email verification
  async onEmailVerified() {
    await this.notificationManager.sendCustomNotification({
      key: 'email-verified',
      title: 'Email Verified',
      body: 'Your email address has been successfully verified.',
      data: { type: 'account' }
    });
  }
}
```

## 🔄 Scheduled Notifications

### Weekly Summary Service

```typescript
// src/app/util/service/weekly-summary.service.ts

import { Injectable } from '@angular/core';
import { NotificationManagerService } from './notification-manager.service';

@Injectable({
  providedIn: 'root'
})
export class WeeklySummaryService {
  constructor(
    private notificationManager: NotificationManagerService
  ) {}

  // Send weekly summary every Sunday
  async sendWeeklySummary() {
    const summary = await this.calculateWeeklySummary();
    
    await this.notificationManager.sendWeeklySummary({
      totalSpent: summary.totalSpent,
      budgetStatus: summary.budgetStatus
    });
  }

  private async calculateWeeklySummary() {
    // Calculate weekly spending and budget status
    // This would integrate with your existing data services
    return {
      totalSpent: 1250.50,
      budgetStatus: 'You stayed within your budget this week!'
    };
  }
}
```

### Bill Reminder Service

```typescript
// src/app/util/service/bill-reminder.service.ts

import { Injectable } from '@angular/core';
import { NotificationManagerService } from './notification-manager.service';

@Injectable({
  providedIn: 'root'
})
export class BillReminderService {
  constructor(
    private notificationManager: NotificationManagerService
  ) {}

  // Check for upcoming bills daily
  async checkUpcomingBills() {
    const upcomingBills = await this.getUpcomingBills();
    
    for (const bill of upcomingBills) {
      const daysUntilDue = this.calculateDaysUntilDue(bill.dueDate);
      
      if (daysUntilDue <= 3) {
        await this.notificationManager.sendBillReminder(bill, daysUntilDue);
      }
    }
  }

  private async getUpcomingBills() {
    // Get bills from your data service
    return [
      { id: '1', name: 'Electric Bill', amount: 150, dueDate: new Date() },
      { id: '2', name: 'Internet Bill', amount: 80, dueDate: new Date() }
    ];
  }

  private calculateDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
```

## 🎯 Conditional Notifications

### Smart Notification Logic

```typescript
// Example of conditional notification logic

export class SmartNotificationService {
  constructor(
    private notificationManager: NotificationManagerService
  ) {}

  // Only send notifications based on user preferences and context
  async sendSmartNotification(type: string, data: any) {
    // Check if user has enabled this notification type
    const settings = this.notificationManager.getNotificationSettings();
    
    if (!settings[type]) {
      console.log(`Notification type ${type} is disabled`);
      return;
    }

    // Check time of day (don't send notifications late at night)
    const hour = new Date().getHours();
    if (hour < 8 || hour > 22) {
      console.log('Outside notification hours');
      return;
    }

    // Check if user is active (don't send if they're using the app)
    if (document.visibilityState === 'visible') {
      console.log('User is active, notification might be redundant');
      return;
    }

    // Send the notification
    switch (type) {
      case 'transaction':
        await this.notificationManager.sendTransactionAlert(data);
        break;
      case 'budget':
        await this.notificationManager.sendBudgetReminder(data.budget, data.spending, data.limit);
        break;
      // ... other cases
    }
  }
}
```

## 📊 Analytics Integration

### Notification Analytics

```typescript
// Track notification engagement

export class NotificationAnalyticsService {
  constructor(
    private notificationManager: NotificationManagerService
  ) {
    this.setupAnalytics();
  }

  private setupAnalytics() {
    // Listen to notification events
    this.notificationManager.notifications$.subscribe(notification => {
      if (notification?.data?.action) {
        this.trackNotificationAction(notification);
      }
    });
  }

  private trackNotificationAction(notification: any) {
    const action = notification.data.action;
    const type = notification.data.type;
    
    // Send analytics data
    console.log(`Notification ${type} action: ${action}`);
    
    // You can integrate with your analytics service here
    // gtag('event', 'notification_action', {
    //   notification_type: type,
    //   action: action
    // });
  }
}
```

## 🚀 Best Practices

### 1. Permission Timing
- Request notification permission at appropriate times (after user engagement)
- Don't request permission immediately on app load
- Provide context about why notifications are useful

### 2. Notification Frequency
- Don't overwhelm users with too many notifications
- Use smart timing and user preferences
- Group related notifications when possible

### 3. Content Quality
- Keep notification content concise and actionable
- Use clear, benefit-focused messaging
- Include relevant data and context

### 4. User Control
- Always respect user notification preferences
- Provide easy ways to manage notification settings
- Allow users to disable specific notification types

### 5. Testing
- Test notifications in different app states (foreground, background, closed)
- Test on different devices and browsers
- Verify notification actions work correctly

## 🔧 Troubleshooting

### Common Issues

1. **Notifications not showing**
   - Check browser permissions
   - Verify VAPID key configuration
   - Ensure HTTPS is used in production

2. **Permission denied**
   - Guide users through browser settings
   - Provide clear instructions for enabling notifications

3. **Service worker issues**
   - Clear browser cache
   - Check service worker registration
   - Verify Firebase configuration

### Debug Commands

```javascript
// Check notification support
console.log('Notifications supported:', 'Notification' in window);

// Check permission status
console.log('Permission:', Notification.permission);

// Check FCM token
console.log('FCM Token:', localStorage.getItem('fcm-token'));

// Test notification
if (Notification.permission === 'granted') {
  new Notification('Test', { body: 'Test notification' });
}
```

This integration guide provides practical examples of how to add push notifications to your existing components while following best practices for user experience and performance. 