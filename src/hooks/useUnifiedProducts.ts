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
  const { getCache, setCache, addPendingOperation, pendingOps, clearPendingOperation } = useCacheManager();

  // Sync pending operations - similar to customers
  const syncPendingOperations = useCallback(async () => {
    if (!user || !isOnline) return;

    const productOps = pendingOps.filter(op => op.type === 'product');
    if (productOps.length === 0) return;

    console.log('[UnifiedProducts] Syncing', productOps.length, 'pending product operations');
    setSyncStatus('syncing');

    const syncedCreates: Array<{tempId: string, realProduct: Product}> = [];

    for (const operation of productOps) {
      try {
        let success = false;

        switch (operation.operation) {
          case 'create':
            console.log('[UnifiedProducts] Syncing create operation:', operation.data);
            const createData = {
              name: operation.data.name,
              category: operation.data.category,
              cost_price: operation.data.costPrice,
              selling_price: operation.data.sellingPrice,
              current_stock: operation.data.currentStock || 0,
              low_stock_threshold: operation.data.lowStockThreshold || 10,
              user_id: user.id,
            };

            const { data: createdData, error: createError } = await supabase
              .from('products')
              .insert([createData])
              .select()
              .single();

            success = !createError;
            if (createError) {
              console.error('[UnifiedProducts] Create sync failed:', createError);
            } else {
              console.log('[UnifiedProducts] Create synced successfully');
              const tempId = operation.data.id || `temp_${operation.data.name}_${operation.data.category}`;
              if (createdData) {
                syncedCreates.push({
                  tempId,
                  realProduct: transformDbProduct(createdData)
                });
              }
            }
            break;

          case 'update':
            console.log('[UnifiedProducts] Syncing update operation:', operation.data);
            const updates = operation.data.updates || operation.data;
            const dbUpdates: any = {};
            
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.category !== undefined) dbUpdates.category = updates.category;
            if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
            if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
            if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
            if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;

            const { error: updateError } = await supabase
              .from('products')
              .update(dbUpdates)
              .eq('id', operation.data.id)
              .eq('user_id', user.id);

            success = !updateError;
            if (updateError) {
              console.error('[UnifiedProducts] Update sync failed:', updateError);
            } else {
              console.log('[UnifiedProducts] Update synced successfully');
            }
            break;

          case 'delete':
            console.log('[UnifiedProducts] Syncing delete operation:', operation.data);
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('id', operation.data.id)
              .eq('user_id', user.id);

            success = !deleteError;
            if (deleteError) {
              console.error('[UnifiedProducts] Delete sync failed:', deleteError);
            } else {
              console.log('[UnifiedProducts] Delete synced successfully');
            }
            break;
        }

        if (success) {
          clearPendingOperation(operation.id);
        }
      } catch (error) {
        console.error('[UnifiedProducts] Error syncing operation:', operation.id, error);
      }
    }

    // Replace temp products with real ones from sync
    if (syncedCreates.length > 0) {
      setProducts(prev => {
        let updated = [...prev];
        
        for (const {tempId, realProduct} of syncedCreates) {
          // Remove temp product and add real one
          updated = updated.filter(p => !p.id.startsWith('temp_') || 
            !(p.name === realProduct.name && p.category === realProduct.category));
          updated.unshift(realProduct);
        }
        
        // Remove duplicates and sort
        const uniqueProducts = updated.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setCache('products', uniqueProducts);
        return uniqueProducts;
      });
    }

    setSyncStatus('success');
    
    // Refresh data after sync
    await loadProducts();
  }, [user, isOnline, pendingOps, clearPendingOperation, setCache]);

  // Load products with intelligent caching - similar to customers
  const loadProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Always try cache first for fast UI
      const cached = getCache<Product[]>('products');
      if (cached && Array.isArray(cached)) {
        console.log('[UnifiedProducts] Using cached data:', cached.length, 'products');
        setProducts(cached);
        setLoading(false);
        
        // If online, fetch fresh data in background and merge intelligently
        if (isOnline) {
          try {
            const { data, error: fetchError } = await supabase
              .from('products')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (!fetchError && data) {
              const serverData = data.map(transformDbProduct);
              
              // Get local products that might have unsynced changes
              const unsyncedLocal = cached.filter(product => 
                product.id.startsWith('temp_') && 
                !serverData.some(s => s.name === product.name && s.category === product.category)
              );
              
              // For each server product, check if we should preserve local changes
              const mergedData: Product[] = [...unsyncedLocal];
              
              for (const serverProduct of serverData) {
                const localProduct = cached.find(p => p.id === serverProduct.id);
                
                if (localProduct) {
                  // Always prefer local data if it's been recently updated
                  const localUpdateTime = new Date(localProduct.updatedAt || 0).getTime();
                  const serverUpdateTime = new Date(serverProduct.updatedAt || 0).getTime();
                  
                  // If local data is newer or equal, keep it; otherwise use server data
                  if (localUpdateTime >= serverUpdateTime) {
                    console.log('[UnifiedProducts] Preserving local changes for product:', localProduct.name);
                    mergedData.push(localProduct);
                  } else {
                    mergedData.push(serverProduct);
                  }
                } else {
                  // New product from server
                  mergedData.push(serverProduct);
                }
              }
              
              // Remove duplicates and sort
              const uniqueData = mergedData.filter((product, index, self) => 
                index === self.findIndex(p => p.id === product.id)
              ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              
              // Update cache and state if data changed
              if (JSON.stringify(uniqueData) !== JSON.stringify(cached)) {
                console.log('[UnifiedProducts] Background refresh: updating with merged data');
                setCache('products', uniqueData);
                setProducts(uniqueData);
              }
            }
          } catch (bgError) {
            console.error('[UnifiedProducts] Background refresh failed:', bgError);
          }
        }
        return;
      }

      // If no cache and online, fetch from server
      if (isOnline) {
        console.log('[UnifiedProducts] No cache, fetching from server');
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
          console.log('[UnifiedProducts] Fetched from server:', transformedData.length, 'products');
          setCache('products', transformedData);
          setProducts(transformedData);
        }
      } else {
        setError('No cached data available offline');
      }
    } catch (err) {
      setError('Failed to load products');
      console.error('[UnifiedProducts] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isOnline, getCache, setCache]);

  // Create product - similar to customers
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const newProduct: Product = {
      ...productData,
      id: `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update UI
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      setCache('products', updated);
      return updated;
    });

    if (isOnline) {
      try {
        const dbData = {
          name: productData.name,
          category: productData.category,
          cost_price: productData.costPrice,
          selling_price: productData.sellingPrice,
          current_stock: productData.currentStock || 0,
          low_stock_threshold: productData.lowStockThreshold || 10,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from('products')
          .insert([dbData])
          .select()
          .single();

        if (error) throw error;

        const transformedProduct = transformDbProduct(data);
        
        // Replace temp product with real one
        setProducts(prev => {
          const updated = prev.map(p => p.id === newProduct.id ? transformedProduct : p);
          setCache('products', updated);
          return updated;
        });

        return transformedProduct;
      } catch (error) {
        console.error('[UnifiedProducts] Create failed, queuing for sync:', error);
        addPendingOperation({
          type: 'product',
          operation: 'create',
          data: { ...productData, id: newProduct.id },
        });
        return newProduct;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'create',
        data: { ...productData, id: newProduct.id },
      });
      return newProduct;
    }
  }, [user, isOnline, addPendingOperation, setCache]);

  // Update product with immediate feedback - similar to customers
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (!user) {
      console.error('[UnifiedProducts] User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('[UnifiedProducts] updateProduct called:', {
      productId: id,
      updates,
      isOnline,
      currentProducts: products.length,
      userAuthenticated: !!user
    });

    // Find the current product
    const currentProduct = products.find(p => p.id === id);
    if (!currentProduct) {
      console.error('[UnifiedProducts] Product not found:', id);
      throw new Error(`Product ${id} not found`);
    }

    console.log('[UnifiedProducts] Current product before update:', {
      id: currentProduct.id,
      name: currentProduct.name,
      currentStock: currentProduct.currentStock,
      costPrice: currentProduct.costPrice
    });

    // Calculate new values
    const updatedProduct = { ...currentProduct, ...updates, updatedAt: new Date().toISOString() };
    console.log('[UnifiedProducts] New product values:', {
      id: updatedProduct.id,
      name: updatedProduct.name,
      currentStock: updatedProduct.currentStock,
      costPrice: updatedProduct.costPrice
    });

    // Immediately update local state for instant UI feedback
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? updatedProduct : p);
      // Also immediately update cache
      setCache('products', updated);
      console.log('[UnifiedProducts] Immediately updated product in UI and cache');
      return updated;
    });

    // Dispatch immediate event for UI updates
    window.dispatchEvent(new CustomEvent('product-updated-locally', {
      detail: { productId: id, product: updatedProduct }
    }));

    // Handle server sync
    if (isOnline) {
      try {
        // Prepare database update object
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
        if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
        if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
        if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;

        console.log('[UnifiedProducts] Updating database with:', dbUpdates);

        const { error } = await supabase
          .from('products')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('[UnifiedProducts] Database update failed:', error);
          throw error;
        }

        console.log('[UnifiedProducts] Product updated successfully in database');
        
        // Dispatch success event
        window.dispatchEvent(new CustomEvent('product-updated-server', {
          detail: { productId: id, product: updatedProduct }
        }));
        
      } catch (error) {
        console.error('[UnifiedProducts] Server update failed, queuing for sync:', error);
        
        // Add to pending operations for later sync
        addPendingOperation({
          type: 'product',
          operation: 'update',
          data: { id, updates },
        });
        
        console.log('[UnifiedProducts] Added pending operation for product update');
      }
    } else {
      console.log('[UnifiedProducts] Offline mode - queuing product update');
      
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'update',
        data: { id, updates },
      });
    }

    console.log('[UnifiedProducts] Product update completed');
    return updatedProduct;
  }, [user, isOnline, addPendingOperation, setCache, products]);

  // Delete product - similar to customers
  const deleteProduct = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const originalProduct = products.find(p => p.id === id);

    // Optimistically update UI
    setProducts(prev => {
      const filtered = prev.filter(p => p.id !== id);
      setCache('products', filtered);
      return filtered;
    });

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('[UnifiedProducts] Product deleted successfully');
      } catch (error) {
        console.error('[UnifiedProducts] Delete failed, queuing for sync:', error);
        
        // Rollback optimistic update
        if (originalProduct) {
          setProducts(prev => {
            const restored = [...prev, originalProduct].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setCache('products', restored);
            return restored;
          });
        }
        
        addPendingOperation({
          type: 'product',
          operation: 'delete',
          data: { id },
        });
        throw error;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'delete',
        data: { id },
      });
    }
  }, [user, isOnline, addPendingOperation, setCache, products]);

  // Load products on mount and when user changes
  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user?.id]);

  // Listen for various events to refresh product data - similar to customers
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('[UnifiedProducts] Data refresh event received');
      loadProducts();
    };

    const events = [
      'sync-completed',
      'data-synced', 
      'product-synced',
      'sale-completed',
      'checkout-completed'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleDataRefresh);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleDataRefresh);
      });
    };
  }, [loadProducts]);

  // Sync pending operations when coming online
  useEffect(() => {
    if (isOnline && pendingOps.filter(op => op.type === 'product').length > 0) {
      const timer = setTimeout(() => {
        syncPendingOperations();
      }, 1000); // Delay to ensure stable connection

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOps, syncPendingOperations]);

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
    syncPendingOperations,
    syncStatus,
  };
};
