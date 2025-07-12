
import { useState, useCallback } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { Customer } from '../types';

export const useOfflineCustomers = () => {
  const { addOfflineOperation, getOfflineData, isOnline } = useOfflineManager();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const createOfflineCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdDate'>) => {
    setIsCreating(true);
    
    try {
      const customer: Customer = {
        ...customerData,
        id: `offline_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdDate: new Date().toISOString(),
        totalPurchases: 0,
        outstandingDebt: 0,
        creditLimit: customerData.creditLimit || 1000
      };

      await addOfflineOperation('customer', 'create', customer, 'low');
      
      console.log('[OfflineCustomers] Customer created offline:', customer.id);
      return customer;
      
    } catch (error) {
      console.error('[OfflineCustomers] Failed to create offline customer:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [addOfflineOperation]);

  const updateOfflineCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    setIsUpdating(true);
    
    try {
      const updateData = {
        id: customerId,
        updates: {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      };

      await addOfflineOperation('customer', 'update', updateData, 'low');
      
      console.log('[OfflineCustomers] Customer updated offline:', customerId);
      return true;
      
    } catch (error) {
      console.error('[OfflineCustomers] Failed to update offline customer:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [addOfflineOperation]);

  const getOfflineCustomers = useCallback(async (): Promise<Customer[]> => {
    try {
      const customers = await getOfflineData('customers');
      return Array.isArray(customers) ? customers : [];
    } catch (error) {
      console.error('[OfflineCustomers] Failed to get offline customers:', error);
      return [];
    }
  }, [getOfflineData]);

  return {
    createOfflineCustomer,
    updateOfflineCustomer,
    getOfflineCustomers,
    isCreating,
    isUpdating,
    isOnline
  };
};
