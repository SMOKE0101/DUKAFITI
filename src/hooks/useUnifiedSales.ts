
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { Sale } from '../types';

// Helper function to transform database sale to interface
const transformDbSale = (dbSale: any): Sale => ({
  id: dbSale.id,
  productId: dbSale.product_id,
  productName: dbSale.product_name,
  customerId: dbSale.customer_id,
  customerName: dbSale.customer_name,
  quantity: dbSale.quantity,
  sellingPrice: dbSale.selling_price,
  costPrice: dbSale.cost_price,
  profit: dbSale.profit,
  total: dbSale.total_amount,
  paymentMethod: (dbSale.payment_method as 'cash' | 'mpesa' | 'debt' | 'partial') || 'cash',
  paymentDetails: typeof dbSale.payment_details === 'object' && dbSale.payment_details 
    ? dbSale.payment_details as {
        cashAmount: number;
        mpesaAmount: number;
        debtAmount: number;
        mpesaReference?: string;
        tillNumber?: string;
      }
    : {
        cashAmount: 0,
        mpesaAmount: 0,
        debtAmount: 0,
      },
  timestamp: dbSale.timestamp,
  synced: dbSale.synced || true,
});

export const useUnifiedSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, addPendingOperation, pendingOps } = useCacheManager();

  // Load sales from cache or server
  const loadSales = useCallback(async () => {
    if (!user) {
      setSales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = getCache<Sale[]>('sales');
      if (cached) {
        setSales(cached);
        setLoading(false);
        
        // If online, refresh in background
        if (isOnline) {
          const { data, error: fetchError } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

          if (!fetchError && data) {
            const transformedData = data.map(transformDbSale);
            setCache('sales', transformedData);
            setSales(transformedData);
          }
        }
        return;
      }

      // If no cache and online, fetch from server
      if (isOnline) {
        const { data, error: fetchError } = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });

        if (fetchError) {
          setError('Failed to load sales');
          console.error('[UnifiedSales] Fetch error:', fetchError);
        } else {
          const transformedData = (data || []).map(transformDbSale);
          setCache('sales', transformedData);
          setSales(transformedData);
        }
      } else {
        setError('No cached data available offline');
      }
    } catch (err) {
      setError('Failed to load sales');
      console.error('[UnifiedSales] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, getCache, setCache]);

  // Create sale
  const createSale = useCallback(async (saleData: Omit<Sale, 'id' | 'synced'>) => {
    if (!user) throw new Error('User not authenticated');

    const newSale: Sale = {
      ...saleData,
      id: `temp_${Date.now()}`,
      synced: false,
      timestamp: saleData.timestamp || new Date().toISOString(),
    };

    // Optimistically update UI
    setSales(prev => [newSale, ...prev]);

    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('sales')
          .insert([{
            user_id: user.id,
            product_id: saleData.productId,
            product_name: saleData.productName,
            customer_id: saleData.customerId,
            customer_name: saleData.customerName,
            quantity: saleData.quantity,
            selling_price: saleData.sellingPrice,
            cost_price: saleData.costPrice,
            profit: saleData.profit,
            total_amount: saleData.total,
            payment_method: saleData.paymentMethod,
            payment_details: saleData.paymentDetails,
            timestamp: newSale.timestamp,
            synced: true,
          }])
          .select()
          .single();

        if (error) throw error;

        const transformedSale = transformDbSale(data);

        // Replace temp sale with real one
        setSales(prev => 
          prev.map(s => s.id === newSale.id ? transformedSale : s)
        );

        // Update cache
        const updatedSales = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });
        
        if (updatedSales.data) {
          const transformedData = updatedSales.data.map(transformDbSale);
          setCache('sales', transformedData);
        }

        return transformedSale;
      } catch (error) {
        // Revert optimistic update and queue for sync
        setSales(prev => prev.filter(s => s.id !== newSale.id));
        addPendingOperation({
          type: 'sale',
          operation: 'create',
          data: saleData,
        });
        console.error('[UnifiedSales] Create failed, queued for sync:', error);
        return newSale;
      }
    } else {
      // Queue for sync when online
      addPendingOperation({
        type: 'sale',
        operation: 'create',
        data: saleData,
      });
      return newSale;
    }
  }, [user, isOnline, setCache, addPendingOperation]);

  // Load sales on mount and when dependencies change
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Listen for network reconnection and sync events
  useEffect(() => {
    const handleReconnect = () => {
      console.log('[UnifiedSales] Network reconnected, refreshing data');
      loadSales();
    };

    const handleSyncComplete = () => {
      console.log('[UnifiedSales] Sync completed, refreshing data');
      loadSales();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('data-synced', handleSyncComplete);
    
    return () => {
      window.removeEventListener('network-reconnected', handleReconnect);
      window.removeEventListener('sync-completed', handleSyncComplete);
      window.removeEventListener('data-synced', handleSyncComplete);
    };
  }, [loadSales]);

  return {
    sales,
    loading,
    error,
    createSale,
    refetch: loadSales,
    isOnline,
    pendingOperations: pendingOps.filter(op => op.type === 'sale').length,
  };
};
