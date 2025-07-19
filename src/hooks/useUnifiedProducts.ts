import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Use refs to prevent infinite loops
  const lastSyncRef = useRef(0);
  const isSyncingRef = useRef(false);

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

  // Load products from cache or server
  const loadProducts = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    console.log('[UnifiedProducts] Loading products, forceRefresh:', forceRefresh);
    
    if (!forceRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      // Try cache first (only if not forcing refresh)
      if (!forceRefresh) {
        const cached = getCache<Product[]>('products');
        if (cached && cached.length > 0) {
          console.log('[UnifiedProducts] Using cached products:', cached.length);
          setProducts(cached);
          setLoading(false);
          
          // If online, refresh in background
          if (isOnline) {
            setTimeout(() => loadProducts(true), 100);
          }
          return;
        }
      }

      // Fetch from server if online
      if (isOnline) {
        console.log('[UnifiedProducts] Fetching from server');
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[UnifiedProducts] Fetch error:', fetchError);
          setError('Failed to load products');
        } else {
          const formattedData = (data || []).map(transformToLocal);
          console.log('[UnifiedProducts] Fetched products:', formattedData.length);
          setCache('products', formattedData);
          setProducts(formattedData);
        }
      } else if (!getCache<Product[]>('products')) {
        setError('No cached data available offline');
      }
    } catch (err) {
      console.error('[UnifiedProducts] Load error:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isOnline, getCache, setCache]);

  // Execute a single sync operation
  const executeSyncOperation = useCallback(async (operation: any): Promise<boolean> => {
    if (!user || !isOnline) return false;

    try {
      console.log('[UnifiedProducts] Executing sync operation:', operation);
      
      switch (operation.operation) {
        case 'create': {
          const productData = operation.data;
          
          // Check if product already exists to prevent duplicates
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('name', productData.name)
            .eq('user_id', user.id)
            .single();

          if (existingProduct) {
            console.log('[UnifiedProducts] Product already exists, skipping create');
            return true;
          }

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
          console.log('[UnifiedProducts] Created product:', data.id);
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
  }, [user, isOnline]);

  // Sync all pending operations with deduplication
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || !user || isSyncingRef.current) return;

    const productOps = pendingOps.filter(op => op.type === 'product');
    if (productOps.length === 0) return;

    console.log(`[UnifiedProducts] Syncing ${productOps.length} pending operations`);
    isSyncingRef.current = true;

    try {
      // Deduplicate operations by keeping the latest for each product
      const deduplicatedOps = new Map();
      
      productOps.forEach(op => {
        const key = `${op.operation}_${op.data.id || op.data.name}`;
        if (!deduplicatedOps.has(key) || op.id > deduplicatedOps.get(key).id) {
          deduplicatedOps.set(key, op);
        }
      });

      const opsToSync = Array.from(deduplicatedOps.values());
      console.log(`[UnifiedProducts] After deduplication: ${opsToSync.length} operations`);

      let syncedCount = 0;
      for (const operation of opsToSync) {
        try {
          const success = await executeSyncOperation(operation);
          if (success) {
            clearPendingOperation(operation.id);
            syncedCount++;
            console.log('[UnifiedProducts] Successfully synced operation:', operation.id);
          }
        } catch (error) {
          console.error('[UnifiedProducts] Failed to sync operation:', operation.id, error);
        }
      }

      // Clear any remaining duplicate operations
      productOps.forEach(op => {
        if (!opsToSync.find(syncOp => syncOp.id === op.id)) {
          clearPendingOperation(op.id);
        }
      });

      // Refresh products after sync to get the latest state
      if (syncedCount > 0) {
        console.log('[UnifiedProducts] Refreshing products after successful sync');
        await loadProducts(true);
        
        toast({
          title: "Sync Complete",
          description: `${syncedCount} product operations synced successfully`,
          duration: 3000,
        });
      }
    } finally {
      isSyncingRef.current = false;
      lastSyncRef.current = Date.now();
    }
  }, [isOnline, user, pendingOps, executeSyncOperation, clearPendingOperation, loadProducts, toast]);

  // Create product
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const newProduct: Product = {
      ...productData,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('[UnifiedProducts] Creating product:', newProduct.name);

    // Optimistically update UI
    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    setCache('products', updatedProducts);

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
        const finalProducts = products.map(p => p.id === newProduct.id ? formattedProduct : p);
        setProducts(finalProducts);
        setCache('products', finalProducts);
        
        toast({
          title: "Product Created",
          description: `${productData.name} has been added to your inventory.`,
        });

        return formattedProduct;
      } catch (error) {
        // Revert optimistic update and queue for sync
        const revertedProducts = products.filter(p => p.id !== newProduct.id);
        setProducts(revertedProducts);
        setCache('products', revertedProducts);
        
        addPendingOperation({
          type: 'product',
          operation: 'create',
          data: productData,
        });
        console.error('[UnifiedProducts] Create failed, queued for sync:', error);
        
        toast({
          title: "Offline Mode",
          description: "Product will be created when connection is restored.",
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
      
      toast({
        title: "Offline Mode",
        description: "Product will be created when connection is restored.",
      });
      
      return newProduct;
    }
  }, [user, isOnline, products, addPendingOperation, setCache, toast]);

  // Update product
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (!user) throw new Error('User not authenticated');

    console.log('[UnifiedProducts] Updating product:', id, updates);

    // Find the original product
    const originalProduct = products.find(p => p.id === id);
    if (!originalProduct) {
      console.error('[UnifiedProducts] Product not found for update:', id);
      return;
    }

    // Optimistically update UI and cache
    const updatedProduct = { ...originalProduct, ...updates, updatedAt: new Date().toISOString() };
    const updatedProducts = products.map(p => p.id === id ? updatedProduct : p);
    setProducts(updatedProducts);
    setCache('products', updatedProducts);

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

        toast({
          title: "Product Updated",
          description: "Product has been updated successfully.",
        });
      } catch (error) {
        // Revert optimistic update and queue for sync
        const revertedProducts = products.map(p => p.id === id ? originalProduct : p);
        setProducts(revertedProducts);
        setCache('products', revertedProducts);
        
        addPendingOperation({
          type: 'product',
          operation: 'update',
          data: { id, updates },
        });
        console.error('[UnifiedProducts] Update failed, queued for sync:', error);
        
        toast({
          title: "Offline Mode",
          description: "Changes will sync when connection is restored.",
        });
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'update',
        data: { id, updates },
      });
      
      toast({
        title: "Offline Mode",
        description: "Changes will sync when connection is restored.",
      });
    }
  }, [user, isOnline, products, addPendingOperation, setCache, toast]);

  // Delete product - Fixed to properly handle offline/online scenarios
  const deleteProduct = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('[UnifiedProducts] Deleting product:', id);

    // Find the product to delete for optimistic UI update
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) {
      console.error('[UnifiedProducts] Product not found for deletion:', id);
      return;
    }
    
    // Optimistically remove from UI and cache
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    setCache('products', updatedProducts);

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Product Deleted",
          description: `${productToDelete.name} has been removed from your inventory.`,
        });
      } catch (error) {
        // Revert optimistic update
        const revertedProducts = [...products, productToDelete];
        setProducts(revertedProducts);
        setCache('products', revertedProducts);
        
        addPendingOperation({
          type: 'product',
          operation: 'delete',
          data: { id },
        });
        console.error('[UnifiedProducts] Delete failed, queued for sync:', error);
        
        toast({
          title: "Offline Mode",
          description: "Product will be deleted when connection is restored.",
        });
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'delete',
        data: { id },
      });
      
      toast({
        title: "Offline Mode",
        description: "Product will be deleted when connection is restored.",
      });
    }
  }, [user, isOnline, products, addPendingOperation, setCache, toast]);

  // Load products on mount
  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  // Auto-sync when coming online (with throttling)
  useEffect(() => {
    if (isOnline && user && !isSyncingRef.current) {
      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      if (timeSinceLastSync > 2000) { // Throttle to prevent excessive syncing
        const timer = setTimeout(() => {
          syncPendingOperations();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, user?.id]); // Remove syncPendingOperations from deps to prevent infinite loops

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: () => loadProducts(true),
    isOnline,
    pendingOperations: pendingOps.filter(op => op.type === 'product').length,
    syncPendingOperations,
  };
};
