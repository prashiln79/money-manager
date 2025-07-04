# Cache Management Guide for Money Manager PWA

## Overview

This guide explains how to handle cache issues on mobile devices after deployments, particularly for the Money Manager PWA.

## The Problem

Mobile browsers and PWAs aggressively cache resources, which can cause issues after deployments:
- Old versions of the app remain cached
- Service worker doesn't update properly
- Users see outdated content
- App appears to not update

## Solutions Implemented

### 1. Enhanced Offline Service

The `OfflineService` now includes:
- **Mobile-specific update checks** (every 30 minutes vs 6 hours on desktop)
- **Automatic cache clearing** when app version changes
- **Force update functionality** for manual cache invalidation
- **Better update notifications** with mobile-optimized UI

### 2. Cache Management Component

A dedicated cache management interface accessible via:
- User dropdown menu → "Cache Management"
- Provides buttons to:
  - Clear all caches
  - Force app update
  - Check for updates
  - View app version info

### 3. Deployment Script

`deploy-cache-bust.js` automatically:
- Generates new version numbers
- Updates manifest files
- Adds cache-busting parameters to resources
- Creates deployment tracking files

### 4. Service Worker Configuration

Enhanced `ngsw-config.json` with:
- **Freshness strategy** for navigation requests
- **Better cache invalidation** rules
- **Mobile-optimized** caching strategies

## Usage

### For Developers

#### Before Deployment
```bash
# Run cache busting script
npm run cache-bust

# Or build with cache busting
npm run build:cache-bust

# Or use the full deploy command
npm run deploy
```

#### Manual Cache Clearing (Development)
```typescript
// In browser console
import { OfflineService } from './app/util/service/offline.service';
const offlineService = new OfflineService();
await offlineService.clearAllCaches();
```

### For Users

#### Mobile Cache Management
1. Open the app
2. Tap the user icon in the header
3. Select "Cache Management"
4. Choose an option:
   - **Clear Cache**: Removes all cached data
   - **Force Update**: Reloads the app with fresh content
   - **Check for Updates**: Triggers service worker update check

#### Manual Browser Cache Clearing
**Chrome (Android):**
1. Open Chrome
2. Go to Settings → Privacy and security
3. Clear browsing data
4. Select "Cached images and files"
5. Clear data

**Safari (iOS):**
1. Go to Settings → Safari
2. Clear History and Website Data

## Technical Details

### Cache Busting Strategy

1. **Version Tracking**: Uses date-based versioning with timestamps
2. **Parameter Addition**: Adds `?v=timestamp` to resource URLs
3. **Service Worker Updates**: Forces service worker to check for updates
4. **IndexedDB Clearing**: Removes all local databases

### Mobile Detection

```typescript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
```

### Update Flow

1. **App Startup**: Checks for version changes
2. **Service Worker**: Monitors for updates every 30 minutes (mobile)
3. **Network Restoration**: Triggers update check when back online
4. **User Action**: Manual cache clearing via UI

## Troubleshooting

### Common Issues

#### App Not Updating
1. Check if service worker is registered
2. Clear browser cache manually
3. Use "Force Update" in cache management
4. Check network connectivity

#### Cache Management Not Working
1. Ensure service worker is enabled
2. Check browser console for errors
3. Verify offline service is properly injected
4. Try manual cache clearing

#### Mobile-Specific Issues
1. **iOS Safari**: May require manual cache clearing
2. **Android Chrome**: Check "Site settings" for storage
3. **PWA Installation**: Uninstall and reinstall the app

### Debug Commands

```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});

// Check cache status
caches.keys().then(keys => {
  console.log('Cache Names:', keys);
});

// Force service worker update
navigator.serviceWorker.getRegistration().then(registration => {
  registration.update();
});
```

## Best Practices

### For Development
1. **Always run cache busting** before deployment
2. **Test on real mobile devices** after deployment
3. **Monitor service worker updates** in production
4. **Provide clear user feedback** for cache operations

### For Users
1. **Use the cache management UI** instead of browser settings
2. **Check for updates** when experiencing issues
3. **Clear cache** if the app seems outdated
4. **Report persistent issues** to support

## Monitoring

### Version Tracking
- App version is stored in `localStorage['app-version']`
- Deployment info is saved in `deployment-info.json`
- Service worker tracks its own version

### Update Detection
- Console logs show update events
- Network status is monitored continuously
- User notifications for important updates

## Future Improvements

1. **Automatic Update Detection**: Push notifications for updates
2. **Incremental Updates**: Delta updates instead of full cache clear
3. **Smart Caching**: Intelligent cache invalidation based on file changes
4. **User Preferences**: Allow users to configure update frequency

## Support

If you encounter cache-related issues:
1. Check this guide first
2. Use the cache management tools in the app
3. Clear browser cache manually if needed
4. Contact support with specific error messages 