
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';
import { offlineOrderManager, OfflineOrder } from '../utils/offlineOrderManager';

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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export const useUnifiedSyncManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const syncInProgress = useRef(false);
  
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: localStorage.getItem('lastUnifiedSyncTime'),
    syncProgress: 0,
    errors: [],
    completedOperations: 0
  });

  // Data validation schemas
  const validateSaleData = (data: any): ValidationResult => {
    const errors: string[] = [];
    
    if (!data.product_id || typeof data.product_id !== 'string') {
      errors.push('Invalid product_id');
    }
    if (!data.quantity || data.quantity <= 0) {
      errors.push('Invalid quantity');
    }
    if (!data.selling_price || data.selling_price <= 0) {
      errors.push('Invalid selling_price');
    }
    if (!data.total_amount || data.total_amount <= 0) {
      errors.push('Invalid total_amount');
    }
    if (!data.payment_method) {
      errors.push('Missing payment_method');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Sanitize and normalize data
    const sanitizedData = {
      user_id: user?.id,
      product_id: data.product_id,
      product_name: data.product_name || 'Unknown Product',
      quantity: Math.floor(Number(data.quantity)),
      selling_price: Number(data.selling_price),
      cost_price: Number(data.cost_price) || 0,
      profit: (Number(data.selling_price) - (Number(data.cost_price) || 0)) * Math.floor(Number(data.quantity)),
      total_amount: Number(data.total_amount),
      payment_method: String(data.payment_method),
      customer_id: data.customer_id || null,
      customer_name: data.customer_name || null,
      timestamp: data.timestamp || new Date().toISOString(),
      offline_id: data.offline_id || null,
      synced: true
    };

    return { isValid: true, errors: [], sanitizedData };
  };

  const validateProductData = (data: any): ValidationResult => {
    const errors: string[] = [];
    
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Invalid product name');
    }
    if (!data.category || typeof data.category !== 'string') {
      errors.push('Invalid category');
    }
    if (data.cost_price === undefined || data.cost_price < 0) {
      errors.push('Invalid cost_price');
    }
    if (data.selling_price === undefined || data.selling_price < 0) {
      errors.push('Invalid selling_price');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const sanitizedData = {
      user_id: user?.id,
      name: String(data.name).trim(),
      category: String(data.category).trim(),
      cost_price: Number(data.cost_price),
      selling_price: Number(data.selling_price),
      current_stock: Math.floor(Number(data.current_stock) || 0),
      low_stock_threshold: Math.floor(Number(data.low_stock_threshold) || 10)
    };

    return { isValid: true, errors: [], sanitizedData };
  };

  const validateCustomerData = (data: any): ValidationResult => {
    const errors: string[] = [];
    
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Invalid customer name');
    }
    if (!data.phone || typeof data.phone !== 'string') {
      errors.push('Invalid phone number');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const sanitizedData = {
      user_id: user?.id,
      name: String(data.name).trim(),
      phone: String(data.phone).trim(),
      email: data.email ? String(data.email).trim() : null,
      address: data.address ? String(data.address).trim() : null,
      credit_limit: Number(data.credit_limit) || 1000,
      outstanding_debt: Number(data.outstanding_debt) || 0,
      total_purchases: Number(data.total_purchases) || 0,
      risk_rating: data.risk_rating || 'low'
    };

    return { isValid: true, errors: [], sanitizedData };
  };

  // Check for duplicate sales by offline_id
  const checkForDuplicateOrder = async (offlineId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id')
        .eq('offline_id', offlineId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[UnifiedSync] Error checking duplicate:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[UnifiedSync] Error checking duplicate:', error);
      return false;
    }
  };

  // Sync a single operation with proper validation and deduplication
  const syncOperation = async (operation: SyncOperation): Promise<boolean> => {
    try {
      console.log(`[UnifiedSync] Syncing ${operation.type} operation:`, operation.id);

      switch (operation.type) {
        case 'sale':
          return await syncSaleOperation(operation);
        case 'product':
          return await syncProductOperation(operation);
        case 'customer':
          return await syncCustomerOperation(operation);
        case 'inventory_update':
          return await syncInventoryOperation(operation);
        default:
          console.warn(`[UnifiedSync] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[UnifiedSync] Error syncing operation ${operation.id}:`, error);
      return false;
    }
  };

  const syncSaleOperation = async (operation: SyncOperation): Promise<boolean> => {
    // Handle offline orders specially
    if (operation.data.offline_id) {
      const isDuplicate = await checkForDuplicateOrder(operation.data.offline_id);
      if (isDuplicate) {
        console.log(`[UnifiedSync] Order ${operation.data.offline_id} already exists, skipping`);
        return true;
      }
    }

    const validation = validateSaleData(operation.data);
    if (!validation.isValid) {
      console.error(`[UnifiedSync] Invalid sale data:`, validation.errors);
      return false;
    }

    const { error } = await supabase
      .from('sales')
      .insert([validation.sanitizedData]);

    if (error) {
      console.error(`[UnifiedSync] Failed to sync sale:`, error);
      return false;
    }

    return true;
  };

  const syncProductOperation = async (operation: SyncOperation): Promise<boolean> => {
    const validation = validateProductData(operation.data);
    if (!validation.isValid) {
      console.error(`[UnifiedSync] Invalid product data:`, validation.errors);
      return false;
    }

    if (operation.operation === 'create') {
      const { error } = await supabase
        .from('products')
        .insert([validation.sanitizedData]);

      return !error;
    } else if (operation.operation === 'update') {
      const { error } = await supabase
        .from('products')
        .update(validation.sanitizedData)
        .eq('id', operation.data.id)
        .eq('user_id', user?.id);

      return !error;
    }

    return false;
  };

  const syncCustomerOperation = async (operation: SyncOperation): Promise<boolean> => {
    const validation = validateCustomerData(operation.data);
    if (!validation.isValid) {
      console.error(`[UnifiedSync] Invalid customer data:`, validation.errors);
      return false;
    }

    if (operation.operation === 'create') {
      const { error } = await supabase
        .from('customers')
        .insert([validation.sanitizedData]);

      return !error;
    } else if (operation.operation === 'update') {
      const { error } = await supabase
        .from('customers')
        .update(validation.sanitizedData)
        .eq('id', operation.data.id)
        .eq('user_id', user?.id);

      return !error;
    }

    return false;
  };

  const syncInventoryOperation = async (operation: SyncOperation): Promise<boolean> => {
    const { productId, quantityChange, newStock } = operation.data;
    
    if (!productId || typeof quantityChange !== 'number') {
      console.error(`[UnifiedSync] Invalid inventory data`);
      return false;
    }

    const { error } = await supabase
      .from('products')
      .update({ current_stock: Math.max(0, newStock) })
      .eq('id', productId)
      .eq('user_id', user?.id);

    return !error;
  };

  // Main sync function
  const executeSync = useCallback(async () => {
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

      // Get offline orders
      const offlineOrders = await offlineOrderManager.getUnsyncedOrders();
      
      // Convert orders to sync operations
      const operations: SyncOperation[] = [];
      
      for (const order of offlineOrders) {
        for (const item of order.items) {
          operations.push({
            id: `sale_${order.offlineId}_${item.productId}`,
            type: 'sale',
            operation: 'create',
            data: {
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              selling_price: item.sellingPrice,
              cost_price: item.costPrice,
              total_amount: item.totalAmount,
              payment_method: order.paymentMethod,
              customer_id: order.customerId,
              customer_name: order.customerName,
              timestamp: order.timestamp,
              offline_id: order.offlineId
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
        return;
      }

      // Process operations sequentially to avoid conflicts
      for (const operation of operations) {
        try {
          const success = await syncOperation(operation);
          
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

      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('sync-completed', { 
        detail: { completedCount, errors: errors.length, timestamp: finalSyncTime }
      }));

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

  // Create offline order
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
      console.log('[UnifiedSync] Creating offline order:', orderData);

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
        setTimeout(() => executeSync(), 500);
      }

      console.log('[UnifiedSync] Offline order created with ID:', offlineId);
      return offlineId;

    } catch (error) {
      console.error('[UnifiedSync] Failed to create offline order:', error);
      throw error;
    }
  }, [user, syncState.isOnline, executeSync]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[UnifiedSync] Device online - starting sync');
      setSyncState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => executeSync(), 1000);
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
      await executeSync();
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
    clearSyncErrors
  };
};
