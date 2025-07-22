
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
        console.log('[CacheManager] 📋 Loaded pending operations:', operations.length);
        setPendingOps(operations);
      }
    } catch (error) {
      console.error('[CacheManager] ❌ Failed to load pending operations:', error);
    }
  }, []);

  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);

  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(pendingOps));
      console.log('[CacheManager] 💾 Saved pending operations:', pendingOps.length);
    } catch (error) {
      console.error('[CacheManager] ❌ Failed to save pending operations:', error);
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
      console.error('[CacheManager] ❌ Failed to get cache:', error);
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
      console.log('[CacheManager] 💾 Set cache for key:', key, '- items:', Array.isArray(data) ? data.length : 'N/A');
    } catch (error) {
      console.error('[CacheManager] ❌ Failed to set cache:', error);
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

    console.log('[CacheManager] ➕ Adding pending operation:', operationWithId.id, operationWithId.type, operationWithId.operation);

    setPendingOps(prev => {
      // Enhanced deduplication with better conflict resolution
      let filteredOps = [...prev];
      
      if (operation.type === 'product' && operation.operation === 'update' && operation.data.id) {
        // For product updates, replace any existing update for the same product
        filteredOps = prev.filter(op => !(
          op.type === 'product' && 
          op.operation === 'update' && 
          op.data.id === operation.data.id
        ));
        
        const removedCount = prev.length - filteredOps.length;
        if (removedCount > 0) {
          console.log(`[CacheManager] 🔄 Replaced ${removedCount} existing update(s) for product: ${operation.data.id}`);
        }
      }
      
      // For creates and deletes, avoid exact duplicates
      const isDuplicate = filteredOps.some(op => 
        op.type === operation.type && 
        op.operation === operation.operation &&
        JSON.stringify(op.data) === JSON.stringify(operation.data)
      );
      
      if (isDuplicate) {
        console.log('[CacheManager] ⚠️  Similar operation already exists, skipping duplicate');
        return prev;
      }
      
      const newOps = [...filteredOps, operationWithId];
      console.log(`[CacheManager] ✅ Added pending operation. Total: ${newOps.length}`);
      return newOps;
    });
  }, []);

  const clearPendingOperation = useCallback((operationId: string): void => {
    console.log('[CacheManager] 🗑️  Clearing pending operation:', operationId);
    setPendingOps(prev => {
      const filtered = prev.filter(op => op.id !== operationId);
      const removed = prev.length - filtered.length;
      if (removed > 0) {
        console.log(`[CacheManager] ✅ Removed ${removed} operation(s)`);
      }
      return filtered;
    });
  }, []);

  const incrementOperationAttempts = useCallback((operationId: string): void => {
    setPendingOps(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, attempts: op.attempts + 1 }
        : op
    ));
  }, []);

  // Enhanced sync function with bulletproof error handling
  const syncPendingOperations = useCallback(async (): Promise<void> => {
    if (!user) {
      console.log('[CacheManager] ❌ No user, skipping sync');
      return;
    }

    const operationsToSync = pendingOps.filter(op => op.attempts < op.maxAttempts);
    if (operationsToSync.length === 0) {
      console.log('[CacheManager] ✅ No operations to sync');
      return;
    }

    console.log('[CacheManager] 🔄 Starting bulletproof sync:', operationsToSync.length, 'operations');
    
    const successfulOps: string[] = [];
    const failedOps: string[] = [];
    
    // Process operations by type and in chronological order
    const operationsByType = operationsToSync.reduce((acc, op) => {
      if (!acc[op.type]) acc[op.type] = [];
      acc[op.type].push(op);
      return acc;
    }, {} as Record<string, PendingOperation[]>);

    for (const [type, typeOps] of Object.entries(operationsByType)) {
      console.log(`[CacheManager] 🔧 Processing ${typeOps.length} ${type} operations`);
      
      // Sort by timestamp to maintain order
      const sortedOps = typeOps.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (const operation of sortedOps) {
        try {
          console.log(`[CacheManager] ⚡ Syncing: ${operation.type} ${operation.operation} - ${operation.id}`);

          let success = false;
          
          if (operation.type === 'product') {
            success = await syncProductOperation(operation, user.id);
          }
          // Add other operation types here as needed

          if (success) {
            successfulOps.push(operation.id);
            console.log(`[CacheManager] ✅ Successfully synced: ${operation.id}`);
          } else {
            failedOps.push(operation.id);
            incrementOperationAttempts(operation.id);
            console.log(`[CacheManager] ❌ Failed to sync: ${operation.id}`);
          }
        } catch (error) {
          console.error(`[CacheManager] ❌ Error syncing ${operation.id}:`, error);
          failedOps.push(operation.id);
          incrementOperationAttempts(operation.id);
        }
      }
    }

    // Remove successful operations
    if (successfulOps.length > 0) {
      setPendingOps(prev => prev.filter(op => !successfulOps.includes(op.id)));
      console.log(`[CacheManager] 🧹 Cleaned up ${successfulOps.length} successful operations`);
    }

    console.log(`[CacheManager] 📊 Sync summary: ${successfulOps.length} success, ${failedOps.length} failed`);

    // Dispatch events if any operations were successful
    if (successfulOps.length > 0) {
      console.log('[CacheManager] 📡 Dispatching sync completion events');
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sync-completed', {
          detail: {
            totalOperations: successfulOps.length,
            operationTypes: [...new Set(operationsToSync.map(op => op.type))],
            timestamp: new Date().toISOString()
          }
        }));
        
        window.dispatchEvent(new CustomEvent('data-synced', {
          detail: {
            operationTypes: [...new Set(operationsToSync.map(op => op.type))],
            timestamp: new Date().toISOString()
          }
        }));

        // Dispatch product-specific event
        window.dispatchEvent(new CustomEvent('product-synced', {
          detail: {
            operationCount: successfulOps.length,
            timestamp: new Date().toISOString()
          }
        }));
      }, 100);
    }
  }, [user, pendingOps, incrementOperationAttempts]);

  // Helper function to sync product operations
  const syncProductOperation = async (operation: PendingOperation, userId: string): Promise<boolean> => {
    const { data } = operation;
    console.log(`[CacheManager] 🔧 Syncing product ${operation.operation}:`, data?.name || data?.id);
    
    try {
      switch (operation.operation) {
        case 'create':
          // Check for existing product to prevent duplicates
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', userId)
            .eq('name', data.name)
            .eq('category', data.category)
            .maybeSingle();

          if (existingProduct) {
            console.log('[CacheManager] ⚠️  Product already exists, marking as synced:', data.name);
            return true;
          }

          const { error: createError } = await supabase
            .from('products')
            .insert([{
              user_id: userId,
              name: data.name,
              category: data.category,
              cost_price: data.costPrice,
              selling_price: data.sellingPrice,
              current_stock: data.currentStock || 0,
              low_stock_threshold: data.lowStockThreshold || 10,
            }]);
          
          if (createError) {
            console.error('[CacheManager] ❌ Product create error:', createError);
            return false;
          }
          console.log('[CacheManager] ✅ Product created successfully');
          return true;
          
        case 'update':
          if (!data.id || data.id.startsWith('temp_')) {
            console.warn('[CacheManager] ⚠️  Cannot update temp product:', data.id);
            return true; // Remove from pending since temp products can't be synced
          }
          
          // Verify product exists before updating
          const { data: productExists } = await supabase
            .from('products')
            .select('id')
            .eq('id', data.id)
            .eq('user_id', userId)
            .maybeSingle();
            
          if (!productExists) {
            console.warn('[CacheManager] ⚠️  Product not found for update:', data.id);
            return true; // Remove from pending since product doesn't exist
          }
          
          const updateData: any = {};
          const updates = data.updates || data;
          
          if (updates.name !== undefined) updateData.name = updates.name;
          if (updates.category !== undefined) updateData.category = updates.category;
          if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
          if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
          if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
          if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;
          updateData.updated_at = new Date().toISOString();

          console.log('[CacheManager] 📝 Updating product with data:', { id: data.id, updateData });
          
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', data.id)
            .eq('user_id', userId);
            
          if (updateError) {
            console.error('[CacheManager] ❌ Product update error:', updateError);
            return false;
          }
          console.log('[CacheManager] ✅ Product updated successfully');
          return true;
          
        case 'delete':
          if (!data.id || data.id.startsWith('temp_')) {
            console.warn('[CacheManager] ⚠️  Cannot delete temp product:', data.id);
            return true; // Remove from pending since temp products can't be synced
          }
          
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', data.id)
            .eq('user_id', userId);
            
          if (deleteError) {
            console.error('[CacheManager] ❌ Product delete error:', deleteError);
            return false;
          }
          console.log('[CacheManager] ✅ Product deleted successfully');
          return true;
          
        default:
          console.warn(`[CacheManager] ❌ Unsupported product operation: ${operation.operation}`);
          return false;
      }
    } catch (error) {
      console.error('[CacheManager] ❌ Product operation error:', error);
      return false;
    }
  };

  const debugPendingOperations = useCallback(() => {
    console.log('[CacheManager] 🐛 Debug - Current pending operations:', {
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
    clearPendingOperation,
    loadPendingOperations,
    debugPendingOperations,
    syncPendingOperations,
    incrementOperationAttempts,
    pendingOps,
  };
};
