
import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '../utils/indexedDB';
import { useOfflineSync } from './useOfflineSync';
import { Sale, Product, Customer } from '../types';

interface OfflineDataState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useOfflineDataManager = () => {
  const [state, setState] = useState<OfflineDataState>({
    isInitialized: false,
    isLoading: true,
    error: null,
  });

  const { addPendingOperation, isOnline } = useOfflineSync();

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await offlineDB.init();
      setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));
      console.log('Offline database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to initialize offline storage' 
      }));
    }
  };

  // Sales operations
  const createOfflineSale = useCallback(async (saleData: Omit<Sale, 'id'>) => {
    const sale: Sale = {
      ...saleData,
      id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
    };

    try {
      // Store sale locally
      await offlineDB.storeOfflineData('sales', sale);

      // Add to sync queue with attempts property
      await offlineDB.addToSyncQueue({
        id: `sync_${sale.id}`,
        type: 'sale',
        data: sale,
        timestamp: new Date().toISOString(),
        synced: false,
        operation: 'create',
        priority: 'high',
        attempts: 0,
      });

      // Update local inventory
      await updateLocalInventory(sale.productId, -sale.quantity);

      // If online, try to sync immediately
      if (isOnline) {
        addPendingOperation({
          type: 'sale',
          data: sale,
        });
      }

      return sale;
    } catch (error) {
      console.error('Failed to create offline sale:', error);
      throw error;
    }
  }, [isOnline, addPendingOperation]);

  const getOfflineSales = useCallback(async (): Promise<Sale[]> => {
    try {
      const sales = await offlineDB.getOfflineData('sales');
      return sales || [];
    } catch (error) {
      console.error('Failed to get offline sales:', error);
      return [];
    }
  }, []);

  // Product operations
  const updateLocalInventory = useCallback(async (productId: string, quantityChange: number) => {
    try {
      const product = await offlineDB.getOfflineData('products', productId);
      if (product) {
        const updatedProduct = {
          ...product,
          currentStock: Math.max(0, product.currentStock + quantityChange),
          updatedAt: new Date().toISOString(),
        };

        await offlineDB.storeOfflineData('products', updatedProduct);

        // Add to sync queue for inventory update with attempts property
        await offlineDB.addToSyncQueue({
          id: `sync_inventory_${productId}_${Date.now()}`,
          type: 'product',
          data: {
            productId,
            quantityChange,
            newStock: updatedProduct.currentStock,
          },
          timestamp: new Date().toISOString(),
          synced: false,
          operation: 'update',
          priority: 'medium',
          attempts: 0,
        });
      }
    } catch (error) {
      console.error('Failed to update local inventory:', error);
      throw error;
    }
  }, []);

  const createOfflineProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const product: Product = {
      ...productData,
      id: `offline_product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await offlineDB.storeOfflineData('products', product);

      await offlineDB.addToSyncQueue({
        id: `sync_${product.id}`,
        type: 'product',
        data: product,
        timestamp: new Date().toISOString(),
        synced: false,
        operation: 'create',
        priority: 'medium',
        attempts: 0,
      });

      if (isOnline) {
        addPendingOperation({
          type: 'inventory',
          data: product,
        });
      }

      return product;
    } catch (error) {
      console.error('Failed to create offline product:', error);
      throw error;
    }
  }, [isOnline, addPendingOperation]);

  const getOfflineProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const products = await offlineDB.getOfflineData('products');
      return products || [];
    } catch (error) {
      console.error('Failed to get offline products:', error);
      return [];
    }
  }, []);

  // Customer operations
  const createOfflineCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdDate'>) => {
    const customer: Customer = {
      ...customerData,
      id: `offline_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdDate: new Date().toISOString(),
    };

    try {
      await offlineDB.storeOfflineData('customers', customer);

      await offlineDB.addToSyncQueue({
        id: `sync_${customer.id}`,
        type: 'customer',
        data: customer,
        timestamp: new Date().toISOString(),
        synced: false,
        operation: 'create',
        priority: 'low',
        attempts: 0,
      });

      if (isOnline) {
        addPendingOperation({
          type: 'customer',
          data: customer,
        });
      }

      return customer;
    } catch (error) {
      console.error('Failed to create offline customer:', error);
      throw error;
    }
  }, [isOnline, addPendingOperation]);

  const updateOfflineCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    try {
      const existingCustomer = await offlineDB.getOfflineData('customers', customerId);
      if (!existingCustomer) {
        throw new Error('Customer not found');
      }

      const updatedCustomer = {
        ...existingCustomer,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await offlineDB.storeOfflineData('customers', updatedCustomer);

      await offlineDB.addToSyncQueue({
        id: `sync_update_${customerId}_${Date.now()}`,
        type: 'customer',
        data: { id: customerId, updates },
        timestamp: new Date().toISOString(),
        synced: false,
        operation: 'update',
        priority: 'low',
        attempts: 0,
      });

      if (isOnline) {
        addPendingOperation({
          type: 'customer',
          data: { id: customerId, updates },
        });
      }

      return updatedCustomer;
    } catch (error) {
      console.error('Failed to update offline customer:', error);
      throw error;
    }
  }, [isOnline, addPendingOperation]);

  const getOfflineCustomers = useCallback(async (): Promise<Customer[]> => {
    try {
      const customers = await offlineDB.getOfflineData('customers');
      return customers || [];
    } catch (error) {
      console.error('Failed to get offline customers:', error);
      return [];
    }
  }, []);

  // Sync operations
  const getSyncQueueStatus = useCallback(async () => {
    try {
      const queue = await offlineDB.getSyncQueue();
      return {
        total: queue.length,
        high: queue.filter(item => item.priority === 'high').length,
        medium: queue.filter(item => item.priority === 'medium').length,
        low: queue.filter(item => item.priority === 'low').length,
      };
    } catch (error) {
      console.error('Failed to get sync queue status:', error);
      return { total: 0, high: 0, medium: 0, low: 0 };
    }
  }, []);

  const clearOfflineData = useCallback(async () => {
    try {
      await Promise.all([
        offlineDB.clearStore('sales'),
        offlineDB.clearStore('products'),
        offlineDB.clearStore('customers'),
        offlineDB.clearStore('syncQueue'),
      ]);
      console.log('Offline data cleared successfully');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    // Sales
    createOfflineSale,
    getOfflineSales,
    // Products
    createOfflineProduct,
    getOfflineProducts,
    updateLocalInventory,
    // Customers
    createOfflineCustomer,
    updateOfflineCustomer,
    getOfflineCustomers,
    // Sync
    getSyncQueueStatus,
    clearOfflineData,
  };
};
