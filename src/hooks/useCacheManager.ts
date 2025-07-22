
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PendingOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  attempts: number;
  maxAttempts: number;
}

export const useCacheManager = () => {
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);
  const { user } = useAuth();

  // Load pending operations from localStorage on mount
  const loadPendingOperations = useCallback(() => {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        const operations = JSON.parse(stored);
        console.log('[CacheManager] Loaded pending operations:', operations.length);
        setPendingOps(operations);
      }
    } catch (error) {
      console.error('[CacheManager] Failed to load pending operations:', error);
    }
  }, []);

  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);

  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(pendingOps));
      console.log('[CacheManager] Saved pending operations:', pendingOps.length);
    } catch (error) {
      console.error('[CacheManager] Failed to save pending operations:', error);
    }
  }, [pendingOps]);

  const getCache = useCallback(<T>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        const cacheTime = parsed.timestamp;
        const now = new Date().getTime();
        const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return parsed.data;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.error('[CacheManager] Failed to get cache:', error);
    }
    return null;
  }, []);

  const setCache = useCallback(<T>(key: string, data: T): void => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      console.log('[CacheManager] Set cache for key:', key, 'data length:', Array.isArray(data) ? data.length : 'N/A');
    } catch (error) {
      console.error('[CacheManager] Failed to set cache:', error);
    }
  }, []);

  const addPendingOperation = useCallback((operation: Omit<PendingOperation, 'id' | 'timestamp' | 'attempts' | 'maxAttempts'>): void => {
    const operationWithId: PendingOperation = {
      ...operation,
      id: `${operation.type}_${operation.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    };

    console.log('[CacheManager] Adding pending operation:', operationWithId);

    setPendingOps(prev => {
      // Enhanced deduplication logic for better conflict resolution
      if ((operation.type === 'customer' || operation.type === 'product') && operation.operation === 'update' && operation.data.id) {
        // For updates, replace existing operations for the same entity
        const filtered = prev.filter(op => !(
          op.type === operation.type && 
          op.operation === 'update' && 
          op.data.id === operation.data.id
        ));
        
        if (filtered.length !== prev.length) {
          console.log(`[CacheManager] Replaced existing ${operation.type} update operation for ID: ${operation.data.id}`);
        }
        
        return [...filtered, operationWithId];
      }
      
      // For creates and deletes, avoid exact duplicates
      const exists = prev.some(op => 
        op.type === operation.type && 
        op.operation === operation.operation &&
        JSON.stringify(op.data) === JSON.stringify(operation.data)
      );
      
      if (exists) {
        console.log('[CacheManager] Similar operation already exists, skipping');
        return prev;
      }
      
      console.log(`[CacheManager] Added new pending operation. Total pending: ${prev.length + 1}`);
      return [...prev, operationWithId];
    });
  }, []);

  const removePendingOperation = useCallback((operationId: string): void => {
    console.log('[CacheManager] Removing pending operation:', operationId);
    setPendingOps(prev => prev.filter(op => op.id !== operationId));
  }, []);

  const clearPendingOperation = useCallback((operationId: string): void => {
    console.log('[CacheManager] Clearing pending operation:', operationId);
    setPendingOps(prev => prev.filter(op => op.id !== operationId));
  }, []);

  const clearAllPendingOperations = useCallback((): void => {
    console.log('[CacheManager] Clearing all pending operations');
    setPendingOps([]);
  }, []);

  const getPendingOperationsByType = useCallback((type: string) => {
    return pendingOps.filter(op => op.type === type);
  }, [pendingOps]);

  const incrementOperationAttempts = useCallback((operationId: string): void => {
    setPendingOps(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, attempts: op.attempts + 1 }
        : op
    ));
  }, []);

  // Enhanced sync function with better error handling and state preservation
  const syncPendingOperations = useCallback(async (): Promise<void> => {
    if (!user) {
      console.log('[CacheManager] No user, skipping sync');
      return;
    }

    const operationsToSync = pendingOps.filter(op => op.attempts < op.maxAttempts);
    if (operationsToSync.length === 0) {
      console.log('[CacheManager] No operations to sync');
      return;
    }

    console.log('[CacheManager] Starting enhanced sync of pending operations:', operationsToSync.length);
    
    const successfulOps: string[] = [];
    const failedOps: string[] = [];
    
    for (const operation of operationsToSync) {
      try {
        console.log('[CacheManager] Syncing operation:', operation.id, operation.type, operation.operation);

        let success = false;
        
        if (operation.type === 'product') {
          if (operation.operation === 'create') {
            // Check if product already exists to prevent duplicates
            const { data: existingProduct } = await supabase
              .from('products')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', operation.data.name)
              .eq('category', operation.data.category)
              .maybeSingle();

            if (existingProduct) {
              console.log('[CacheManager] Product already exists, marking as synced:', operation.data.name);
              success = true;
            } else {
              const { data, error } = await supabase
                .from('products')
                .insert([{
                  user_id: user.id,
                  name: operation.data.name,
                  category: operation.data.category,
                  cost_price: operation.data.costPrice,
                  selling_price: operation.data.sellingPrice,
                  current_stock: operation.data.currentStock,
                  low_stock_threshold: operation.data.lowStockThreshold,
                }])
                .select()
                .single();

              success = !error;
              if (success) {
                console.log('[CacheManager] Product created successfully:', data.id);
              } else {
                console.error('[CacheManager] Product create error:', error);
              }
            }
          } else if (operation.operation === 'update') {
            if (!operation.data.id || operation.data.id.startsWith('temp_')) {
              console.warn('[CacheManager] Cannot sync temp product update:', operation.data.id);
              // Mark as successful to remove from pending (can't sync temp products)
              success = true;
            } else {
              // Verify product exists before updating
              const { data: existingProduct } = await supabase
                .from('products')
                .select('id, updated_at')
                .eq('id', operation.data.id)
                .eq('user_id', user.id)
                .maybeSingle();
                
              if (!existingProduct) {
                console.warn('[CacheManager] Product not found for update:', operation.data.id);
                success = true; // Remove from pending since product doesn't exist
              } else {
                const updateData: any = {};
                const updates = operation.data.updates || operation.data;
                
                if (updates.name !== undefined) updateData.name = updates.name;
                if (updates.category !== undefined) updateData.category = updates.category;
                if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
                if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
                if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
                if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;
                updateData.updated_at = new Date().toISOString();

                const { error, data } = await supabase
                  .from('products')
                  .update(updateData)
                  .eq('id', operation.data.id)
                  .eq('user_id', user.id)
                  .select()
                  .single();

                success = !error;
                if (success) {
                  console.log('[CacheManager] Product updated successfully:', data.id);
                } else {
                  console.error('[CacheManager] Product update error:', error);
                }
              }
            }
          } else if (operation.operation === 'delete') {
            if (!operation.data.id || operation.data.id.startsWith('temp_')) {
              console.warn('[CacheManager] Cannot sync temp product delete:', operation.data.id);
              success = true; // Remove from pending since temp products don't exist on server
            } else {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', operation.data.id)
                .eq('user_id', user.id);

              success = !error;
              if (success) {
                console.log('[CacheManager] Product deleted successfully:', operation.data.id);
              } else {
                console.error('[CacheManager] Product delete error:', error);
              }
            }
          }
        }

        if (success) {
          successfulOps.push(operation.id);
        } else {
          failedOps.push(operation.id);
          incrementOperationAttempts(operation.id);
        }
      } catch (error) {
        console.error('[CacheManager] Failed to sync operation:', operation.id, error);
        failedOps.push(operation.id);
        incrementOperationAttempts(operation.id);
      }
    }

    // Remove successful operations
    if (successfulOps.length > 0) {
      setPendingOps(prev => prev.filter(op => !successfulOps.includes(op.id)));
      console.log(`[CacheManager] Removed ${successfulOps.length} successful operations`);
    }

    console.log(`[CacheManager] Sync completed: ${successfulOps.length} successful, ${failedOps.length} failed`);

    // Dispatch events if all operations were successful
    if (failedOps.length === 0 && successfulOps.length > 0) {
      console.log('[CacheManager] All operations synced successfully - dispatching events');
      window.dispatchEvent(new CustomEvent('sync-completed', {
        detail: {
          totalOperations: successfulOps.length,
          timestamp: new Date().toISOString()
        }
      }));
      window.dispatchEvent(new CustomEvent('data-synced', {
        detail: {
          operationTypes: [...new Set(operationsToSync.map(op => op.type))],
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, [user, pendingOps, incrementOperationAttempts]);

  const debugPendingOperations = useCallback(() => {
    console.log('[CacheManager] Current pending operations:', {
      total: pendingOps.length,
      byType: {
        sale: pendingOps.filter(op => op.type === 'sale').length,
        customer: pendingOps.filter(op => op.type === 'customer').length,
        product: pendingOps.filter(op => op.type === 'product').length,
        transaction: pendingOps.filter(op => op.type === 'transaction').length,
      },
      operations: pendingOps
    });
  }, [pendingOps]);

  return {
    getCache,
    setCache,
    addPendingOperation,
    removePendingOperation,
    clearPendingOperation,
    clearAllPendingOperations,
    loadPendingOperations,
    getPendingOperationsByType,
    debugPendingOperations,
    syncPendingOperations,
    incrementOperationAttempts,
    pendingOps,
  };
};
