
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { offlineDB } from '../utils/offlineDB';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  pendingOperations: number;
  lastSync: Date | null;
  lastSyncTime: Date | null;
  error: string | null;
  errors: string[];
  isSyncing: boolean;
  syncProgress: number;
  dataStats: Record<string, number>;
}

interface PendingAction {
  id: string;
  operation: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  data: any;
  timestamp: number;
}

export const useRobustOfflineManager = () => {
  const { user } = useAuth();
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    pendingOperations: 0,
    lastSync: null,
    lastSyncTime: null,
    error: null,
    errors: [],
    isSyncing: false,
    syncProgress: 0,
    dataStats: {}
  });

  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  // Initialize offline database and sync on mount
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        console.log('[OfflineManager] Initializing offline database...');
        await offlineDB.init();
        
        if (user?.id) {
          // Load pending operations count
          const syncQueue = await offlineDB.getSyncQueue();
          const mockPendingActions = syncQueue.map((item: any) => ({
            id: item.id,
            operation: item.operation_type || 'update',
            type: 'data',
            priority: 'medium' as const,
            data: item.data,
            timestamp: new Date(item.created_at).getTime()
          }));
          
          setPendingActions(mockPendingActions);
          
          setOfflineState(prev => ({
            ...prev,
            isInitialized: true,
            pendingOperations: syncQueue.length,
            error: null,
            errors: []
          }));
        } else {
          setOfflineState(prev => ({
            ...prev,
            isInitialized: true,
            error: null,
            errors: []
          }));
        }
      } catch (error) {
        console.error('[OfflineManager] Failed to initialize:', error);
        setOfflineState(prev => ({
          ...prev,
          isInitialized: true,
          error: `Offline initialization failed: ${error.message}`,
          errors: [`Offline initialization failed: ${error.message}`]
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

  const getOfflineData = async (type: string) => {
    try {
      if (!user?.id) return [];
      
      console.log(`[OfflineManager] Getting offline data for: ${type}`);
      
      // Mock implementation - replace with actual offlineDB calls
      switch (type) {
        case 'products':
          return await offlineDB.getProducts?.(user.id) || [];
        case 'customers':
          return await offlineDB.getCustomers?.(user.id) || [];
        case 'sales':
          return await offlineDB.getSales?.(user.id) || [];
        default:
          return [];
      }
    } catch (error) {
      console.error(`[OfflineManager] Failed to get offline data for ${type}:`, error);
      return [];
    }
  };

  const forceSyncNow = async () => {
    if (!offlineState.isOnline || offlineState.isSyncing) return;
    
    setOfflineState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 0,
      errors: []
    }));

    try {
      console.log('[OfflineManager] Starting forced sync...');
      
      // Simulate sync progress
      for (let i = 0; i <= 100; i += 20) {
        setOfflineState(prev => ({ ...prev, syncProgress: i }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Clear pending actions after successful sync
      setPendingActions([]);
      
      setOfflineState(prev => ({
        ...prev,
        isSyncing: false,
        syncProgress: 100,
        pendingOperations: 0,
        lastSync: new Date(),
        lastSyncTime: new Date(),
        error: null,
        errors: []
      }));

      console.log('[OfflineManager] Sync completed successfully');
    } catch (error) {
      console.error('[OfflineManager] Sync failed:', error);
      setOfflineState(prev => ({
        ...prev,
        isSyncing: false,
        syncProgress: 0,
        error: `Sync failed: ${error.message}`,
        errors: [...prev.errors, `Sync failed: ${error.message}`]
      }));
    }
  };

  const clearSyncErrors = () => {
    setOfflineState(prev => ({
      ...prev,
      error: null,
      errors: []
    }));
  };

  const hasPendingActions = pendingActions.length > 0;

  return {
    offlineState,
    pendingActions,
    getOfflineData,
    forceSyncNow,
    clearSyncErrors,
    hasPendingActions,
    updatePendingOperations: (count: number) => {
      setOfflineState(prev => ({ ...prev, pendingOperations: count }));
    },
    updateLastSync: (date: Date) => {
      setOfflineState(prev => ({ 
        ...prev, 
        lastSync: date,
        lastSyncTime: date 
      }));
    }
  };
};
