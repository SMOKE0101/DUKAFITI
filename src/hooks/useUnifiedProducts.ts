
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

  // Apply pending operations to a dataset
  const applyPendingOperations = useCallback((baseData: Product[], pendingProductOps: any[]) => {
    let processedData = [...baseData];
    
    // Apply pending operations in chronological order
    const sortedOps = pendingProductOps.sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    
    for (const op of sortedOps) {
      if (op.operation === 'create') {
        // Add temp products that aren't already in the base data
        const existsInBase = processedData.some(p => 
          p.name === op.data.name && p.category === op.data.category
        );
        if (!existsInBase) {
          const tempProduct: Product = {
            ...op.data,
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            createdAt: op.timestamp || new Date().toISOString(),
            updatedAt: op.timestamp || new Date().toISOString(),
          };
          processedData.unshift(tempProduct);
        }
      } else if (op.operation === 'update') {
        const index = processedData.findIndex(p => p.id === op.data.id);
        if (index !== -1) {
          const updates = op.data.updates || op.data;
          processedData[index] = { 
            ...processedData[index], 
            ...updates,
            updatedAt: op.timestamp || new Date().toISOString()
          };
          console.log(`[UnifiedProducts] Applied pending update to product ${op.data.id}:`, updates);
        }
      } else if (op.operation === 'delete') {
        processedData = processedData.filter(p => p.id !== op.data.id);
      }
    }
    
    return processedData;
  }, []);

  // Load products from cache or server
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
      
      // Try cache first
      const cached = getCache<Product[]>('products');
      const pendingProductOps = pendingOps.filter(op => op.type === 'product');
      
      if (cached) {
        console.log(`[UnifiedProducts] Loaded ${cached.length} products from cache`);
        
        // Apply pending operations to cached data
        const processedData = applyPendingOperations(cached, pendingProductOps);
        setProducts(processedData);
        setLoading(false);
        
        // If online, fetch fresh data from server and merge
        if (isOnline) {
          try {
            const { data, error: fetchError } = await supabase
              .from('products')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (!fetchError && data) {
              const serverData = data.map(transformDbProduct);
              console.log(`[UnifiedProducts] Fetched ${serverData.length} products from server`);
              
              // Apply pending operations to server data for final merge
              const finalData = applyPendingOperations(serverData, pendingProductOps);
              
              console.log(`[UnifiedProducts] Final merged data: ${finalData.length} products`);
              setCache('products', serverData); // Cache clean server data
              setProducts(finalData); // Display data with pending changes
            }
          } catch (serverError) {
            console.error('[UnifiedProducts] Server fetch failed:', serverError);
            // Keep cached data on server error
          }
        }
        return;
      }

      // If no cache and online, fetch from server
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
          const finalData = applyPendingOperations(serverData, pendingProductOps);
          
          console.log(`[UnifiedProducts] Loaded ${serverData.length} products from server, ${finalData.length} with pending ops`);
          setCache('products', serverData);
          setProducts(finalData);
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
  }, [user, isOnline, getCache, setCache, pendingOps, applyPendingOperations]);

  // Create product
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newProduct: Product = {
      ...productData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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

        // Replace temp product with real one and update cache
        setProducts(prev => {
          const updated = prev.map(p => p.id === tempId ? transformedProduct : p);
          const cleanData = updated.filter(p => !p.id.startsWith('temp_'));
          setCache('products', cleanData);
          return updated;
        });

        console.log('[UnifiedProducts] Product created online:', transformedProduct.id);
        return transformedProduct;
      } catch (error) {
        console.error('[UnifiedProducts] Create failed, queuing for sync:', error);
        // Keep optimistic update and queue for sync
        addPendingOperation({
          type: 'product',
          operation: 'create',
          data: productData,
        });
        return newProduct;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'create',
        data: productData,
      });
      console.log('[UnifiedProducts] Product created offline and queued for sync');
      return newProduct;
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Update product
  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    if (!user) throw new Error('User not authenticated');

    const timestamp = new Date().toISOString();

    // Optimistically update UI immediately
    setProducts(prev => {
      const updated = prev.map(product => 
        product.id === productId 
          ? { ...product, ...updates, updatedAt: timestamp }
          : product
      );
      return updated;
    });

    console.log('[UnifiedProducts] Optimistically updated product:', productId, updates);

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
        
        // Update cache with latest data
        const updatedProducts = products.map(p => 
          p.id === productId ? { ...p, ...updates, updatedAt: timestamp } : p
        );
        const cleanData = updatedProducts.filter(p => !p.id.startsWith('temp_'));
        setCache('products', cleanData);
        
      } catch (error) {
        console.error('[UnifiedProducts] Update failed, queuing for sync:', error);
        // Keep optimistic update and queue for sync
        addPendingOperation({
          type: 'product',
          operation: 'update',
          data: { id: productId, updates },
        });
      }
    } else {
      // Queue for sync when online (including temp products)
      addPendingOperation({
        type: 'product',
        operation: 'update',
        data: { id: productId, updates },
      });
      console.log('[UnifiedProducts] Product update queued for sync:', productId);
    }
  }, [user, isOnline, setCache, addPendingOperation, products]);

  // Delete product
  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    // Optimistically update UI
    setProducts(prev => {
      const updated = prev.filter(product => product.id !== productId);
      const cleanData = updated.filter(p => !p.id.startsWith('temp_'));
      setCache('products', cleanData);
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
        console.error('[UnifiedProducts] Delete failed, queuing for sync:', error);
        // Keep optimistic update and queue for sync
        addPendingOperation({
          type: 'product',
          operation: 'delete',
          data: { id: productId },
        });
      }
    } else {
      // Queue for sync when online (excluding temp products)
      if (!productId.startsWith('temp_')) {
        addPendingOperation({
          type: 'product',
          operation: 'delete',
          data: { id: productId },
        });
        console.log('[UnifiedProducts] Product delete queued for sync:', productId);
      }
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Sync pending operations
  const handleSyncPendingOperations = useCallback(async () => {
    if (!isOnline || !user) return;

    setSyncStatus('syncing');
    try {
      await syncPendingOperations();
      // Don't reload immediately, let the sync events handle refresh
      setSyncStatus('success');
    } catch (error) {
      console.error('[UnifiedProducts] Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isOnline, user, syncPendingOperations]);

  // Load products on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Listen for sync events and network changes
  useEffect(() => {
    const handleReconnect = () => {
      console.log('[UnifiedProducts] Network reconnected, refreshing data');
      setTimeout(() => loadProducts(), 1000); // Delay to ensure stable connection
    };

    const handleSyncComplete = () => {
      console.log('[UnifiedProducts] Sync completed, refreshing data');
      setTimeout(() => loadProducts(), 500); // Short delay to let sync settle
    };

    const handleProductSync = () => {
      console.log('[UnifiedProducts] Product sync event received, refreshing data');
      setTimeout(() => loadProducts(), 500);
    };

    window.addEventListener('online', handleReconnect);
    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('data-synced', handleSyncComplete);
    window.addEventListener('product-synced', handleProductSync);
    window.addEventListener('sync-product-completed', handleProductSync);
    
    return () => {
      window.removeEventListener('online', handleReconnect);
      window.removeEventListener('sync-completed', handleSyncComplete);
      window.removeEventListener('data-synced', handleSyncComplete);
      window.removeEventListener('product-synced', handleProductSync);
      window.removeEventListener('sync-product-completed', handleProductSync);
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
