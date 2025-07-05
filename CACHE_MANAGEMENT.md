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

# Cache Management Improvements

## Problem Solved

Previously, the app had an aggressive cache clearing strategy that would log out users whenever there was an app update. This was caused by:

1. **Daily version changes** - The app used date-based versioning that triggered cache clears on every app restart
2. **Complete cache clearing** - All caches including authentication data were cleared during updates
3. **Service worker conflicts** - The service worker wasn't properly configured to preserve auth state

## Solution Implemented

### 1. Smart Cache Update Strategy

The new system implements a "smart cache update" that:
- **Preserves authentication state** during cache updates
- **Only clears application caches**, not user data
- **Uses weekly versioning** instead of daily to reduce unnecessary cache clears
- **Maintains user preferences** and settings

### 2. Enhanced Authentication State Management

#### User Service Improvements:
- **Automatic user data caching** on login/signup
- **Offline user data access** through localStorage
- **Graceful cache recovery** during app updates
- **Proper cleanup** on logout

#### Auth Guard Enhancements:
- **Detection of cache update scenarios**
- **Better error messaging** for users
- **Query parameter tracking** for debugging

### 3. Service Worker Configuration

Updated `ngsw-config.json` to:
- **Separate auth API caching** from application caching
- **Preserve Firebase authentication** data
- **Better cache strategies** for different resource types

### 4. Main.ts Cache Management

Replaced aggressive cache clearing with:
- **Intelligent version checking**
- **Auth state preservation**
- **Selective cache clearing**

## Key Features

### Authentication State Preservation

```typescript
// Preserves Firebase auth data during cache updates
const authKeys = Object.keys(localStorage).filter(key => 
  key.startsWith('firebase:authUser:') || 
  key.startsWith('firebase:persistence:')
);
```

### Weekly Versioning

```typescript
// Reduces unnecessary cache clears
const weekNumber = Math.ceil(now.getDate() / 7);
const currentVersion = `${year}-${month.toString().padStart(2, '0')}-W${weekNumber}`;
```

### Smart Cache Clearing

```typescript
// Only clears application caches, preserves user data
const appCaches = cacheNames.filter(name => 
  !name.includes('firebase') && 
  !name.includes('auth') && 
  !name.includes('user')
);
```

## Benefits

1. **No More Unexpected Logouts** - Users stay logged in during app updates
2. **Better User Experience** - Seamless updates without disruption
3. **Improved Performance** - Reduced unnecessary cache clears
4. **Offline Resilience** - Better handling of network issues
5. **Debugging Support** - Better tracking of cache-related issues

## Monitoring and Debugging

### Console Logs

The system provides detailed logging:
- `Smart cache update completed successfully`
- `User data cached for offline access`
- `Found cached auth data, user might have been logged out due to cache update`

### Query Parameters

When users are redirected to sign-in, check for:
- `cacheUpdate=true` - Indicates cache update caused logout
- `session=expired` - Standard session expiration
- `redirect=URL` - Where user was trying to go

## Configuration

### Version Strategy

To change the versioning strategy, modify `getAppVersion()` in:
- `src/app/util/service/offline.service.ts`
- `src/main.ts`

### Cache Preservation Rules

To modify what gets preserved during cache updates, edit:
- `preserveAuthData()` method in offline service
- `clearApplicationCaches()` method in offline service

### Service Worker Cache Groups

To modify cache strategies, update:
- `ngsw-config.json` dataGroups section

## Testing

### Test Cache Updates

1. Deploy a new version of the app
2. Verify users remain logged in
3. Check console logs for cache update messages
4. Verify user data is preserved

### Test Offline Scenarios

1. Disconnect network
2. Verify app works offline
3. Reconnect network
4. Verify data syncs properly

### Test Authentication Recovery

1. Clear browser cache manually
2. Verify auth state is restored
3. Check user data is available

## Troubleshooting

### Users Still Getting Logged Out

1. Check console for cache update errors
2. Verify Firebase auth persistence is enabled
3. Check service worker registration
4. Review cache preservation rules

### Cache Not Updating

1. Check version strategy
2. Verify service worker is enabled
3. Check browser cache settings
4. Review cache clearing logic

### Performance Issues

1. Monitor cache sizes
2. Check cache clearing frequency
3. Review cache strategies
4. Optimize version checking

## Future Improvements

1. **Incremental Updates** - Only update changed resources
2. **Background Sync** - Sync data when network is restored
3. **Cache Analytics** - Track cache hit rates and performance
4. **User Notifications** - Inform users about updates
5. **Rollback Support** - Ability to revert to previous version 