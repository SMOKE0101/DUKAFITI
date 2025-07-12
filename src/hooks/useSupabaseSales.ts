
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
        cashAmount: Number(details.cashAmount) || 0,
        mpesaAmount: Number(details.mpesaAmount) || 0,
        debtAmount: Number(details.debtAmount) || 0,
        mpesaReference: details.mpesaReference || undefined,
        tillNumber: details.tillNumber || undefined,
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
    productId: sale.product_id,
    productName: sale.product_name,
    quantity: sale.quantity,
    sellingPrice: Number(sale.selling_price),
    costPrice: Number(sale.cost_price),
    profit: Number(sale.profit),
    timestamp: sale.timestamp || sale.created_at,
    synced: sale.synced || true,
    customerId: sale.customer_id,
    customerName: sale.customer_name,
    paymentMethod: sale.payment_method as 'cash' | 'mpesa' | 'debt' | 'partial',
    paymentDetails: convertPaymentDetails(sale.payment_details),
    total: Number(sale.total_amount),
  });

  const transformFromLocal = (sale: any): Sale => ({
    id: sale.id,
    productId: sale.productId,
    productName: sale.productName,
    quantity: sale.quantity,
    sellingPrice: Number(sale.sellingPrice),
    costPrice: Number(sale.costPrice),
    profit: Number(sale.profit),
    timestamp: sale.timestamp,
    synced: sale.synced || true,
    customerId: sale.customerId,
    customerName: sale.customerName,
    paymentMethod: sale.paymentMethod,
    paymentDetails: sale.paymentDetails || { cashAmount: 0, mpesaAmount: 0, debtAmount: 0 },
    total: Number(sale.total),
  });

  const loadFromSupabase = async () => {
    if (!user) throw new Error('No user authenticated');
    
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data.map(transformToLocal);
  };

  const {
    data: sales,
    loading,
    error,
    refresh: refreshSales,
    isOnline
  } = useOfflineFirstSupabase<Sale>({
    cacheKey: 'sales',
    tableName: 'sales',
    loadFromSupabase,
    transformToLocal,
    transformFromLocal
  });

  // Create sales (batch)
  const createSales = async (salesData: Omit<Sale, 'id'>[]) => {
    if (!user) return;

    try {
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
        synced: sale.synced,
        timestamp: sale.timestamp,
      }));

      const { data, error } = await supabase
        .from('sales')
        .insert(salesInserts)
        .select();

      if (error) throw error;

      const newSales = data.map(transformToLocal);
      await refreshSales();
      return newSales;
    } catch (error) {
      console.error('Error creating sales:', error);
      toast({
        title: "Error",
        description: "Failed to create sales",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isOnline) return;

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
        () => {
          refreshSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOnline, refreshSales]);

  return {
    sales,
    loading,
    createSales,
    refreshSales,
  };
};
