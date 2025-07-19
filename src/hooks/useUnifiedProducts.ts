
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { Product } from '../types';

export const useUnifiedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, addPendingOperation, pendingOps } = useCacheManager();

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
            const formattedData = data.map(item => ({
              id: item.id,
              name: item.name,
              category: item.category,
              costPrice: item.cost_price,
              sellingPrice: item.selling_price,
              currentStock: item.current_stock,
              lowStockThreshold: item.low_stock_threshold,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            }));
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
          const formattedData = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            costPrice: item.cost_price,
            sellingPrice: item.selling_price,
            currentStock: item.current_stock,
            lowStockThreshold: item.low_stock_threshold,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
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
          .insert([{
            name: productData.name,
            category: productData.category,
            cost_price: productData.costPrice,
            selling_price: productData.sellingPrice,
            current_stock: productData.currentStock,
            low_stock_threshold: productData.lowStockThreshold,
            user_id: user.id,
          }])
          .select()
          .single();

        if (error) throw error;

        const formattedProduct: Product = {
          id: data.id,
          name: data.name,
          category: data.category,
          costPrice: data.cost_price,
          sellingPrice: data.selling_price,
          currentStock: data.current_stock,
          lowStockThreshold: data.low_stock_threshold,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Replace temp product with real one
        setProducts(prev => 
          prev.map(p => p.id === newProduct.id ? formattedProduct : p)
        );

        // Update cache
        const updatedProducts = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id);
        
        if (updatedProducts.data) {
          const formattedData = updatedProducts.data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            costPrice: item.cost_price,
            sellingPrice: item.selling_price,
            currentStock: item.current_stock,
            lowStockThreshold: item.low_stock_threshold,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
          setCache('products', formattedData);
        }

        return formattedProduct;
      } catch (error) {
        // Revert optimistic update and queue for sync
        setProducts(prev => prev.filter(p => p.id !== newProduct.id));
        addPendingOperation({
          type: 'product',
          operation: 'create',
          data: productData,
        });
        console.error('[UnifiedProducts] Create failed, queued for sync:', error);
        return newProduct;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'create',
        data: productData,
      });
      return newProduct;
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Update product
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (!user) throw new Error('User not authenticated');

    // Optimistically update UI
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
        const updatedProducts = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id);
        
        if (updatedProducts.data) {
          const formattedData = updatedProducts.data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            costPrice: item.cost_price,
            sellingPrice: item.selling_price,
            currentStock: item.current_stock,
            lowStockThreshold: item.low_stock_threshold,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
          setCache('products', formattedData);
        }
      } catch (error) {
        // Revert optimistic update and queue for sync
        await loadProducts();
        addPendingOperation({
          type: 'product',
          operation: 'update',
          data: { id, updates },
        });
        console.error('[UnifiedProducts] Update failed, queued for sync:', error);
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'product',
        operation: 'update',
        data: { id, updates },
      });
    }
  }, [user, isOnline, setCache, addPendingOperation, loadProducts]);

  // Load products on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Listen for network reconnection
  useEffect(() => {
    const handleReconnect = () => {
      loadProducts();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    return () => window.removeEventListener('network-reconnected', handleReconnect);
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    refetch: loadProducts,
    isOnline,
    pendingOperations: pendingOps.filter(op => op.type === 'product').length,
  };
};
