
import { useState, useCallback } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { Sale } from '../types';

export const useOfflineSales = () => {
  const { addOfflineOperation, getOfflineData, isOnline } = useOfflineManager();
  const [isCreating, setIsCreating] = useState(false);

  const createOfflineSale = useCallback(async (saleData: Omit<Sale, 'id' | 'synced'>) => {
    setIsCreating(true);
    
    try {
      const sale: Sale = {
        ...saleData,
        id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
        timestamp: saleData.timestamp || new Date().toISOString()
      };

      // Add to offline queue with high priority
      await addOfflineOperation('sale', 'create', sale, 'high');
      
      console.log('[OfflineSales] Sale created offline:', sale.id);
      return sale;
      
    } catch (error) {
      console.error('[OfflineSales] Failed to create offline sale:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [addOfflineOperation]);

  const getOfflineSales = useCallback(async (): Promise<Sale[]> => {
    try {
      const sales = await getOfflineData('sales');
      return Array.isArray(sales) ? sales : [];
    } catch (error) {
      console.error('[OfflineSales] Failed to get offline sales:', error);
      return [];
    }
  }, [getOfflineData]);

  return {
    createOfflineSale,
    getOfflineSales,
    isCreating,
    isOnline
  };
};
