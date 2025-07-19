
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { useToast } from './use-toast';
import { Product } from '../types';

export const useUnifiedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, addPendingOperation, pendingOps, clearPendingOperation } = useCacheManager();
  const { toast } = useToast();

  // Transform functions for field mapping
  const transformToLocal = (product: any): Product => {
    if (!product) return {
      id: '',
      name: '',
      category: '',
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      lowStockThreshold: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      id: product.id || '',
      name: product.name || '',
      category: product.category || '',
      costPrice: Number(product.cost_price || product.costPrice || 0),
      sellingPrice: Number(product.selling_price || product.sellingPrice || 0),
      currentStock: Number(product.current_stock || product.currentStock || 0),
      lowStockThreshold: Number(product.low_stock_threshold || product.lowStockThreshold || 10),
      createdAt: product.created_at || product.createdAt || new Date().toISOString(),
      updatedAt: product.updated_at || product.updatedAt || new Date().toISOString(),
    };
  };

  const transformFromLocal = (product: Product): any => ({
    id: product.id,
    name: product.name,
    category: product.category,
    cost_price: Number(product.costPrice || 0),
    selling_price: Number(product.sellingPrice || 0),
    current_stock: Number(product.currentStock || 0),
    low_stock_threshold: Number(product.lowStockThreshold || 10),
    user_id: user?.id,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  });

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
      // Try cache first
      const cached = getCache<Product[]>('products');
      if (cached) {
        setProducts(cached);
        setLoading(false);
        
        // If online, refresh in background
        if (isOnline) {
          const { data, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!fetchError && data) {
            const formattedData = data.map(transformToLocal);
            setCache('products', formattedData);
            setProducts(formattedData);
          }
        }
        return;
      }

      // If no cache and online, fetch from server
      if (isOnline) {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError('Failed to load products');
          console.error('[UnifiedProducts] Fetch error:', fetchError);
        } else {
          const formattedData = (data || []).map(transformToLocal);
          setCache('products', formattedData);
          setProducts(formattedData);
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
  }, [user, isOnline, getCache, setCache]);

  // Execute a single sync operation
  const executeSyncOperation = useCallback(async (operation: any): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('[UnifiedProducts] Executing sync operation:', operation);
      
      switch (operation.operation) {
        case 'create': {
          const productData = operation.data;
          const { data, error } = await supabase
            .from('products')
            .insert({
              name: productData.name,
              category: productData.category,
              cost_price: productData.costPrice,
              selling_price: productData.sellingPrice,
              current_stock: productData.currentStock || 0,
              low_stock_threshold: productData.lowStockThreshold || 10,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;
          console.log('[UnifiedProducts] Created product:', data);
          return true;
        }

        case 'update': {
          const { id, updates } = operation.data;
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
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          console.log('[UnifiedProducts] Updated product:', id);
          return true;
        }

        case 'delete': {
          const { id } = operation.data;
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          console.log('[UnifiedProducts] Deleted product:', id);
          return true;
        }

        default:
          console.warn('[UnifiedProducts] Unknown operation:', operation.operation);
          return false;
      }
    } catch (error) {
      console.error('[UnifiedProducts] Sync operation failed:', error);
      return false;
    }
  }, [user]);

  // Sync all pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || !user) return;

    const productOps = pendingOps.filter(op => op.type === 'product');
    if (productOps.length === 0) return;

    console.log(`[UnifiedProducts] Syncing ${productOps.length} pending operations`);

    for (const operation of productOps) {
      try {
        const success = await executeSyncOperation(operation);
        if (success) {
          clearPendingOperation(operation.id);
          console.log('[UnifiedProducts] Successfully synced operation:', operation.id);
        }
      } catch (error) {
        console.error('[UnifiedProducts] Failed to sync operation:', operation.id, error);
      }
    }

    // Refresh products after sync
    await loadProducts();
    
    const syncedCount = productOps.length - pendingOps.filter(op => op.type === 'product').length;
    if (syncedCount > 0) {
      toast({
        title: "Sync Complete",
        description: `${syncedCount} product operations synced successfully`,
        duration: 3000,
      });
    }
  }, [isOnline, user, pendingOps, executeSyncOperation, clearPendingOperation, loadProducts, toast]);

  // Create product
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const newProduct: Product = {
      ...productData,
      id: `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update UI
    setProducts(prev => [newProduct, ...prev]);

    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: productData.name,
            category: productData.category,
            cost_price: productData.costPrice,
            selling_price: productData.sellingPrice,
            current_stock: productData.currentStock,
            low_stock_threshold: productData.lowStockThreshold,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        const formattedProduct = transformToLocal(data);
        
        // Replace temp product with real one
        setProducts(prev => 
          prev.map(p => p.id === newProduct.id ? formattedProduct : p)
        );

        // Update cache
        await loadProducts();
        
        toast({
          title: "Product Created",
          description: `${productData.name} has been added to your inventory.`,
        });

        return formattedProduct;
      } catch (error) {
        // Revert optimistic update and queue for sync
        setProducts(prev => prev.filter(p => p.id !== newProduct.id));
        addPendingOperation({
          id: `create_${Date.now()}`,
          type: 'product',
          operation: 'create',
          data: productData,
        });
        console.error('[UnifiedProducts] Create failed, queued for sync:', error);
        
        toast({
          title: "Error",
          description: "Failed to create product. Will retry when online.",
          variant: "destructive",
        });
        
        return newProduct;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        id: `create_${Date.now()}`,
        type: 'product',
        operation: 'create',
        data: productData,
      });
      
      toast({
        title: "Offline Mode",
        description: "Product will be created when connection is restored.",
      });
      
      return newProduct;
    }
  }, [user, isOnline, addPendingOperation, loadProducts, toast]);

  // Update product
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (!user) throw new Error('User not authenticated');

    // Optimistically update UI
    const originalProduct = products.find(p => p.id === id);
    setProducts(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );

    if (isOnline) {
      try {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
        if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
        if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
        if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update cache
        await loadProducts();

        toast({
          title: "Product Updated",
          description: "Product has been updated successfully.",
        });
      } catch (error) {
        // Revert optimistic update and queue for sync
        if (originalProduct) {
          setProducts(prev => 
            prev.map(p => p.id === id ? originalProduct : p)
          );
        }
        
        addPendingOperation({
          id: `update_${id}_${Date.now()}`,
          type: 'product',
          operation: 'update',
          data: { id, updates },
        });
        console.error('[UnifiedProducts] Update failed, queued for sync:', error);
        
        toast({
          title: "Error",
          description: "Failed to update product. Will retry when online.",
          variant: "destructive",
        });
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        id: `update_${id}_${Date.now()}`,
        type: 'product',
        operation: 'update',
        data: { id, updates },
      });
      
      toast({
        title: "Offline Mode",
        description: "Changes will sync when connection is restored.",
      });
    }
  }, [user, isOnline, products, addPendingOperation, loadProducts, toast]);

  // Delete product
  const deleteProduct = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    // Find the product to delete for optimistic UI update
    const productToDelete = products.find(p => p.id === id);
    
    // Optimistically remove from UI
    setProducts(prev => prev.filter(p => p.id !== id));

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update cache
        await loadProducts();

        toast({
          title: "Product Deleted",
          description: `${productToDelete?.name || 'Product'} has been removed from your inventory.`,
        });
      } catch (error) {
        // Revert optimistic update
        if (productToDelete) {
          setProducts(prev => [...prev, productToDelete]);
        }
        
        addPendingOperation({
          id: `delete_${id}_${Date.now()}`,
          type: 'product',
          operation: 'delete',
          data: { id },
        });
        console.error('[UnifiedProducts] Delete failed, queued for sync:', error);
        
        toast({
          title: "Error",
          description: "Failed to delete product. Will retry when online.",
          variant: "destructive",
        });
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        id: `delete_${id}_${Date.now()}`,
        type: 'product',
        operation: 'delete',
        data: { id },
      });
      
      toast({
        title: "Offline Mode",
        description: "Product will be deleted when connection is restored.",
      });
    }
  }, [user, isOnline, products, addPendingOperation, loadProducts, toast]);

  // Load products on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Listen for network reconnection and sync
  useEffect(() => {
    const handleReconnect = async () => {
      console.log('[UnifiedProducts] Network reconnected, syncing...');
      await syncPendingOperations();
      await loadProducts();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    return () => window.removeEventListener('network-reconnected', handleReconnect);
  }, [syncPendingOperations, loadProducts]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && user) {
      const timer = setTimeout(() => {
        syncPendingOperations();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, user, syncPendingOperations]);

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
  };
};
