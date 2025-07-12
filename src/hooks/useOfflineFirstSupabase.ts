
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRobustOfflineManager } from './useRobustOfflineManager';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface OfflineFirstConfig {
  cacheKey: string;
  tableName: string;
  loadFromSupabase: () => Promise<any[]>;
  transformToLocal?: (data: any) => any;
  transformFromLocal?: (data: any) => any;
}

export const useOfflineFirstSupabase = <T>(config: OfflineFirstConfig) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    isOnline, 
    getOfflineData, 
    robustOfflineDB,
    isInitialized 
  } = useRobustOfflineManager();
  const loadAttempted = useRef(false);

  // Load data with offline-first approach
  const loadData = useCallback(async () => {
    if (!user || !isInitialized) return;
    
    console.log(`[OfflineFirst] Loading ${config.cacheKey}...`);
    setLoading(true);
    setError(null);

    try {
      // First, try to load from local cache
      const cachedData = await getOfflineData(config.tableName);
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log(`[OfflineFirst] Found ${cachedData.length} cached ${config.cacheKey}`);
        const transformedData = config.transformFromLocal 
          ? cachedData.map(config.transformFromLocal)
          : cachedData;
        setData(transformedData);
        setLoading(false);
        
        // Show cache loaded notification only when offline
        if (!isOnline) {
          toast({
            title: "Offline Mode",
            description: `Loaded ${cachedData.length} ${config.cacheKey} from cache`,
            duration: 2000,
          });
        }
      }

      // If online, try to fetch fresh data from Supabase
      if (isOnline) {
        try {
          console.log(`[OfflineFirst] Fetching fresh ${config.cacheKey} from Supabase...`);
          const freshData = await config.loadFromSupabase();
          
          if (freshData && Array.isArray(freshData)) {
            console.log(`[OfflineFirst] Loaded ${freshData.length} fresh ${config.cacheKey}`);
            setData(freshData);
            
            // Cache the fresh data
            if (robustOfflineDB && freshData.length > 0) {
              try {
                // Clear old cache and store fresh data
                await robustOfflineDB.clearStore(config.tableName);
                for (const item of freshData) {
                  const transformedItem = config.transformToLocal ? config.transformToLocal(item) : item;
                  await robustOfflineDB.storeData(config.tableName, transformedItem);
                }
                console.log(`[OfflineFirst] Cached ${freshData.length} ${config.cacheKey} successfully`);
              } catch (cacheError) {
                console.warn(`[OfflineFirst] Failed to cache ${config.cacheKey}:`, cacheError);
              }
            }
          }
        } catch (networkError) {
          console.warn(`[OfflineFirst] Network error loading ${config.cacheKey}:`, networkError);
          
          // If we have cached data, continue using it
          if (data.length === 0) {
            // Only show error if we have no cached data
            setError(`Failed to load ${config.cacheKey}. ${!isOnline ? 'You are offline.' : 'Please check your connection.'}`);
            toast({
              title: "Loading Error",
              description: `Failed to load ${config.cacheKey}. ${cachedData?.length ? 'Using cached data.' : 'No cached data available.'}`,
              variant: "destructive",
              duration: 3000,
            });
          }
        }
      } else if (!cachedData || cachedData.length === 0) {
        // Offline and no cached data
        setError(`No ${config.cacheKey} available offline. Please connect to the internet to sync data.`);
        toast({
          title: "Offline Mode",
          description: `No cached ${config.cacheKey} found. Connect to internet to sync data.`,
          variant: "default",
          duration: 3000,
        });
      }

    } catch (error) {
      console.error(`[OfflineFirst] Critical error loading ${config.cacheKey}:`, error);
      setError(`Critical error loading ${config.cacheKey}`);
      toast({
        title: "Error",
        description: `Critical error loading ${config.cacheKey}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
      loadAttempted.current = true;
    }
  }, [user, isOnline, isInitialized, config, getOfflineData, robustOfflineDB, toast, data.length]);

  // Load data on mount and when network status changes
  useEffect(() => {
    if (!loadAttempted.current || (isOnline && data.length === 0)) {
      loadData();
    }
  }, [loadData, isOnline, data.length]);

  // Refresh function for manual reloading
  const refresh = useCallback(async () => {
    loadAttempted.current = false;
    await loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    isOnline,
    hasCachedData: data.length > 0
  };
};
