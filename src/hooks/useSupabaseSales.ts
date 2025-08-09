
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useOfflineFirstSupabase } from './useOfflineFirstSupabase';
import { Sale } from '../types';

export const useSupabaseSales = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to safely convert payment details
  const convertPaymentDetails = (details: any) => {
    try {
      if (typeof details === 'object' && details !== null) {
        return {
          cashAmount: Number(details.cashAmount || details.cash_amount || 0),
          mpesaAmount: Number(details.mpesaAmount || details.mpesa_amount || 0),
          debtAmount: Number(details.debtAmount || details.debt_amount || 0),
          mpesaReference: details.mpesaReference || details.mpesa_reference || undefined,
          tillNumber: details.tillNumber || details.till_number || undefined,
        };
      }
      return {
        cashAmount: 0,
        mpesaAmount: 0,
        debtAmount: 0,
      };
    } catch (error) {
      console.error('[useSupabaseSales] Error converting payment details:', error);
      return {
        cashAmount: 0,
        mpesaAmount: 0,
        debtAmount: 0,
      };
    }
  };

  // Transform functions for field mapping
  const transformToLocal = (sale: any): Sale => {
    try {
      return {
        id: sale.id,
        productId: sale.product_id || sale.productId,
        productName: sale.product_name || sale.productName,
        quantity: Number(sale.quantity || 0),
        sellingPrice: Number(sale.selling_price || sale.sellingPrice || 0),
        costPrice: Number(sale.cost_price || sale.costPrice || 0),
        profit: Number(sale.profit || 0),
        timestamp: sale.timestamp || sale.created_at,
        synced: sale.synced !== false,
        customerId: sale.customer_id || sale.customerId,
        customerName: sale.customer_name || sale.customerName,
        paymentMethod: (((sale.payment_method || sale.paymentMethod || 'cash') === 'partial') ? 'split' : (sale.payment_method || sale.paymentMethod || 'cash')) as 'cash' | 'mpesa' | 'debt' | 'split',
        paymentDetails: convertPaymentDetails(sale.payment_details || sale.paymentDetails),
        total: Number(sale.total_amount || sale.total || 0),
      };
    } catch (error) {
      console.error('[useSupabaseSales] Error transforming sale to local:', error, sale);
      throw new Error('Failed to transform sale data');
    }
  };

  const transformFromLocal = (sale: Sale): any => {
    try {
      return {
        id: sale.id,
        product_id: sale.productId,
        product_name: sale.productName,
        quantity: Number(sale.quantity || 0),
        selling_price: Number(sale.sellingPrice || 0),
        cost_price: Number(sale.costPrice || 0),
        profit: Number(sale.profit || 0),
        timestamp: sale.timestamp,
        synced: sale.synced !== false,
        customer_id: sale.customerId,
        customer_name: sale.customerName,
        payment_method: sale.paymentMethod || 'cash',
        payment_details: sale.paymentDetails || { cashAmount: 0, mpesaAmount: 0, debtAmount: 0 },
        total_amount: Number(sale.total || 0),
      };
    } catch (error) {
      console.error('[useSupabaseSales] Error transforming sale from local:', error, sale);
      throw new Error('Failed to transform sale data');
    }
  };

  const loadFromSupabase = async () => {
    if (!user) {
      console.log('[useSupabaseSales] No user authenticated, skipping load');
      throw new Error('No user authenticated');
    }
    
    try {
      console.log('[useSupabaseSales] Loading sales from Supabase for user:', user.id);
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('[useSupabaseSales] Supabase error:', error);
        throw new Error(`Failed to load sales: ${error.message}`);
      }

      console.log('[useSupabaseSales] Loaded sales from Supabase:', data?.length || 0);
      
      if (!data) {
        return [];
      }

      // Transform data with error handling for each item
      const transformedSales: Sale[] = [];
      for (const saleData of data) {
        try {
          const transformedSale = transformToLocal(saleData);
          transformedSales.push(transformedSale);
        } catch (error) {
          console.error('[useSupabaseSales] Failed to transform sale:', error, saleData);
          // Continue processing other sales instead of failing completely
        }
      }

      return transformedSales;
    } catch (error) {
      console.error('[useSupabaseSales] Error in loadFromSupabase:', error);
      throw error;
    }
  };

  const {
    data: sales,
    loading,
    error,
    refresh: refreshSales,
    isOnline,
    lastSyncTime,
    testOffline
  } = useOfflineFirstSupabase<Sale>({
    cacheKey: 'sales',
    tableName: 'sales',
    loadFromSupabase,
    transformToLocal,
    transformFromLocal,
    user
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isOnline) return;

    console.log('[useSupabaseSales] Setting up real-time subscription for user:', user.id);
    
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useSupabaseSales] Real-time change detected:', payload);
          refreshSales();
        }
      )
      .subscribe();

    return () => {
      console.log('[useSupabaseSales] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, isOnline, refreshSales]);

  return {
    sales: sales || [],
    loading,
    error,
    refreshSales,
    isOnline,
    lastSyncTime,
    testOffline
  };
};
