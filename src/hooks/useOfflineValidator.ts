
import { useState, useEffect } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { offlineDB } from '../utils/offlineDB';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats?: any;
  timestamp: string;
}

export const useOfflineValidator = () => {
  const { isOnline, pendingActions } = useOfflineManager();
  const [validationResults, setValidationResults] = useState({
    dbHealth: false,
    cacheHealth: false,
    syncQueueHealth: false,
    dataIntegrity: false
  });
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);

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
      
      // Test data integrity (basic checks) - using getStats instead of getDataStats
      const stats = await offlineDB.getStats();
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

  const validateAndReport = async () => {
    setIsValidating(true);
    const errors: string[] = [];
    const warnings: string[] = [];
    let stats: any = {};

    try {
      // Test database connectivity
      const dbTest = await offlineDB.testDatabase();
      if (!dbTest) {
        errors.push('Database connectivity test failed');
      }
      
      // Test cache health
      const cacheTest = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
      if (!cacheTest) {
        warnings.push('Service worker not active - offline functionality may be limited');
      }
      
      // Test sync queue
      const syncQueue = await offlineDB.getSyncQueue();
      if (!Array.isArray(syncQueue)) {
        errors.push('Sync queue is not accessible');
      } else if (syncQueue.length > 10) {
        warnings.push(`Large sync queue detected: ${syncQueue.length} pending operations`);
      }
      
      // Get data stats
      stats = await offlineDB.getStats();
      if (!stats) {
        warnings.push('Unable to retrieve data statistics');
      }

      const result: ValidationResult = {
        success: errors.length === 0,
        errors,
        warnings,
        stats,
        timestamp: new Date().toISOString()
      };

      setLastValidation(result);

      // Update simple validation results
      setValidationResults({
        dbHealth: dbTest,
        cacheHealth: cacheTest,
        syncQueueHealth: Array.isArray(syncQueue),
        dataIntegrity: !!stats
      });

    } catch (error) {
      console.error('Validation failed:', error);
      const result: ValidationResult = {
        success: false,
        errors: [`Validation process failed: ${error.message}`],
        warnings: [],
        timestamp: new Date().toISOString()
      };
      setLastValidation(result);
      
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
    validateAndReport,
    lastValidation,
    pendingActionsCount: pendingActions.length,
    isOnline
  };
};
