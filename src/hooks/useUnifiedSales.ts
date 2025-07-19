
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { Sale } from '../types';

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
            const formattedData = data.map(item => ({
              id: item.id,
              userId: item.user_id,
              productId: item.product_id,
              productName: item.product_name,
              customerId: item.customer_id,
              customerName: item.customer_name,
              quantity: item.quantity,
              sellingPrice: item.selling_price,
              costPrice: item.cost_price,
              profit: item.profit,
              totalAmount: item.total_amount,
              paymentMethod: item.payment_method,
              timestamp: item.timestamp,
              synced: item.synced,
            }));
            setCache('sales', formattedData);
            setSales(formattedData);
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
          const formattedData = (data || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            productId: item.product_id,
            productName: item.product_name,
            customerId: item.customer_id,
            customerName: item.customer_name,
            quantity: item.quantity,
            sellingPrice: item.selling_price,
            costPrice: item.cost_price,
            profit: item.profit,
            totalAmount: item.total_amount,
            paymentMethod: item.payment_method,
            timestamp: item.timestamp,
            synced: item.synced,
          }));
          setCache('sales', formattedData);
          setSales(formattedData);
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
  const createSale = useCallback(async (saleData: Omit<Sale, 'id' | 'userId' | 'synced'>) => {
    if (!user) throw new Error('User not authenticated');

    const newSale: Sale = {
      ...saleData,
      id: `temp_${Date.now()}`,
      userId: user.id,
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
            total_amount: saleData.totalAmount,
            payment_method: saleData.paymentMethod,
            timestamp: newSale.timestamp,
            synced: true,
          }])
          .select()
          .single();

        if (error) throw error;

        const formattedSale: Sale = {
          id: data.id,
          userId: data.user_id,
          productId: data.product_id,
          productName: data.product_name,
          customerId: data.customer_id,
          customerName: data.customer_name,
          quantity: data.quantity,
          sellingPrice: data.selling_price,
          costPrice: data.cost_price,
          profit: data.profit,
          totalAmount: data.total_amount,
          paymentMethod: data.payment_method,
          timestamp: data.timestamp,
          synced: data.synced,
        };

        // Replace temp sale with real one
        setSales(prev => 
          prev.map(s => s.id === newSale.id ? formattedSale : s)
        );

        // Update cache
        const updatedSales = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id);
        
        if (updatedSales.data) {
          const formattedData = updatedSales.data.map(item => ({
            id: item.id,
            userId: item.user_id,
            productId: item.product_id,
            productName: item.product_name,
            customerId: item.customer_id,
            customerName: item.customer_name,
            quantity: item.quantity,
            sellingPrice: item.selling_price,
            costPrice: item.cost_price,
            profit: item.profit,
            totalAmount: item.total_amount,
            paymentMethod: item.payment_method,
            timestamp: item.timestamp,
            synced: item.synced,
          }));
          setCache('sales', formattedData);
        }

        return formattedSale;
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

  // Listen for network reconnection
  useEffect(() => {
    const handleReconnect = () => {
      loadSales();
    };

    window.addEventListener('network-reconnected', handleReconnect);
    return () => window.removeEventListener('network-reconnected', handleReconnect);
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
