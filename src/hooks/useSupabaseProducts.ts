
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductMutations } from './products/useProductMutations';
import { useToast } from './use-toast';
import { Product } from '../types';

export const useSupabaseProducts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { createProduct: createProductMutation, updateProduct: updateProductMutation, deleteProduct: deleteProductMutation } = useProductMutations();

  // Query for fetching products
  const { data: products = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        costPrice: product.cost_price,
        sellingPrice: product.selling_price,
        currentStock: product.current_stock,
        lowStockThreshold: product.low_stock_threshold || 10,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      })) as Product[];
    },
  });

  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createProductMutation(productData);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      await updateProductMutation(id, productData);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteProductMutation(id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const addStock = async (productId: string, quantity: number, buyingPrice: number, supplier?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: product.current_stock + quantity })
        .eq('id', productId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: "Stock Added",
        description: `Successfully added ${quantity} units to inventory`,
      });
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    addStock,
    refetch,
  };
};
