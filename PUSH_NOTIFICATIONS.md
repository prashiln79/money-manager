# Push Notifications Implementation Guide

## Overview

This guide explains how to set up and use Firebase Cloud Messaging (FCM) for push notifications in the Money Manager application. The implementation includes both foreground and background notification handling, user preferences, and various notification types.

## 🚀 Features Implemented

### ✅ Core Functionality
- **Firebase Cloud Messaging Integration**: Full FCM setup with VAPID key support
- **Foreground & Background Notifications**: Handles notifications in both app states
- **User Permission Management**: Request and manage notification permissions
- **Notification Settings UI**: Complete settings interface for user preferences
- **Multiple Notification Types**: Transaction alerts, budget reminders, goal updates, etc.
- **Service Worker Integration**: Background notification handling
- **Token Management**: FCM token generation, storage, and refresh

### ✅ Notification Types
- **Transaction Alerts**: New transaction notifications
- **Budget Reminders**: Spending limit alerts
- **Goal Updates**: Progress tracking notifications
- **Bill Reminders**: Payment due notifications
- **Security Alerts**: Important security notifications
- **Welcome Messages**: New user onboarding
- **Weekly Summaries**: Spending reports

### ✅ User Controls
- **Granular Settings**: Enable/disable specific notification types
- **Advanced Options**: Sound, vibration, and interaction preferences
- **Token Management**: View, copy, and refresh FCM tokens
- **Permission Status**: Real-time permission status display

## 🔧 Setup Instructions

### 1. Firebase Console Configuration

#### Step 1: Enable Cloud Messaging
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`money-manager-b394e`)
3. Navigate to **Project Settings** → **Cloud Messaging**
4. Enable **Cloud Messaging API**

#### Step 2: Generate VAPID Key
1. In **Cloud Messaging** settings, scroll to **Web configuration**
2. Click **Generate Key Pair** under **Web Push certificates**
3. Copy the generated VAPID key

#### Step 3: Update Environment Files
Replace `YOUR_VAPID_KEY_HERE` in both environment files:

```typescript
// src/environments/environment.ts
export const environment = {
  // ... existing config
  vapidKey: "YOUR_ACTUAL_VAPID_KEY_HERE"
};

// src/environments/environment.prod.ts
export const environment = {
  // ... existing config
  vapidKey: "YOUR_ACTUAL_VAPID_KEY_HERE"
};
```

### 2. Service Worker Setup

The Firebase messaging service worker (`src/firebase-messaging-sw.js`) is already configured and will be automatically registered when the app loads.

### 3. Build and Deploy

```bash
# Build for production
npm run build

# Deploy to your hosting platform
npm run deploy
```

## 📱 Usage Guide

### For Users

#### Accessing Notification Settings
1. Navigate to `/dashboard/notifications` in the app
2. Or add a link in your navigation menu

#### Managing Notifications
1. **Enable Notifications**: Click "Enable Notifications" to grant permission
2. **Notification Types**: Toggle specific notification types on/off
3. **Advanced Settings**: Configure sound, vibration, and interaction preferences
4. **Test Notifications**: Send test notifications to verify setup

#### Notification Types Available
- **Transaction Alerts**: Get notified about new transactions
- **Budget Reminders**: Alerts when approaching spending limits
- **Goal Updates**: Track progress on financial goals
- **Bill Reminders**: Never miss bill payments
- **Security Alerts**: Important security notifications

### For Developers

#### Sending Notifications

```typescript
import { NotificationManagerService } from './util/service/notification-manager.service';

export class MyComponent {
  constructor(private notificationManager: NotificationManagerService) {}

  // Send transaction alert
  async sendTransactionNotification(transaction: any) {
    await this.notificationManager.sendTransactionAlert(transaction);
  }

  // Send budget reminder
  async sendBudgetNotification(budget: any, currentSpending: number, limit: number) {
    await this.notificationManager.sendBudgetReminder(budget, currentSpending, limit);
  }

  // Send custom notification
  async sendCustomNotification() {
    await this.notificationManager.sendCustomNotification({
      key: 'custom',
      title: 'Custom Title',
      body: 'Custom message body',
      data: { customData: 'value' }
    });
  }
}
```

#### Checking Notification Status

```typescript
// Check if notifications are supported
if (this.notificationManager.isSupported()) {
  // Request permission
  const permission = await this.notificationManager.requestPermission();
  
  if (permission === 'granted') {
    // Get FCM token
    const token = await this.notificationManager.getToken();
    console.log('FCM Token:', token);
  }
}
```

#### Managing User Preferences

```typescript
// Update notification type settings
this.notificationManager.updateNotificationSettings('transactions', true);

// Update advanced settings
this.notificationManager.updateAdvancedSettings('soundEnabled', false);

// Get current settings
const settings = this.notificationManager.getNotificationSettings();
const advanced = this.notificationManager.getAdvancedSettings();
```

## 🔍 Testing

### Local Testing
1. **Build for Production**: `npm run build`
2. **Serve with HTTPS**: Use a local HTTPS server (required for notifications)
3. **Request Permission**: Navigate to notification settings and enable
4. **Test Notifications**: Use the "Test Notification" button

### Browser Testing
1. **Chrome DevTools**: Check Application → Service Workers
2. **Network Tab**: Monitor FCM requests
3. **Console**: Check for FCM-related logs

### Mobile Testing
1. **Install PWA**: Add to home screen
2. **Grant Permissions**: Allow notifications when prompted
3. **Background Testing**: Close app and send notifications

## 🛠️ Troubleshooting

### Common Issues

