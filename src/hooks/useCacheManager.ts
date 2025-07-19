
import { useState, useEffect } from 'react';

interface PendingOperation {
  id: string;
  type: 'sale' | 'product' | 'customer';
  operation: 'create' | 'update' | 'delete';
  data: any;
}

export const useCacheManager = () => {
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  // Load pending operations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        const operations = JSON.parse(stored);
        setPendingOps(operations);
      }
    } catch (error) {
      console.error('[CacheManager] Failed to load pending operations:', error);
    }
  }, []);

  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(pendingOps));
    } catch (error) {
      console.error('[CacheManager] Failed to save pending operations:', error);
    }
  }, [pendingOps]);

  const getCache = <T>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        const cacheTime = parsed.timestamp;
        const now = new Date().getTime();
        const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return parsed.data;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.error('[CacheManager] Failed to get cache:', error);
    }
    return null;
  };

  const setCache = <T>(key: string, data: T): void => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[CacheManager] Failed to set cache:', error);
    }
  };

  const addPendingOperation = (operation: PendingOperation): void => {
    setPendingOps(prev => {
      // Check if operation already exists
      const exists = prev.some(op => op.id === operation.id);
      if (exists) {
        return prev;
      }
      return [...prev, operation];
    });
  };

  const clearPendingOperation = (operationId: string): void => {
    setPendingOps(prev => prev.filter(op => op.id !== operationId));
  };

  const clearAllPendingOperations = (): void => {
    setPendingOps([]);
  };

  return {
    getCache,
    setCache,
    addPendingOperation,
    clearPendingOperation,
    clearAllPendingOperations,
    pendingOps,
  };
};
