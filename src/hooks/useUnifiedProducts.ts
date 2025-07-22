import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { Product } from '../types';

// Helper function to transform database product to interface
const transformDbProduct = (dbProduct: any): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  category: dbProduct.category,
  costPrice: Number(dbProduct.cost_price),
  sellingPrice: Number(dbProduct.selling_price),
  currentStock: dbProduct.current_stock,
  lowStockThreshold: dbProduct.low_stock_threshold || 10,
  createdAt: dbProduct.created_at,
  updatedAt: dbProduct.updated_at,
});

export const useUnifiedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, addPendingOperation, pendingOps, syncPendingOperations } = useCacheManager();

  // Enhanced merge function that preserves offline changes
  const mergeWithPendingOperations = useCallback((serverData: Product[], pendingProductOps: any[]) => {
    console.log('[UnifiedProducts] Merging server data with pending operations');
    console.log('[UnifiedProducts] Server data count:', serverData.length);
    console.log('[UnifiedProducts] Pending operations:', pendingProductOps.length);
    
    // Start with server data as base
    let mergedData = [...serverData];
    
    // Create a map for faster lookups
    const productMap = new Map(mergedData.map(p => [p.id, p]));
    
    // Sort pending operations by timestamp to apply them in order
    const sortedOps = pendingProductOps.sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    
    for (const op of sortedOps) {
      console.log(`[UnifiedProducts] Processing pending operation:`, op.operation, op.data?.name || op.data?.id);
      
      if (op.operation === 'create') {
        // Add new products that don't exist in server data
        const exists = mergedData.some(p => 
          (p.name === op.data.name && p.category === op.data.category) ||
          p.id === op.data.id
        );
        
        if (!exists) {
          const tempProduct: Product = {
            ...op.data,
            id: op.data.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            createdAt: op.timestamp || new Date().toISOString(),
            updatedAt: op.timestamp || new Date().toISOString(),
          };
          mergedData.unshift(tempProduct);
          console.log(`[UnifiedProducts] Added pending create:`, tempProduct.name);
        }
      } else if (op.operation === 'update') {
        const productId = op.data.id;
        const existingProduct = productMap.get(productId);
        
        if (existingProduct) {
          // Apply updates to existing product
          const updates = op.data.updates || op.data;
          const updatedProduct = { 
            ...existingProduct, 
            ...updates,
            updatedAt: op.timestamp || new Date().toISOString()
          };
          
          // Update in both array and map
          const index = mergedData.findIndex(p => p.id === productId);
          if (index !== -1) {
            mergedData[index] = updatedProduct;
            productMap.set(productId, updatedProduct);
            console.log(`[UnifiedProducts] Applied pending update to:`, updatedProduct.name, updates);
          }
        } else if (productId?.startsWith('temp_')) {
          // Handle updates to temp products
          const index = mergedData.findIndex(p => p.id === productId);
          if (index !== -1) {
            const updates = op.data.updates || op.data;
            mergedData[index] = { 
              ...mergedData[index], 
              ...updates,
              updatedAt: op.timestamp || new Date().toISOString()
            };
            console.log(`[UnifiedProducts] Applied update to temp product:`, productId);
          }
        }
      } else if (op.operation === 'delete') {
        // Remove deleted products
        mergedData = mergedData.filter(p => p.id !== op.data.id);
        productMap.delete(op.data.id);
        console.log(`[UnifiedProducts] Applied pending delete:`, op.data.id);
      }
    }
    
    console.log(`[UnifiedProducts] Merge complete. Final count:`, mergedData.length);
    return mergedData;
  }, []);

  // Load products with enhanced offline/online handling
  const loadProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[UnifiedProducts] Loading products...');
      
      const cached = getCache<Product[]>('products');
      const pendingProductOps = pendingOps.filter(op => op.type === 'product');
      
      console.log('[UnifiedProducts] Cache status:', !!cached);
      console.log('[UnifiedProducts] Pending operations:', pendingProductOps.length);
      
      if (cached) {
        // Apply pending operations to cached data first
        const cachedWithPending = mergeWithPendingOperations(cached, pendingProductOps);
        setProducts(cachedWithPending);
        setLoading(false);
        
        // If online, fetch fresh data and merge
        if (isOnline) {
          try {
            console.log('[UnifiedProducts] Fetching fresh data from server...');
            const { data, error: fetchError } = await supabase
              .from('products')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (!fetchError && data) {
              const serverData = data.map(transformDbProduct);
              console.log(`[UnifiedProducts] Server returned ${serverData.length} products`);
              
              // Merge server data with current pending operations
              const finalMergedData = mergeWithPendingOperations(serverData, pendingProductOps);
              
              // Update cache with clean server data only
              setCache('products', serverData);
              
              // Display merged data (server + pending changes)
              setProducts(finalMergedData);
              console.log(`[UnifiedProducts] Updated with ${finalMergedData.length} merged products`);
            }
          } catch (serverError) {
            console.error('[UnifiedProducts] Server fetch failed:', serverError);
            // Keep cached data with pending operations on server error
          }
        }
        return;
      }

      // No cache - fetch from server if online
      if (isOnline) {
        console.log('[UnifiedProducts] No cache, fetching from server...');
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError('Failed to load products');
          console.error('[UnifiedProducts] Fetch error:', fetchError);
        } else {
          const serverData = (data || []).map(transformDbProduct);
          const mergedData = mergeWithPendingOperations(serverData, pendingProductOps);
          
          console.log(`[UnifiedProducts] Loaded ${serverData.length} from server, ${mergedData.length} after merge`);
          setCache('products', serverData);
          setProducts(mergedData);
        }
      } else {
        setError('No cached data available offline');
        console.log('[UnifiedProducts] Offline with no cache');
      }
    } catch (err) {
      setError('Failed to load products');
      console.error('[UnifiedProducts] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, getCache, setCache, pendingOps, mergeWithPendingOperations]);

  // Enhanced create product with better offline handling
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: tempId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    console.log('[UnifiedProducts] Creating product:', newProduct.name);

    // Always add to pending operations first
    addPendingOperation({
      type: 'product',
      operation: 'create',
      data: productData,
    });

    // Optimistically update UI
    setProducts(prev => [newProduct, ...prev]);

    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([{
            user_id: user.id,
            name: productData.name,
            category: productData.category,
            cost_price: productData.costPrice,
            selling_price: productData.sellingPrice,
            current_stock: productData.currentStock,
            low_stock_threshold: productData.lowStockThreshold,
          }])
          .select()
          .single();

        if (error) throw error;

        const transformedProduct = transformDbProduct(data);
        console.log('[UnifiedProducts] Product created online:', transformedProduct.id);

        // Replace temp product with real one
        setProducts(prev => {
          const updated = prev.map(p => p.id === tempId ? transformedProduct : p);
          // Update cache with clean server data
          const cleanData = updated.filter(p => !p.id.startsWith('temp_'));
          setCache('products', cleanData);
          return updated;
        });

        return transformedProduct;
      } catch (error) {
        console.error('[UnifiedProducts] Create failed online:', error);
        // Keep the pending operation and optimistic update
        return newProduct;
      }
    } else {
      console.log('[UnifiedProducts] Product created offline, queued for sync');
      return newProduct;
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Enhanced update product with conflict resolution
  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    if (!user) throw new Error('User not authenticated');

    const timestamp = new Date().toISOString();
    console.log('[UnifiedProducts] Updating product:', productId, updates);

    // Always queue the operation first
    addPendingOperation({
      type: 'product',
      operation: 'update',
      data: { id: productId, updates },
    });

    // Optimistically update UI immediately
    setProducts(prev => {
      const updated = prev.map(product => 
        product.id === productId 
          ? { ...product, ...updates, updatedAt: timestamp }
          : product
      );
      
      // Update cache for real products only
      const cleanData = updated.filter(p => !p.id.startsWith('temp_'));
      if (cleanData.length > 0) {
        setCache('products', cleanData);
      }
      
      return updated;
    });

    if (isOnline && !productId.startsWith('temp_')) {
      try {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
        if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
        if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
        if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;
        updateData.updated_at = timestamp;

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('[UnifiedProducts] Product updated online:', productId);
      } catch (error) {
        console.error('[UnifiedProducts] Update failed online, keeping pending:', error);
        // Operation already queued, just keep the optimistic update
      }
    } else {
      console.log('[UnifiedProducts] Product update queued for sync:', productId);
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Enhanced delete product
  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('[UnifiedProducts] Deleting product:', productId);

    // Queue operation for non-temp products
    if (!productId.startsWith('temp_')) {
      addPendingOperation({
        type: 'product',
        operation: 'delete',
        data: { id: productId },
      });
    }

    // Optimistically update UI
    setProducts(prev => {
      const updated = prev.filter(product => product.id !== productId);
      const cleanData = updated.filter(p => !p.id.startsWith('temp_'));
      if (cleanData.length >= 0) {
        setCache('products', cleanData);
      }
      return updated;
    });

    if (isOnline && !productId.startsWith('temp_')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', user.id);

        if (error) throw error;
        console.log('[UnifiedProducts] Product deleted online:', productId);
      } catch (error) {
        console.error('[UnifiedProducts] Delete failed online, keeping pending:', error);
        // Operation already queued
      }
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Enhanced sync function
  const handleSyncPendingOperations = useCallback(async () => {
    if (!isOnline || !user) return;

    setSyncStatus('syncing');
    try {
      console.log('[UnifiedProducts] Starting enhanced sync...');
      await syncPendingOperations();
      
      // After sync, reload to get the latest state
      setTimeout(() => {
        loadProducts();
        setSyncStatus('success');
      }, 500);
    } catch (error) {
      console.error('[UnifiedProducts] Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isOnline, user, syncPendingOperations, loadProducts]);

  // Load products on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Enhanced sync event listeners
  useEffect(() => {
    const handleNetworkChange = () => {
      console.log('[UnifiedProducts] Network status changed, reloading...');
      setTimeout(() => loadProducts(), 1000);
    };

    const handleSyncComplete = () => {
      console.log('[UnifiedProducts] Sync completed, reloading...');
      setTimeout(() => loadProducts(), 500);
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('data-synced', handleSyncComplete);
    window.addEventListener('product-synced', handleSyncComplete);
    
    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('sync-completed', handleSyncComplete);
      window.removeEventListener('data-synced', handleSyncComplete);
      window.removeEventListener('product-synced', handleSyncComplete);
    };
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: loadProducts,
    isOnline,
    pendingOperations: pendingOps.filter(op => op.type === 'product').length,
    syncPendingOperations: handleSyncPendingOperations,
    syncStatus,
  };
};
