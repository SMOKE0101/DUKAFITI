
import { useState, useEffect, useCallback } from 'react';
import { useOfflineFirst } from './useOfflineFirst';
import { useToast } from './use-toast';
import { offlineDB } from '@/utils/indexedDB';

interface OfflineMetrics {
  cacheHits: number;
  cacheMisses: number;
  syncSuccess: number;
  syncFailures: number;
  queueSize: number;
  lastSyncTime?: Date;
  avgResponseTime: number;
}

interface ConflictItem {
  id: string;
  table: string;
  localData: any;
  serverData: any;
  timestamp: string;
}

export const useEnhancedOfflineManager = () => {
  const { 
    isOnline, 
    isInitialized, 
    syncInProgress, 
    queuedOperations,
    stats,
    forceSync,
    clearOfflineData,
    updateStats
  } = useOfflineFirst();
  
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<OfflineMetrics>({
    cacheHits: 0,
    cacheMisses: 0,
    syncSuccess: 0,
    syncFailures: 0,
    queueSize: 0,
    avgResponseTime: 0
  });
  
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  // Test enhanced offline functionality
  const testEnhancedOffline = useCallback(async () => {
    console.log('[EnhancedOfflineManager] Starting comprehensive offline test...');
    
    try {
      // Test 1: IndexedDB functionality
      const dbTest = await offlineDB.testOfflineCapabilities();
      console.log('[EnhancedOfflineManager] IndexedDB test:', dbTest.success ? '✅' : '❌');
      
      // Test 2: Service Worker status
      const swTest = await testServiceWorkerStatus();
      console.log('[EnhancedOfflineManager] Service Worker test:', swTest.success ? '✅' : '❌');
      
      // Test 3: Cache performance
      const cacheTest = await testCachePerformance();
      console.log('[EnhancedOfflineManager] Cache performance test:', cacheTest.success ? '✅' : '❌');
      
      // Test 4: Sync queue operations
      const syncTest = await testSyncQueue();
      console.log('[EnhancedOfflineManager] Sync queue test:', syncTest.success ? '✅' : '❌');
      
      const allTests = [dbTest, swTest, cacheTest, syncTest];
      const allPassed = allTests.every(test => test.success);
      
      return {
        success: allPassed,
        message: allPassed ? 'All enhanced offline tests passed' : 'Some tests failed',
        details: allTests
      };
      
    } catch (error) {
      console.error('[EnhancedOfflineManager] Test failed:', error);
      return {
        success: false,
        message: 'Enhanced offline test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Test service worker status
  const testServiceWorkerStatus = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        return { success: false, message: 'Service Worker not supported' };
      }
      
      const registration = await navigator.serviceWorker.getRegistration();
      const hasActiveWorker = registration && registration.active;
      
      return {
        success: !!hasActiveWorker,
        message: hasActiveWorker ? 'Service Worker active' : 'No active Service Worker',
        details: {
          registration: !!registration,
          active: !!registration?.active,
          installing: !!registration?.installing,
          waiting: !!registration?.waiting
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Service Worker test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Test cache performance
  const testCachePerformance = async () => {
    try {
      const startTime = performance.now();
      
      // Test cache read performance
      const products = await offlineDB.getOfflineData('products');
      const customers = await offlineDB.getOfflineData('customers');
      const sales = await offlineDB.getOfflineData('sales');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Performance benchmark: should be under 100ms for typical datasets
      const isPerformant = duration < 100;
      
      return {
        success: isPerformant,
        message: `Cache read took ${Math.round(duration)}ms`,
        details: {
          duration,
          recordCounts: {
            products: products?.length || 0,
            customers: customers?.length || 0,
            sales: sales?.length || 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Cache performance test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Test sync queue operations
  const testSyncQueue = async () => {
    try {
      // Create test sync operation
      const testOp = {
        id: 'test_sync_' + Date.now(),
        type: 'product',
        operation: 'create',
        data: { name: 'Test Product', category: 'Test' },
        timestamp: new Date().toISOString(),
        priority: 'medium' as const,
        attempts: 0,
        synced: false
      };
      
      // Add to queue
      await offlineDB.addToSyncQueue(testOp);
      
      // Verify it's in queue
      const queue = await offlineDB.getSyncQueue();
      const foundOp = queue.find(op => op.id === testOp.id);
      
      if (!foundOp) {
        throw new Error('Operation not found in sync queue');
      }
      
      // Clean up
      await offlineDB.removeFromSyncQueue(testOp.id);
      
      return {
        success: true,
        message: 'Sync queue operations working correctly',
        details: { queueSize: queue.length }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sync queue test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Run diagnostics
  const runDiagnostics = useCallback(async () => {
    setIsRunningDiagnostics(true);
    
    try {
      console.log('[EnhancedOfflineManager] Running comprehensive diagnostics...');
      
      // Update metrics
      const stats = await offlineDB.getDataStats();
      const queue = await offlineDB.getSyncQueue();
      
      setMetrics(prev => ({
        ...prev,
        queueSize: queue.length,
        lastSyncTime: new Date()
      }));
      
      // Test all functionality
      const testResult = await testEnhancedOffline();
      
      toast({
        title: testResult.success ? "✅ Diagnostics Passed" : "⚠️ Issues Detected",
        description: testResult.message,
        variant: testResult.success ? "default" : "destructive"
      });
      
      return testResult;
      
    } catch (error) {
      console.error('[EnhancedOfflineManager] Diagnostics failed:', error);
      toast({
        title: "Diagnostics Failed",
        description: "Failed to run offline diagnostics",
        variant: "destructive"
      });
      
      return {
        success: false,
        message: 'Diagnostics failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, [testEnhancedOffline, toast]);

  // Force sync with enhanced monitoring
  const forceSyncNow = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      await forceSync();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        syncSuccess: prev.syncSuccess + 1,
        avgResponseTime: (prev.avgResponseTime + duration) / 2,
        lastSyncTime: new Date()
      }));
      
      await updateStats();
      
      toast({
        title: "Sync Complete",
        description: `Synced in ${Math.round(duration)}ms`,
      });
      
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        syncFailures: prev.syncFailures + 1
      }));
      
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline data",
        variant: "destructive"
      });
    }
  }, [forceSync, updateStats, toast]);

  // Clear all offline data with confirmation
  const clearAllOfflineData = useCallback(async () => {
    try {
      await clearOfflineData();
      
      setMetrics({
        cacheHits: 0,
        cacheMisses: 0,
        syncSuccess: 0,
        syncFailures: 0,
        queueSize: 0,
        avgResponseTime: 0
      });
      
      setConflicts([]);
      
      toast({
        title: "Data Cleared",
        description: "All offline data has been cleared",
      });
      
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear offline data",
        variant: "destructive"
      });
    }
  }, [clearOfflineData, toast]);

  // Monitor performance
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isInitialized) {
        try {
          const stats = await offlineDB.getDataStats();
          const queue = await offlineDB.getSyncQueue();
          
          setMetrics(prev => ({
            ...prev,
            queueSize: queue.length
          }));
        } catch (error) {
          console.error('[EnhancedOfflineManager] Failed to update metrics:', error);
        }
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [isInitialized]);

  return {
    // Status
    isOnline,
    isInitialized,
    isSyncing: syncInProgress,
    isRunningDiagnostics,
    
    // Data
    pendingOperations: queuedOperations,
    metrics,
    conflicts,
    stats,
    
    // Actions
    testEnhancedOffline,
    runDiagnostics,
    forceSyncNow,
    clearAllOfflineData,
    
    // Utils
    updateStats
  };
};
