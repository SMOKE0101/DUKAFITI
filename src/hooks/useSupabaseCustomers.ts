
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
    createdDate: customer.created_date || customer.created_at || customer.createdDate,
    totalPurchases: Number(customer.total_purchases || customer.totalPurchases || 0),
    outstandingDebt: Number(customer.outstanding_debt || customer.outstandingDebt || 0),
    creditLimit: Number(customer.credit_limit || customer.creditLimit || 1000),
    riskRating: (customer.risk_rating || customer.riskRating || 'low') as 'low' | 'medium' | 'high',
    lastPurchaseDate: customer.last_purchase_date || customer.lastPurchaseDate,
  });

  const transformFromLocal = (customer: Customer): any => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    address: customer.address || '',
    created_date: customer.createdDate,
    total_purchases: Number(customer.totalPurchases || 0),
    outstanding_debt: Number(customer.outstandingDebt || 0),
    credit_limit: Number(customer.creditLimit || 1000),
    risk_rating: customer.riskRating || 'low',
    last_purchase_date: customer.lastPurchaseDate,
  });

  const loadFromSupabase = async () => {
    if (!user) throw new Error('No user authenticated');
    
    console.log('[useSupabaseCustomers] Loading customers from Supabase...');
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useSupabaseCustomers] Supabase error:', error);
      throw error;
    }

    console.log('[useSupabaseCustomers] Loaded customers from Supabase:', data?.length || 0);
    return data ? data.map(transformToLocal) : [];
  };

  const {
    data: customers,
    loading,
    error,
    refresh: refreshCustomers,
    isOnline,
    lastSyncTime,
    testOffline
  } = useOfflineFirstSupabase<Customer>({
    cacheKey: 'customers',
    tableName: 'customers',
    loadFromSupabase,
    transformToLocal,
    transformFromLocal
  });

  // Create customer with offline support
  const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdDate'>) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseCustomers] Creating customer:', customerData);

      if (!isOnline) {
        // Work offline: create the customer locally and queue for sync
        const newCustomer: Customer = {
          ...customerData,
          id: `offline_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdDate: new Date().toISOString(),
        };

        // Store the operation for sync
        const createOperation = {
          id: `customer_create_${newCustomer.id}_${Date.now()}`,
          type: 'customer' as const,
          operation: 'create' as const,
          data: newCustomer,
          timestamp: new Date().toISOString(),
        };

        const pendingOps = JSON.parse(localStorage.getItem('offline_customer_creates') || '[]');
        pendingOps.push(createOperation);
        localStorage.setItem('offline_customer_creates', JSON.stringify(pendingOps));

        toast({
          title: "Offline Mode",
          description: "Customer saved locally and will sync when online",
          variant: "default",
        });

        return newCustomer;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address,
          total_purchases: customerData.totalPurchases || 0,
          outstanding_debt: customerData.outstandingDebt || 0,
          credit_limit: customerData.creditLimit || 1000,
          risk_rating: customerData.riskRating || 'low',
          last_purchase_date: customerData.lastPurchaseDate,
        })
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseCustomers] Create error:', error);
        throw error;
      }

      console.log('[useSupabaseCustomers] Customer created successfully:', data);
      const newCustomer = transformToLocal(data);
      
      // Refresh data to sync with cache
      await refreshCustomers();
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      return newCustomer;
    } catch (error) {
      console.error('[useSupabaseCustomers] Create customer error:', error);
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update customer with offline support
  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseCustomers] Updating customer:', id, updates);

      if (!isOnline) {
        // Work offline: queue the update operation and update local cache
        const currentCustomers = customers || [];
        const customerIndex = currentCustomers.findIndex(c => c.id === id);
        
        if (customerIndex === -1) {
          throw new Error('Customer not found');
        }

        // Create a proper offline update operation
        const updateOperation = {
          id: `customer_update_${id}_${Date.now()}`,
          type: 'customer' as const,
          operation: 'update' as const,
          data: { customerId: id, updates },
          timestamp: new Date().toISOString(),
        };

        // Store the operation for sync (using localStorage as fallback)
        const pendingOps = JSON.parse(localStorage.getItem('offline_customer_updates') || '[]');
        pendingOps.push(updateOperation);
        localStorage.setItem('offline_customer_updates', JSON.stringify(pendingOps));

        const updatedCustomer = { ...currentCustomers[customerIndex], ...updates };
        
        toast({
          title: "Offline Mode", 
          description: "Changes saved and will sync when online",
          variant: "default",
        });

        return updatedCustomer;
      }

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

      if (error) {
        console.error('[useSupabaseCustomers] Update error:', error);
        throw error;
      }

      console.log('[useSupabaseCustomers] Customer updated successfully:', data);
      const updatedCustomer = transformToLocal(data);
      
      // Refresh data to sync with cache
      await refreshCustomers();
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      return updatedCustomer;
    } catch (error) {
      console.error('[useSupabaseCustomers] Update customer error:', error);
      toast({
        title: "Error",
        description: `Failed to update customer: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete customer with offline support
  const deleteCustomer = async (id: string) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseCustomers] Deleting customer:', id);

      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Cannot delete customer while offline",
          variant: "destructive",
        });
        throw new Error('Cannot delete customer while offline');
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseCustomers] Delete error:', error);
        throw error;
      }

      console.log('[useSupabaseCustomers] Customer deleted successfully');
      
      // Refresh data to sync with cache
      await refreshCustomers();
      
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      console.error('[useSupabaseCustomers] Delete customer error:', error);
      toast({
        title: "Error",
        description: `Failed to delete customer: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Set up real-time subscription and offline sync
  useEffect(() => {
    if (!user || !isOnline) return;

    console.log('[useSupabaseCustomers] Setting up real-time subscription');
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
        (payload) => {
          console.log('[useSupabaseCustomers] Real-time change detected:', payload);
          refreshCustomers();
        }
      )
      .subscribe();

    // Process offline operations when coming online
    processOfflineOperations();

    return () => {
      console.log('[useSupabaseCustomers] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, isOnline, refreshCustomers]);

  // Process offline operations when coming online
  const processOfflineOperations = async () => {
    if (!user || !isOnline) return;

    try {
      // Process offline customer creates
      const pendingCreates = JSON.parse(localStorage.getItem('offline_customer_creates') || '[]');
      for (const operation of pendingCreates) {
        try {
          const { data, error } = await supabase
            .from('customers')
            .insert({
              user_id: user.id,
              name: operation.data.name,
              phone: operation.data.phone,
              email: operation.data.email || '',
              address: operation.data.address || '',
              total_purchases: operation.data.totalPurchases || 0,
              outstanding_debt: operation.data.outstandingDebt || 0,
              credit_limit: operation.data.creditLimit || 1000,
              risk_rating: operation.data.riskRating || 'low',
              last_purchase_date: operation.data.lastPurchaseDate,
            })
            .select()
            .single();

          if (!error) {
            console.log('[useSupabaseCustomers] Synced offline customer create:', data);
          }
        } catch (error) {
          console.error('[useSupabaseCustomers] Failed to sync customer create:', error);
        }
      }
      localStorage.removeItem('offline_customer_creates');

      // Process offline customer updates
      const pendingUpdates = JSON.parse(localStorage.getItem('offline_customer_updates') || '[]');
      for (const operation of pendingUpdates) {
        try {
          const { customerId, updates } = operation.data;
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
            .eq('id', customerId)
            .select()
            .single();

          if (!error) {
            console.log('[useSupabaseCustomers] Synced offline customer update:', data);
          }
        } catch (error) {
          console.error('[useSupabaseCustomers] Failed to sync customer update:', error);
        }
      }
      localStorage.removeItem('offline_customer_updates');

      // Refresh data after sync
      if (pendingCreates.length > 0 || pendingUpdates.length > 0) {
        await refreshCustomers();
        toast({
          title: "Sync Complete",
          description: `Synced ${pendingCreates.length + pendingUpdates.length} customer changes`,
        });
      }
    } catch (error) {
      console.error('[useSupabaseCustomers] Offline sync failed:', error);
    }
  };

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
    isOnline,
    lastSyncTime,
    testOffline
  };
};
