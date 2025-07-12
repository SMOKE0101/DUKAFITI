
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useOfflineFirstSupabase } from './useOfflineFirstSupabase';
import { Product } from '../types';

export const useSupabaseProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Transform functions for field mapping
  const transformToLocal = (product: any): Product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    costPrice: Number(product.cost_price || product.costPrice || 0),
    sellingPrice: Number(product.selling_price || product.sellingPrice || 0),
    currentStock: Number(product.current_stock || product.currentStock || 0),
    lowStockThreshold: Number(product.low_stock_threshold || product.lowStockThreshold || 10),
    createdAt: product.created_at || product.createdAt,
    updatedAt: product.updated_at || product.updatedAt,
  });

  const transformFromLocal = (product: Product): any => ({
    id: product.id,
    name: product.name,
    category: product.category,
    cost_price: Number(product.costPrice || 0),
    selling_price: Number(product.sellingPrice || 0),
    current_stock: Number(product.currentStock || 0),
    low_stock_threshold: Number(product.lowStockThreshold || 10),
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  });

  const loadFromSupabase = async () => {
    if (!user) throw new Error('No user authenticated');
    
    console.log('[useSupabaseProducts] Loading products from Supabase...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useSupabaseProducts] Supabase error:', error);
      throw error;
    }

    console.log('[useSupabaseProducts] Loaded products from Supabase:', data?.length || 0);
    return data ? data.map(transformToLocal) : [];
  };

  const {
    data: products,
    loading,
    error,
    refresh: refreshProducts,
    isOnline,
    lastSyncTime,
    testOffline
  } = useOfflineFirstSupabase<Product>({
    cacheKey: 'products',
    tableName: 'products',
    loadFromSupabase,
    transformToLocal,
    transformFromLocal
  });

  // Create product with offline support
  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseProducts] Creating product:', productData);

      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Product will be created when connection is restored",
          variant: "default",
        });
        throw new Error('Cannot create product while offline');
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productData.name,
          category: productData.category,
          cost_price: productData.costPrice,
          selling_price: productData.sellingPrice,
          current_stock: productData.currentStock || 0,
          low_stock_threshold: productData.lowStockThreshold || 10,
        })
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseProducts] Create error:', error);
        throw error;
      }

      console.log('[useSupabaseProducts] Product created successfully:', data);
      const newProduct = transformToLocal(data);
      
      // Refresh data to sync with cache
      await refreshProducts();
      
      toast({
        title: "Success",
        description: "Product created successfully",
      });

      return newProduct;
    } catch (error) {
      console.error('[useSupabaseProducts] Create product error:', error);
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update product with offline support
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseProducts] Updating product:', id, updates);

      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Changes will sync when connection is restored",
          variant: "default",
        });
        throw new Error('Cannot update product while offline');
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          name: updates.name,
          category: updates.category,
          cost_price: updates.costPrice,
          selling_price: updates.sellingPrice,
          current_stock: updates.currentStock,
          low_stock_threshold: updates.lowStockThreshold,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseProducts] Update error:', error);
        throw error;
      }

      console.log('[useSupabaseProducts] Product updated successfully:', data);
      const updatedProduct = transformToLocal(data);
      
      // Refresh data to sync with cache
      await refreshProducts();
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      return updatedProduct;
    } catch (error) {
      console.error('[useSupabaseProducts] Update product error:', error);
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete product with offline support
  const deleteProduct = async (id: string) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseProducts] Deleting product:', id);

      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Cannot delete product while offline",
          variant: "destructive",
        });
        throw new Error('Cannot delete product while offline');
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseProducts] Delete error:', error);
        throw error;
      }

      console.log('[useSupabaseProducts] Product deleted successfully');
      
      // Refresh data to sync with cache
      await refreshProducts();
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('[useSupabaseProducts] Delete product error:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Add stock function with offline support
  const addStock = async (productId: string, quantity: number, buyingPrice: number, supplier?: string) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseProducts] Adding stock:', { productId, quantity, buyingPrice, supplier });

      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Stock changes will sync when connection is restored",
          variant: "default",
        });
        throw new Error('Cannot add stock while offline');
      }

      // Update the product stock
      await updateProduct(productId, {
        currentStock: product.currentStock + quantity,
        costPrice: buyingPrice, // Update cost price with latest buying price
      });

      toast({
        title: "Stock Added Successfully",
        description: `Added ${quantity} units of ${product.name}`,
      });
    } catch (error) {
      console.error('[useSupabaseProducts] Add stock error:', error);
      toast({
        title: "Error",
        description: `Failed to add stock: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isOnline) return;

    console.log('[useSupabaseProducts] Setting up real-time subscription');
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useSupabaseProducts] Real-time change detected:', payload);
          refreshProducts();
        }
      )
      .subscribe();

    return () => {
      console.log('[useSupabaseProducts] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, isOnline, refreshProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    addStock,
    refreshProducts,
    isOnline,
    lastSyncTime,
    testOffline
  };
};
