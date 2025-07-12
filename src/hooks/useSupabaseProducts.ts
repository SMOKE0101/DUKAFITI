
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
    costPrice: Number(product.cost_price),
    sellingPrice: Number(product.selling_price),
    currentStock: Number(product.current_stock || 0),
    lowStockThreshold: Number(product.low_stock_threshold || 10),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  });

  const transformFromLocal = (product: any): Product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    costPrice: Number(product.costPrice),
    sellingPrice: Number(product.sellingPrice),
    currentStock: Number(product.currentStock || 0),
    lowStockThreshold: Number(product.lowStockThreshold || 10),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });

  const loadFromSupabase = async () => {
    if (!user) throw new Error('No user authenticated');
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(transformToLocal);
  };

  const {
    data: products,
    loading,
    error,
    refresh: refreshProducts,
    isOnline
  } = useOfflineFirstSupabase<Product>({
    cacheKey: 'products',
    tableName: 'products',
    loadFromSupabase,
    transformToLocal,
    transformFromLocal
  });

  // Create product
  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
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

      if (error) throw error;

      const newProduct = transformToLocal(data);
      await refreshProducts();
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return;

    try {
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

      if (error) throw error;

      const updatedProduct = transformToLocal(data);
      await refreshProducts();
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isOnline) return;

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
        () => {
          refreshProducts();
        }
      )
      .subscribe();

    return () => {
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
    refreshProducts,
  };
};
