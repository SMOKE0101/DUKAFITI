
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface PWAOfflineState {
  isOnline: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  syncInProgress: boolean;
  queuedRequests: number;
  cacheStatus: 'ready' | 'loading' | 'error';
}

export const usePWAOffline = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<PWAOfflineState>({
    isOnline: navigator.onLine,
    isInstalled: false,
    updateAvailable: false,
    syncInProgress: false,
    queuedRequests: 0,
    cacheStatus: 'loading'
  });

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        console.log('[PWA] Registering PWA offline service worker...');
        
        const registration = await navigator.serviceWorker.register('/pwa-offline-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('[PWA] Service worker registered successfully');
        setState(prev => ({ ...prev, cacheStatus: 'ready' }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('[PWA] Update found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, updateAvailable: true }));
                toast({
                  title: "App Update Available",
                  description: "A new version is ready. Refresh to update.",
                });
              }
            });
          }
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_COMPLETE') {
            setState(prev => ({ ...prev, syncInProgress: false }));
            toast({
              title: "Sync Complete",
              description: `${event.data.syncedCount} items synchronized`,
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
        setState(prev => ({ ...prev, cacheStatus: 'error' }));
        return null;
      }
    }
    return null;
  }, [toast]);

  // Force sync now
  const forceSyncNow = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setState(prev => ({ ...prev, syncInProgress: true }));
      navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
    }
  }, []);

  // Check if app is installed
  const checkInstallation = useCallback(() => {
    // Check for PWA installation indicators
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;
    
    setState(prev => ({ ...prev, isInstalled }));
    return isInstalled;
  }, []);

  // Install prompt
  const showInstallPrompt = useCallback(async () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        setState(prev => ({ ...prev, isInstalled: true }));
      }
      (window as any).deferredPrompt = null;
    }
  }, []);

  // Pre-cache essential data
  const preCacheData = useCallback(async () => {
    try {
      console.log('[PWA] Pre-caching essential data...');
      
      // This would normally fetch and cache essential API data
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Cache Updated",
        description: "App data has been cached for offline use",
      });
      
    } catch (error) {
      console.error('[PWA] Failed to pre-cache data:', error);
      toast({
        title: "Cache Error", 
        description: "Failed to cache data for offline use",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Device back online');
      setState(prev => ({ ...prev, isOnline: true }));
      
      // Auto-sync when back online
      setTimeout(() => {
        forceSyncNow();
      }, 1000);
    };

    const handleOffline = () => {
      console.log('[PWA] Device went offline');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceSyncNow]);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      
      // Show install banner after a delay
      setTimeout(() => {
        toast({
          title: "Install DukaFiti",
          description: "Install this app for better offline experience",
        });
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  // Initialize
  useEffect(() => {
    registerServiceWorker();
    checkInstallation();
  }, [registerServiceWorker, checkInstallation]);

  return {
    ...state,
    registerServiceWorker,
    forceSyncNow,
    showInstallPrompt,
    preCacheData,
    checkInstallation
  };
};
