
import { useState, useEffect } from 'react';

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  serviceWorkerReady: boolean;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    serviceWorkerReady: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register enhanced service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/offline-sw.js')
        .then((registration) => {
          console.log('[PWA] Enhanced SW registered:', registration.scope);
          setPwaState(prev => ({ ...prev, serviceWorkerReady: true }));
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New service worker available');
                  // Optionally show update notification
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Enhanced SW registration failed:', error);
        });
    }

    // Check if app is installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    setPwaState(prev => ({ ...prev, isInstalled }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for online/offline status
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
      }
    };
    
    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaState(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
      }
      setDeferredPrompt(null);
    }
  };

  const requestPersistentStorage = async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const persistent = await navigator.storage.persist();
      console.log(`[PWA] Persistent storage: ${persistent ? 'granted' : 'denied'}`);
      return persistent;
    }
    return false;
  };

  return {
    ...pwaState,
    installApp,
    requestPersistentStorage,
  };
};
