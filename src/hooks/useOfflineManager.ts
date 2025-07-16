
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { offlineDB } from '../utils/offlineDB';

export interface OfflineAction {
  id: string;
  type: 'product' | 'customer' | 'sale' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

export const useOfflineManager = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions on mount
  useEffect(() => {
    const loadPendingActions = async () => {
      try {
        const actions = await offlineDB.getSyncQueue();
        setPendingActions(actions);
      } catch (error) {
        console.error('[OfflineManager] Failed to load pending actions:', error);
      }
    };

    loadPendingActions();
  }, []);

  const addOfflineOperation = useCallback(async (
    type: OfflineAction['type'],
    operation: OfflineAction['operation'],
    data: any,
    priority: OfflineAction['priority'] = 'medium'
  ): Promise<string> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const actionId = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const action: OfflineAction = {
      id: actionId,
      type,
      operation,
      data: { ...data, user_id: user.id },
      timestamp: Date.now(),
      priority,
      attempts: 0,
      synced: false
    };

    try {
      // Store in IndexedDB sync queue
      await offlineDB.addToSyncQueue(action);
      
      // Update local state
      setPendingActions(prev => [...prev, action]);
      
      console.log(`[OfflineManager] Added ${type} ${operation} to queue:`, actionId);
      return actionId;
    } catch (error) {
      console.error('[OfflineManager] Failed to add operation to queue:', error);
      throw error;
    }
  }, [user?.id]);

  const getOfflineData = useCallback(async (type: string): Promise<any[]> => {
    try {
      switch (type) {
        case 'products':
          return await offlineDB.getProducts(user?.id || '');
        case 'customers':
          return await offlineDB.getCustomers(user?.id || '');
        case 'sales':
          return await offlineDB.getSales(user?.id || '');
        default:
          return await offlineDB.getAllOfflineData(type, user?.id);
      }
    } catch (error) {
      console.error(`[OfflineManager] Failed to get offline data for ${type}:`, error);
      return [];
    }
  }, [user?.id]);

  const storeOfflineData = useCallback(async (type: string, data: any): Promise<void> => {
    try {
      await offlineDB.store(type, { ...data, user_id: user?.id });
      console.log(`[OfflineManager] Stored ${type} data offline:`, data.id);
    } catch (error) {
      console.error(`[OfflineManager] Failed to store ${type} data:`, error);
      throw error;
    }
  }, [user?.id]);

  const removeFromQueue = useCallback(async (actionId: string): Promise<void> => {
    try {
      await offlineDB.removeFromSyncQueue(actionId);
      setPendingActions(prev => prev.filter(action => action.id !== actionId));
      console.log(`[OfflineManager] Removed action from queue:`, actionId);
    } catch (error) {
      console.error('[OfflineManager] Failed to remove action from queue:', error);
      throw error;
    }
  }, []);

  const clearAllPendingActions = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await offlineDB.clearStore('syncQueue');
      setPendingActions([]);
      console.log('[OfflineManager] Cleared all pending actions');
    } catch (error) {
      console.error('[OfflineManager] Failed to clear pending actions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPendingActions = useCallback(async (): Promise<void> => {
    try {
      const actions = await offlineDB.getSyncQueue();
      setPendingActions(actions);
    } catch (error) {
      console.error('[OfflineManager] Failed to refresh pending actions:', error);
    }
  }, []);

  // Enhanced offline CRUD operations
  const createOfflineProduct = useCallback(async (productData: any): Promise<any> => {
    const product = {
      ...productData,
      id: `offline_product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store locally
    await storeOfflineData('products', product);
    
    // Queue for sync
    await addOfflineOperation('product', 'create', product, 'medium');
    
    return product;
  }, [user?.id, storeOfflineData, addOfflineOperation]);

  const updateOfflineProduct = useCallback(async (id: string, updates: any): Promise<any> => {
    const product = await offlineDB.getProduct(id);
    if (!product) throw new Error('Product not found');

    const updatedProduct = {
      ...product,
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update locally
    await storeOfflineData('products', updatedProduct);
    
    // Queue for sync
    await addOfflineOperation('product', 'update', updatedProduct, 'medium');
    
    return updatedProduct;
  }, [storeOfflineData, addOfflineOperation]);

  const createOfflineCustomer = useCallback(async (customerData: any): Promise<any> => {
    const customer = {
      ...customerData,
      id: `offline_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id,
      created_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store locally
    await storeOfflineData('customers', customer);
    
    // Queue for sync
    await addOfflineOperation('customer', 'create', customer, 'medium');
    
    return customer;
  }, [user?.id, storeOfflineData, addOfflineOperation]);

  return {
    isOnline,
    pendingActions,
    isLoading,
    addOfflineOperation,
    getOfflineData,
    storeOfflineData,
    removeFromQueue,
    clearAllPendingActions,
    refreshPendingActions,
    createOfflineProduct,
    updateOfflineProduct,
    createOfflineCustomer,
    hasPendingActions: pendingActions.length > 0
  };
};
