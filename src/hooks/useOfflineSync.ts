import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize offline data on app startup
  const initializeOfflineData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[OfflineSync] Initializing offline data...');
      console.log('[OfflineSync] App initialized for user:', user.id);
    } catch (error) {
      console.error('[OfflineSync] Failed to initialize offline data:', error);
    }
  }, [user]);

  // Add pending operation (simplified for compatibility)
  const addPendingOperation = useCallback(async (operation: any) => {
    console.log('[OfflineSync] Adding pending operation:', operation);
    return Promise.resolve('op_' + Date.now());
  }, []);

  // Sync data when coming back online
  const handleOnlineSync = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    try {
      console.log('[OfflineSync] Device back online, triggering sync...');
      window.dispatchEvent(new CustomEvent('force-sync'));
    } catch (error) {
      console.error('[OfflineSync] Failed to trigger sync:', error);
    }
  }, [user]);

  // Setup event listeners
  useEffect(() => {
    initializeOfflineData();

    const handleOnline = () => {
      console.log('[OfflineSync] Online event detected');
      setIsOnline(true);
      handleOnlineSync();
    };

    const handleOffline = () => {
      console.log('[OfflineSync] Offline event detected');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, initializeOfflineData, handleOnlineSync]);

  return {
    initializeOfflineData,
    handleOnlineSync,
    addPendingOperation,
    isOnline,
  };
};