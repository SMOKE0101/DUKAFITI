
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

  // Enhanced merge function with proper optimistic update handling
  const mergeWithPendingOperations = useCallback((serverData: Product[], pendingProductOps: any[]) => {
    console.log('[UnifiedProducts] 🔄 Starting merge with proper optimistic handling');
    console.log('[UnifiedProducts] 📊 Server data:', serverData.length, 'items');
    console.log('[UnifiedProducts] 📋 Pending operations:', pendingProductOps.length);
    
    // Create a map of server products for quick lookup
    const serverProductMap = new Map(serverData.map(p => [p.id, { ...p }]));
    let mergedData = [...serverData];
    
    // Sort pending operations chronologically
    const sortedOps = pendingProductOps.sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    
    console.log('[UnifiedProducts] 🔧 Processing operations in chronological order...');
    
    for (const op of sortedOps) {
      console.log(`[UnifiedProducts] ⚡ Processing: ${op.operation} - ${op.data?.name || op.data?.id || 'unknown'}`);
      
      if (op.operation === 'create') {
        // For creates, only add if not already in server data
        const existsInServer = mergedData.find(p => 
          (p.name === op.data.name && p.category === op.data.category) ||
          (p.id === op.data.id && !op.data.id.startsWith('temp_'))
        );
        
        if (!existsInServer) {
          const tempProduct: Product = {
            ...op.data,
            id: op.data.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            createdAt: op.timestamp || new Date().toISOString(),
            updatedAt: op.timestamp || new Date().toISOString(),
          };
          
          mergedData.unshift(tempProduct);
          console.log(`[UnifiedProducts] ➕ Added offline create: ${tempProduct.name}`);
        } else {
          console.log(`[UnifiedProducts] ⚠️ Create already exists in server: ${op.data.name}`);
        }
        
      } else if (op.operation === 'update') {
        const productId = op.data.id;
        const updates = op.data.updates || op.data;
        
        // Find the product to update
        const index = mergedData.findIndex(p => p.id === productId);
        if (index !== -1) {
          const currentProduct = mergedData[index];
          
          // Apply updates but preserve server data integrity
          const updatedProduct = { 
            ...currentProduct,
            ...updates,
            id: currentProduct.id, // Always preserve the real ID
            updatedAt: op.timestamp || new Date().toISOString()
          };
          
          mergedData[index] = updatedProduct;
          console.log(`[UnifiedProducts] 📝 Applied update to: ${updatedProduct.name}`, updates);
        } else {
          console.warn(`[UnifiedProducts] ❌ Product not found for update: ${productId}`);
        }
        
      } else if (op.operation === 'delete') {
        const productId = op.data.id;
        
        // Only remove if it's not a temp product that doesn't exist on server
        if (!productId.startsWith('temp_') || mergedData.find(p => p.id === productId)) {
          mergedData = mergedData.filter(p => p.id !== productId);
          console.log(`[UnifiedProducts] 🗑️ Applied delete: ${productId}`);
        }
      }
    }
    
    console.log(`[UnifiedProducts] ✅ Merge complete: ${mergedData.length} products`);
    return mergedData;
  }, []);

  // Load products with proper state management
  const loadProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[UnifiedProducts] 🚀 Loading products...');
      
      const cached = getCache<Product[]>('products');
      const pendingProductOps = pendingOps.filter(op => op.type === 'product');
      
      // Always start with cached data for immediate UI response
      if (cached && cached.length > 0) {
        const cachedWithPending = mergeWithPendingOperations(cached, pendingProductOps);
        setProducts(cachedWithPending);
        console.log('[UnifiedProducts] 🎯 Set initial state from cache+pending:', cachedWithPending.length);
      }
      
      // If online, fetch fresh data and merge properly
      if (isOnline) {
        try {
          console.log('[UnifiedProducts] 🌐 Fetching fresh server data...');
          const { data, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!fetchError && data) {
            const serverData = data.map(transformDbProduct);
            console.log(`[UnifiedProducts] 📡 Server returned: ${serverData.length} products`);
            
            // Update cache with clean server data
            setCache('products', serverData);
            
            // Get current pending operations (might have changed)
            const currentPendingOps = pendingOps.filter(op => op.type === 'product');
            
            // Merge server data with pending operations
            const finalMergedData = mergeWithPendingOperations(serverData, currentPendingOps);
            
            // Update UI with merged data
            setProducts(finalMergedData);
            console.log(`[UnifiedProducts] 🔄 Updated UI with ${finalMergedData.length} merged products`);
            
          } else if (fetchError) {
            console.error('[UnifiedProducts] ❌ Server fetch error:', fetchError);
          }
        } catch (serverError) {
          console.error('[UnifiedProducts] ❌ Server error:', serverError);
        }
      } else {
        console.log('[UnifiedProducts] 📴 Offline mode - using cached data');
        if (!cached || cached.length === 0) {
          setError('No data available offline');
        }
      }
      
    } catch (err) {
      console.error('[UnifiedProducts] ❌ Load error:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, getCache, setCache, pendingOps, mergeWithPendingOperations]);

  // Create product with proper optimistic updates
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = new Date().toISOString();
    
    console.log('[UnifiedProducts] ➕ Creating product:', productData.name);

    // Create optimistic product
    const optimisticProduct: Product = {
      ...productData,
      id: tempId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Add to pending operations FIRST
    addPendingOperation({
      type: 'product',
      operation: 'create',
      data: { ...productData, id: tempId },
    });

    // Apply optimistic update
    setProducts(prev => [optimisticProduct, ...prev]);

    // Try immediate sync if online
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

        if (!error && data) {
          const realProduct = transformDbProduct(data);
          console.log('[UnifiedProducts] ✅ Product created online:', realProduct.id);

          // Replace temp product with real one
          setProducts(prev => prev.map(p => 
            p.id === tempId ? realProduct : p
          ));

          // Update cache
          const cached = getCache<Product[]>('products') || [];
          setCache('products', [realProduct, ...cached]);
          
          return realProduct;
        }
      } catch (error) {
        console.error('[UnifiedProducts] ❌ Create error:', error);
      }
    }

    return optimisticProduct;
  }, [user, isOnline, setCache, getCache, addPendingOperation]);

  // Update product with proper optimistic updates
  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    if (!user) throw new Error('User not authenticated');

    const timestamp = new Date().toISOString();
    console.log('[UnifiedProducts] 📝 Updating product:', productId, updates);

    // Add to pending operations
    addPendingOperation({
      type: 'product',
      operation: 'update',
      data: { id: productId, updates },
    });

    // Apply optimistic update
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, ...updates, updatedAt: timestamp }
        : product
    ));

    // Update cache for real products
    if (!productId.startsWith('temp_')) {
      const cached = getCache<Product[]>('products') || [];
      const updatedCache = cached.map(product =>
        product.id === productId
          ? { ...product, ...updates, updatedAt: timestamp }
          : product
      );
      setCache('products', updatedCache);
    }

    // Try immediate sync if online
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

        if (!error) {
          console.log('[UnifiedProducts] ✅ Product updated online immediately');
        }
      } catch (error) {
        console.error('[UnifiedProducts] ❌ Update error:', error);
      }
    }
  }, [user, isOnline, setCache, getCache, addPendingOperation]);

  // Delete product with proper optimistic updates
  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('[UnifiedProducts] 🗑️ Deleting product:', productId);

    // Add to pending operations for real products
    if (!productId.startsWith('temp_')) {
      addPendingOperation({
        type: 'product',
        operation: 'delete',
        data: { id: productId },
      });
    }

    // Apply optimistic delete
    setProducts(prev => prev.filter(product => product.id !== productId));

    // Update cache for real products
    if (!productId.startsWith('temp_')) {
      const cached = getCache<Product[]>('products') || [];
      const updatedCache = cached.filter(product => product.id !== productId);
      setCache('products', updatedCache);
    }

    // Try immediate sync if online
    if (isOnline && !productId.startsWith('temp_')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', user.id);

        if (!error) {
          console.log('[UnifiedProducts] ✅ Product deleted online immediately');
        }
      } catch (error) {
        console.error('[UnifiedProducts] ❌ Delete error:', error);
      }
    }
  }, [user, isOnline, setCache, getCache, addPendingOperation]);

  // Enhanced sync function
  const handleSyncPendingOperations = useCallback(async () => {
    if (!isOnline || !user) return;

    setSyncStatus('syncing');
    try {
      console.log('[UnifiedProducts] 🔄 Starting sync...');
      await syncPendingOperations();
      
      // Reload data after sync to ensure consistency
      setTimeout(() => {
        loadProducts();
        setSyncStatus('success');
      }, 500);
    } catch (error) {
      console.error('[UnifiedProducts] ❌ Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isOnline, user, syncPendingOperations, loadProducts]);

  // Load products on mount and dependencies
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Enhanced event listeners
  useEffect(() => {
    let reloadTimeout: NodeJS.Timeout;
    
    const handleNetworkChange = () => {
      console.log('[UnifiedProducts] 🌐 Network status changed to online');
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => loadProducts(), 1000);
    };

    const handleSyncComplete = () => {
      console.log('[UnifiedProducts] ✅ Sync completed, reloading products');
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => loadProducts(), 500);
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('data-synced', handleSyncComplete);
    window.addEventListener('product-synced', handleSyncComplete);
    
    return () => {
      clearTimeout(reloadTimeout);
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
