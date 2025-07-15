
import { useState, useEffect, useCallback } from 'react';
import { useOfflineFirst } from './useOfflineFirst';
import { useToast } from './use-toast';

interface EnhancedOfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  syncProgress: number;
  lastSyncTime?: string;
  errors: string[];
}

export const useEnhancedOfflineManager = () => {
  const offlineFirst = useOfflineFirst();
  const { toast } = useToast();
  
  const [state, setState] = useState<EnhancedOfflineState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0,
    errors: []
  });

  // Update state when offline first state changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isOnline: offlineFirst.isOnline,
      isSyncing: offlineFirst.syncInProgress,
      pendingOperations: offlineFirst.queuedOperations,
      lastSyncTime: offlineFirst.lastSyncTime?.toISOString()
    }));
  }, [offlineFirst.isOnline, offlineFirst.syncInProgress, offlineFirst.queuedOperations, offlineFirst.lastSyncTime]);

  // Test enhanced offline functionality
  const testEnhancedOffline = useCallback(async () => {
    console.log('[EnhancedOfflineManager] Starting comprehensive offline test...');
    
    try {
      // Test IndexedDB capabilities
      const { offlineDB } = await import('@/utils/indexedDB');
      const testResult = await offlineDB.testOfflineCapabilities();
      
      if (testResult.success) {
        console.log('[EnhancedOfflineManager] ✅ Offline test passed');
        return {
          success: true,
          message: 'Enhanced offline functionality working correctly',
          details: testResult.details
        };
      } else {
        console.error('[EnhancedOfflineManager] ❌ Offline test failed:', testResult.details);
        return {
          success: false,
          message: 'Offline functionality test failed',
          error: testResult.details.error
        };
      }
    } catch (error) {
      console.error('[EnhancedOfflineManager] ❌ Test error:', error);
      return {
        success: false,
        message: 'Failed to run offline test',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Force sync with progress tracking
  const forceSyncNow = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true, syncProgress: 0 }));
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({ 
          ...prev, 
          syncProgress: Math.min(prev.syncProgress + 10, 90) 
        }));
      }, 100);

      await offlineFirst.forceSync();
      
      clearInterval(progressInterval);
      setState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncProgress: 100,
        lastSyncTime: new Date().toISOString()
      }));

      toast({
        title: "Sync Complete",
        description: "All data has been synchronized successfully",
      });

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncProgress: 0,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Sync failed']
      }));

      toast({
        title: "Sync Failed",
        description: "Failed to synchronize data. Will retry automatically.",
        variant: "destructive",
      });
    }
  }, [offlineFirst, toast]);

  // Clear all offline data
  const clearAllOfflineData = useCallback(async () => {
    try {
      await offlineFirst.clearOfflineData();
      setState(prev => ({ 
        ...prev, 
        pendingOperations: 0,
        errors: []
      }));
    } catch (error) {
      console.error('[EnhancedOfflineManager] Failed to clear data:', error);
    }
  }, [offlineFirst]);

  // Get detailed offline statistics
  const getOfflineStats = useCallback(async () => {
    try {
      const { offlineDB } = await import('@/utils/indexedDB');
      return await offlineDB.getDataStats();
    } catch (error) {
      console.error('[EnhancedOfflineManager] Failed to get stats:', error);
      return {};
    }
  }, []);

  return {
    ...state,
    testEnhancedOffline,
    forceSyncNow,
    clearAllOfflineData,
    getOfflineStats,
    stats: offlineFirst.stats
  };
};
