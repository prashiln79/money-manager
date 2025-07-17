// Test script for Firebase Cloud Messaging notifications
// Run this in the browser console to test notifications

console.log('🔔 Firebase Notification Test Script');
console.log('=====================================');

// Test 1: Check browser support
console.log('\n1. Browser Support Check:');
console.log('- Service Worker:', 'serviceWorker' in navigator);
console.log('- Notifications:', 'Notification' in window);
console.log('- Push Manager:', 'PushManager' in window);

// Test 2: Check notification permission
console.log('\n2. Notification Permission:');
console.log('- Current permission:', Notification.permission);

// Test 3: Check service worker registrations
async function checkServiceWorkers() {
  console.log('\n3. Service Worker Registrations:');
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('- Total registrations:', registrations.length);
    
    registrations.forEach((reg, index) => {
      console.log(`- Registration ${index + 1}:`);
      console.log('  Scope:', reg.scope);
      console.log('  State:', reg.active?.state);
      console.log('  Script URL:', reg.active?.scriptURL);
    });
    
    // Check for Firebase messaging service worker
    const firebaseSW = registrations.find(reg => 
      reg.scope.includes('firebase-cloud-messaging-push-scope') ||
      reg.active?.scriptURL.includes('firebase-messaging-sw.js')
    );
    
    if (firebaseSW) {
      console.log('- ✅ Firebase messaging service worker found');
    } else {
      console.log('- ❌ Firebase messaging service worker not found');
    }
  } catch (error) {
    console.error('- Error checking service workers:', error);
  }
}

// Test 4: Check FCM token
async function checkFCMToken() {
  console.log('\n4. FCM Token Check:');
  try {
    const token = localStorage.getItem('fcm-token');
    if (token) {
      console.log('- ✅ FCM token found in localStorage');
      console.log('- Token (first 20 chars):', token.substring(0, 20) + '...');
    } else {
      console.log('- ❌ No FCM token found in localStorage');
    }
  } catch (error) {
    console.error('- Error checking FCM token:', error);
  }
}

// Test 5: Test native notification
function testNativeNotification() {
  console.log('\n5. Native Notification Test:');
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from the browser console',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      });
      
      notification.onclick = () => {
        console.log('- ✅ Notification clicked');
        notification.close();
      };
      
      console.log('- ✅ Test notification sent');
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
        console.log('- Test notification auto-closed');
      }, 5000);
    } catch (error) {
      console.error('- ❌ Error sending test notification:', error);
    }
  } else {
    console.log('- ❌ Cannot send test notification - permission not granted');
  }
}

// Test 6: Check Firebase configuration
function checkFirebaseConfig() {
  console.log('\n6. Firebase Configuration Check:');
  try {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined') {
      console.log('- ✅ Firebase is available');
      
      // Check if messaging is available
      if (firebase.messaging) {
        console.log('- ✅ Firebase messaging is available');
      } else {
        console.log('- ❌ Firebase messaging not available');
      }
    } else {
      console.log('- ❌ Firebase not available');
    }
  } catch (error) {
    console.error('- Error checking Firebase config:', error);
  }
}

// Test 7: Check environment variables
function checkEnvironment() {
  console.log('\n7. Environment Check:');
  try {
    // Check if we're on HTTPS
    const isHttps = window.location.protocol === 'https:';
    console.log('- HTTPS:', isHttps ? '✅ Yes' : '❌ No (required for notifications)');
    
    // Check if we're on localhost (allowed for development)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    console.log('- Localhost:', isLocalhost ? '✅ Yes' : '❌ No');
    
    // Check if we're in a PWA context
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('- PWA Standalone:', isStandalone ? '✅ Yes' : '❌ No');
    
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('- Mobile Device:', isMobile ? '✅ Yes' : '❌ No');
  } catch (error) {
    console.error('- Error checking environment:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting notification tests...\n');
  
  checkEnvironment();
  checkFirebaseConfig();
  await checkServiceWorkers();
  await checkFCMToken();
  testNativeNotification();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- If you see ❌ marks, those are the issues to fix');
  console.log('- Check the browser console for detailed error messages');
  console.log('- Make sure you\'re on HTTPS or localhost');
  console.log('- Ensure notification permission is granted');
}

// Export functions for manual testing
window.notificationTests = {
  runAllTests,
  checkServiceWorkers,
  checkFCMToken,
  testNativeNotification,
  checkFirebaseConfig,
  checkEnvironment
};

// Auto-run tests
runAllTests(); 