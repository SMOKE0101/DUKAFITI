
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Product } from '../types';

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('useSupabaseProducts: Hook initialized, user:', user?.id);

  // Load products from database
  const loadProducts = async () => {
    if (!user) {
      console.log('useSupabaseProducts: No user, clearing products');
      setLoading(false);
      setError(null);
      setProducts([]);
      return;
    }
    
    console.log('useSupabaseProducts: Loading products for user:', user.id);
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('useSupabaseProducts: Supabase response:', { data, error: supabaseError });

      if (supabaseError) {
        console.error('useSupabaseProducts: Database error:', supabaseError);
        throw supabaseError;
      }

      if (!data) {
        console.log('useSupabaseProducts: No data returned from database');
        setProducts([]);
        return;
      }

      console.log('useSupabaseProducts: Raw data from database:', data);

      const mappedProducts: Product[] = data.map(product => {
        const mapped = {
          id: product.id,
          name: product.name,
          category: product.category,
          costPrice: Number(product.cost_price || 0),
          sellingPrice: Number(product.selling_price || 0),
          currentStock: Number(product.current_stock || 0),
          lowStockThreshold: Number(product.low_stock_threshold || 10),
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        };
        console.log('useSupabaseProducts: Mapped product:', mapped);
        return mapped;
      });

      console.log('useSupabaseProducts: Final mapped products:', mappedProducts);
      setProducts(mappedProducts);
    } catch (error) {
      console.error('useSupabaseProducts: Error loading products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setProducts([]);
      toast({
        title: "Error",
        description: `Failed to load products: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create product
  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      console.error('useSupabaseProducts: No user for createProduct');
      return;
    }

    console.log('useSupabaseProducts: Creating product:', productData);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productData.name,
          category: productData.category,
          cost_price: productData.costPrice,
          selling_price: productData.sellingPrice,
          current_stock: productData.currentStock,
          low_stock_threshold: productData.lowStockThreshold,
        })
        .select()
        .single();

      if (error) {
        console.error('useSupabaseProducts: Create error:', error);
        throw error;
      }

      console.log('useSupabaseProducts: Product created:', data);

      const newProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        costPrice: Number(data.cost_price || 0),
        sellingPrice: Number(data.selling_price || 0),
        currentStock: Number(data.current_stock || 0),
        lowStockThreshold: Number(data.low_stock_threshold || 10),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (error) {
      console.error('useSupabaseProducts: Error creating product:', error);
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

    console.log('useSupabaseProducts: Updating product:', id, updates);

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

      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        costPrice: Number(data.cost_price || 0),
        sellingPrice: Number(data.selling_price || 0),
        currentStock: Number(data.current_stock || 0),
        lowStockThreshold: Number(data.low_stock_threshold || 10),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (error) {
      console.error('useSupabaseProducts: Error updating product:', error);
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

    console.log('useSupabaseProducts: Deleting product:', id);

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('useSupabaseProducts: Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Add stock
  const addStock = async (id: string, quantity: number, buyingPrice: number) => {
    if (!user) return;

    console.log('useSupabaseProducts: Adding stock:', id, quantity, buyingPrice);

    try {
      const product = products.find(p => p.id === id);
      if (!product) throw new Error('Product not found');

      const newStock = product.currentStock + quantity;
      
      const { data, error } = await supabase
        .from('products')
        .update({
          current_stock: newStock,
          cost_price: buyingPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        costPrice: Number(data.cost_price || 0),
        sellingPrice: Number(data.selling_price || 0),
        currentStock: Number(data.current_stock || 0),
        lowStockThreshold: Number(data.low_stock_threshold || 10),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (error) {
      console.error('useSupabaseProducts: Error adding stock:', error);
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) {
      console.log('useSupabaseProducts: No user for real-time subscription');
      return;
    }

    console.log('useSupabaseProducts: Setting up real-time subscription for user:', user.id);

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
          console.log('useSupabaseProducts: Real-time change detected:', payload);
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      console.log('useSupabaseProducts: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load products on mount and when user changes
  useEffect(() => {
    console.log('useSupabaseProducts: Effect triggered, user changed:', user?.id);
    loadProducts();
  }, [user]);

  console.log('useSupabaseProducts: Returning state:', { 
    products: products.length, 
    loading, 
    error,
    user: user?.id 
  });

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    addStock,
    refreshProducts: loadProducts,
  };
};
