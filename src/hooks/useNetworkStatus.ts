
import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    console.log('[NetworkStatus] Initial state:', navigator.onLine);
    
    const handleOnline = () => {
      console.log('[NetworkStatus] Going online');
      setIsOnline(true);
      
      // Dispatch custom event for reconnection
      window.dispatchEvent(new CustomEvent('network-reconnected'));
    };

    const handleOffline = () => {
      console.log('[NetworkStatus] Going offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add debug logging for current state
  console.log('[NetworkStatus] Current isOnline state:', isOnline);

  return { isOnline };
};
