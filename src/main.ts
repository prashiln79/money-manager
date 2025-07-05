import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// PWA Navigation and Service Worker initialization
function initializePwaFeatures() {
  // Handle PWA installation
  let deferredPrompt: any;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA install prompt ready');
  });

  // Handle app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
  });

  // Handle navigation events for PWA
  window.addEventListener('popstate', (event) => {
    console.log('Navigation event:', event);
  });

  // Handle visibility change for PWA
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('App went to background');
    } else {
      console.log('App came to foreground');
    }
  });

  // Handle beforeunload for PWA
  window.addEventListener('beforeunload', (event) => {
    // Save app state before unload
    const appState = {
      timestamp: Date.now(),
      url: window.location.href,
      scrollPosition: window.scrollY
    };
    
    try {
      localStorage.setItem('app-state', JSON.stringify(appState));
    } catch (error) {
      console.warn('Failed to save app state:', error);
    }
  });
}

// Intelligent cache management that preserves authentication
function initializeCacheManagement() {
  // Check if this is a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Use weekly versioning to reduce unnecessary cache clears
    const now = new Date();
    const weekNumber = Math.ceil(now.getDate() / 7);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const currentVersion = `${year}-${month.toString().padStart(2, '0')}-W${weekNumber}`;
    
    const storedVersion = localStorage.getItem('app-version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log('App version changed on mobile, performing smart cache update');
      performSmartCacheUpdate(storedVersion, currentVersion);
    } else {
      localStorage.setItem('app-version', currentVersion);
    }
  }
}

async function performSmartCacheUpdate(oldVersion: string, newVersion: string): Promise<void> {
  try {
    console.log(`Performing smart cache update from ${oldVersion} to ${newVersion}`);
    
    // Preserve authentication state
    const authData = preserveAuthData();
    
    // Clear only application caches, not authentication data
    await clearApplicationCaches();
    
    // Restore authentication state
    restoreAuthData(authData);
    
    // Update version
    localStorage.setItem('app-version', newVersion);
    
    console.log('Smart cache update completed successfully');
  } catch (error) {
    console.error('Smart cache update failed:', error);
    // Don't force reload on failure - let the app continue
  }
}

function preserveAuthData(): any {
  const authData: any = {};
  
  // Preserve Firebase Auth state
  if (localStorage.getItem('firebase:authUser:')) {
    const authKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('firebase:authUser:') || 
      key.startsWith('firebase:persistence:')
    );
    authKeys.forEach(key => {
      authData[key] = localStorage.getItem(key);
    });
  }
  
  // Preserve user preferences
  const userPrefs = ['theme', 'language', 'user-settings'];
  userPrefs.forEach(pref => {
    const value = localStorage.getItem(pref);
    if (value) authData[pref] = value;
  });
  
  return authData;
}

function restoreAuthData(authData: any): void {
  // Restore preserved data
  Object.keys(authData).forEach(key => {
    localStorage.setItem(key, authData[key]);
  });
}

async function clearApplicationCaches(): Promise<void> {
  try {
    // Clear service worker caches (excluding auth-related caches)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const appCaches = cacheNames.filter(name => 
        !name.includes('firebase') && 
        !name.includes('auth') && 
        !name.includes('user')
      );
      
      await Promise.all(
        appCaches.map(cacheName => caches.delete(cacheName))
      );
    }

    // Clear application-specific localStorage items
    const keysToRemove = Object.keys(localStorage).filter(key => 
      !key.startsWith('firebase:') &&
      !key.startsWith('user') &&
      !key.startsWith('theme') &&
      !key.startsWith('language') &&
      key !== 'app-version'
    );
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Application caches cleared successfully');
  } catch (error) {
    console.error('Failed to clear application caches:', error);
    throw error;
  }
}

// Initialize PWA features
initializePwaFeatures();

// Initialize cache management
initializeCacheManagement();

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true
})
  .catch(err => console.error(err));
