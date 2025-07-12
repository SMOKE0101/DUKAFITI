
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Sale } from '../types';

export const useSupabaseSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load sales from database
  const loadSales = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const mappedSales: Sale[] = data.map(sale => ({
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
      }));

      setSales(mappedSales);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      const newSales: Sale[] = data.map(sale => ({
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
      }));

      setSales(prev => [...newSales, ...prev]);
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

  // Migrate localStorage data to database
  const migrateLocalStorageData = async () => {
    if (!user) return;

    try {
      const localData = localStorage.getItem('dts_sales');
      if (!localData) return;

      const localSales = JSON.parse(localData);
      if (!Array.isArray(localSales) || localSales.length === 0) return;

      console.log('Migrating sales from localStorage:', localSales.length);

      const salesInserts = localSales.map(sale => ({
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
        payment_details: sale.paymentDetails || {},
        total_amount: sale.total || (sale.sellingPrice * sale.quantity),
        synced: sale.synced || true,
        timestamp: sale.timestamp || new Date().toISOString(),
      }));

      await supabase
        .from('sales')
        .insert(salesInserts);

      // Clear localStorage after successful migration
      localStorage.removeItem('dts_sales');
      console.log('Sales migrated successfully');

      // Reload sales from database
      await loadSales();
    } catch (error) {
      console.error('Error migrating sales:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

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
          loadSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load sales and migrate data on mount
  useEffect(() => {
    if (user) {
      loadSales().then(() => {
        migrateLocalStorageData();
      });
    }
  }, [user]);

  return {
    sales,
    loading,
    createSales,
    refreshSales: loadSales,
  };
};
