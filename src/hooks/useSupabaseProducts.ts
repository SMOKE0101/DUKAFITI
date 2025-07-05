
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Product } from '../types';

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load products from database
  const loadProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = data.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        costPrice: Number(product.cost_price),
        sellingPrice: Number(product.selling_price),
        currentStock: product.current_stock,
        lowStockThreshold: product.low_stock_threshold || 10,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          current_stock: productData.currentStock,
          low_stock_threshold: productData.lowStockThreshold,
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        costPrice: Number(data.cost_price),
        sellingPrice: Number(data.selling_price),
        currentStock: data.current_stock,
        lowStockThreshold: data.low_stock_threshold || 10,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProducts(prev => [newProduct, ...prev]);
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

      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        costPrice: Number(data.cost_price),
        sellingPrice: Number(data.selling_price),
        currentStock: data.current_stock,
        lowStockThreshold: data.low_stock_threshold || 10,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
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

      setProducts(prev => prev.filter(p => p.id !== id));
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

  // Migrate localStorage data to database
  const migrateLocalStorageData = async () => {
    if (!user) return;

    try {
      const localData = localStorage.getItem('dts_products');
      if (!localData) return;

      const localProducts = JSON.parse(localData);
      if (!Array.isArray(localProducts) || localProducts.length === 0) return;

      console.log('Migrating products from localStorage:', localProducts.length);

      for (const product of localProducts) {
        await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: product.name,
            category: product.category,
            cost_price: product.costPrice,
            selling_price: product.sellingPrice,
            current_stock: product.currentStock,
            low_stock_threshold: product.lowStockThreshold || 10,
            created_at: product.createdAt || new Date().toISOString(),
          });
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('dts_products');
      console.log('Products migrated successfully');

      // Reload products from database
      await loadProducts();
    } catch (error) {
      console.error('Error migrating products:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

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
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load products and migrate data on mount
  useEffect(() => {
    if (user) {
      loadProducts().then(() => {
        migrateLocalStorageData();
      });
    }
  }, [user]);

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: loadProducts,
  };
};
