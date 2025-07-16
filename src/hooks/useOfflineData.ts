
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB, OfflineProduct, OfflineCustomer, OfflineSale } from '../utils/offlineDB';
import { useOfflineSync } from './useOfflineSync';

export const useOfflineProducts = () => {
  const { user } = useAuth();
  const { updateQueuedActionsCount } = useOfflineSync();
  const [products, setProducts] = useState<OfflineProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline] = useState(navigator.onLine);

  const loadProducts = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (isOnline) {
        // Try to fetch from server first
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          if (data) {
            await offlineDB.storeProducts(data);
            setProducts(data);
          }
        } catch (error) {
          console.log('[useOfflineProducts] Server fetch failed, using local data');
          const localProducts = await offlineDB.getProducts(user.id);
          setProducts(localProducts);
        }
      } else {
        // Load from local storage
        const localProducts = await offlineDB.getProducts(user.id);
        setProducts(localProducts);
      }
    } catch (error) {
      console.error('[useOfflineProducts] Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isOnline]);

  const createProduct = async (productData: Omit<OfflineProduct, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    const newProduct: OfflineProduct = {
      ...productData,
      id: `offline_product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };

    // Store locally immediately
    await offlineDB.store('products', newProduct);
    
    // Queue for sync
    await offlineDB.queueAction({
      type: 'CREATE',
      table: 'products',
      data: newProduct,
      user_id: user.id
    });

    // Update local state
    setProducts(prev => [...prev, newProduct]);
    await updateQueuedActionsCount();

    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<OfflineProduct>) => {
    if (!user) throw new Error('User not authenticated');

    const existingProduct = await offlineDB.getProduct(id);
    if (!existingProduct) throw new Error('Product not found');

    const updatedProduct = {
      ...existingProduct,
      ...updates,
      updated_at: new Date().toISOString(),
      synced: false
    };

    // Store locally immediately
    await offlineDB.store('products', updatedProduct);
    
    // Queue for sync
    await offlineDB.queueAction({
      type: 'UPDATE',
      table: 'products',
      data: updatedProduct,
      user_id: user.id
    });

    // Update local state
    setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    await updateQueuedActionsCount();

    return updatedProduct;
  };

  const deleteProduct = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    // Remove locally immediately
    await offlineDB.delete('products', id);
    
    // Queue for sync
    await offlineDB.queueAction({
      type: 'DELETE',
      table: 'products',
      data: { id },
      user_id: user.id
    });

    // Update local state
    setProducts(prev => prev.filter(p => p.id !== id));
    await updateQueuedActionsCount();
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: loadProducts
  };
};

export const useOfflineCustomers = () => {
  const { user } = useAuth();
  const { updateQueuedActionsCount } = useOfflineSync();
  const [customers, setCustomers] = useState<OfflineCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline] = useState(navigator.onLine);

  const loadCustomers = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          if (data) {
            await offlineDB.storeCustomers(data);
            setCustomers(data);
          }
        } catch (error) {
          console.log('[useOfflineCustomers] Server fetch failed, using local data');
          const localCustomers = await offlineDB.getCustomers(user.id);
          setCustomers(localCustomers);
        }
      } else {
        const localCustomers = await offlineDB.getCustomers(user.id);
        setCustomers(localCustomers);
      }
    } catch (error) {
      console.error('[useOfflineCustomers] Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isOnline]);

  const createCustomer = async (customerData: Omit<OfflineCustomer, 'id' | 'user_id' | 'created_date'>) => {
    if (!user) throw new Error('User not authenticated');

    const newCustomer: OfflineCustomer = {
      ...customerData,
      id: `offline_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      created_date: new Date().toISOString(),
      synced: false
    };

    await offlineDB.store('customers', newCustomer);
    
    await offlineDB.queueAction({
      type: 'CREATE',
      table: 'customers',
      data: newCustomer,
      user_id: user.id
    });

    setCustomers(prev => [...prev, newCustomer]);
    await updateQueuedActionsCount();

    return newCustomer;
  };

  const updateCustomer = async (id: string, updates: Partial<OfflineCustomer>) => {
    if (!user) throw new Error('User not authenticated');

    const existingCustomer = await offlineDB.getCustomer(id);
    if (!existingCustomer) throw new Error('Customer not found');

    const updatedCustomer = {
      ...existingCustomer,
      ...updates,
      updated_at: new Date().toISOString(),
      synced: false
    };

    await offlineDB.store('customers', updatedCustomer);
    
    await offlineDB.queueAction({
      type: 'UPDATE',
      table: 'customers',
      data: updatedCustomer,
      user_id: user.id
    });

    setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
    await updateQueuedActionsCount();

    return updatedCustomer;
  };

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    isLoading,
    createCustomer,
    updateCustomer,
    refreshCustomers: loadCustomers
  };
};

export const useOfflineSales = () => {
  const { user } = useAuth();
  const { updateQueuedActionsCount } = useOfflineSync();
  const [sales, setSales] = useState<OfflineSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline] = useState(navigator.onLine);

  const loadSales = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

          if (error) throw error;

          if (data) {
            await offlineDB.storeSales(data);
            setSales(data);
          }
        } catch (error) {
          console.log('[useOfflineSales] Server fetch failed, using local data');
          const localSales = await offlineDB.getSales(user.id);
          setSales(localSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }
      } else {
        const localSales = await offlineDB.getSales(user.id);
        setSales(localSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (error) {
      console.error('[useOfflineSales] Failed to load sales:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isOnline]);

  const createSale = async (saleData: Omit<OfflineSale, 'id' | 'user_id' | 'timestamp'>) => {
    if (!user) throw new Error('User not authenticated');

    const newSale: OfflineSale = {
      ...saleData,
      id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      synced: false
    };

    // Store locally immediately
    await offlineDB.store('sales', newSale);
    
    // Update product stock locally
    if (newSale.product_id && newSale.quantity) {
      const product = await offlineDB.getProduct(newSale.product_id);
      if (product) {
        await offlineDB.updateProductStock(newSale.product_id, product.current_stock - newSale.quantity);
      }
    }
    
    // Queue for sync
    await offlineDB.queueAction({
      type: 'CREATE',
      table: 'sales',
      data: newSale,
      user_id: user.id
    });

    // Update local state
    setSales(prev => [newSale, ...prev]);
    await updateQueuedActionsCount();

    return newSale;
  };

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales,
    isLoading,
    createSale,
    refreshSales: loadSales
  };
};
