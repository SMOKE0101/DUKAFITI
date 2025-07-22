
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PendingOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
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

  const addPendingOperation = useCallback((operation: Omit<PendingOperation, 'id'>): void => {
    const operationWithId = {
      ...operation,
      id: `${operation.type}_${operation.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('[CacheManager] Adding pending operation:', operationWithId);

    setPendingOps(prev => {
      // For product and customer updates, check if we already have a similar operation to avoid duplicates
      if ((operation.type === 'customer' || operation.type === 'product') && operation.operation === 'update') {
        const similarExists = prev.some(op => 
          op.type === operation.type && 
          op.operation === 'update' && 
          op.data.id === operation.data.id
        );
        
        if (similarExists) {
          console.log(`[CacheManager] Similar ${operation.type} update operation exists, replacing with new one`);
          // Remove the old operation and add the new one with updated data
          return [...prev.filter(op => !(
            op.type === operation.type && 
            op.operation === 'update' && 
            op.data.id === operation.data.id
          )), operationWithId];
        }
      }
      
      // Check if exact operation already exists (for other cases)
      const exists = prev.some(op => op.id === operationWithId.id);
      if (exists) {
        console.log('[CacheManager] Operation already exists, skipping');
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

  const syncPendingOperations = useCallback(async (): Promise<void> => {
    if (!user) {
      console.log('[CacheManager] No user, skipping sync');
      return;
    }

    console.log('[CacheManager] Starting sync of pending operations:', pendingOps.length);
    
    const operationsToSync = [...pendingOps];
    const syncedOperations: string[] = [];

    for (const operation of operationsToSync) {
      try {
        console.log('[CacheManager] Syncing operation:', operation.id, operation.type, operation.operation);

        if (operation.type === 'product') {
          if (operation.operation === 'create') {
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

            if (error) throw error;
            console.log('[CacheManager] Product created successfully:', data.id);
          } else if (operation.operation === 'update') {
            const updateData: any = {};
            if (operation.data.updates.name !== undefined) updateData.name = operation.data.updates.name;
            if (operation.data.updates.category !== undefined) updateData.category = operation.data.updates.category;
            if (operation.data.updates.costPrice !== undefined) updateData.cost_price = operation.data.updates.costPrice;
            if (operation.data.updates.sellingPrice !== undefined) updateData.selling_price = operation.data.updates.sellingPrice;
            if (operation.data.updates.currentStock !== undefined) updateData.current_stock = operation.data.updates.currentStock;
            if (operation.data.updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = operation.data.updates.lowStockThreshold;
            updateData.updated_at = new Date().toISOString();

            const { error } = await supabase
              .from('products')
              .update(updateData)
              .eq('id', operation.data.id)
              .eq('user_id', user.id);

            if (error) throw error;
            console.log('[CacheManager] Product updated successfully:', operation.data.id);
          } else if (operation.operation === 'delete') {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', operation.data.id)
              .eq('user_id', user.id);

            if (error) throw error;
            console.log('[CacheManager] Product deleted successfully:', operation.data.id);
          }
        }

        syncedOperations.push(operation.id);
      } catch (error) {
        console.error('[CacheManager] Failed to sync operation:', operation.id, error);
        // Continue with other operations
      }
    }

    // Remove successfully synced operations
    if (syncedOperations.length > 0) {
      setPendingOps(prev => prev.filter(op => !syncedOperations.includes(op.id)));
      console.log('[CacheManager] Synced and removed operations:', syncedOperations.length);
    }
  }, [user, pendingOps]);

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
    pendingOps,
  };
};
