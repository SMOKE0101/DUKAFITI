
import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface OfflineOperation {
  id: string;
  type: string;
  operation: string;
  data: any;
  priority?: 'low' | 'medium' | 'high';
  timestamp: string;
}

export const useUnifiedOfflineManager = () => {
  const { isOnline } = useNetworkStatus();
  const [pendingOperations, setPendingOperations] = useState(0);
  const [operations, setOperations] = useState<OfflineOperation[]>([]);

  // Load pending operations from localStorage
  const loadPendingOperations = useCallback(() => {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        const ops = JSON.parse(stored);
        setOperations(ops);
        setPendingOperations(ops.length);
        console.log('[UnifiedOfflineManager] Loaded pending operations:', ops.length);
      }
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to load pending operations:', error);
    }
  }, []);

  // Save operations to localStorage
  const saveOperations = useCallback((ops: OfflineOperation[]) => {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(ops));
      console.log('[UnifiedOfflineManager] Saved pending operations:', ops.length);
    } catch (error) {
      console.error('[UnifiedOfflineManager] Failed to save pending operations:', error);
    }
  }, []);

  const addOfflineOperation = useCallback(async (
    type: string,
    operation: string,
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const newOperation: OfflineOperation = {
      id: `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      operation,
      data,
      priority,
      timestamp: new Date().toISOString(),
    };
    
    console.log('[UnifiedOfflineManager] Adding offline operation:', newOperation);
    
    const updatedOps = [...operations, newOperation];
    setOperations(updatedOps);
    setPendingOperations(updatedOps.length);
    saveOperations(updatedOps);
  }, [operations, saveOperations]);

  const removeOfflineOperation = useCallback((operationId: string) => {
    console.log('[UnifiedOfflineManager] Removing offline operation:', operationId);
    const updatedOps = operations.filter(op => op.id !== operationId);
    setOperations(updatedOps);
    setPendingOperations(updatedOps.length);
    saveOperations(updatedOps);
  }, [operations, saveOperations]);

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || operations.length === 0) {
      console.log('[UnifiedOfflineManager] Skipping sync - offline or no operations');
      return;
    }

    console.log('[UnifiedOfflineManager] Starting sync of', operations.length, 'operations');
    
    try {
      // Sort operations by priority and timestamp
      const sortedOps = [...operations].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); // Older first
      });

      // Process operations one by one
      for (const operation of sortedOps) {
        try {
          console.log('[UnifiedOfflineManager] Processing operation:', operation.id);
          // Here you would implement the actual sync logic based on operation type
          // For now, we'll just remove the operation as if it was synced
          removeOfflineOperation(operation.id);
        } catch (error) {
          console.error('[UnifiedOfflineManager] Failed to sync operation:', operation.id, error);
          // Leave failed operations for next sync attempt
        }
      }

      console.log('[UnifiedOfflineManager] Sync completed');
    } catch (error) {
      console.error('[UnifiedOfflineManager] Sync failed:', error);
    }
  }, [isOnline, operations, removeOfflineOperation]);

  // Load operations on mount
  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && operations.length > 0) {
      console.log('[UnifiedOfflineManager] Coming online, triggering sync');
      // Delay sync to allow other components to initialize
      setTimeout(syncPendingOperations, 1000);
    }
  }, [isOnline, operations.length, syncPendingOperations]);

  // Listen for network reconnection events
  useEffect(() => {
    const handleReconnect = () => {
      console.log('[UnifiedOfflineManager] Network reconnected, triggering sync');
      setTimeout(syncPendingOperations, 1000);
    };

    window.addEventListener('network-reconnected', handleReconnect);
    return () => window.removeEventListener('network-reconnected', handleReconnect);
  }, [syncPendingOperations]);

  return {
    isOnline,
    pendingOperations,
    operations,
    addOfflineOperation,
    removeOfflineOperation,
    syncPendingOperations,
    loadPendingOperations,
  };
};
