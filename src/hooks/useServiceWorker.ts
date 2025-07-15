import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker after React app has fully loaded
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('[SW] Registering service worker...');
          const registration = await navigator.serviceWorker.register('/offline-sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });

          console.log('[SW] Service worker registered successfully');
          setSwRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('[SW] Update found');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Handle waiting service worker
          if (registration.waiting) {
            setUpdateAvailable(true);
          }

        } catch (error) {
          console.error('[SW] Service worker registration failed:', error);
        }
      }
    };

    // Register SW only after React has rendered
    const timer = setTimeout(registerSW, 1000);

    // Online/offline detection
    const handleOnline = () => {
      console.log('[SW] App is online');
      setIsOnline(true);
      // Trigger sync when back online
      try {
        if (swRegistration && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            // Type assertion for background sync
            const reg = registration as any;
            if (reg.sync) {
              return reg.sync.register('offline-sync');
            }
          }).catch(console.error);
        }
      } catch (e) {
        console.log('[SW] Background sync not supported');
      }
    };

    const handleOffline = () => {
      console.log('[SW] App is offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [swRegistration]);

  const skipWaiting = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
  };

  const triggerSync = () => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({ type: 'SYNC_NOW' });
    }
  };

  return {
    isOnline,
    updateAvailable,
    skipWaiting,
    triggerSync,
    swRegistration
  };
};