/**
 * PWA utilities for service worker registration and app installation
 */

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Check if app is installed
export const isAppInstalled = (): boolean => {
  // Check for standalone mode (PWA installed)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  return false;
};

// Get device type
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
};

// Check PWA support
export const isPWASupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (
  registration: ServiceWorkerRegistration,
  vapidKey: string
): Promise<PushSubscription | null> => {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    });
    
    console.log('Push subscription successful:', subscription);
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
};

// Get installation instructions based on browser
export const getInstallInstructions = (): { browser: string; instructions: string[] } => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return {
      browser: 'Chrome',
      instructions: [
        'Tap the menu button (⋮) in the top right',
        'Select "Add to Home screen" or "Install app"',
        'Tap "Add" or "Install" to confirm'
      ]
    };
  }
  
  if (userAgent.includes('firefox')) {
    return {
      browser: 'Firefox',
      instructions: [
        'Tap the menu button (⋮) in the top right',
        'Select "Add to Home screen"',
        'Tap "Add" to confirm'
      ]
    };
  }
  
  if (userAgent.includes('safari')) {
    return {
      browser: 'Safari',
      instructions: [
        'Tap the share button (□↗) at the bottom',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm'
      ]
    };
  }
  
  if (userAgent.includes('edg')) {
    return {
      browser: 'Edge',
      instructions: [
        'Tap the menu button (⋯) in the top right',
        'Select "Add to phone"',
        'Tap "Add" to confirm'
      ]
    };
  }
  
  return {
    browser: 'Browser',
    instructions: [
      'Look for an "Install" or "Add to Home Screen" option in your browser menu',
      'Follow the prompts to install the app'
    ]
  };
};

// Track PWA events
export const trackPWAEvent = (event: string, metadata?: Record<string, any>) => {
  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      event_category: 'PWA',
      ...metadata
    });
  }
  
  console.log('PWA Event:', event, metadata);
};