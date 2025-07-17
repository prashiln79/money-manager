# Notification Troubleshooting Guide

## 🔍 Quick Diagnosis

### Step 1: Run the Test Script
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste the contents of `test-notifications.js`
5. Press Enter to run the diagnostic tests

### Step 2: Check the Results
The test script will show you exactly what's working and what's not. Look for ❌ marks - those indicate issues.

## 🚨 Common Issues and Solutions

### Issue 1: "Service Worker not supported"
**Symptoms:** Browser doesn't support service workers
**Solution:** 
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Ensure you're not in an iframe
- Check if you're in a secure context (HTTPS or localhost)

### Issue 2: "Firebase messaging service worker not found"
**Symptoms:** Firebase SW not registered
**Solutions:**
1. **Clear browser cache and reload**
2. **Check if the service worker file exists:**
   - Navigate to `https://yourdomain.com/firebase-messaging-sw.js`
   - Should show the service worker code
3. **Force re-registration:**
   - Go to Notification Settings in your app
   - Click "Force Re-registration" button
4. **Check Angular build:**
   - Ensure `firebase-messaging-sw.js` is in the `dist` folder
   - Rebuild the app: `npm run build`

### Issue 3: "No FCM token found"
**Symptoms:** No token in localStorage
**Solutions:**
1. **Request permission first:**
   - Go to Notification Settings
   - Click "Enable Notifications"
   - Grant permission when prompted
2. **Check VAPID key:**
   - Verify VAPID key in Firebase Console
   - Ensure it matches the one in `environment.ts`
3. **Check Firebase project:**
   - Ensure Cloud Messaging is enabled
   - Verify project ID matches

### Issue 4: "Permission denied"
**Symptoms:** Browser blocks notifications
**Solutions:**
1. **Browser settings:**
   - Click the lock/info icon in address bar
   - Find "Notifications" setting
   - Change from "Block" to "Allow"
2. **Site settings:**
   - Go to browser settings
   - Find site permissions
   - Allow notifications for your domain
3. **Clear site data:**
   - Clear cookies and site data
   - Reload the page

### Issue 5: "Not on HTTPS"
**Symptoms:** Notifications require secure context
**Solutions:**
1. **Development:** Use `localhost` or `127.0.0.1`
2. **Production:** Deploy to HTTPS
3. **Local testing:** Use `ng serve --ssl`

## 🔧 Advanced Troubleshooting

### Check Service Worker Registration
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('All registrations:', registrations);
});
```

### Check FCM Token
```javascript
// In browser console
console.log('FCM Token:', localStorage.getItem('fcm-token'));
```

### Test Native Notifications
```javascript
// In browser console (if permission granted)
new Notification('Test', { body: 'Hello World' });
```

### Check Firebase Configuration
```javascript
// In browser console
console.log('Firebase available:', typeof firebase !== 'undefined');
console.log('Messaging available:', typeof firebase.messaging !== 'undefined');
```

## 🛠️ Manual Fixes

### Fix 1: Re-register Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    if (registration.scope.includes('firebase')) {
      registration.unregister();
    }
  });
});
// Then reload the page
```

### Fix 2: Clear All Data
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Then reload the page
```

### Fix 3: Force Permission Request
```javascript
// In browser console
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

## 📱 Mobile-Specific Issues

### iOS Safari
- **Issue:** Limited notification support
- **Solution:** Use PWA (add to home screen)

### Android Chrome
- **Issue:** Background notifications not working
- **Solution:** Ensure app is not battery optimized

### PWA Context
- **Issue:** Different behavior in standalone mode
- **Solution:** Test both browser and PWA modes

## 🔍 Debug Information

### Check Debug Info in App
1. Go to Notification Settings
2. Scroll to "Debug Tools" section
3. Click "Debug Service Worker"
4. Check console for detailed information

### Environment Variables
- **VAPID Key:** Check `environment.ts` and `environment.prod.ts`
- **Firebase Config:** Verify project settings
- **Service Worker:** Ensure file is accessible

### Network Issues
- **CORS:** Check if service worker can load Firebase scripts
- **Firewall:** Ensure Firebase domains are accessible
- **Proxy:** Check if corporate proxy blocks Firebase

## 📞 Getting Help

### Before Asking for Help
1. ✅ Run the test script
2. ✅ Check browser console for errors
3. ✅ Verify Firebase Console settings
4. ✅ Test on different browsers/devices
5. ✅ Check if issue is environment-specific

### Information to Provide
- Browser and version
- Device type (desktop/mobile)
- Error messages from console
- Test script results
- Firebase project ID
- Environment (development/production)

### Common Debug Commands
```javascript
// Check all service workers
navigator.serviceWorker.getRegistrations()

// Check notification permission
Notification.permission

// Check FCM token
localStorage.getItem('fcm-token')

// Test notification
new Notification('Test')

// Check Firebase
typeof firebase
```

## 🎯 Success Checklist

- [ ] Service Worker registered
- [ ] Firebase messaging initialized
- [ ] Notification permission granted
- [ ] FCM token generated
- [ ] Test notification works
- [ ] Background notifications work
- [ ] Notification clicks work
- [ ] Works on mobile devices
- [ ] Works in PWA mode

## 🚀 Next Steps

Once notifications are working:

1. **Test different notification types**
2. **Configure notification settings**
3. **Set up server-side sending**
4. **Monitor delivery rates**
5. **Add analytics tracking**

---

**Need more help?** Check the Firebase documentation or create an issue with the debug information from the test script. 