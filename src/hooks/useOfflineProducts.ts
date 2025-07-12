
import { useState, useCallback } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { Product } from '../types';

export const useOfflineProducts = () => {
  const { addOfflineOperation, getOfflineData, isOnline } = useOfflineManager();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const createOfflineProduct = useCallback(async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    setIsCreating(true);
    
    try {
      const product: Product = {
        ...productData,
        id: `offline_product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await addOfflineOperation('product', 'create', product, 'medium');
      
      console.log('[OfflineProducts] Product created offline:', product.id);
      return product;
      
    } catch (error) {
      console.error('[OfflineProducts] Failed to create offline product:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [addOfflineOperation]);

  const updateOfflineProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    setIsUpdating(true);
    
    try {
      const updateData = {
        id: productId,
        updates: {
          ...updates,
          updated_at: new Date().toISOString()
        }
      };

      await addOfflineOperation('product', 'update', updateData, 'medium');
      
      console.log('[OfflineProducts] Product updated offline:', productId);
      return true;
      
    } catch (error) {
      console.error('[OfflineProducts] Failed to update offline product:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [addOfflineOperation]);

  const getOfflineProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const products = await getOfflineData('products');
      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error('[OfflineProducts] Failed to get offline products:', error);
      return [];
    }
  }, [getOfflineData]);

  return {
    createOfflineProduct,
    updateOfflineProduct,
    getOfflineProducts,
    isCreating,
    isUpdating,
    isOnline
  };
};
