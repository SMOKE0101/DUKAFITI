
import { useState, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useAuth } from './useAuth';
import { SyncService, PendingOperation } from '../services/syncService';

interface OfflineOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  priority?: 'low' | 'medium' | 'high';
}

export const useUnifiedOfflineManager = () => {
  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();
  const [pendingOperations, setPendingOperations] = useState(0);
  const [operations, setOperations] = useState<OfflineOperation[]>([]);

  const addOfflineOperation = async (
    type: 'sale' | 'product' | 'customer' | 'transaction',
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const newOperation: OfflineOperation = {
      id: `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      operation,
      data,
      priority,
    };
    
    setOperations(prev => [...prev, newOperation]);
    setPendingOperations(prev => prev + 1);
    
    // Store in localStorage for persistence
    try {
      const existingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
      existingOps.push(newOperation);
      localStorage.setItem('pendingOperations', JSON.stringify(existingOps));
    } catch (error) {
      console.error('Failed to save offline operation:', error);
    }
  };

  const syncPendingOperations = async () => {
    if (!isOnline || operations.length === 0 || !user) return;

    console.log('[UnifiedOfflineManager] Starting sync process...');
    
    try {
      const success = await SyncService.syncPendingOperations(operations as PendingOperation[], user.id);
      
      if (success) {
        // Clear operations after successful sync
        setOperations([]);
        setPendingOperations(0);
        localStorage.removeItem('pendingOperations');
        console.log('[UnifiedOfflineManager] Sync completed successfully - operations cleared');
        
        // Manually dispatch additional events to ensure all components refresh
        setTimeout(() => {
          console.log('[UnifiedOfflineManager] Dispatching additional refresh events');
          window.dispatchEvent(new CustomEvent('sales-synced'));
          window.dispatchEvent(new CustomEvent('products-synced')); 
          window.dispatchEvent(new CustomEvent('customers-synced'));
        }, 100);
      } else {
        console.log('[UnifiedOfflineManager] Some operations failed to sync');
      }
    } catch (error) {
      console.error('[UnifiedOfflineManager] Sync failed:', error);
    }
  };

  // Load pending operations on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pendingOperations');
      if (saved) {
        const ops = JSON.parse(saved);
        setOperations(ops);
        setPendingOperations(ops.length);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && operations.length > 0 && user) {
      console.log('[UnifiedOfflineManager] Coming online with pending operations, auto-syncing...');
      // Use timeout to prevent immediate re-triggering
      const timeout = setTimeout(() => {
        syncPendingOperations();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, user?.id]);

  return {
    isOnline,
    pendingOperations,
    addOfflineOperation,
    syncPendingOperations,
  };
};
