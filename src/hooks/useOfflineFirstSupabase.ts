
import { useState, useEffect, useCallback } from 'react';
import { useRobustOfflineManager } from './useRobustOfflineManager';

interface OfflineFirstOptions<T> {
  cacheKey: string;
  tableName: string;
  loadFromSupabase: () => Promise<T[]>;
  transformToLocal: (item: any) => T;
  transformFromLocal: (item: T) => any;
}

export function useOfflineFirstSupabase<T>({
  cacheKey,
  tableName,
  loadFromSupabase,
  transformToLocal,
  transformFromLocal
}: OfflineFirstOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const { isOnline, getCachedData, setCachedData, addToSyncQueue } = useRobustOfflineManager();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Try to load cached data first
      const cachedData = await getCachedData(cacheKey);
      if (cachedData && cachedData.length > 0) {
        console.log(`Loading cached ${cacheKey}:`, cachedData.length, 'items');
        setData(cachedData.map(transformToLocal));
      }

      // If online, try to fetch from Supabase
      if (isOnline) {
        try {
          const freshData = await loadFromSupabase();
          console.log(`Loaded fresh ${cacheKey} from Supabase:`, freshData.length, 'items');
          
          // Update cache with fresh data
          await setCachedData(cacheKey, freshData.map(transformFromLocal));
          setData(freshData);
        } catch (supabaseError) {
          console.error(`Supabase error for ${cacheKey}:`, supabaseError);
          
          // If we have cached data, use it; otherwise show error
          if (cachedData && cachedData.length > 0) {
            console.log(`Using cached ${cacheKey} due to Supabase error`);
            setData(cachedData.map(transformToLocal));
          } else {
            setError(`Failed to load ${cacheKey}. Please check your connection.`);
          }
        }
      } else {
        // Offline mode
        if (!cachedData || cachedData.length === 0) {
          console.log(`No cached ${cacheKey} available offline`);
          setError(`No ${cacheKey} available offline. Please connect to the internet to load data.`);
        }
      }
    } catch (cacheError) {
      console.error(`Cache error for ${cacheKey}:`, cacheError);
      setError(`Failed to load ${cacheKey}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, isOnline, loadFromSupabase, transformToLocal, transformFromLocal, getCachedData, setCachedData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when coming back online
  useEffect(() => {
    if (isOnline) {
      loadData();
    }
  }, [isOnline, loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    isOnline
  };
}
