import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useNetworkStatus } from './useNetworkStatus';
import { useLocalStorage } from './useLocalStorage';
import { useUnifiedOfflineManager } from './useUnifiedOfflineManager';
import { Customer } from '../types';

export const useSupabaseCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { setValue } = useLocalStorage('customers', []);
  const { addOfflineOperation } = useUnifiedOfflineManager();

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user, isOnline]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('createdDate', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          setCustomers(data);
          setValue(data); // Update local storage
        }
      } else {
        // Load from local storage when offline
        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
          setCustomers(JSON.parse(storedCustomers));
        } else {
          setCustomers([]);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        setCustomers(prevCustomers => [data, ...prevCustomers]);
        setValue([data, ...customers]); // Optimistically update local storage
        return data;
      } else {
        throw new Error('Customer creation failed: No data returned');
      }
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          setCustomers(prevCustomers =>
            prevCustomers.map(customer => (customer.id === id ? data : customer))
          );
          setValue(customers.map(customer => (customer.id === id ? data : customer))); // Update local storage
        }
      } catch (error: any) {
        console.error('Failed to update customer:', error);
        toast({
          title: "Error",
          description: "Failed to update customer. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Queue update for sync when online
      await addOfflineOperation('customer', 'update', { id, updates }, 'medium');

      // Optimistically update local state
      setCustomers(prevCustomers =>
        prevCustomers.map(customer => (customer.id === id ? { ...customer, ...updates } : customer))
      );
      setValue(customers.map(customer => (customer.id === id ? { ...customer, ...updates } : customer))); // Update local storage
    }
  };

  return {
    customers,
    loading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
  };
};
