import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useNetworkStatus } from './useNetworkStatus';
import { useLocalStorage } from './useLocalStorage';
import { useCacheManager } from './useCacheManager';
import { Customer } from '../types';

// Export the Customer type
export type { Customer };

// Helper function to transform database customer to interface
const transformDbCustomer = (dbCustomer: any): Customer => ({
  id: dbCustomer.id,
  name: dbCustomer.name,
  phone: dbCustomer.phone,
  email: dbCustomer.email,
  address: dbCustomer.address,
  createdDate: dbCustomer.created_date || dbCustomer.created_at,
  totalPurchases: Number(dbCustomer.total_purchases) || 0,
  outstandingDebt: Number(dbCustomer.outstanding_debt) || 0,
  creditLimit: Number(dbCustomer.credit_limit) || 1000,
  lastPurchaseDate: dbCustomer.last_purchase_date,
  riskRating: (dbCustomer.risk_rating as 'low' | 'medium' | 'high') || 'low',
});

// Helper function to transform interface customer to database format
const transformToDbCustomer = (customer: Omit<Customer, 'id'>, userId: string) => ({
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
  total_purchases: Number(customer.totalPurchases) || 0,
  outstanding_debt: Number(customer.outstandingDebt) || 0,
  credit_limit: Number(customer.creditLimit) || 1000,
  risk_rating: customer.riskRating || 'low',
  last_purchase_date: customer.lastPurchaseDate,
  user_id: userId,
});

export const useSupabaseCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { setValue } = useLocalStorage('customers', []);
  const { addPendingOperation } = useCacheManager();

  const fetchCustomers = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_date', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          const transformedCustomers = data.map(transformDbCustomer);
          setCustomers(transformedCustomers);
          setValue(transformedCustomers);
        }
      } else {
        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
          setCustomers(JSON.parse(storedCustomers));
        } else {
          setCustomers([]);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user, isOnline]);

  const createCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbCustomerData = transformToDbCustomer(customerData, user.id);
      
      const { data, error } = await supabase
        .from('customers')
        .insert([dbCustomerData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const transformedCustomer = transformDbCustomer(data);
        setCustomers(prevCustomers => [transformedCustomer, ...prevCustomers]);
        setValue([transformedCustomer, ...customers]);
        return transformedCustomer;
      } else {
        throw new Error('Customer creation failed: No data returned');
      }
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<void> => {
    if (isOnline) {
      try {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.phone) dbUpdates.phone = updates.phone;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.address) dbUpdates.address = updates.address;
        if (updates.totalPurchases !== undefined) dbUpdates.total_purchases = Number(updates.totalPurchases);
        if (updates.outstandingDebt !== undefined) dbUpdates.outstanding_debt = Number(updates.outstandingDebt);
        if (updates.creditLimit !== undefined) dbUpdates.credit_limit = Number(updates.creditLimit);
        if (updates.riskRating) dbUpdates.risk_rating = updates.riskRating;
        if (updates.lastPurchaseDate !== undefined) dbUpdates.last_purchase_date = updates.lastPurchaseDate;

        const { data, error } = await supabase
          .from('customers')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user?.id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          const transformedCustomer = transformDbCustomer(data);
          setCustomers(prevCustomers =>
            prevCustomers.map(customer => (customer.id === id ? transformedCustomer : customer))
          );
          const updatedCustomers = customers.map(customer => (customer.id === id ? transformedCustomer : customer));
          setValue(updatedCustomers);
        }
      } catch (error: any) {
        console.error('Failed to update customer:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to update customer. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    } else {
      addPendingOperation({ 
        type: 'customer', 
        operation: 'update', 
        data: { id, updates } 
      });

      setCustomers(prevCustomers =>
        prevCustomers.map(customer => (customer.id === id ? { ...customer, ...updates } : customer))
      );
      const updatedCustomers = customers.map(customer => (customer.id === id ? { ...customer, ...updates } : customer));
      setValue(updatedCustomers);
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== id));
      const updatedCustomers = customers.filter(customer => customer.id !== id);
      setValue(updatedCustomers);
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
