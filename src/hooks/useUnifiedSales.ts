
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
  paymentMethod: (dbSale.payment_method as 'cash' | 'mpesa' | 'debt' | 'partial' | 'split') || 'cash',
  paymentDetails: typeof dbSale.payment_details === 'object' && dbSale.payment_details 
    ? {
        cashAmount: dbSale.payment_details.cashAmount ?? 0,
        mpesaAmount: dbSale.payment_details.mpesaAmount ?? 0,
        debtAmount: dbSale.payment_details.debtAmount ?? 0,
        mpesaReference: dbSale.payment_details.mpesaReference,
        tillNumber: dbSale.payment_details.tillNumber,
        discountAmount: dbSale.payment_details.discountAmount ?? 0,
      }
    : {
        cashAmount: 0,
        mpesaAmount: 0,
        debtAmount: 0,
        discountAmount: 0,
      },
  timestamp: dbSale.timestamp,
  synced: dbSale.synced || true,
  clientSaleId: dbSale.client_sale_id || undefined,
  offlineId: dbSale.offline_id || undefined,
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
        
        // If online, merge with server data instead of replacing
        if (isOnline) {
          const { data, error: fetchError } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

          if (!fetchError && data) {
            const serverData = data.map(transformDbSale);
            
            // Merge local unsynced data with server data
            const unsyncedLocal = cached.filter(sale => sale.id.startsWith('temp_'));
            const mergedData = [...unsyncedLocal, ...serverData];
            
            // Remove duplicates and sort
            const uniqueData = mergedData.filter((sale, index, self) => 
              index === self.findIndex(s => s.id === sale.id)
            ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            setCache('sales', uniqueData);
            setSales(uniqueData);
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

    // Optimistically update UI and cache
    setSales(prev => {
      const updated = [newSale, ...prev];
      setCache('sales', updated);
      return updated;
    });

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

        // Update cache and preserve any unsynced local (temp_) sales
        const updatedSales = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });
        
        if (updatedSales.data) {
          const transformedData = updatedSales.data.map(transformDbSale);
          const currentCached = getCache<Sale[]>('sales') || [];
          const unsyncedLocal = currentCached.filter(s => s.id?.startsWith?.('temp_'));
          const merged = [...unsyncedLocal, ...transformedData]
            .filter((sale, index, self) => index === self.findIndex(s => s.id === sale.id))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setCache('sales', merged);
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
      console.log('[UnifiedSales] Sale created offline and queued for sync');
      return newSale;
    }
  }, [user, isOnline, setCache, addPendingOperation, getCache]);

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

    const handleSalesSync = () => {
      console.log('[UnifiedSales] Sales sync event received, refreshing data');
      loadSales();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('data-synced', handleSyncComplete);
    window.addEventListener('sales-synced', handleSalesSync);
    
    return () => {
      window.removeEventListener('network-reconnected', handleReconnect);
      window.removeEventListener('sync-completed', handleSyncComplete);
      window.removeEventListener('data-synced', handleSyncComplete);
      window.removeEventListener('sales-synced', handleSalesSync);
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
