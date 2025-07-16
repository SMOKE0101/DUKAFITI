
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
  };

  // Transform functions for field mapping
  const transformToLocal = (sale: any): Sale => ({
    id: sale.id,
    productId: sale.product_id || sale.productId,
    productName: sale.product_name || sale.productName,
    quantity: Number(sale.quantity || 0),
    sellingPrice: Number(sale.selling_price || sale.sellingPrice || 0),
    costPrice: Number(sale.cost_price || sale.costPrice || 0),
    profit: Number(sale.profit || 0),
    timestamp: sale.timestamp || sale.created_at,
    synced: sale.synced || true,
    customerId: sale.customer_id || sale.customerId,
    customerName: sale.customer_name || sale.customerName,
    paymentMethod: (sale.payment_method || sale.paymentMethod || 'cash') as 'cash' | 'mpesa' | 'debt' | 'partial',
    paymentDetails: convertPaymentDetails(sale.payment_details || sale.paymentDetails),
    total: Number(sale.total_amount || sale.total || 0),
  });

  const transformFromLocal = (sale: Sale): any => ({
    id: sale.id,
    product_id: sale.productId,
    product_name: sale.productName,
    quantity: Number(sale.quantity || 0),
    selling_price: Number(sale.sellingPrice || 0),
    cost_price: Number(sale.costPrice || 0),
    profit: Number(sale.profit || 0),
    timestamp: sale.timestamp,
    synced: sale.synced || true,
    customer_id: sale.customerId,
    customer_name: sale.customerName,
    payment_method: sale.paymentMethod || 'cash',
    payment_details: sale.paymentDetails || { cashAmount: 0, mpesaAmount: 0, debtAmount: 0 },
    total_amount: Number(sale.total || 0),
  });

  const loadFromSupabase = async () => {
    if (!user) throw new Error('No user authenticated');
    
    console.log('[useSupabaseSales] Loading sales from Supabase...');
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[useSupabaseSales] Supabase error:', error);
      throw error;
    }

    console.log('[useSupabaseSales] Loaded sales from Supabase:', data?.length || 0);
    return data ? data.map(transformToLocal) : [];
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
    transformFromLocal
  });

  // Create sales (batch) with offline support
  const createSales = async (salesData: Omit<Sale, 'id'>[]) => {
    if (!user) {
      throw new Error('No user authenticated');
    }

    try {
      console.log('[useSupabaseSales] Creating sales batch:', salesData.length, 'items');

      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Sales will be created when connection is restored",
          variant: "default",
        });
        throw new Error('Cannot create sales while offline');
      }

      const salesInserts = salesData.map(sale => ({
        user_id: user.id,
        product_id: sale.productId,
        product_name: sale.productName,
        quantity: sale.quantity,
        selling_price: sale.sellingPrice,
        cost_price: sale.costPrice,
        profit: sale.profit,
        customer_id: sale.customerId,
        customer_name: sale.customerName,
        payment_method: sale.paymentMethod,
        payment_details: sale.paymentDetails,
        total_amount: sale.total,
        synced: sale.synced !== false,
        timestamp: sale.timestamp || new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('sales')
        .insert(salesInserts)
        .select();

      if (error) {
        console.error('[useSupabaseSales] Create error:', error);
        throw error;
      }

      console.log('[useSupabaseSales] Sales created successfully:', data?.length || 0);
      const newSales = data ? data.map(transformToLocal) : [];
      
      // Refresh data to sync with cache
      await refreshSales();
      
      toast({
        title: "Success",
        description: `${newSales.length} sale(s) created successfully`,
      });

      return newSales;
    } catch (error) {
      console.error('[useSupabaseSales] Create sales error:', error);
      toast({
        title: "Error",
        description: `Failed to create sales: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isOnline) return;

    console.log('[useSupabaseSales] Setting up real-time subscription');
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
    sales,
    loading,
    error,
    createSales,
    refreshSales,
    isOnline,
    lastSyncTime,
    testOffline
  };
};
