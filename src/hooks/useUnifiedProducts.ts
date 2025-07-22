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

  // Enhanced merge function that ALWAYS preserves offline changes
  const mergeWithPendingOperations = useCallback((serverData: Product[], pendingProductOps: any[]) => {
    console.log('[UnifiedProducts] 🔄 Starting comprehensive merge');
    console.log('[UnifiedProducts] 📊 Server data:', serverData.length, 'items');
    console.log('[UnifiedProducts] 📋 Pending operations:', pendingProductOps.length);
    
    // Start with server data as the foundation
    let mergedData = [...serverData];
    const productMap = new Map(mergedData.map(p => [p.id, { ...p }]));
    
    // Sort pending operations chronologically to apply in correct order
    const sortedOps = pendingProductOps.sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    
    console.log('[UnifiedProducts] 🔧 Processing operations in chronological order...');
    
    for (const op of sortedOps) {
      const opId = op.id || `${op.type}_${op.operation}_${Date.now()}`;
      console.log(`[UnifiedProducts] ⚡ Processing: ${op.operation} - ${op.data?.name || op.data?.id || 'unknown'}`);
      
      if (op.operation === 'create') {
        // For creates, check if the product already exists by name+category or temp ID
        const existsInServer = mergedData.find(p => 
          (p.name === op.data.name && p.category === op.data.category) ||
          p.id === op.data.id
        );
        
        if (!existsInServer) {
          const tempProduct: Product = {
            ...op.data,
            id: op.data.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            createdAt: op.timestamp || new Date().toISOString(),
            updatedAt: op.timestamp || new Date().toISOString(),
          };
          
          mergedData.unshift(tempProduct); // Add to beginning for newest-first order
          productMap.set(tempProduct.id, tempProduct);
          console.log(`[UnifiedProducts] ➕ Added offline create: ${tempProduct.name}`);
        } else {
          console.log(`[UnifiedProducts] ⚠️  Create already exists: ${op.data.name}`);
        }
        
      } else if (op.operation === 'update') {
        const productId = op.data.id;
        const updates = op.data.updates || op.data;
        
        // Find the product to update (either by real ID or temp ID)
        let targetProduct = productMap.get(productId);
        if (!targetProduct) {
          targetProduct = mergedData.find(p => p.id === productId);
        }
        
        if (targetProduct) {
          // Apply the updates, preserving all fields
          const updatedProduct = { 
            ...targetProduct,
            ...updates,
            id: targetProduct.id, // Preserve original ID
            updatedAt: op.timestamp || new Date().toISOString()
          };
          
          // Update in both array and map
          const index = mergedData.findIndex(p => p.id === productId);
          if (index !== -1) {
            mergedData[index] = updatedProduct;
            productMap.set(productId, updatedProduct);
            console.log(`[UnifiedProducts] 📝 Applied update to: ${updatedProduct.name}`, updates);
          }
        } else {
          console.warn(`[UnifiedProducts] ❌ Product not found for update: ${productId}`);
        }
        
      } else if (op.operation === 'delete') {
        const productId = op.data.id;
        
        // Remove from both array and map
        mergedData = mergedData.filter(p => p.id !== productId);
        productMap.delete(productId);
        console.log(`[UnifiedProducts] 🗑️  Applied delete: ${productId}`);
      }
    }
    
    console.log(`[UnifiedProducts] ✅ Merge complete: ${mergedData.length} products (${serverData.length} server + pending changes)`);
    return mergedData;
  }, []);

  // Load products with bulletproof offline/online handling
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
      
      console.log('[UnifiedProducts] 💾 Cache available:', !!cached, cached?.length || 0, 'items');
      console.log('[UnifiedProducts] ⏳ Pending operations:', pendingProductOps.length);
      
      // ALWAYS start with cached data + pending operations for immediate UI
      if (cached && cached.length > 0) {
        const cachedWithPending = mergeWithPendingOperations(cached, pendingProductOps);
        setProducts(cachedWithPending);
        console.log('[UnifiedProducts] 🎯 Set initial state from cache+pending:', cachedWithPending.length);
        setLoading(false);
      }
      
      // If online, fetch fresh data and merge carefully
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
            
            // Get current pending ops (might have changed during fetch)
            const currentPendingOps = pendingOps.filter(op => op.type === 'product');
            
            // Merge server data with ALL pending operations
            const finalMergedData = mergeWithPendingOperations(serverData, currentPendingOps);
            
            // Update cache with CLEAN server data only (no pending ops)
            setCache('products', serverData);
            
            // Update UI with merged data (server + pending changes)
            setProducts(finalMergedData);
            console.log(`[UnifiedProducts] 🔄 Updated UI with ${finalMergedData.length} merged products`);
            
          } else if (fetchError) {
            console.error('[UnifiedProducts] ❌ Server fetch error:', fetchError);
            // Keep current data on server error
          }
        } catch (serverError) {
          console.error('[UnifiedProducts] ❌ Server error:', serverError);
          // Keep current cached data with pending ops on server error
        }
      } else {
        console.log('[UnifiedProducts] 📴 Offline mode - using cached data');
        if (!cached || cached.length === 0) {
          console.log('[UnifiedProducts] ❌ No cached data available offline');
          setError('No data available offline');
        }
      }
      
      // If we had no initial cached data, we're done loading
      if (!cached || cached.length === 0) {
        setLoading(false);
      }
      
    } catch (err) {
      console.error('[UnifiedProducts] ❌ Load error:', err);
      setError('Failed to load products');
      setLoading(false);
    }
  }, [user, isOnline, getCache, setCache, pendingOps, mergeWithPendingOperations]);

  // Bulletproof create product function
  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = new Date().toISOString();
    
    console.log('[UnifiedProducts] ➕ Creating product:', productData.name);

    // ALWAYS add to pending operations FIRST
    addPendingOperation({
      type: 'product',
      operation: 'create',
      data: { ...productData, id: tempId },
    });

    // Create optimistic product for immediate UI update
    const optimisticProduct: Product = {
      ...productData,
      id: tempId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Optimistically update UI immediately
    setProducts(prev => {
      const updated = [optimisticProduct, ...prev];
      console.log('[UnifiedProducts] 🎯 Optimistic create - UI updated with:', updated.length, 'products');
      return updated;
    });

    // Try to sync immediately if online
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

          // Replace temp product with real one in UI
          setProducts(prev => prev.map(p => 
            p.id === tempId ? realProduct : p
          ));

          // Update cache
          const cached = getCache<Product[]>('products') || [];
          setCache('products', [realProduct, ...cached]);
          
          return realProduct;
        } else {
          console.error('[UnifiedProducts] ❌ Online create failed:', error);
        }
      } catch (error) {
        console.error('[UnifiedProducts] ❌ Create error:', error);
      }
    }

    console.log('[UnifiedProducts] 📴 Product queued for offline sync');
    return optimisticProduct;
  }, [user, isOnline, setCache, getCache, addPendingOperation]);

  // Bulletproof update product function
  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    if (!user) throw new Error('User not authenticated');

    const timestamp = new Date().toISOString();
    console.log('[UnifiedProducts] 📝 Updating product:', productId, updates);

    // ALWAYS queue the operation FIRST
    addPendingOperation({
      type: 'product',
      operation: 'update',
      data: { id: productId, updates },
    });

    // Apply optimistic update to UI IMMEDIATELY
    setProducts(prev => {
      const updated = prev.map(product => 
        product.id === productId 
          ? { ...product, ...updates, updatedAt: timestamp }
          : product
      );
      console.log('[UnifiedProducts] 🎯 Optimistic update applied to UI');
      return updated;
    });

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

    // Try immediate sync if online and not a temp product
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
        } else {
          console.error('[UnifiedProducts] ❌ Immediate online update failed:', error);
        }
      } catch (error) {
        console.error('[UnifiedProducts] ❌ Update error:', error);
      }
    }

    console.log('[UnifiedProducts] 📋 Update queued for sync');
  }, [user, isOnline, setCache, getCache, addPendingOperation]);

  // Bulletproof delete product function
  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('[UnifiedProducts] 🗑️  Deleting product:', productId);

    // Queue operation for non-temp products
    if (!productId.startsWith('temp_')) {
      addPendingOperation({
        type: 'product',
        operation: 'delete',
        data: { id: productId },
      });
    }

    // Optimistically remove from UI immediately
    setProducts(prev => {
      const updated = prev.filter(product => product.id !== productId);
      console.log('[UnifiedProducts] 🎯 Optimistic delete - UI updated');
      return updated;
    });

    // Update cache for real products
    if (!productId.startsWith('temp_')) {
      const cached = getCache<Product[]>('products') || [];
      const updatedCache = cached.filter(product => product.id !== productId);
      setCache('products', updatedCache);
    }

    // Try immediate sync if online and not a temp product
    if (isOnline && !productId.startsWith('temp_')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', user.id);

        if (!error) {
          console.log('[UnifiedProducts] ✅ Product deleted online immediately');
        } else {
          console.error('[UnifiedProducts] ❌ Immediate online delete failed:', error);
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
      console.log('[UnifiedProducts] 🔄 Starting enhanced sync...');
      await syncPendingOperations();
      
      // Reload data after successful sync
      setTimeout(() => {
        loadProducts();
        setSyncStatus('success');
      }, 500);
    } catch (error) {
      console.error('[UnifiedProducts] ❌ Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isOnline, user, syncPendingOperations, loadProducts]);

  // Load products on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Enhanced sync event listeners with debouncing
  useEffect(() => {
    let reloadTimeout: NodeJS.Timeout;
    
    const handleNetworkChange = () => {
      console.log('[UnifiedProducts] 🌐 Network status changed');
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => loadProducts(), 1000);
    };

    const handleSyncComplete = () => {
      console.log('[UnifiedProducts] ✅ Sync completed');
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
