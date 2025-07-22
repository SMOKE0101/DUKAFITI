
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
      if (cached) {
        console.log(`[UnifiedProducts] Loaded ${cached.length} products from cache`);
        setProducts(cached);
        setLoading(false);
        
        // If online, merge with server data
        if (isOnline) {
          try {
            const { data, error: fetchError } = await supabase
              .from('products')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (!fetchError && data) {
              const serverData = data.map(transformDbProduct);
              
              // Apply pending updates to server data
              const pendingProductOps = pendingOps.filter(op => op.type === 'product');
              let mergedData = [...serverData];
              
              // Apply pending updates
              pendingProductOps.forEach(op => {
                if (op.operation === 'update') {
                  const index = mergedData.findIndex(p => p.id === op.data.id);
                  if (index !== -1) {
                    mergedData[index] = { ...mergedData[index], ...op.data.updates };
                  }
                } else if (op.operation === 'create') {
                  // Check if temp product exists and replace with actual data
                  const tempIndex = mergedData.findIndex(p => p.id.startsWith('temp_'));
                  if (tempIndex === -1) {
                    mergedData.unshift({
                      ...op.data,
                      id: `temp_${Date.now()}`,
                    });
                  }
                }
              });
              
              console.log(`[UnifiedProducts] Merged with ${serverData.length} server products`);
              setCache('products', mergedData);
              setProducts(mergedData);
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
          const transformedData = (data || []).map(transformDbProduct);
          console.log(`[UnifiedProducts] Loaded ${transformedData.length} products from server`);
          setCache('products', transformedData);
          setProducts(transformedData);
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
  }, [user, isOnline, getCache, setCache, pendingOps]);

  // Create product
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const tempId = `temp_${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update UI and cache
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      setCache('products', updated);
      return updated;
    });

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

        // Replace temp product with real one
        setProducts(prev => {
          const updated = prev.map(p => p.id === tempId ? transformedProduct : p);
          setCache('products', updated);
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

    // Optimistically update UI and cache
    setProducts(prev => {
      const updated = prev.map(product => 
        product.id === productId 
          ? { ...product, ...updates, updatedAt: new Date().toISOString() }
          : product
      );
      setCache('products', updated);
      return updated;
    });

    if (isOnline) {
      try {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
        if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
        if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
        if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('[UnifiedProducts] Product updated online:', productId);
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
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'update',
        data: { id: productId, updates },
      });
      console.log('[UnifiedProducts] Product update queued for sync:', productId);
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Delete product
  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    // Optimistically update UI and cache
    setProducts(prev => {
      const updated = prev.filter(product => product.id !== productId);
      setCache('products', updated);
      return updated;
    });

    if (isOnline) {
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
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'delete',
        data: { id: productId },
      });
      console.log('[UnifiedProducts] Product delete queued for sync:', productId);
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Sync pending operations
  const handleSyncPendingOperations = useCallback(async () => {
    if (!isOnline || !user) return;

    setSyncStatus('syncing');
    try {
      await syncPendingOperations();
      await loadProducts(); // Refresh data after sync
      setSyncStatus('success');
    } catch (error) {
      console.error('[UnifiedProducts] Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isOnline, user, syncPendingOperations, loadProducts]);

  // Load products on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Listen for sync events and network changes
  useEffect(() => {
    const handleReconnect = () => {
      console.log('[UnifiedProducts] Network reconnected, refreshing data');
      loadProducts();
    };

    const handleSyncComplete = () => {
      console.log('[UnifiedProducts] Sync completed, refreshing data');
      loadProducts();
    };

    const handleProductSync = () => {
      console.log('[UnifiedProducts] Product sync event received, refreshing data');
      loadProducts();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('data-synced', handleSyncComplete);
    window.addEventListener('product-synced', handleProductSync);
    window.addEventListener('sync-product-completed', handleProductSync);
    
    return () => {
      window.removeEventListener('network-reconnected', handleReconnect);
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
