
import { useState, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface PendingOperation {
  id: string;
  type: 'sale' | 'product' | 'customer';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export const useCacheManager = () => {
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  // Cache management
  const setCache = useCallback(<T>(key: string, data: T): void => {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        key,
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('[CacheManager] Failed to set cache:', error);
    }
  }, []);

  const getCache = useCallback(<T>(key: string, maxAge: number = 5 * 60 * 1000): T | null => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const isExpired = Date.now() - cacheItem.timestamp > maxAge;
      
      if (isExpired) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('[CacheManager] Failed to get cache:', error);
      return null;
    }
  }, []);

  const clearCache = useCallback((pattern?: string): void => {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('cache_') && (!pattern || key.includes(pattern))
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[CacheManager] Failed to clear cache:', error);
    }
  }, []);

  // Pending operations management
  const addPendingOperation = useCallback((op: Omit<PendingOperation, 'id' | 'timestamp'>): void => {
    const operation: PendingOperation = {
      ...op,
      id: `${op.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setPendingOps(prev => {
      const updated = [...prev, operation];
      try {
        localStorage.setItem('pending_operations', JSON.stringify(updated));
      } catch (error) {
        console.warn('[CacheManager] Failed to store pending operations:', error);
      }
      return updated;
    });

    console.log('[CacheManager] Added pending operation:', operation.id);
  }, []);

  const removePendingOperation = useCallback((id: string): void => {
    setPendingOps(prev => {
      const updated = prev.filter(op => op.id !== id);
      try {
        localStorage.setItem('pending_operations', JSON.stringify(updated));
      } catch (error) {
        console.warn('[CacheManager] Failed to update pending operations:', error);
      }
      return updated;
    });

    console.log('[CacheManager] Removed pending operation:', id);
  }, []);

  const loadPendingOperations = useCallback((): void => {
    try {
      const stored = localStorage.getItem('pending_operations');
      if (stored) {
        const operations = JSON.parse(stored);
        setPendingOps(operations);
        console.log('[CacheManager] Loaded pending operations:', operations.length);
      }
    } catch (error) {
      console.warn('[CacheManager] Failed to load pending operations:', error);
    }
  }, []);

  return {
    // Cache
    setCache,
    getCache,
    clearCache,
    // Pending operations
    pendingOps,
    addPendingOperation,
    removePendingOperation,
    loadPendingOperations,
  };
};
