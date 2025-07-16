
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '../integrations/supabase/client';
import { Customer } from '../types';

export const useSupabaseCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_date', { ascending: false });

      if (fetchError) throw fetchError;

      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_date' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          user_id: user.id,
          created_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating customer:', err);
      throw err;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => prev.map(customer => 
        customer.id === id ? { ...customer, ...data } : customer
      ));

      return data;
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  };

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers
  };
};
