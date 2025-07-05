# PWA Navigation Features

This document describes the comprehensive PWA navigation features implemented in the Money Manager application.

## Overview

The PWA navigation system provides a native app-like experience with proper handling of:
- Hardware back button (Android)
- iOS swipe back gestures
- Browser back/forward buttons
- Keyboard navigation
- PWA installation prompts
- Offline/online state management
- App lifecycle events

## Components

### 1. PwaNavigationService

**Location**: `src/app/util/service/pwa-navigation.service.ts`

**Features**:
- Tracks navigation state and history
- Handles hardware back button on mobile devices
- Manages iOS swipe back gestures
- Provides keyboard navigation support (Alt+Left, Escape)
- Detects PWA standalone mode
- Manages navigation stack

**Key Methods**:
```typescript
goBack(): void                    // Navigate back
goForward(): void                 // Navigate forward
navigateTo(route: string): void   // Navigate to specific route
clearNavigationStack(): void      // Clear navigation history
isStandaloneMode(): boolean       // Check if app is in standalone mode
isMobileMode(): boolean          // Check if running on mobile
```

### 2. PwaBackButtonComponent

**Location**: `src/app/util/components/pwa-back-button/pwa-back-button.component.ts`

**Features**:
- Smart back button that shows/hides based on navigation state
- Adapts styling for standalone PWA mode
- Responsive design for mobile devices
- Customizable text display

**Usage**:
```html
<app-pwa-back-button 
  [showText]="true"
  [alwaysShow]="false"
  (backClicked)="onBackClick()">
</app-pwa-back-button>
```

### 3. PwaNavigationBarComponent

**Location**: `src/app/util/components/pwa-navigation-bar/pwa-navigation-bar.component.ts`

**Features**:
- Complete navigation bar with back button, title, and actions
- Offline indicator
- Refresh button
- Home button
- Custom action slots
- PWA-optimized styling

**Usage**:
```html
<app-pwa-navigation-bar 
  title="Page Title"
  [showBackButton]="true"
  [showHomeButton]="true"
  [showRefreshButton]="true"
  (backClicked)="onBackClick()"
  (homeClicked)="onHomeClick()"
  (refreshClicked)="onRefreshClick()">
  
  <div nav-actions>
    <!-- Custom actions -->
  </div>
</app-pwa-navigation-bar>
```

### 4. PwaInstallPromptComponent

**Location**: `src/app/util/components/pwa-install-prompt/pwa-install-prompt.component.ts`

**Features**:
- Automatic PWA installation prompt
- Smart dismissal with 7-day cooldown
- Responsive design
- Dark theme support
- Installation tracking

**Usage**:
```html
<app-pwa-install-prompt
  (installClicked)="onInstallClicked()"
  (dismissClicked)="onDismissClicked()">
</app-pwa-install-prompt>
```

### 5. PwaSwService

**Location**: `src/app/util/service/pwa-sw.service.ts`

**Features**:
- Service worker update management
- Automatic update activation for patch releases
- App lifecycle event handling
- Background/foreground state management
- Installation status tracking

## Navigation Features

### Hardware Back Button Support

**Android**:
- Listens for `backbutton` events
- Handles modal/dialog closing
- Provides exit confirmation for standalone PWA

**iOS**:
- Detects swipe back gestures from left edge
- Threshold-based gesture recognition
- Smooth navigation experience

### Keyboard Navigation

- **Alt + Left Arrow**: Navigate back
- **Escape**: Close modals/dialogs
- **Browser back/forward**: Fully supported

### PWA-Specific Features

**Standalone Mode Detection**:
```typescript
const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true;
```

**App Lifecycle Events**:
- `beforeunload`: Save app state
- `visibilitychange`: Handle background/foreground
- `beforeinstallprompt`: Handle installation
- `appinstalled`: Track successful installation

### Navigation Stack Management

The service maintains a navigation stack to provide intelligent back navigation:

```typescript
interface NavigationState {
  canGoBack: boolean;
  currentRoute: string;
  previousRoute: string;
  navigationStack: string[];
  isStandalone: boolean;
  isMobile: boolean;
}
```

## Implementation in Components

### Using PWA Navigation in Components

```typescript
import { PwaNavigationService } from '../../util/service/pwa-navigation.service';

export class MyComponent {
  constructor(private pwaNavigation: PwaNavigationService) {}

  ngOnInit() {
    // Subscribe to navigation state changes
    this.pwaNavigation.navigationState$.subscribe(state => {
      console.log('Navigation state:', state);
    });
  }

  goBack() {
    this.pwaNavigation.goBack();
  }
}
```

### Adding Navigation Bar to Pages

```html
<app-pwa-navigation-bar 
  title="My Page"
  [showBackButton]="true">
  
  <div nav-actions>
    <button (click)="saveData()">Save</button>
  </div>
</app-pwa-navigation-bar>

<div class="page-content">
  <!-- Page content here -->
</div>
```

## Configuration

### Service Worker Configuration

The service worker is configured in `ngsw-config.json` with:
- Navigation URL patterns
- Cache strategies
- Offline fallbacks
- Update policies

### Manifest Configuration

The `manifest.webmanifest` includes:
- PWA installation settings
- Display modes
- Orientation preferences
- Edge side panel support

## Best Practices

### 1. Navigation State Management
- Always check `canGoBack` before showing back buttons
- Use the navigation service instead of direct location calls
- Clear navigation stack when appropriate

### 2. PWA Installation
- Don't show install prompt immediately
- Respect user dismissal preferences
- Track installation success/failure

### 3. Offline Support
- Always check online status before network requests
- Provide offline indicators
- Cache critical data for offline use

### 4. Mobile Optimization
- Use larger touch targets (44px minimum)
- Provide haptic feedback where possible
- Optimize for one-handed use

## Testing

### Testing PWA Navigation

1. **Hardware Back Button**:
   - Test on Android device
   - Verify modal closing behavior
   - Check exit confirmation

2. **iOS Gestures**:
   - Test swipe back from left edge
   - Verify gesture threshold
   - Check smooth animation

3. **Keyboard Navigation**:
   - Test Alt+Left arrow
   - Test Escape key
   - Test browser back/forward

4. **PWA Installation**:
   - Test install prompt appearance
   - Verify dismissal behavior
   - Check installation success

5. **Offline Behavior**:
   - Test offline indicator
   - Verify cached content
   - Check sync when online

## Troubleshooting

### Common Issues

1. **Back button not working**:
   - Check if navigation stack is empty
   - Verify PWA navigation service is injected
   - Ensure proper route configuration

2. **Install prompt not showing**:
   - Check if app is already installed
   - Verify manifest configuration
   - Check browser compatibility

3. **Hardware back button not responding**:
   - Ensure running in standalone mode
   - Check Android device compatibility
   - Verify event listener registration

### Debug Information

Enable debug logging by checking browser console for:
- Navigation state changes
- Service worker events
- PWA installation events
- Offline/online transitions

## Future Enhancements

1. **Advanced Gestures**:
   - Multi-finger gestures
   - Custom gesture recognition
   - Haptic feedback integration

2. **Navigation Analytics**:
   - User navigation patterns
   - Back button usage statistics
   - Installation conversion rates

3. **Enhanced Offline Support**:
   - Background sync
   - Conflict resolution
   - Progressive data loading

4. **Accessibility Improvements**:
   - Screen reader support
   - Voice navigation
   - High contrast mode

## Conclusion

The PWA navigation system provides a comprehensive, native app-like experience while maintaining web compatibility. It handles all major navigation scenarios and provides a solid foundation for future enhancements. 