#### Notifications Not Working
1. **Check HTTPS**: Notifications require HTTPS in production
2. **Verify VAPID Key**: Ensure VAPID key is correctly set in environment
3. **Check Permissions**: Verify notification permission is granted
4. **Service Worker**: Ensure service worker is registered

#### Permission Denied
1. **Browser Settings**: Check browser notification settings
2. **Site Settings**: Verify site has notification permission
3. **Multiple Tabs**: Close other tabs that might be using notifications

#### Token Issues
1. **Token Generation**: Check console for FCM token generation errors
2. **Token Refresh**: Use "Refresh Token" button in settings
3. **Network Issues**: Ensure stable internet connection

### Debug Commands

```javascript
// Check service worker registration
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});

// Check notification permission
console.log('Notification Permission:', Notification.permission);

// Check FCM token
localStorage.getItem('fcm-token');
```

## 📊 Analytics & Monitoring

### Firebase Analytics Integration
The implementation includes basic analytics tracking for:
- Notification permission requests
- Token generation success/failure
- Notification clicks and actions
- User preference changes

### Monitoring Notifications
- **Console Logs**: Detailed logging for debugging
- **Error Tracking**: Automatic error reporting
- **Performance Metrics**: Token refresh and notification delivery times

## 🔒 Security Considerations

### Best Practices
1. **VAPID Key Security**: Keep VAPID key secure and rotate regularly
2. **Token Storage**: FCM tokens are stored locally only
3. **Permission Handling**: Always respect user permission choices
4. **Data Privacy**: Notification data is minimal and user-controlled

### Privacy Features
- **Granular Controls**: Users can disable specific notification types
- **Local Storage**: All settings stored locally
- **No Tracking**: No personal data sent to external services
- **User Consent**: Explicit permission required for notifications

## 🚀 Advanced Features

### Scheduled Notifications
```typescript
// Schedule a notification for later
setTimeout(() => {
  this.notificationManager.sendBudgetReminder(budget, spending, limit);
}, 5000); // 5 seconds delay
```

### Conditional Notifications
```typescript
// Only send if user has enabled this type
if (this.notificationManager.getNotificationSettings()['budgets']) {
  await this.notificationManager.sendBudgetReminder(budget, spending, limit);
}
```

### Custom Notification Actions
```typescript
// Send notification with custom actions
await this.notificationManager.sendCustomNotification({
  key: 'custom',
  title: 'Action Required',
  body: 'Please review your account',
  actions: [
    { action: 'review', title: 'Review Now' },
    { action: 'later', title: 'Remind Later' }
  ]
});
```

## 📈 Performance Optimization

### Token Management
- **Automatic Refresh**: Tokens are refreshed when needed
- **Efficient Storage**: Minimal localStorage usage
- **Error Recovery**: Automatic retry on token generation failure

### Notification Delivery
- **Background Processing**: Service worker handles background notifications
- **Efficient Caching**: Minimal resource usage
- **Smart Retry**: Automatic retry for failed deliveries

## 🔄 Future Enhancements

### Planned Features
1. **Rich Notifications**: Images and custom layouts
2. **Notification History**: Track sent and received notifications
3. **Smart Scheduling**: AI-powered notification timing
4. **Cross-Device Sync**: Notifications across multiple devices
5. **Custom Sounds**: User-selectable notification sounds

### Integration Opportunities
1. **Analytics Dashboard**: Notification engagement metrics
2. **A/B Testing**: Test different notification strategies
3. **User Segmentation**: Targeted notifications based on behavior
4. **Automated Workflows**: Trigger notifications based on events

## 📞 Support

### Getting Help
1. **Check Console**: Look for error messages in browser console
2. **Verify Setup**: Ensure all configuration steps are completed
3. **Test Permissions**: Verify notification permissions are granted
4. **Check Network**: Ensure stable internet connection

### Common Solutions
- **Notifications not showing**: Check browser settings and permissions
- **Token not generating**: Verify VAPID key and Firebase configuration
- **Service worker issues**: Clear browser cache and reload
- **Permission denied**: Guide users through browser settings

## 📝 API Reference

### NotificationManagerService Methods

```typescript
// Core Methods
requestPermission(): Promise<NotificationPermission>
getToken(): Promise<string | null>
isSupported(): boolean
getPermissionStatus(): NotificationPermission

// Notification Methods
sendTransactionAlert(transaction: any): Promise<void>
sendBudgetReminder(budget: any, spending: number, limit: number): Promise<void>
sendGoalUpdate(goal: any, progress: number): Promise<void>
sendBillReminder(bill: any, daysUntilDue: number): Promise<void>
sendSecurityAlert(alert: any): Promise<void>
sendCustomNotification(type: NotificationType): Promise<void>
sendWelcomeNotification(userName: string): Promise<void>
sendWeeklySummary(summary: any): Promise<void>

// Settings Methods
updateNotificationSettings(type: string, enabled: boolean): void
updateAdvancedSettings(setting: string, value: boolean): void
getNotificationSettings(): { [key: string]: boolean }
getAdvancedSettings(): AdvancedSettings
```

### FirebaseMessagingService Methods

```typescript
// Core Methods
requestPermission(): Promise<NotificationPermission>
getToken(): Promise<string | null>
refreshToken(): Promise<string | null>
showNotification(notification: NotificationPayload): void

// Utility Methods
getStoredToken(): string | null
clearStoredToken(): void
isSupported(): boolean
getPermissionStatus(): NotificationPermission
sendTestNotification(): void
```

This implementation provides a complete, production-ready push notification system for the Money Manager application with comprehensive user controls, developer tools, and monitoring capabilities. 