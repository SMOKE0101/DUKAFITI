
import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '../utils/indexedDB';
import { useOfflineManager } from './useOfflineManager';
import { useToast } from './use-toast';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: any;
}

export const useOfflineValidator = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const { isOnline, isInitialized } = useOfflineManager();
  const { toast } = useToast();

  const runComprehensiveTests = useCallback(async (): Promise<ValidationResult> => {
    setIsValidating(true);
    console.log('[OfflineValidator] Starting comprehensive offline tests...');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    let stats: any = {};

    try {
      // Test 1: Database initialization
      console.log('[OfflineValidator] Testing database initialization...');
      if (!isInitialized) {
        errors.push('IndexedDB not properly initialized');
      }

      // Test 2: Store operations
      console.log('[OfflineValidator] Testing store operations...');
      const dbTest = await offlineDB.testOfflineCapabilities();
      if (!dbTest.success) {
        errors.push(`Database operations failed: ${dbTest.details.error}`);
      } else {
        stats = dbTest.details.stats;
      }

      // Test 3: Service Worker registration
      console.log('[OfflineValidator] Testing service worker...');
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistrations();
          if (registration.length === 0) {
            warnings.push('No service workers registered');
          } else {
            console.log('[OfflineValidator] ✅ Service worker active');
          }
        } catch (error) {
          warnings.push('Service worker check failed');
        }
      } else {
        warnings.push('Service workers not supported');
      }

      // Test 4: Network detection
      console.log('[OfflineValidator] Testing network detection...');
      const networkStatus = navigator.onLine;
      if (networkStatus !== isOnline) {
        warnings.push('Network status detection mismatch');
      }

      // Test 5: Cache functionality
      console.log('[OfflineValidator] Testing cache functionality...');
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          if (cacheNames.length === 0) {
            warnings.push('No caches found - offline functionality may be limited');
          } else {
            console.log('[OfflineValidator] ✅ Cache API working');
          }
        } catch (error) {
          warnings.push('Cache API test failed');
        }
      } else {
        warnings.push('Cache API not supported');
      }

      // Test 6: Local storage
      console.log('[OfflineValidator] Testing local storage...');
      try {
        const testKey = 'offline_test_' + Date.now();
        localStorage.setItem(testKey, 'test');
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved !== 'test') {
          errors.push('Local storage not working');
        }
      } catch (error) {
        errors.push('Local storage access denied');
      }

      // Test 7: CRUD operations simulation
      console.log('[OfflineValidator] Testing CRUD operations...');
      try {
        // Simulate offline sales creation
        const testSale = {
          id: 'test_sale_' + Date.now(),
          user_id: 'test_user',
          product_id: 'test_product',
          product_name: 'Test Product',
          quantity: 1,
          selling_price: 100,
          cost_price: 80,
          profit: 20,
          total_amount: 100,
          payment_method: 'cash',
          timestamp: new Date().toISOString(),
          synced: false
        };

        await offlineDB.storeOfflineData('sales', testSale);
        const retrievedSale = await offlineDB.getOfflineData('sales', testSale.id);
        
        if (!retrievedSale || retrievedSale.id !== testSale.id) {
          errors.push('Sales CRUD operations failed');
        } else {
          // Cleanup
          await offlineDB.deleteOfflineData('sales', testSale.id);
          console.log('[OfflineValidator] ✅ Sales CRUD test passed');
        }
      } catch (error) {
        errors.push('CRUD operations test failed: ' + error.message);
      }

      const result: ValidationResult = {
        success: errors.length === 0,
        errors,
        warnings,
        stats
      };

      setLastValidation(result);
      console.log('[OfflineValidator] Validation completed:', result);
      
      return result;

    } catch (error) {
      const result: ValidationResult = {
        success: false,
        errors: ['Validation process failed: ' + error.message],
        warnings,
        stats
      };
      
      setLastValidation(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [isInitialized, isOnline]);

  const validateAndReport = useCallback(async () => {
    const result = await runComprehensiveTests();
    
    if (result.success) {
      toast({
        title: "✅ Offline Mode Validated",
        description: `All tests passed! ${result.warnings.length} warnings.`,
        duration: 3000,
      });
    } else {
      toast({
        title: "❌ Offline Issues Detected",
        description: `${result.errors.length} errors found. Check console for details.`,
        variant: "destructive",
        duration: 5000,
      });
    }
    
    // Log detailed results
    console.group('[OfflineValidator] Detailed Results');
    console.log('Success:', result.success);
    console.log('Errors:', result.errors);
    console.log('Warnings:', result.warnings);
    console.log('Stats:', result.stats);
    console.groupEnd();
  }, [runComprehensiveTests, toast]);

  // Auto-validate when app becomes online
  useEffect(() => {
    if (isOnline && isInitialized) {
      setTimeout(validateAndReport, 2000);
    }
  }, [isOnline, isInitialized, validateAndReport]);

  return {
    isValidating,
    lastValidation,
    runComprehensiveTests,
    validateAndReport
  };
};
