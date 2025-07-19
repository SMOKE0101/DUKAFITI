
import { useState, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface OfflineOperation {
  type: string;
  operation: string;
  data: any;
  priority?: 'low' | 'medium' | 'high';
}

export const useUnifiedOfflineManager = () => {
  const { isOnline } = useNetworkStatus();
  const [pendingOperations, setPendingOperations] = useState(0);
  const [operations, setOperations] = useState<OfflineOperation[]>([]);

  const addOfflineOperation = async (
    type: string,
    operation: string,
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const newOperation: OfflineOperation = {
      type,
      operation,
      data,
      priority,
    };
    
    setOperations(prev => [...prev, newOperation]);
    setPendingOperations(prev => prev + 1);
    
    // Store in localStorage for persistence
    try {
      const existingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
      existingOps.push(newOperation);
      localStorage.setItem('pendingOperations', JSON.stringify(existingOps));
    } catch (error) {
      console.error('Failed to save offline operation:', error);
    }
  };

  const syncPendingOperations = async () => {
    if (!isOnline || operations.length === 0) return;

    console.log('Syncing pending operations...');
    // Clear operations after sync
    setOperations([]);
    setPendingOperations(0);
    localStorage.removeItem('pendingOperations');
  };

  // Load pending operations on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pendingOperations');
      if (saved) {
        const ops = JSON.parse(saved);
        setOperations(ops);
        setPendingOperations(ops.length);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }, []);

  return {
    isOnline,
    pendingOperations,
    addOfflineOperation,
    syncPendingOperations,
  };
};
