import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// Cache management for mobile devices
function initializeCacheManagement() {
  // Check if this is a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Add cache busting for mobile
    const currentVersion = new Date().toISOString().split('T')[0];
    const storedVersion = localStorage.getItem('app-version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log('App version changed on mobile, clearing cache');
      clearAllCaches().then(() => {
        localStorage.setItem('app-version', currentVersion);
        console.log('Cache cleared and version updated');
      });
    } else {
      localStorage.setItem('app-version', currentVersion);
    }
  }
}

async function clearAllCaches() {
  try {
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // Clear IndexedDB
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    }
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Initialize cache management
initializeCacheManagement();

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true
})
  .catch(err => console.error(err));
