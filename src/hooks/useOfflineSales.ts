
import { useState, useCallback } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { offlineDB } from '../utils/offlineDB';
import { Sale } from '../types';

export const useOfflineSales = () => {
  const { addOfflineOperation, getOfflineData, isOnline } = useOfflineManager();
  const [isCreating, setIsCreating] = useState(false);

  const createOfflineSale = useCallback(async (saleData: any) => {
    setIsCreating(true);
    
    try {
      console.log('[OfflineSales] Creating offline sale:', saleData);

      const sale = {
        ...saleData,
        id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
        timestamp: saleData.timestamp || new Date().toISOString()
      };

      // Store the sale directly in IndexedDB with enhanced error handling
      try {
        await offlineDB.storeSale(sale);
        console.log('[OfflineSales] Sale stored in IndexedDB successfully');
      } catch (dbError) {
        console.error('[OfflineSales] Failed to store sale in IndexedDB:', dbError);
        throw new Error(`Database storage failed: ${dbError.message}`);
      }

      // Add to offline queue with high priority for eventual sync
      try {
        const operationId = await addOfflineOperation('sale', 'create', sale, 'high');
        console.log('[OfflineSales] Sale added to sync queue with operation ID:', operationId);
      } catch (queueError) {
        console.warn('[OfflineSales] Failed to add to sync queue (sale still stored locally):', queueError);
        // Don't fail the operation if sync queue fails, sale is still stored locally
      }
      
      console.log('[OfflineSales] Sale created offline successfully');
      return sale;
      
    } catch (error) {
      console.error('[OfflineSales] Failed to create offline sale:', error);
      throw new Error(`Failed to create offline sale: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  }, [addOfflineOperation]);

  const getOfflineSales = useCallback(async (): Promise<Sale[]> => {
    try {
      console.log('[OfflineSales] Fetching offline sales...');
      
      // Try to get from IndexedDB directly first
      const sales = await offlineDB.getAllOfflineData('sales');
      
      if (Array.isArray(sales)) {
        console.log(`[OfflineSales] Retrieved ${sales.length} sales from IndexedDB`);
        return sales.map(sale => ({
          ...sale,
          // Ensure proper data mapping
          id: sale.id,
          productId: sale.product_id,
          productName: sale.product_name,
          customerId: sale.customer_id,
          customerName: sale.customer_name,
          quantity: sale.quantity,
          sellingPrice: sale.selling_price,
          costPrice: sale.cost_price,
          total: sale.total_amount,
          profit: sale.profit,
          paymentMethod: sale.payment_method,
          paymentDetails: sale.payment_details || {},
          timestamp: sale.timestamp,
          synced: sale.synced || false
        }));
      }
      
      console.log('[OfflineSales] No sales found in IndexedDB');
      return [];
    } catch (error) {
      console.error('[OfflineSales] Failed to get offline sales:', error);
      
      // Fallback to the offline manager's data
      try {
        const fallbackSales = await getOfflineData('sales');
        return Array.isArray(fallbackSales) ? fallbackSales : [];
      } catch (fallbackError) {
        console.error('[OfflineSales] Fallback also failed:', fallbackError);
        return [];
      }
    }
  }, [getOfflineData]);

  const getSalesStats = useCallback(async () => {
    try {
      const sales = await getOfflineSales();
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
      const unsyncedSales = sales.filter(sale => !sale.synced).length;
      
      return {
        totalSales,
        totalRevenue,
        totalProfit,
        unsyncedSales
      };
    } catch (error) {
      console.error('[OfflineSales] Failed to get sales stats:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        unsyncedSales: 0
      };
    }
  }, [getOfflineSales]);

  return {
    createOfflineSale,
    getOfflineSales,
    getSalesStats,
    isCreating,
    isOnline
  };
};
