
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const { getCache, setCache, addPendingOperation, pendingOps, clearPendingOperation, debugPendingOperations } = useCacheManager();
  
  // Track if we're currently loading to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);
  const syncInProgressRef = useRef(false);

  // Sync pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!user || !isOnline || syncInProgressRef.current) return;

    const customerOps = pendingOps.filter(op => op.type === 'customer');
    if (customerOps.length === 0) return;

    console.log('[UnifiedCustomers] Syncing', customerOps.length, 'pending customer operations');
    syncInProgressRef.current = true;

    const syncedCreates: Array<{tempId: string, realCustomer: Customer}> = [];

    for (const operation of customerOps) {
      try {
        let success = false;

        switch (operation.operation) {
          case 'create':
            console.log('[UnifiedCustomers] Syncing create operation:', operation.data);
            const createData = {
              name: operation.data.name,
              phone: operation.data.phone,
              email: operation.data.email,
              address: operation.data.address,
              total_purchases: operation.data.totalPurchases || 0,
              outstanding_debt: operation.data.outstandingDebt || 0,
              credit_limit: operation.data.creditLimit || 1000,
              risk_rating: operation.data.riskRating || 'low',
              last_purchase_date: operation.data.lastPurchaseDate,
              user_id: user.id,
            };

            const { data: createdData, error: createError } = await supabase
              .from('customers')
              .insert([createData])
              .select()
              .single();

            success = !createError;
            if (createError) {
              console.error('[UnifiedCustomers] Create sync failed:', createError);
            } else {
              console.log('[UnifiedCustomers] Create synced successfully');
              // Track temp ID to real customer mapping for replacement
              const tempId = operation.data.tempId || `temp_${operation.data.name}_${operation.data.phone}`;
              if (createdData) {
                syncedCreates.push({
                  tempId,
                  realCustomer: transformDbCustomer(createdData)
                });
              }
            }
            break;

          case 'update':
            console.log('[UnifiedCustomers] Syncing update operation:', operation.data);
            const updates = operation.data.updates;
            const dbUpdates: any = {};
            
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.totalPurchases !== undefined) dbUpdates.total_purchases = updates.totalPurchases;
            if (updates.outstandingDebt !== undefined) dbUpdates.outstanding_debt = updates.outstandingDebt;
            if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;
            if (updates.riskRating !== undefined) dbUpdates.risk_rating = updates.riskRating;
            if (updates.lastPurchaseDate !== undefined) dbUpdates.last_purchase_date = updates.lastPurchaseDate;

            const { error: updateError } = await supabase
              .from('customers')
              .update(dbUpdates)
              .eq('id', operation.data.id)
              .eq('user_id', user.id);

            success = !updateError;
            if (updateError) {
              console.error('[UnifiedCustomers] Update sync failed:', updateError);
            } else {
              console.log('[UnifiedCustomers] Update synced successfully');
            }
            break;

          case 'delete':
            console.log('[UnifiedCustomers] Syncing delete operation:', operation.data);
            const { error: deleteError } = await supabase
              .from('customers')
              .delete()
              .eq('id', operation.data.id)
              .eq('user_id', user.id);

            success = !deleteError;
            if (deleteError) {
              console.error('[UnifiedCustomers] Delete sync failed:', deleteError);
            } else {
              console.log('[UnifiedCustomers] Delete synced successfully');
            }
            break;
        }

        if (success) {
          clearPendingOperation(operation.id);
        }
      } catch (error) {
        console.error('[UnifiedCustomers] Error syncing operation:', operation.id, error);
      }
    }

    // Replace temp customers with real ones from sync
    if (syncedCreates.length > 0) {
      setCustomers(prev => {
        let updated = [...prev];
        
        for (const {tempId, realCustomer} of syncedCreates) {
          // Remove temp customer and add real one
          updated = updated.filter(c => !c.id.startsWith('temp_') || 
            !(c.name === realCustomer.name && c.phone === realCustomer.phone));
          updated.unshift(realCustomer);
        }
        
        // Remove duplicates and sort
        const uniqueCustomers = updated.filter((customer, index, self) => 
          index === self.findIndex(c => c.id === customer.id)
        ).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        
        setCache('customers', uniqueCustomers);
        return uniqueCustomers;
      });
    }

    syncInProgressRef.current = false;
    
    // Refresh data after sync
    await loadCustomers();
  }, [user, isOnline, pendingOps, clearPendingOperation]);

  // Load customers from cache or server
  const loadCustomers = useCallback(async () => {
    if (!user || isLoadingRef.current) {
      if (!user) {
        setCustomers([]);
        setLoading(false);
      }
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = getCache<Customer[]>('customers');
      if (cached && Array.isArray(cached)) {
        console.log('[UnifiedCustomers] Using cached data:', cached.length, 'customers');
        setCustomers(cached);
        setLoading(false);
        
        // If online, merge with server data instead of replacing
        if (isOnline) {
          try {
            const { data, error: fetchError } = await supabase
              .from('customers')
              .select('*')
              .eq('user_id', user.id)
              .order('created_date', { ascending: false });

            if (!fetchError && data) {
              const serverData = data.map(transformDbCustomer);
              
              // Get local customers that might have unsynced changes (excluding temp customers from completed syncs)
              const unsyncedLocal = cached.filter(customer => 
                customer.id.startsWith('temp_') && 
                !serverData.some(s => s.name === customer.name && s.phone === customer.phone)
              );
              
              // For synced customers, check if local version has newer data than server
              const mergedData: typeof cached = [];
              
              // Add unsynced local customers first
              mergedData.push(...unsyncedLocal);
              
              // For each server customer, check if we have local changes
              for (const serverCustomer of serverData) {
                const localCustomer = cached.find(c => c.id === serverCustomer.id);
                
                if (localCustomer) {
                  // Compare timestamps or specific fields to determine which is newer
                  // For debt updates, always trust the local version if it's different from server
                  const hasLocalChanges = localCustomer.outstandingDebt !== serverCustomer.outstandingDebt ||
                                        localCustomer.totalPurchases !== serverCustomer.totalPurchases ||
                                        localCustomer.lastPurchaseDate !== serverCustomer.lastPurchaseDate;
                  
                  if (hasLocalChanges) {
                    console.log('[UnifiedCustomers] Preserving local changes for customer:', localCustomer.name);
                    mergedData.push(localCustomer);
                  } else {
                    mergedData.push(serverCustomer);
                  }
                } else {
                  // New customer from server
                  mergedData.push(serverCustomer);
                }
              }
              
              // Remove duplicates and sort
              const uniqueData = mergedData.filter((customer, index, self) => 
                index === self.findIndex(c => c.id === customer.id)
              ).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
              
              // Only update if data actually changed
              if (JSON.stringify(uniqueData) !== JSON.stringify(cached)) {
                console.log('[UnifiedCustomers] Background refresh: updating cache with merged data');
                setCache('customers', uniqueData);
                setCustomers(uniqueData);
              }
            }
          } catch (bgError) {
            console.error('[UnifiedCustomers] Background refresh failed:', bgError);
          }
        }
        return;
      }

      // If no cache and online, fetch from server
      if (isOnline) {
        console.log('[UnifiedCustomers] No cache, fetching from server');
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
          console.log('[UnifiedCustomers] Fetched from server:', transformedData.length, 'customers');
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
      isLoadingRef.current = false;
    }
  }, [user?.id, isOnline, getCache, setCache]);

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
    setCustomers(prev => {
      const updated = [newCustomer, ...prev];
      setCache('customers', updated);
      return updated;
    });

    if (isOnline) {
      try {
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
        setCustomers(prev => {
          const updated = prev.map(c => c.id === newCustomer.id ? transformedCustomer : c);
          setCache('customers', updated);
          return updated;
        });

        return transformedCustomer;
      } catch (error) {
        console.error('[UnifiedCustomers] Create failed, queuing for sync:', error);
        addPendingOperation({
          type: 'customer',
          operation: 'create',
          data: { ...customerData, tempId: newCustomer.id },
        });
        return newCustomer;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'customer',
        operation: 'create',
        data: { ...customerData, tempId: newCustomer.id },
      });
      return newCustomer;
    }
  }, [user, isOnline, addPendingOperation, setCache]);

  // Update customer
  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    if (!user) throw new Error('User not authenticated');

    console.log('[UnifiedCustomers] updateCustomer called with:', {
      customerId: id,
      updates,
      isOnline,
      pendingOpsCount: pendingOps.length,
      userAuthenticated: !!user
    });

    // Find the current customer for reference
    const currentCustomer = customers.find(c => c.id === id);
    console.log('[UnifiedCustomers] Current customer data:', currentCustomer);

    // Optimistically update UI
    setCustomers(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      setCache('customers', updated);
      console.log('[UnifiedCustomers] Optimistically updated customer in UI');
      return updated;
    });

    if (isOnline) {
      try {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.totalPurchases !== undefined) dbUpdates.total_purchases = updates.totalPurchases;
        if (updates.outstandingDebt !== undefined) dbUpdates.outstanding_debt = updates.outstandingDebt;
        if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;
        if (updates.riskRating !== undefined) dbUpdates.risk_rating = updates.riskRating;
        if (updates.lastPurchaseDate !== undefined) dbUpdates.last_purchase_date = updates.lastPurchaseDate;

        console.log('[UnifiedCustomers] Preparing database update:', dbUpdates);

        const { error } = await supabase
          .from('customers')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('[UnifiedCustomers] Customer updated successfully in database');
        
        // Refresh customers data to ensure consistency
        await loadCustomers();
      } catch (error) {
        console.error('[UnifiedCustomers] Update failed, queuing for sync:', error);
        
        // Add pending operation for offline sync
        const operationData = { id, updates };
        addPendingOperation({
          type: 'customer',
          operation: 'update',
          data: operationData,
        });
        
        console.log('[UnifiedCustomers] Added pending operation for customer update:', operationData);
      }
    } else {
      console.log('[UnifiedCustomers] Offline mode - queuing customer update for sync');
      
      // Queue for sync when online
      const operationData = { id, updates };
      addPendingOperation({
        type: 'customer',
        operation: 'update',
        data: operationData,
      });
      
      console.log('[UnifiedCustomers] Added pending operation for offline customer update:', operationData);
    }
  }, [user, isOnline, addPendingOperation, setCache, customers, pendingOps.length, loadCustomers]);

  // Delete customer
  const deleteCustomer = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    // Store original data for potential rollback
    const originalCustomer = customers.find(c => c.id === id);

    // Optimistically update UI
    setCustomers(prev => {
      const filtered = prev.filter(c => c.id !== id);
      setCache('customers', filtered);
      return filtered;
    });

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log('[UnifiedCustomers] Customer deleted successfully');
      } catch (error) {
        console.error('[UnifiedCustomers] Delete failed, queuing for sync:', error);
        
        // Rollback optimistic update
        if (originalCustomer) {
          setCustomers(prev => {
            const restored = [...prev, originalCustomer].sort((a, b) => 
              new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
            );
            setCache('customers', restored);
            return restored;
          });
        }
        
        addPendingOperation({
          type: 'customer',
          operation: 'delete',
          data: { id },
        });
        throw error;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'customer',
        operation: 'delete',
        data: { id },
      });
    }
  }, [user, isOnline, addPendingOperation, setCache, customers]);

  // Load customers on mount and when user changes
  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user?.id]);

  // Listen for network reconnection and sync events
  useEffect(() => {
    const handleReconnect = async () => {
      if (user && isOnline) {
        console.log('[UnifiedCustomers] Network reconnected, syncing pending operations');
        await syncPendingOperations();
      }
    };

    const handleSyncComplete = () => {
      console.log('[UnifiedCustomers] Sync completed, refreshing data');
      loadCustomers();
    };

    const handleCustomersSync = () => {
      console.log('[UnifiedCustomers] Customers sync event received, refreshing data');
      loadCustomers();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('data-synced', handleSyncComplete);
    window.addEventListener('customers-synced', handleCustomersSync);
    
    return () => {
      window.removeEventListener('network-reconnected', handleReconnect);
      window.removeEventListener('sync-completed', handleSyncComplete);
      window.removeEventListener('data-synced', handleSyncComplete);
      window.removeEventListener('customers-synced', handleCustomersSync);
    };
  }, [user?.id, isOnline, syncPendingOperations, loadCustomers]);

  // Sync pending operations when coming online
  useEffect(() => {
    if (isOnline && pendingOps.filter(op => op.type === 'customer').length > 0) {
      const timer = setTimeout(() => {
        syncPendingOperations();
      }, 1000); // Delay to ensure stable connection

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOps, syncPendingOperations]);

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: loadCustomers,
    isOnline,
    pendingOperations: pendingOps.filter(op => op.type === 'customer').length,
    syncPendingOperations,
  };
};
