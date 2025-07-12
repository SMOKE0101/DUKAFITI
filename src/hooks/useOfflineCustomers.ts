
import { useState, useCallback } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { Customer } from '../types';
import { useToast } from './use-toast';

export const useOfflineCustomers = () => {
  const { addOfflineOperation, getOfflineData, isOnline } = useOfflineManager();
  const { toast } = useToast();
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
      
      if (!isOnline) {
        toast({
          title: "Customer Created Offline",
          description: "Customer will sync when connection is restored.",
          duration: 3000,
        });
      }
      
      return customer;
      
    } catch (error) {
      console.error('[OfflineCustomers] Failed to create offline customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [addOfflineOperation, isOnline, toast]);

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
      
      if (!isOnline) {
        toast({
          title: "Customer Updated Offline",
          description: "Changes will sync when connection is restored.",
          duration: 3000,
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('[OfflineCustomers] Failed to update offline customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [addOfflineOperation, isOnline, toast]);

  const getOfflineCustomers = useCallback(async (): Promise<Customer[]> => {
    try {
      console.log('[OfflineCustomers] Loading customers from offline storage...');
      const customers = await getOfflineData('customers');
      const result = Array.isArray(customers) ? customers : [];
      console.log('[OfflineCustomers] Loaded customers:', result.length);
      return result;
    } catch (error) {
      console.error('[OfflineCustomers] Failed to get offline customers:', error);
      
      // Don't show error toast for data loading - this might be expected
      // Only log the error for debugging
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
