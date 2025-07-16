
import { useState, useCallback } from 'react';
import { useOfflineManager } from './useOfflineManager';
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

      // Add to offline queue with high priority
      const operationId = await addOfflineOperation('sale', 'create', sale, 'high');
      
      console.log('[OfflineSales] Sale created offline with operation ID:', operationId);
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
