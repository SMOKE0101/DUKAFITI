
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
          
          // Force a check for install prompt after SW is ready
          setTimeout(() => {
            checkInstallPrompt();
          }, 1000);
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

    // Listen for install prompt - but don't rely on development mode
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

    // Initial check for install prompt availability
    checkInstallPrompt();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkInstallPrompt = () => {
    // Force trigger install prompt check for supported browsers
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    if ((isChrome || isEdge) && !pwaState.isInstalled) {
      console.log('[PWA] Chromium browser detected, setting installable to true');
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    }
  };

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
        tryAlternativeInstall();
      }
    } else {
      tryAlternativeInstall();
    }
  };

  const tryAlternativeInstall = () => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    
    // For Chrome/Edge, try to trigger the native install banner
    if (isChrome || isEdge) {
      console.log('[PWA] Trying alternative install method for Chrome/Edge');
      
      // Check if the app meets PWA criteria and try to show install prompt
      if ('serviceWorker' in navigator) {
        // Create a synthetic beforeinstallprompt event if none exists
        setTimeout(() => {
          const event = new CustomEvent('beforeinstallprompt', {
            bubbles: true,
            cancelable: true
          });
          
          // Add prompt method to the event
          (event as any).prompt = () => {
            showBrowserSpecificInstructions();
          };
          
          window.dispatchEvent(event);
        }, 100);
      } else {
        showBrowserSpecificInstructions();
      }
    } else {
      showBrowserSpecificInstructions();
    }
  };

  const showBrowserSpecificInstructions = () => {
    console.log('[PWA] Showing browser-specific install instructions');
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    let title = 'Install DukaFiti App';
    let message = '';
    
    if (isChrome) {
      message = 'To install this app:\n\n1. Click the install icon (⬇️) in the address bar\nOR\n1. Click the menu (⋮) in the top right\n2. Select "Install DukaFiti"\n3. Click "Install" when prompted';
    } else if (isEdge) {
      message = 'To install this app:\n\n1. Click the install icon (⬇️) in the address bar\nOR\n1. Click the menu (...) in the top right\n2. Select "Apps" > "Install this site as an app"\n3. Click "Install" when prompted';
    } else if (isSafari) {
      message = 'To install this app:\n\n1. Tap the Share button (⬆️) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n4. The app will appear on your home screen';
    } else if (isFirefox) {
      message = 'To install this app:\n\n1. Click the menu (☰) in the top right\n2. Look for "Install" option\n3. Follow the prompts to install';
    } else {
      message = 'To install this app:\n\nLook for an "Install" icon in your browser\'s address bar or an "Install" or "Add to Home Screen" option in your browser menu and follow the prompts.';
    }
    
    // Use a better notification instead of alert
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Try to show a styled notification
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #1f2937;
          color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 9999;
          max-width: 300px;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${title}</h4>
          <p style="margin: 0; font-size: 12px; line-height: 1.4; white-space: pre-line;">${message}</p>
          <button onclick="this.parentElement.parentElement.remove()" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 16px;
          ">×</button>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Auto remove after 10 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 10000);
    } else {
      // Fallback to alert
      alert(title + '\n\n' + message);
    }
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
