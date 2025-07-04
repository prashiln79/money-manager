# Debugging Offline Service Worker Issues

## Common Issues and Solutions

### 1. Service Worker Not Registering

**Symptoms:**
- No service worker in Chrome DevTools → Application → Service Workers
- Console errors about service worker registration

**Solutions:**
```bash
# Check if service worker is enabled in production
ng build --configuration production
ng serve --configuration production

# Check ngsw-config.json exists and is valid
cat ngsw-config.json
```

### 2. Service Worker Update Issues

**Symptoms:**
- `versionUpdates` not firing
- Update notifications not showing

**Fixed Issues:**
- ✅ Updated from `available` to `versionUpdates` (Angular 16+)
- ✅ Added proper event type checking (`VERSION_READY`)
- ✅ Added `activateUpdate()` call before reload

### 3. Animation Errors

**Symptoms:**
- Console errors about missing animation imports
- Animations not working

**Fixed Issues:**
- ✅ Added proper Angular animation imports
- ✅ Updated animation syntax to use `trigger`, `state`, `transition`

### 4. Component Registration Issues

**Symptoms:**
- `'app-offline-indicator' is not a known element`
- Component not found errors

**Solutions:**
- ✅ Added components to app.module.ts declarations
- ✅ Removed standalone property from components

### 5. Network Status Detection Issues

**Symptoms:**
- Offline indicator not showing
- Network status not updating

**Debug Steps:**
```javascript
// In browser console
console.log('navigator.onLine:', navigator.onLine);
console.log('connection:', navigator.connection);

// Test offline mode
// Chrome DevTools → Network → Offline
```

### 6. Firebase Offline Persistence Issues

**Symptoms:**
- Data not persisting offline
- Sync issues when back online

**Debug Steps:**
```javascript
// Check Firebase persistence
import { getFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';

const firestore = getFirestore();
enableIndexedDbPersistence(firestore)
  .then(() => console.log('✅ Persistence enabled'))
  .catch(err => console.error('❌ Persistence error:', err));
```

## Testing Checklist

### ✅ Service Worker
- [ ] Service worker registers successfully
- [ ] Service worker caches resources
- [ ] Service worker updates work
- [ ] Offline mode works

### ✅ Offline Service
- [ ] Network status detection works
- [ ] Connection quality detection works
- [ ] Data caching works
- [ ] Notification permissions work

### ✅ UI Components
- [ ] Offline indicator shows/hides correctly
- [ ] Animations work smoothly
- [ ] Offline page displays correctly
- [ ] No console errors

### ✅ Data Sync
- [ ] Transactions save offline
- [ ] Data syncs when online
- [ ] Offline queue works
- [ ] Conflict resolution works

## Debug Commands

```bash
# Build for production (required for service worker)
ng build --configuration production

# Serve with service worker
ng serve --configuration production

# Run tests
ng test --include="**/offline.service.spec.ts"

# Check service worker
# Chrome DevTools → Application → Service Workers

# Check cache storage
# Chrome DevTools → Application → Storage → Cache Storage

# Check IndexedDB
# Chrome DevTools → Application → Storage → IndexedDB
```

## Common Error Messages

### "Service worker registration failed"
- Check if running in production mode
- Verify ngsw-config.json exists
- Check for HTTPS requirement

### "versionUpdates is not a function"
- Update Angular to version 16+
- Use `versionUpdates` instead of `available`

### "Animation trigger not found"
- Import animations from '@angular/animations'
- Use proper animation syntax

### "Component not found"
- Add component to module declarations
- Check import paths

## Performance Monitoring

### Lighthouse Audit
```bash
# Install Lighthouse
npm install -g lighthouse

# Run PWA audit
lighthouse http://localhost:4200 --view --only-categories=pwa
```

### Service Worker Metrics
- Update success rate
- Cache hit rate
- Offline usage patterns
- Sync performance

## Troubleshooting Steps

1. **Check Console Errors**
   - Look for TypeScript compilation errors
   - Check for runtime JavaScript errors
   - Verify service worker registration

2. **Test Offline Mode**
   - Chrome DevTools → Network → Offline
   - Test app functionality
   - Check data persistence

3. **Verify Service Worker**
   - Chrome DevTools → Application → Service Workers
   - Check if service worker is active
   - Verify cache contents

4. **Test Data Sync**
   - Create transaction offline
   - Go back online
   - Verify data syncs

5. **Check Network Status**
   - Monitor network status indicator
   - Test connection quality detection
   - Verify offline notifications

## Support

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify all files are properly imported and declared
3. Test in production mode (service worker only works in production)
4. Ensure HTTPS is used (required for service worker)
5. Check Angular version compatibility

---

**Note**: Most issues are resolved by ensuring the app runs in production mode with HTTPS, as service workers have strict requirements for security and caching. 