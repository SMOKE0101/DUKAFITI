
import { useState, useEffect, useCallback } from 'react';
import { useOfflineFirst } from './useOfflineFirst';
import { supabase } from '@/integrations/supabase/client';

interface UseOfflineAwareDataOptions {
  table: 'products' | 'customers' | 'sales' | 'transactions';
  select?: string;
  filters?: Record<string, any>;
  dependencies?: any[];
}

export const useOfflineAwareData = <T = any>({
  table,
  select = '*',
  filters = {},
  dependencies = []
}: UseOfflineAwareDataOptions) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline, getOfflineData, storeOfflineData } = useOfflineFirst();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Fetch from Supabase when online - use type assertion for table name
        let query = supabase.from(table as any).select(select);
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        const { data: freshData, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        // Store in offline cache
        if (freshData) {
          await storeOfflineData(table, freshData);
          setData(freshData as T[]);
        }
      } else {
        // Fetch from offline cache when offline
        const cachedData = await getOfflineData(table);
        
        // Apply client-side filtering for offline data
        let filteredData = cachedData || [];
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            filteredData = filteredData.filter((item: any) => item[key] === value);
          }
        });
        
        setData(filteredData as T[]);
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Fallback to offline data even if online fetch fails
      try {
        const fallbackData = await getOfflineData(table);
        if (fallbackData) {
          setData(fallbackData as T[]);
        }
      } catch (offlineError) {
        console.error('Failed to load offline fallback:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(filters), isOnline, getOfflineData, storeOfflineData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    isOnline
  };
};
