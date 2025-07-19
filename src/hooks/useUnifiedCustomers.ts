
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { Customer } from '../types';

// Helper function to transform database customer to interface
const transformDbCustomer = (dbCustomer: any): Customer => ({
  id: dbCustomer.id,
  name: dbCustomer.name,
  phone: dbCustomer.phone,
  email: dbCustomer.email,
  address: dbCustomer.address,
  createdDate: dbCustomer.created_date || dbCustomer.created_at,
  totalPurchases: dbCustomer.total_purchases || 0,
  outstandingDebt: dbCustomer.outstanding_debt || 0,
  creditLimit: dbCustomer.credit_limit || 1000,
  lastPurchaseDate: dbCustomer.last_purchase_date,
  riskRating: (dbCustomer.risk_rating as 'low' | 'medium' | 'high') || 'low',
});

export const useUnifiedCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, addPendingOperation, pendingOps } = useCacheManager();

  // Load customers from cache or server
  const loadCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = getCache<Customer[]>('customers');
      if (cached) {
        setCustomers(cached);
        setLoading(false);
        
        // If online, refresh in background
        if (isOnline) {
          const { data, error: fetchError } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .order('created_date', { ascending: false });

          if (!fetchError && data) {
            const transformedData = data.map(transformDbCustomer);
            setCache('customers', transformedData);
            setCustomers(transformedData);
          }
        }
        return;
      }

      // If no cache and online, fetch from server
      if (isOnline) {
        const { data, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_date', { ascending: false });

        if (fetchError) {
          setError('Failed to load customers');
          console.error('[UnifiedCustomers] Fetch error:', fetchError);
        } else {
          const transformedData = (data || []).map(transformDbCustomer);
          setCache('customers', transformedData);
          setCustomers(transformedData);
        }
      } else {
        setError('No cached data available offline');
      }
    } catch (err) {
      setError('Failed to load customers');
      console.error('[UnifiedCustomers] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, getCache, setCache]);

  // Create customer
  const createCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdDate'>) => {
    if (!user) throw new Error('User not authenticated');

    const newCustomer: Customer = {
      ...customerData,
      id: `temp_${Date.now()}`,
      createdDate: new Date().toISOString(),
      totalPurchases: customerData.totalPurchases || 0,
      outstandingDebt: customerData.outstandingDebt || 0,
      creditLimit: customerData.creditLimit || 1000,
    };

    // Optimistically update UI
    setCustomers(prev => [newCustomer, ...prev]);

    if (isOnline) {
      try {
        // Transform interface to database format
        const dbData = {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address,
          total_purchases: customerData.totalPurchases || 0,
          outstanding_debt: customerData.outstandingDebt || 0,
          credit_limit: customerData.creditLimit || 1000,
          risk_rating: customerData.riskRating || 'low',
          last_purchase_date: customerData.lastPurchaseDate,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from('customers')
          .insert([dbData])
          .select()
          .single();

        if (error) throw error;

        const transformedCustomer = transformDbCustomer(data);
        
        // Replace temp customer with real one
        setCustomers(prev => 
          prev.map(c => c.id === newCustomer.id ? transformedCustomer : c)
        );

        // Update cache
        const updatedCustomers = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id);
        
        if (updatedCustomers.data) {
          const transformedData = updatedCustomers.data.map(transformDbCustomer);
          setCache('customers', transformedData);
        }

        return transformedCustomer;
      } catch (error) {
        // Revert optimistic update and queue for sync
        setCustomers(prev => prev.filter(c => c.id !== newCustomer.id));
        addPendingOperation({
          type: 'customer',
          operation: 'create',
          data: customerData,
        });
        console.error('[UnifiedCustomers] Create failed, queued for sync:', error);
        return newCustomer;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'customer',
        operation: 'create',
        data: customerData,
      });
      return newCustomer;
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Update customer
  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    if (!user) throw new Error('User not authenticated');

    // Optimistically update UI
    setCustomers(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );

    if (isOnline) {
      try {
        // Transform interface updates to database format
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.phone) dbUpdates.phone = updates.phone;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.address) dbUpdates.address = updates.address;
        if (updates.totalPurchases !== undefined) dbUpdates.total_purchases = updates.totalPurchases;
        if (updates.outstandingDebt !== undefined) dbUpdates.outstanding_debt = updates.outstandingDebt;
        if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;
        if (updates.riskRating) dbUpdates.risk_rating = updates.riskRating;
        if (updates.lastPurchaseDate !== undefined) dbUpdates.last_purchase_date = updates.lastPurchaseDate;

        const { error } = await supabase
          .from('customers')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update cache
        const updatedCustomers = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id);
        
        if (updatedCustomers.data) {
          const transformedData = updatedCustomers.data.map(transformDbCustomer);
          setCache('customers', transformedData);
        }
      } catch (error) {
        // Revert optimistic update and queue for sync
        await loadCustomers();
        addPendingOperation({
          type: 'customer',
          operation: 'update',
          data: { id, updates },
        });
        console.error('[UnifiedCustomers] Update failed, queued for sync:', error);
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'customer',
        operation: 'update',
        data: { id, updates },
      });
    }
  }, [user, isOnline, setCache, addPendingOperation, loadCustomers]);

  // Load customers on mount and when dependencies change
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Listen for network reconnection
  useEffect(() => {
    const handleReconnect = () => {
      loadCustomers();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    return () => window.removeEventListener('network-reconnected', handleReconnect);
  }, [loadCustomers]);

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    refetch: loadCustomers,
    isOnline,
    pendingOperations: pendingOps.filter(op => op.type === 'customer').length,
  };
};
