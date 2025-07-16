
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { offlineDB } from '../utils/offlineDB';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  pendingOperations: number;
  lastSync: Date | null;
  error: string | null;
}

export const useRobustOfflineManager = () => {
  const { user } = useAuth();
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    pendingOperations: 0,
    lastSync: null,
    error: null
  });

  // Initialize offline database and sync on mount
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        console.log('[OfflineManager] Initializing offline database...');
        await offlineDB.init();
        
        if (user?.id) {
          // Load pending operations count
          const syncQueue = await offlineDB.getSyncQueue();
          setOfflineState(prev => ({
            ...prev,
            isInitialized: true,
            pendingOperations: syncQueue.length,
            error: null
          }));
        } else {
          setOfflineState(prev => ({
            ...prev,
            isInitialized: true,
            error: null
          }));
        }
      } catch (error) {
        console.error('[OfflineManager] Failed to initialize:', error);
        setOfflineState(prev => ({
          ...prev,
          isInitialized: true,
          error: `Offline initialization failed: ${error.message}`
        }));
      }
    };

    initializeOffline();
  }, [user?.id]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineManager] 🌐 Back online');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log('[OfflineManager] 📴 Gone offline');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    offlineState,
    updatePendingOperations: (count: number) => {
      setOfflineState(prev => ({ ...prev, pendingOperations: count }));
    },
    updateLastSync: (date: Date) => {
      setOfflineState(prev => ({ ...prev, lastSync: date }));
    }
  };
};
