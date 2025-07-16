
import { useState, useEffect } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { offlineDB } from '../utils/offlineDB';

export const useOfflineValidator = () => {
  const { isOnline, pendingActions } = useOfflineManager();
  const [validationResults, setValidationResults] = useState({
    dbHealth: false,
    cacheHealth: false,
    syncQueueHealth: false,
    dataIntegrity: false
  });
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    
    try {
      // Test database connectivity
      const dbTest = await offlineDB.testDatabase();
      
      // Test cache health (check if service worker is active)
      const cacheTest = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
      
      // Test sync queue
      const syncQueue = await offlineDB.getSyncQueue();
      const syncQueueTest = Array.isArray(syncQueue);
      
      // Test data integrity (basic checks)
      const stats = await offlineDB.getDataStats();
      const dataIntegrityTest = typeof stats === 'object' && stats !== null;
      
      setValidationResults({
        dbHealth: dbTest,
        cacheHealth: cacheTest,
        syncQueueHealth: syncQueueTest,
        dataIntegrity: dataIntegrityTest
      });
      
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResults({
        dbHealth: false,
        cacheHealth: false,
        syncQueueHealth: false,
        dataIntegrity: false
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Run validation on mount and when going offline/online
  useEffect(() => {
    runValidation();
  }, [isOnline]);

  return {
    validationResults,
    isValidating,
    runValidation,
    pendingActionsCount: pendingActions.length,
    isOnline
  };
};
