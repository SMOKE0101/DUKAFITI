
import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[NetworkStatus] Going online');
      setIsOnline(true);
      if (wasOffline) {
        setWasOffline(false);
        // Trigger sync after a brief delay to ensure connection is stable
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('network-reconnected'));
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('[NetworkStatus] Going offline');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    wasOffline,
  };
};
