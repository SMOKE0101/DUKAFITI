import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '../utils/indexedDB';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  syncProgress: number;
  lastSyncTime: string | null;
  errors: string[];
}

interface OfflineOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

export const useOfflineManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0,
    lastSyncTime: localStorage.getItem('lastSyncTime'),
    errors: []
  });

  // Initialize offline capabilities
  useEffect(() => {
    initializeOfflineSystem();
    
    const handleOnline = () => {
      console.log('[OfflineManager] Online detected');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      if (user) {
        setTimeout(() => syncPendingOperations(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('[OfflineManager] Offline detected');
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
      console.log('[OfflineManager] Initializing offline system...');
      
      // Register service worker with better error handling
      if ('serviceWorker' in navigator) {
        try {
          // Only register offline-sw.js to avoid conflicts
          const registration = await navigator.serviceWorker.register('/offline-sw.js', {
            scope: '/'
          });
          console.log('[OfflineManager] Service Worker registered successfully:', registration.scope);
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "App Updated",
                    description: "New version available. Restart to apply updates.",
                    duration: 5000,
                  });
                }
              });
            }
          });
          
          // Test service worker functionality
          if (navigator.serviceWorker.controller) {
            console.log('[OfflineManager] Service Worker is active and controlling');
          }
          
        } catch (error) {
          console.error('[OfflineManager] Service Worker registration failed:', error);
          // Don't throw - continue with degraded functionality
        }
      }

      // Initialize IndexedDB
      await offlineDB.init();
      
      // Load pending operations count
      await loadPendingOperationsCount();
      
      setOfflineState(prev => ({ ...prev, isInitialized: true }));
      console.log('[OfflineManager] Offline system initialized successfully');
      
    } catch (error) {
      console.error('[OfflineManager] Failed to initialize offline system:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isInitialized: true, // Still mark as initialized to prevent infinite loops
        errors: [...prev.errors, `Initialization failed: ${error.message}`]
      }));
    }
  };

  const loadPendingOperationsCount = async () => {
    try {
      const queue = await offlineDB.getSyncQueue();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: queue?.length || 0 
      }));
    } catch (error) {
      console.error('[OfflineManager] Failed to load pending operations:', error);
    }
  };

  // Add operation to offline queue
  const addOfflineOperation = useCallback(async (
    type: 'sale' | 'product' | 'customer' | 'transaction',
    operation: 'create' | 'update' | 'delete',
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> => {
    const operationId = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineOperation: OfflineOperation = {
      id: operationId,
      type,
      operation,
      data: { ...data, user_id: user?.id },
      timestamp: new Date().toISOString(),
      priority,
      attempts: 0,
      synced: false
    };

    try {
      // Store in IndexedDB
      await offlineDB.addToSyncQueue(offlineOperation);
      
      // Update local storage immediately for UI responsiveness
      await updateLocalStorage(type, operation, data);
      
      // Update pending count
      await loadPendingOperationsCount();
      
      // Try immediate sync if online
      if (offlineState.isOnline && user) {
        setTimeout(() => syncPendingOperations(), 500);
      }
      
      console.log(`[OfflineManager] Added ${type} ${operation} to offline queue:`, operationId);
      return operationId;
      
    } catch (error) {
      console.error('[OfflineManager] Failed to add offline operation:', error);
      throw error;
    }
  }, [user, offlineState.isOnline]);

  // Update local storage for immediate UI feedback
  const updateLocalStorage = async (type: string, operation: string, data: any) => {
    try {
      switch (type) {
        case 'sale':
          if (operation === 'create') {
            await offlineDB.storeOfflineData('sales', data);
            // Update product stock locally
            if (data.product_id && data.quantity) {
              const product = await offlineDB.getOfflineData('products', data.product_id);
              if (product) {
                product.current_stock = Math.max(0, product.current_stock - data.quantity);
                await offlineDB.storeOfflineData('products', product);
              }
            }
          }
          break;
          
        case 'product':
          await offlineDB.storeOfflineData('products', data);
          break;
          
        case 'customer':
          await offlineDB.storeOfflineData('customers', data);
          break;
          
        case 'transaction':
          await offlineDB.storeOfflineData('transactions', data);
          break;
      }
    } catch (error) {
      console.error('[OfflineManager] Failed to update local storage:', error);
    }
  };

  // Sync pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.isSyncing || !user) {
      return;
    }

    setOfflineState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 0,
      errors: []
    }));

    try {
      const operations = await offlineDB.getSyncQueue();
      const totalOperations = operations?.length || 0;

      if (totalOperations === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncTime: new Date().toISOString()
        }));
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        return;
      }

      console.log(`[OfflineManager] Starting sync of ${totalOperations} operations`);

      // Sort by priority and timestamp
      const sortedOperations = operations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      let completed = 0;
      const errors: string[] = [];

      for (const operation of sortedOperations) {
        try {
          const success = await syncSingleOperation(operation);
          if (success) {
            await offlineDB.removeFromSyncQueue(operation.id);
            completed++;
          } else {
            // Increment attempts
            operation.attempts++;
            if (operation.attempts >= 3) {
              await offlineDB.removeFromSyncQueue(operation.id);
              errors.push(`Max attempts reached for ${operation.type} ${operation.operation}`);
            } else {
              await offlineDB.addToSyncQueue(operation);
            }
          }
        } catch (error) {
          console.error(`[OfflineManager] Failed to sync operation ${operation.id}:`, error);
          errors.push(`Failed to sync ${operation.type}: ${error.message}`);
        }

        // Update progress
        const progress = Math.round(((completed + errors.length) / totalOperations) * 100);
        setOfflineState(prev => ({ ...prev, syncProgress: progress }));
      }

      const finalPendingCount = totalOperations - completed;
      const syncTime = new Date().toISOString();
      
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        pendingOperations: finalPendingCount,
        lastSyncTime: syncTime,
        errors: errors
      }));

      localStorage.setItem('lastSyncTime', syncTime);
      
      if (completed > 0) {
        toast({
          title: "Sync Complete",
          description: `${completed} operations synced successfully`,
          duration: 3000,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Sync Issues",
          description: `${errors.length} operations failed to sync`,
          variant: "destructive",
          duration: 5000,
        });
      }

      console.log(`[OfflineManager] Sync completed: ${completed} synced, ${errors.length} errors, ${finalPendingCount} pending`);

    } catch (error) {
      console.error('[OfflineManager] Sync process failed:', error);
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        errors: [...prev.errors, `Sync failed: ${error.message}`]
      }));
    }
  }, [offlineState.isOnline, offlineState.isSyncing, user, toast]);

  const syncSingleOperation = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      switch (operation.type) {
        case 'sale':
          return await syncSale(operation);
        case 'product':
          return await syncProduct(operation);
        case 'customer':
          return await syncCustomer(operation);
        case 'transaction':
          return await syncTransaction(operation);
        default:
          console.warn(`[OfflineManager] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[OfflineManager] Error syncing ${operation.type}:`, error);
      return false;
    }
  };

  const syncSale = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      const { data } = operation;
      
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('sales')
          .insert([{
            user_id: user?.id,
            product_id: data.product_id,
            product_name: data.product_name,
            quantity: data.quantity,
            selling_price: data.selling_price,
            cost_price: data.cost_price,
            profit: data.profit,
            total_amount: data.total_amount,
            payment_method: data.payment_method,
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            payment_details: data.payment_details || {},
            timestamp: data.timestamp || new Date().toISOString(),
            synced: true
          }]);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineManager] Sale sync error:', error);
      return false;
    }
  };

  const syncProduct = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      const { data } = operation;
      
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('products')
          .insert([{
            user_id: user?.id,
            name: data.name,
            category: data.category,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            current_stock: data.current_stock || 0,
            low_stock_threshold: data.low_stock_threshold || 10
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        // Handle special stock operations
        if (data.metadata?.operation === 'add_stock') {
          // Get current product to safely update stock
          const { data: currentProduct } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', data.id)
            .eq('user_id', user?.id)
            .single();

          const newStock = (currentProduct?.current_stock || 0) + data.metadata.quantity;
          
          const { error } = await supabase
            .from('products')
            .update({ 
              current_stock: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.id)
            .eq('user_id', user?.id);
          
          return !error;
        } else {
          // Regular update
          const { error } = await supabase
            .from('products')
            .update(data.updates)
            .eq('id', data.id)
            .eq('user_id', user?.id);
          
          return !error;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineManager] Product sync error:', error);
      return false;
    }
  };

  const syncCustomer = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      const { data } = operation;
      
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('customers')
          .insert([{
            user_id: user?.id,
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            credit_limit: data.credit_limit || 1000,
            outstanding_debt: data.outstanding_debt || 0
          }]);
        
        return !error;
      } else if (operation.operation === 'update') {
        const { error } = await supabase
          .from('customers')
          .update(data.updates)
          .eq('id', data.id)
          .eq('user_id', user?.id);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineManager] Customer sync error:', error);
      return false;
    }
  };

  const syncTransaction = async (operation: OfflineOperation): Promise<boolean> => {
    try {
      const { data } = operation;
      
      if (operation.operation === 'create') {
        const { error } = await supabase
          .from('transactions')
          .insert([{
            user_id: user?.id,
            customer_id: data.customer_id,
            item_id: data.item_id,
            quantity: data.quantity,
            unit_price: data.unit_price,
            total_amount: data.total_amount,
            paid: data.paid || false,
            notes: data.notes
          }]);
        
        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineManager] Transaction sync error:', error);
      return false;
    }
  };

  // Force sync now
  const forceSyncNow = useCallback(async () => {
    if (offlineState.isOnline && !offlineState.isSyncing) {
      await syncPendingOperations();
    } else if (!offlineState.isOnline) {
      toast({
        title: "Offline Mode",
        description: "Cannot sync while offline. Data will sync when connection is restored.",
        variant: "default",
      });
    }
  }, [offlineState.isOnline, offlineState.isSyncing, syncPendingOperations, toast]);

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    setOfflineState(prev => ({ ...prev, errors: [] }));
  }, []);

  // Get offline data with better error handling
  const getOfflineData = useCallback(async (type: string, id?: string) => {
    try {
      return await offlineDB.getOfflineData(type, id);
    } catch (error) {
      console.error(`[OfflineManager] Failed to get offline data for ${type}:`, error);
      return null;
    }
  }, []);

  return {
    ...offlineState,
    addOfflineOperation,
    syncPendingOperations,
    forceSyncNow,
    clearSyncErrors,
    getOfflineData,
  };
};
