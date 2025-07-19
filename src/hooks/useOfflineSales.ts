
import { useState } from 'react';
import { useUnifiedOfflineManager } from './useUnifiedOfflineManager';

export const useOfflineSales = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { addOfflineOperation } = useUnifiedOfflineManager();

  const createOfflineSale = async (saleData: any) => {
    setIsCreating(true);
    try {
      await addOfflineOperation('sale', 'create', saleData, 'high');
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createOfflineSale,
    isCreating,
  };
};
