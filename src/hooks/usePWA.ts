
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
    console.log('[PWA] Hook initialized');
    
    // Check if service worker is already registered by index.html
    if ('serviceWorker' in navigator) {
      // Wait for the service worker registered in index.html
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('[PWA] Using existing SW registration:', registration.scope);
          setPwaState(prev => ({ ...prev, serviceWorkerReady: true }));
        })
        .catch((error) => {
          console.error('[PWA] SW not ready:', error);
        });
    }

    // Check if app is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone;
    const isAndroidInstalled = document.referrer.includes('android-app://');
    const isInstalled = isStandalone || isIOSStandalone || isAndroidInstalled;
    
    console.log('[PWA] Installation check:', { isStandalone, isIOSStandalone, isAndroidInstalled, isInstalled });
    setPwaState(prev => ({ ...prev, isInstalled }));

    // For development/testing, make installable by default if not installed
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject.com');
    if (isDev && !isInstalled) {
      console.log('[PWA] Development mode: making installable by default');
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setPwaState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
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
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    console.log('[PWA] Install button clicked, deferredPrompt:', !!deferredPrompt);
    
    if (deferredPrompt) {
      try {
        // Show the install prompt
        const promptResult = await deferredPrompt.prompt();
        console.log('[PWA] Prompt result:', promptResult);
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] User choice:', outcome);
        
        if (outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
          setPwaState(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
        } else {
          console.log('[PWA] User dismissed the install prompt');
        }
        
        // Clear the deferred prompt
        setDeferredPrompt(null);
      } catch (error) {
        console.error('[PWA] Install prompt error:', error);
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    console.log('[PWA] No deferred prompt available - showing manual instructions');
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    let message = 'To install this app:\n\n';
    if (isChrome || isEdge) {
      message += '1. Click the menu (⋮) in the top right\n2. Select "Install DukaFiti" or "Install app"\n3. Click "Install" when prompted';
    } else if (isSafari) {
      message += '1. Tap the Share button (⬆️)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
    } else if (isFirefox) {
      message += '1. Click the menu (☰) in the top right\n2. Look for "Install" option\n3. Follow the prompts';
    } else {
      message += '1. Look for an "Install" or "Add to Home Screen" option in your browser menu\n2. Follow the prompts to install the app';
    }
    
    alert(message);
  };


  const isRunningInBrowser = () => {
    // Check if running in browser (not in installed app)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone;
    return !isStandalone && !isIOSStandalone;
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
    isRunningInBrowser,
    requestPersistentStorage,
  };
};
