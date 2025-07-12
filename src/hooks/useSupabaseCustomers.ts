
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useOfflineFirstSupabase } from './useOfflineFirstSupabase';
import { Customer } from '../types';

export const useSupabaseCustomers = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Transform functions for field mapping
  const transformToLocal = (customer: any): Customer => ({
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
  });

  const transformFromLocal = (customer: any): Customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    address: customer.address || '',
    createdDate: customer.createdDate,
    totalPurchases: Number(customer.totalPurchases || 0),
    outstandingDebt: Number(customer.outstandingDebt || 0),
    creditLimit: Number(customer.creditLimit || 1000),
    riskRating: customer.riskRating || 'low',
    lastPurchaseDate: customer.lastPurchaseDate,
  });

  const loadFromSupabase = async () => {
    if (!user) throw new Error('No user authenticated');
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(transformToLocal);
  };

  const {
    data: customers,
    loading,
    error,
    refresh: refreshCustomers,
    isOnline
  } = useOfflineFirstSupabase<Customer>({
    cacheKey: 'customers',
    tableName: 'customers',
    loadFromSupabase,
    transformToLocal,
    transformFromLocal
  });

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

      // Transform and add to local state
      const newCustomer = transformToLocal(data);
      await refreshCustomers();
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

      const updatedCustomer = transformToLocal(data);
      await refreshCustomers();
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
      await refreshCustomers();
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

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isOnline) return;

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
          refreshCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOnline, refreshCustomers]);

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
  };
};
