
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '../types';
import { useToast } from './use-toast';

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch products
  const fetchProducts = async () => {
    try {
      console.log('useSupabaseProducts: Starting fetch...');
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useSupabaseProducts: Fetch error:', error);
        setError(error.message);
        throw error;
      }

      console.log('useSupabaseProducts: Fetched products:', data?.length || 0);
      
      const mappedProducts: Product[] = (data || []).map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        sellingPrice: Number(product.selling_price),
        costPrice: Number(product.cost_price),
        currentStock: product.current_stock,
        lowStockThreshold: product.low_stock_threshold || 10,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('useSupabaseProducts: Error in fetchProducts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Create product
  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('useSupabaseProducts: Creating product:', productData);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name: productData.name,
            category: productData.category,
            selling_price: productData.sellingPrice,
            cost_price: productData.costPrice,
            current_stock: productData.currentStock,
            low_stock_threshold: productData.lowStockThreshold,
            user_id: userData.user.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('useSupabaseProducts: Create error:', error);
        throw error;
      }

      console.log('useSupabaseProducts: Product created:', data);
      await fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('useSupabaseProducts: Error in createProduct:', error);
      throw error;
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      console.log('useSupabaseProducts: Updating product:', id, updates);
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
      if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
      if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
      if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('useSupabaseProducts: Update error:', error);
        throw error;
      }

      console.log('useSupabaseProducts: Product updated');
      await fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('useSupabaseProducts: Error in updateProduct:', error);
      throw error;
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      console.log('useSupabaseProducts: Deleting product:', id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('useSupabaseProducts: Delete error:', error);
        throw error;
      }

      console.log('useSupabaseProducts: Product deleted');
      await fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('useSupabaseProducts: Error in deleteProduct:', error);
      throw error;
    }
  };

  // Add stock
  const addStock = async (id: string, quantity: number, buyingPrice: number) => {
    try {
      console.log('useSupabaseProducts: Adding stock:', id, quantity, buyingPrice);
      
      // First get current product to update stock
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('useSupabaseProducts: Fetch current product error:', fetchError);
        throw fetchError;
      }

      const newStock = (currentProduct.current_stock || 0) + quantity;

      const { error } = await supabase
        .from('products')
        .update({ 
          current_stock: newStock,
          cost_price: buyingPrice 
        })
        .eq('id', id);

      if (error) {
        console.error('useSupabaseProducts: Add stock error:', error);
        throw error;
      }

      console.log('useSupabaseProducts: Stock added');
      await fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('useSupabaseProducts: Error in addStock:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('useSupabaseProducts: Effect triggered, fetching products...');
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    addStock,
    refetch: fetchProducts,
  };
};
