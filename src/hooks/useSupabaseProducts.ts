
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useOfflineFirstSupabase } from './useOfflineFirstSupabase';
import { Product } from '../types';
import { useState, useEffect } from 'react';

export const useSupabaseProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Transform functions for field mapping
  const transformToLocal = (product: any): Product => {
    if (!product) {
      console.warn('Received null/undefined product in transformToLocal');
      return {
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
    }

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
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  });

  const loadFromSupabase = async () => {
    if (!user) {
      console.log('[useSupabaseProducts] No user authenticated, user state:', user);
      return [];
    }
    
    console.log('[useSupabaseProducts] Loading products from Supabase for user:', user.id);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // First, let's check what products exist in the database
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('*')
        .limit(5);
      
      console.log('[useSupabaseProducts] All products (first 5):', allProducts);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useSupabaseProducts] Supabase error:', error);
        throw new Error(`Failed to load products: ${error.message}`);
      }

      if (!data) {
        console.log('[useSupabaseProducts] No data returned from Supabase');
        return [];
      }

      console.log('[useSupabaseProducts] Loaded products from Supabase for user:', data.length, 'products');
      return data.map(transformToLocal).filter(product => product.id); // Filter out invalid products
    } catch (error) {
      console.error('[useSupabaseProducts] Load error:', error);
      throw error;
    }
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
    transformFromLocal,
    user // Pass the user to the offline hook
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

      const { supabase } = await import('@/integrations/supabase/client');

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
        throw new Error(`Failed to create product: ${error.message}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to create product: ${errorMessage}`,
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

      const { supabase } = await import('@/integrations/supabase/client');

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
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseProducts] Update error:', error);
        throw new Error(`Failed to update product: ${error.message}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to update product: ${errorMessage}`,
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

      const { supabase } = await import('@/integrations/supabase/client');

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[useSupabaseProducts] Delete error:', error);
        throw new Error(`Failed to delete product: ${error.message}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to delete product: ${errorMessage}`,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to add stock: ${errorMessage}`,
        variant: "destructive",
      });
      throw error;
    }
  };

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
