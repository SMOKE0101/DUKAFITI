
import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('[SW] Registering robust service worker...');
          setIsInstalling(true);
          
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
          
          const registration = await navigator.serviceWorker.register('/robust-sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });

          console.log('[SW] Robust service worker registered successfully');
          setSwRegistration(registration);
          setIsInstalling(false);

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

          if (registration.waiting) {
            setUpdateAvailable(true);
          }

          // Background sync registration (with fallback for unsupported browsers)
          try {
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
              // Check if registration has sync property before using
              if (registration.sync) {
                await registration.sync.register('background-sync');
              }
            } else {
              console.warn('[SW] Background sync not supported by this browser');
            }
          } catch (error) {
            console.warn('[SW] Background sync registration failed:', error);
          }

        } catch (error) {
          console.error('[SW] Service worker registration failed:', error);
          setIsInstalling(false);
        }
      }
    };

    registerSW();

    const handleOnline = () => {
      console.log('[SW] App is online');
      setIsOnline(true);
      
      if (swRegistration?.active) {
        swRegistration.active.postMessage({ type: 'FORCE_SYNC' });
      }
    };

    const handleOffline = () => {
      console.log('[SW] App is offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [swRegistration]);

  const skipWaiting = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  const triggerSync = () => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({ type: 'FORCE_SYNC' });
    }
  };

  const clearCache = () => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  };

  return {
    isOnline,
    updateAvailable,
    isInstalling,
    skipWaiting,
    triggerSync,
    clearCache,
    swRegistration
  };
};
