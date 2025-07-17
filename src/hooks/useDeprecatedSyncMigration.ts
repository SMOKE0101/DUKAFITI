
import { useEffect } from 'react';

/**
 * This hook helps migrate from old sync systems to the new unified sync system.
 * It should be removed after all components have been updated.
 */
export const useDeprecatedSyncMigration = () => {
  useEffect(() => {
    console.warn('[DEPRECATED] Old sync hooks are deprecated. Please use useUnifiedSyncManager instead.');
    
    // Clear old sync data to prevent conflicts
    const oldKeys = [
      'lastOrderSyncTime',
      'lastSyncTime',
      'lastOfflineSyncTime'
    ];
    
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`[Migration] Removing old sync key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }, []);
};
