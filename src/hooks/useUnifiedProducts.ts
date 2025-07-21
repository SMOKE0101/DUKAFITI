
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { useToast } from './use-toast';
import { useProductSync } from './products/useProductSync';
import { Product } from '../types';

export const useUnifiedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, addPendingOperation } = useCacheManager();
  const { toast } = useToast();
  const { syncPendingOperations, pendingProductOps } = useProductSync();

  const isLoadingRef = useRef(false);

  // Transform functions for field mapping
  const transformToLocal = useCallback((product: any): Product => {
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
  }, []);

  // Load products from cache or server
  const loadProducts = useCallback(async (forceRefresh = false) => {
    if (!user || isLoadingRef.current) {
      if (!user) {
        setProducts([]);
        setLoading(false);
      }
      return;
    }

    console.log('[UnifiedProducts] Loading products, forceRefresh:', forceRefresh);
    
    isLoadingRef.current = true;
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
            setTimeout(() => {
              isLoadingRef.current = false;
              loadProducts(true);
            }, 100);
            return;
          }
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
      isLoadingRef.current = false;
    }
  }, [user?.id, isOnline, getCache, setCache, transformToLocal]);

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

    // Check for existing product with same name to prevent duplicates
    const existingProduct = products.find(p => 
      p.name.toLowerCase() === productData.name.toLowerCase()
    );

    if (existingProduct) {
      toast({
        title: "Product Already Exists",
        description: `A product named "${productData.name}" already exists.`,
        variant: "destructive",
      });
      throw new Error('Product with this name already exists');
    }

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
  }, [user, isOnline, products, addPendingOperation, setCache, toast, transformToLocal]);

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

  // Delete product
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
  }, [user?.id]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && user && pendingProductOps.length > 0) {
      const timer = setTimeout(() => {
        syncPendingOperations();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, user?.id, pendingProductOps.length]);

  // Listen for sync events
  useEffect(() => {
    const handleSyncComplete = () => {
      console.log('[UnifiedProducts] Sync completed, refreshing data');
      loadProducts(true);
    };

    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('products-synced', handleSyncComplete);
    
    return () => {
      window.removeEventListener('sync-completed', handleSyncComplete);
      window.removeEventListener('products-synced', handleSyncComplete);
    };
  }, [loadProducts]);

  // Set up real-time subscription for immediate updates
  useEffect(() => {
    if (!user || !isOnline) return;

    console.log('[UnifiedProducts] Setting up real-time subscription');
    
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[UnifiedProducts] Real-time update received:', payload);
        
        // Refresh products when changes occur
        setTimeout(() => {
          loadProducts(true);
        }, 100);
      })
      .subscribe();

    return () => {
      console.log('[UnifiedProducts] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isOnline, loadProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: () => loadProducts(true),
    isOnline,
    pendingOperations: pendingProductOps.length,
    syncPendingOperations,
  };
};
