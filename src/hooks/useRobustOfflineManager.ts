
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { offlineDB } from '../utils/offlineDB';

export interface OfflineAction {
  id: string;
  type: 'product' | 'customer' | 'sale';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
  userId: string;
}

export interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  syncProgress: number;
  lastSyncTime: string | null;
  errors: string[];
  dataStats: { [key: string]: number };
}

export const useRobustOfflineManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0,
    lastSyncTime: localStorage.getItem('lastSyncTime'),
    errors: [],
    dataStats: {}
  });

  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  // Initialize offline system
  useEffect(() => {
    initializeOfflineSystem();
    
    const handleOnline = () => {
      console.log('[RobustOfflineManager] Online detected');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[RobustOfflineManager] Offline detected');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const initializeOfflineSystem = async () => {
    try {
      console.log('[RobustOfflineManager] Initializing offline system...');
      
      // Register robust service worker
      if ('serviceWorker' in navigator) {
        // Unregister old service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        
        // Register new robust service worker
        const registration = await navigator.serviceWorker.register('/robust-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        console.log('[RobustOfflineManager] Robust Service Worker registered:', registration.scope);
      }
      
      // Initialize IndexedDB
      await offlineDB.init();
      
      // Load pending operations
      await loadPendingOperations();
      
      // Get data stats
      const stats = await offlineDB.getStats();
      
      setOfflineState(prev => ({ 
        ...prev, 
        isInitialized: true,
        dataStats: stats
      }));
      
      console.log('[RobustOfflineManager] Offline system initialized successfully');
      
    } catch (error) {
      console.error('[RobustOfflineManager] Failed to initialize offline system:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isInitialized: true,
        errors: [...prev.errors, `Initialization failed: ${error.message}`]
      }));
    }
  };

  const loadPendingOperations = async () => {
    try {
      const queue = await offlineDB.getSyncQueue();
      const userQueue = queue.filter(action => action.user_id === user?.id);
      setPendingActions(userQueue);
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: userQueue.length 
      }));
    } catch (error) {
      console.error('[RobustOfflineManager] Failed to load pending operations:', error);
    }
  };

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
      synced: false,
      userId: user.id
    };

    try {
      // Store in IndexedDB sync queue
      await offlineDB.addToSyncQueue(action);
      
      // Update local state
      setPendingActions(prev => [...prev, action]);
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: prev.pendingOperations + 1 
      }));
      
      console.log(`[RobustOfflineManager] Added ${type} ${operation} to queue:`, actionId);
      
      // Show user feedback
      toast({
        title: "Action Queued",
        description: `${operation.charAt(0).toUpperCase() + operation.slice(1)} ${type} will sync when online`,
        duration: 3000,
      });
      
      return actionId;
    } catch (error) {
      console.error('[RobustOfflineManager] Failed to add operation to queue:', error);
      throw error;
    }
  }, [user?.id, toast]);

  const syncPendingOperations = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.isSyncing || !user?.id) {
      return;
    }

    setOfflineState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 0,
      errors: [] 
    }));

    try {
      const queue = await offlineDB.getSyncQueue();
      const userQueue = queue.filter(action => action.user_id === user.id);
      const totalOperations = userQueue.length;

      if (totalOperations === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[RobustOfflineManager] Starting sync of ${totalOperations} operations`);

      // Sort by priority
      const sortedQueue = userQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      let completed = 0;
      const errors: string[] = [];

      for (const operation of sortedQueue) {
        try {
          const success = await syncOperation(operation);
          if (success) {
            await offlineDB.removeFromSyncQueue(operation.id);
            completed++;
            
            // Update UI
            setPendingActions(prev => prev.filter(action => action.id !== operation.id));
          }
        } catch (error) {
          console.error(`[RobustOfflineManager] Failed to sync operation ${operation.id}:`, error);
          errors.push(`Failed to sync ${operation.type}: ${error.message}`);
        }

        // Update progress
        const progress = Math.round(((completed + errors.length) / totalOperations) * 100);
        setOfflineState(prev => ({ ...prev, syncProgress: progress }));
      }

      const finalPendingCount = totalOperations - completed;
      const now = new Date().toISOString();
      
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        pendingOperations: finalPendingCount,
        lastSyncTime: now,
        errors: errors
      }));

      localStorage.setItem('lastSyncTime', now);
      
      // Show success/error feedback
      if (completed > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${completed} operations`,
          duration: 3000,
        });
      }
      
      if (errors.length > 0) {
        toast({
          title: "Sync Errors",
          description: `${errors.length} operations failed to sync`,
          variant: "destructive",
          duration: 5000,
        });
      }

      console.log(`[RobustOfflineManager] Sync completed: ${completed} synced, ${errors.length} errors`);

    } catch (error) {
      console.error('[RobustOfflineManager] Sync process failed:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [...prev.errors, `Sync failed: ${error.message}`]
      }));
    }
  }, [offlineState.isOnline, offlineState.isSyncing, user?.id, toast]);

  const syncOperation = async (operation: OfflineAction): Promise<boolean> => {
    // This would integrate with your actual API
    // For now, we'll simulate the sync
    console.log(`[RobustOfflineManager] Syncing ${operation.type} ${operation.operation}:`, operation.data);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error(`[RobustOfflineManager] Sync failed for ${operation.id}:`, error);
      return false;
    }
  };

  // CRUD operations that work offline
  const createOfflineProduct = useCallback(async (productData: any) => {
    const product = {
      ...productData,
      id: `offline_product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store locally
    await offlineDB.store('products', product);
    
    // Queue for sync
    await addOfflineOperation('product', 'create', product, 'medium');
    
    return product;
  }, [user?.id, addOfflineOperation]);

  const createOfflineCustomer = useCallback(async (customerData: any) => {
    const customer = {
      ...customerData,
      id: `offline_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id,
      created_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store locally
    await offlineDB.store('customers', customer);
    
    // Queue for sync
    await addOfflineOperation('customer', 'create', customer, 'medium');
    
    return customer;
  }, [user?.id, addOfflineOperation]);

  const createOfflineSale = useCallback(async (saleData: any) => {
    const sale = {
      ...saleData,
      id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id,
      timestamp: new Date().toISOString(),
      synced: false
    };

    // Store locally
    await offlineDB.storeSale(sale);
    
    // Queue for sync
    await addOfflineOperation('sale', 'create', sale, 'high');
    
    return sale;
  }, [user?.id, addOfflineOperation]);

  const getOfflineData = useCallback(async (type: string) => {
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
      console.error(`[RobustOfflineManager] Failed to get offline data for ${type}:`, error);
      return [];
    }
  }, [user?.id]);

  const clearSyncErrors = useCallback(() => {
    setOfflineState(prev => ({ ...prev, errors: [] }));
  }, []);

  const forceSyncNow = useCallback(async () => {
    if (offlineState.isOnline && !offlineState.isSyncing) {
      await syncPendingOperations();
    }
  }, [offlineState.isOnline, offlineState.isSyncing, syncPendingOperations]);

  return {
    offlineState,
    pendingActions,
    addOfflineOperation,
    syncPendingOperations,
    createOfflineProduct,
    createOfflineCustomer,
    createOfflineSale,
    getOfflineData,
    clearSyncErrors,
    forceSyncNow,
    hasPendingActions: pendingActions.length > 0
  };
};
