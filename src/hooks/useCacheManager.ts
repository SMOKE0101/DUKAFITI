
import { useState, useEffect, useCallback } from 'react';

interface PendingOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
}

export const useCacheManager = () => {
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  // Load pending operations from localStorage on mount
  const loadPendingOperations = useCallback(() => {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        const operations = JSON.parse(stored);
        console.log('[CacheManager] Loaded pending operations:', operations.length);
        setPendingOps(operations);
      }
    } catch (error) {
      console.error('[CacheManager] Failed to load pending operations:', error);
    }
  }, []);

  useEffect(() => {
    loadPendingOperations();
  }, [loadPendingOperations]);

  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(pendingOps));
      console.log('[CacheManager] Saved pending operations:', pendingOps.length);
    } catch (error) {
      console.error('[CacheManager] Failed to save pending operations:', error);
    }
  }, [pendingOps]);

  const getCache = useCallback(<T>(key: string): T | null => {
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
  }, []);

  const setCache = useCallback(<T>(key: string, data: T): void => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      console.log('[CacheManager] Set cache for key:', key, 'data length:', Array.isArray(data) ? data.length : 'N/A');
    } catch (error) {
      console.error('[CacheManager] Failed to set cache:', error);
    }
  }, []);

  const addPendingOperation = useCallback((operation: Omit<PendingOperation, 'id'>): void => {
    const operationWithId = {
      ...operation,
      id: `${operation.type}_${operation.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('[CacheManager] Adding pending operation:', operationWithId);

    setPendingOps(prev => {
      // Check if operation already exists
      const exists = prev.some(op => op.id === operationWithId.id);
      if (exists) {
        console.log('[CacheManager] Operation already exists, skipping');
        return prev;
      }
      const updated = [...prev, operationWithId];
      console.log('[CacheManager] Total pending operations after add:', updated.length);
      return updated;
    });
  }, []);

  const removePendingOperation = useCallback((operationId: string): void => {
    console.log('[CacheManager] Removing pending operation:', operationId);
    setPendingOps(prev => prev.filter(op => op.id !== operationId));
  }, []);

  const clearPendingOperation = useCallback((operationId: string): void => {
    console.log('[CacheManager] Clearing pending operation:', operationId);
    setPendingOps(prev => prev.filter(op => op.id !== operationId));
  }, []);

  const clearAllPendingOperations = useCallback((): void => {
    console.log('[CacheManager] Clearing all pending operations');
    setPendingOps([]);
  }, []);

  return {
    getCache,
    setCache,
    addPendingOperation,
    removePendingOperation,
    clearPendingOperation,
    clearAllPendingOperations,
    loadPendingOperations,
    pendingOps,
  };
};
