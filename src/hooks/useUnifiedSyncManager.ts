
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';
import { offlineOrderManager, OfflineOrder } from '../utils/offlineOrderManager';
import { SalesDeduplication } from '../utils/salesDeduplication';

interface SyncOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'inventory_update';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  attempts: number;
  lastError?: string;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
  syncProgress: number;
  errors: string[];
  completedOperations: number;
}

export const useUnifiedSyncManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const syncInProgress = useRef(false);
  const hasSyncedOnce = useRef(false);
  
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: localStorage.getItem('lastUnifiedSyncTime'),
    syncProgress: 0,
    errors: [],
    completedOperations: 0
  });

  // Enhanced sync operation with strict deduplication
  const syncSaleOperation = async (operation: SyncOperation): Promise<boolean> => {
    try {
      console.log(`[UnifiedSync] Processing sale operation:`, operation.data.offline_id);

      // Validate data structure first
      const validation = SalesDeduplication.validateOrderData(operation.data);
      if (!validation.isValid) {
        console.error(`[UnifiedSync] Invalid sale data:`, validation.errors);
        return false;
      }

      // Check for duplicates with multiple strategies
      const duplicateCheck = await SalesDeduplication.checkForDuplicate(
        operation.data.offline_id,
        [validation.cleanData] // Include clean data for alternative matching
      );

      if (duplicateCheck.isDuplicate) {
        console.log(`[UnifiedSync] Skipping duplicate order: ${operation.data.offline_id}`);
        return true; // Mark as successful to remove from queue
      }

      console.log(`[UnifiedSync] Inserting new sale with offline_id: ${operation.data.offline_id}`);
      
      const { error } = await supabase
        .from('sales')
        .insert([validation.cleanData]);

      if (error) {
        console.error(`[UnifiedSync] Failed to sync sale:`, error);
        return false;
      }

      console.log(`[UnifiedSync] Successfully synced sale: ${operation.data.offline_id}`);
      return true;

    } catch (error) {
      console.error(`[UnifiedSync] Error syncing sale:`, error);
      return false;
    }
  };

  // Main sync function with enhanced error handling and UI refresh
  const executeSync = useCallback(async (forceRefresh = false) => {
    if (!syncState.isOnline || syncInProgress.current || !user) {
      return;
    }

    syncInProgress.current = true;
    setSyncState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 0,
      errors: [],
      completedOperations: 0
    }));

    try {
      console.log('[UnifiedSync] Starting comprehensive sync...');

      // Get offline orders with enhanced error handling
      const offlineOrders = await offlineOrderManager.getUnsyncedOrders();
      
      // Convert orders to sync operations with guaranteed unique offline IDs
      const operations: SyncOperation[] = [];
      
      for (const order of offlineOrders) {
        for (const item of order.items) {
          operations.push({
            id: `sale_${order.offlineId}_${item.productId}_${Date.now()}`,
            type: 'sale',
            operation: 'create',
            data: {
              user_id: user.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              selling_price: item.sellingPrice,
              cost_price: item.costPrice,
              profit: (item.sellingPrice - item.costPrice) * item.quantity,
              total_amount: item.totalAmount,
              payment_method: order.paymentMethod,
              customer_id: order.customerId,
              customer_name: order.customerName,
              timestamp: order.timestamp,
              offline_id: order.offlineId // Guaranteed unique ID
            },
            timestamp: order.timestamp,
            attempts: order.syncAttempts || 0
          });
        }
      }

      const totalOperations = operations.length;
      let completedCount = 0;
      const errors: string[] = [];

      console.log(`[UnifiedSync] Processing ${totalOperations} operations`);

      if (totalOperations === 0) {
        setSyncState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString(),
          pendingOperations: 0
        }));
        localStorage.setItem('lastUnifiedSyncTime', new Date().toISOString());
        syncInProgress.current = false;
        
        // Still trigger UI refresh even if no operations
        if (forceRefresh || !hasSyncedOnce.current) {
          triggerUIRefresh();
          hasSyncedOnce.current = true;
        }
        return;
      }

      // Process operations sequentially to avoid conflicts
      for (const operation of operations) {
        try {
          const success = await syncSaleOperation(operation);
          
          if (success) {
            completedCount++;
            // Mark the original order as synced if this was the last item
            const orderItems = operations.filter(op => 
              op.data.offline_id === operation.data.offline_id
            );
            const completedOrderItems = orderItems.filter(op => 
              operations.indexOf(op) <= operations.indexOf(operation)
            );
            
            if (completedOrderItems.length === orderItems.length) {
              await offlineOrderManager.markOrderAsSynced(operation.data.offline_id);
            }
          } else {
            await offlineOrderManager.incrementSyncAttempts(operation.data.offline_id);
            errors.push(`Failed to sync operation ${operation.id}`);
          }
        } catch (error) {
          console.error(`[UnifiedSync] Error processing operation:`, error);
          errors.push(`Error in operation ${operation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Update progress
        const progress = Math.round(((completedCount + errors.length) / totalOperations) * 100);
        setSyncState(prev => ({ 
          ...prev, 
          syncProgress: progress,
          completedOperations: completedCount
        }));
      }

      // Clean up failed orders (max 3 attempts)
      await offlineOrderManager.removeFailedOrders(3);

      // Update final state
      const remainingOrders = await offlineOrderManager.getUnsyncedOrders();
      const finalSyncTime = new Date().toISOString();
      
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: finalSyncTime,
        pendingOperations: remainingOrders.length,
        errors: errors,
        syncProgress: 100
      }));

      localStorage.setItem('lastUnifiedSyncTime', finalSyncTime);

      // Show results
      if (completedCount > 0) {
        toast({
          title: "Sync Complete",
          description: `${completedCount} operation${completedCount > 1 ? 's' : ''} synced successfully`,
          duration: 3000,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Sync Issues",
          description: `${errors.length} operation${errors.length > 1 ? 's' : ''} failed to sync`,
          variant: "destructive",
          duration: 5000,
        });
      }

      console.log(`[UnifiedSync] Sync completed: ${completedCount} synced, ${errors.length} errors`);

      // CRITICAL: Always trigger UI refresh after sync
      triggerUIRefresh();
      hasSyncedOnce.current = true;

    } catch (error) {
      console.error('[UnifiedSync] Sync process failed:', error);
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
      
      toast({
        title: "Sync Failed",
        description: "Unable to sync data. Will retry automatically.",
        variant: "destructive",
      });
    } finally {
      syncInProgress.current = false;
    }
  }, [syncState.isOnline, user, toast]);

  // Enhanced UI refresh trigger with multiple event types
  const triggerUIRefresh = useCallback(() => {
    console.log('[UnifiedSync] Triggering comprehensive UI refresh');
    
    // Dispatch multiple events to ensure all components refresh
    window.dispatchEvent(new CustomEvent('sync-completed', { 
      detail: { timestamp: new Date().toISOString() }
    }));
    
    window.dispatchEvent(new CustomEvent('refresh-data'));
    window.dispatchEvent(new CustomEvent('orders-updated'));
    window.dispatchEvent(new CustomEvent('sales-updated'));
    
    // Force a slight delay to ensure all components have time to respond
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('force-refresh'));
    }, 100);
  }, []);

  // Create offline order with guaranteed unique ID
  const createOfflineOrder = useCallback(async (orderData: {
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      sellingPrice: number;
      costPrice: number;
      totalAmount: number;
    }>;
    totalAmount: number;
    paymentMethod: string;
    customerId?: string;
    customerName?: string;
  }): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('[UnifiedSync] Creating offline order with unique ID');

      const offlineId = await offlineOrderManager.storeOfflineOrder({
        userId: user.id,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        timestamp: new Date().toISOString()
      });

      // Update pending count
      const unsyncedOrders = await offlineOrderManager.getUnsyncedOrders();
      setSyncState(prev => ({ 
        ...prev, 
        pendingOperations: unsyncedOrders.length 
      }));

      // Try to sync immediately if online
      if (syncState.isOnline) {
        setTimeout(() => executeSync(true), 500);
      }

      console.log('[UnifiedSync] Offline order created with ID:', offlineId);
      return offlineId;

    } catch (error) {
      console.error('[UnifiedSync] Failed to create offline order:', error);
      throw error;
    }
  }, [user, syncState.isOnline, executeSync]);

  // Enhanced online/offline monitoring with immediate sync
  useEffect(() => {
    const handleOnline = () => {
      console.log('[UnifiedSync] Device online - starting immediate sync with UI refresh');
      setSyncState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        // Force immediate sync and UI refresh when going online
        setTimeout(() => executeSync(true), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[UnifiedSync] Device offline');
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial pending count
    const loadPendingCount = async () => {
      try {
        const unsyncedOrders = await offlineOrderManager.getUnsyncedOrders();
        setSyncState(prev => ({ 
          ...prev, 
          pendingOperations: unsyncedOrders.length 
        }));
        
        // If we have pending operations and we're online, sync immediately
        if (unsyncedOrders.length > 0 && navigator.onLine && user) {
          console.log('[UnifiedSync] Found pending operations, syncing immediately');
          setTimeout(() => executeSync(true), 2000);
        }
      } catch (error) {
        console.error('[UnifiedSync] Failed to load pending count:', error);
      }
    };

    if (user) {
      loadPendingCount();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, executeSync]);

  const forceSyncNow = useCallback(async () => {
    if (syncState.isOnline && !syncState.isSyncing) {
      await executeSync(true);
    } else if (!syncState.isOnline) {
      toast({
        title: "Offline Mode",
        description: "Cannot sync while offline. Data will sync when connection is restored.",
        variant: "default",
      });
    }
  }, [syncState.isOnline, syncState.isSyncing, executeSync, toast]);

  const clearSyncErrors = useCallback(() => {
    setSyncState(prev => ({ ...prev, errors: [] }));
  }, []);

  return {
    ...syncState,
    createOfflineOrder,
    executeSync,
    forceSyncNow,
    clearSyncErrors,
    triggerUIRefresh
  };
};
