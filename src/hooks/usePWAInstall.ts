
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if running in PWA mode on iOS
      const isIOSPWA = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isIOSPWA);
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] User ${outcome} the install prompt`);
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  };

  const getInstallInstructions = (): string => {
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'Tap the Share button and then "Add to Home Screen"';
    } else if (/Android/.test(userAgent)) {
      return 'Tap the menu and select "Add to Home Screen" or "Install App"';
    } else if (/Chrome/.test(userAgent)) {
      return 'Click the install icon in the address bar or use the menu';
    } else if (/Firefox/.test(userAgent)) {
      return 'Use the menu and select "Install" or "Add to Home Screen"';
    } else if (/Safari/.test(userAgent)) {
      return 'Use the Share menu and select "Add to Home Screen"';
    } else {
      return 'Look for an install option in your browser menu';
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    getInstallInstructions,
    canPromptInstall: !!deferredPrompt
  };
};
