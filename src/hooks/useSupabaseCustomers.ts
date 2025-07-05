
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Customer } from '../types';

export const useSupabaseCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load customers from database
  const loadCustomers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedCustomers: Customer[] = data.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        createdDate: customer.created_date || customer.created_at,
        totalPurchases: Number(customer.total_purchases || 0),
        outstandingDebt: Number(customer.outstanding_debt || 0),
        creditLimit: Number(customer.credit_limit || 1000),
        riskRating: customer.risk_rating as 'low' | 'medium' | 'high',
        lastPurchaseDate: customer.last_purchase_date,
      }));

      setCustomers(mappedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create customer
  const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address,
          total_purchases: customerData.totalPurchases,
          outstanding_debt: customerData.outstandingDebt,
          credit_limit: customerData.creditLimit,
          risk_rating: customerData.riskRating,
          last_purchase_date: customerData.lastPurchaseDate,
        })
        .select()
        .single();

      if (error) throw error;

      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        createdDate: data.created_date || data.created_at,
        totalPurchases: Number(data.total_purchases || 0),
        outstandingDebt: Number(data.outstanding_debt || 0),
        creditLimit: Number(data.credit_limit || 1000),
        riskRating: data.risk_rating as 'low' | 'medium' | 'high',
        lastPurchaseDate: data.last_purchase_date,
      };

      setCustomers(prev => [newCustomer, ...prev]);
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update customer
  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email,
          address: updates.address,
          total_purchases: updates.totalPurchases,
          outstanding_debt: updates.outstandingDebt,
          credit_limit: updates.creditLimit,
          risk_rating: updates.riskRating,
          last_purchase_date: updates.lastPurchaseDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedCustomer: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        createdDate: data.created_date || data.created_at,
        totalPurchases: Number(data.total_purchases || 0),
        outstandingDebt: Number(data.outstanding_debt || 0),
        creditLimit: Number(data.credit_limit || 1000),
        riskRating: data.risk_rating as 'low' | 'medium' | 'high',
        lastPurchaseDate: data.last_purchase_date,
      };

      setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete customer
  const deleteCustomer = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Migrate localStorage data to database
  const migrateLocalStorageData = async () => {
    if (!user) return;

    try {
      const localData = localStorage.getItem('dts_customers');
      if (!localData) return;

      const localCustomers = JSON.parse(localData);
      if (!Array.isArray(localCustomers) || localCustomers.length === 0) return;

      console.log('Migrating customers from localStorage:', localCustomers.length);

      for (const customer of localCustomers) {
        await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            address: customer.address || '',
            total_purchases: customer.totalPurchases || 0,
            outstanding_debt: customer.outstandingDebt || 0,
            credit_limit: customer.creditLimit || 1000,
            risk_rating: customer.riskRating || 'low',
            last_purchase_date: customer.lastPurchaseDate,
            created_date: customer.createdDate || new Date().toISOString(),
          });
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('dts_customers');
      console.log('Customers migrated successfully');

      // Reload customers from database
      await loadCustomers();
    } catch (error) {
      console.error('Error migrating customers:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load customers and migrate data on mount
  useEffect(() => {
    if (user) {
      loadCustomers().then(() => {
        migrateLocalStorageData();
      });
    }
  }, [user]);

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers: loadCustomers,
  };
};
