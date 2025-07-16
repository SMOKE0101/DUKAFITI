
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { offlineDB } from '../utils/offlineDB';
import { supabase } from '@/integrations/supabase/client';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  // Load last sync time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lastSyncTime');
    if (stored) {
      setLastSyncTime(new Date(stored));
    }
  }, []);

  const syncData = useCallback(async () => {
    if (!user?.id || !navigator.onLine) {
      console.log('[OfflineSync] Cannot sync: no user or offline');
      return;
    }

    setIsSyncing(true);
    setSyncErrors([]);
    console.log('[OfflineSync] Starting sync process...');

    try {
      // Get all queued actions
      const queuedActions = await offlineDB.getSyncQueue();
      console.log(`[OfflineSync] Found ${queuedActions.length} queued actions`);

      const errors: string[] = [];

      for (const action of queuedActions) {
        try {
          console.log(`[OfflineSync] Processing action:`, action);

          switch (action.type) {
            case 'sale':
              if (action.operation === 'create') {
                const { data, error } = await supabase
                  .from('sales')
                  .insert([action.data]);
                
                if (error) throw error;
                console.log(`[OfflineSync] Synced sale:`, action.data.id);
              }
              break;

            case 'product':
              if (action.operation === 'create') {
                const { data, error } = await supabase
                  .from('products')
                  .insert([action.data]);
                
                if (error) throw error;
                console.log(`[OfflineSync] Synced product:`, action.data.id);
              } else if (action.operation === 'update') {
                const { data, error } = await supabase
                  .from('products')
                  .update(action.data)
                  .eq('id', action.data.id);
                
                if (error) throw error;
                console.log(`[OfflineSync] Updated product:`, action.data.id);
              }
              break;

            case 'customer':
              if (action.operation === 'create') {
                const { data, error } = await supabase
                  .from('customers')
                  .insert([action.data]);
                
                if (error) throw error;
                console.log(`[OfflineSync] Synced customer:`, action.data.id);
              }
              break;

            default:
              console.warn(`[OfflineSync] Unknown action type:`, action.type);
          }

          // Remove successfully synced action
          await offlineDB.removeFromSyncQueue(action.id);

        } catch (error) {
          console.error(`[OfflineSync] Failed to sync action ${action.id}:`, error);
          errors.push(`Failed to sync ${action.type}: ${error.message}`);
          
          // Update action with error info (increment attempts)
          const updatedAction = {
            ...action,
            attempts: (action.attempts || 0) + 1,
            lastAttempt: Date.now(),
            errorMessage: error.message
          };
          await offlineDB.addToSyncQueue(updatedAction);
        }
      }

      // Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now.toISOString());

      if (errors.length > 0) {
        setSyncErrors(errors);
        console.warn('[OfflineSync] Sync completed with errors:', errors);
      } else {
        console.log('[OfflineSync] Sync completed successfully');
      }

    } catch (error) {
      console.error('[OfflineSync] Sync process failed:', error);
      setSyncErrors([`Sync failed: ${error.message}`]);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id]);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineSync] Detected online status, starting auto-sync');
      setTimeout(syncData, 1000); // Delay to ensure connection is stable
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncData]);

  return {
    syncData,
    isSyncing,
    lastSyncTime,
    syncErrors,
    clearErrors: () => setSyncErrors([])
  };
};
