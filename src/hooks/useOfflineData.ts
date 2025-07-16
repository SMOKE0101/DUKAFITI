
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useOfflineSync } from './useOfflineSync';
import { offlineDB } from '../utils/offlineDB';

export const useOfflineData = () => {
  const { user } = useAuth();
  const { syncData } = useOfflineSync();
  
  const [data, setData] = useState({
    products: [],
    customers: [],
    sales: [],
    transactions: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOfflineData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [products, customers, sales, transactions] = await Promise.all([
        offlineDB.getProducts(user.id),
        offlineDB.getCustomers(user.id),
        offlineDB.getSales(user.id),
        offlineDB.getAllOfflineData('transactions', user.id)
      ]);
      
      setData({
        products: products || [],
        customers: customers || [],
        sales: sales || [],
        transactions: transactions || []
      });
      
    } catch (err) {
      console.error('Failed to load offline data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const addProduct = useCallback(async (productData: any) => {
    try {
      const product = {
        ...productData,
        id: `offline_product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await offlineDB.store('products', product);
      
      // Add to sync queue
      await offlineDB.addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'product',
        operation: 'create',
        data: product,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        attempts: 0,
        synced: false
      });

      // Refresh data
      await loadOfflineData();
      
      return product;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  }, [user?.id, loadOfflineData]);

  const addCustomer = useCallback(async (customerData: any) => {
    try {
      const customer = {
        ...customerData,
        id: `offline_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user?.id,
        created_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await offlineDB.store('customers', customer);
      
      // Add to sync queue
      await offlineDB.addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'customer',
        operation: 'create',
        data: customer,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        attempts: 0,
        synced: false
      });

      // Refresh data
      await loadOfflineData();
      
      return customer;
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  }, [user?.id, loadOfflineData]);

  const addSale = useCallback(async (saleData: any) => {
    try {
      const sale = {
        ...saleData,
        id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        synced: false
      };

      await offlineDB.storeSale(sale);
      
      // Add to sync queue
      await offlineDB.addToSyncQueue({
        id: `sync_${Date.now()}`,
        type: 'sale',
        operation: 'create',
        data: sale,
        timestamp: new Date().toISOString(),
        priority: 'high',
        attempts: 0,
        synced: false
      });

      // Refresh data
      await loadOfflineData();
      
      return sale;
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  }, [user?.id, loadOfflineData]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadOfflineData();
  }, [loadOfflineData]);

  return {
    data,
    isLoading,
    error,
    addProduct,
    addCustomer,
    addSale,
    refreshData: loadOfflineData,
    syncData
  };
};
