
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '../../types';

export const useProductQueries = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const mapSupabaseProduct = (product: any): Product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    costPrice: Number(product.cost_price),
    sellingPrice: Number(product.selling_price),
    currentStock: product.current_stock,
    lowStockThreshold: product.low_stock_threshold || 10,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    image_url: product.image_url,
    // Variant support
    parent_id: product.parent_id,
    variant_name: product.variant_name,
    variant_multiplier: product.variant_multiplier,
    stock_derivation_quantity: product.stock_derivation_quantity,
    is_parent: product.is_parent,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .or('parent_id.is.null,is_parent.eq.true') // Only show parent products and non-variant products
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      const mappedProducts = data.map(mapSupabaseProduct);
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Set up real-time subscription
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products'
      }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    products,
    loading,
    refetch: fetchProducts,
  };
};
