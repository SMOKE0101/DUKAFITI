import { useState, useEffect } from 'react';

interface AppContext {
  isInstalledApp: boolean;
  isPWA: boolean;
  isStandalone: boolean;
}

export const useAppContext = (): AppContext => {
  const [context, setContext] = useState<AppContext>({
    isInstalledApp: false,
    isPWA: false,
    isStandalone: false,
  });

  useEffect(() => {
    const checkAppContext = () => {
      // Check if running as standalone PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check if running as installed PWA (iOS Safari specific)
      const isPWA = (window.navigator as any).standalone || isStandalone;
      
      // Check if running in app-like environment
      const isInstalledApp = isPWA || isStandalone;

      setContext({
        isInstalledApp,
        isPWA,
        isStandalone,
      });
    };

    checkAppContext();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkAppContext();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return context;
};