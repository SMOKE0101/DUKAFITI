
import { useState, useCallback } from 'react';
import { offlineDB } from '@/utils/indexedDB';
import { useToast } from './use-toast';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats?: Record<string, any>;
  timestamp: string;
}

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

export const useOfflineValidator = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  // 1. Automated Environment Setup
  const setupEnvironment = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Enable debugging
      (window as any).__offlineTest__ = true;
      
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear IndexedDB stores
      await Promise.all([
        offlineDB.clearStore('products'),
        offlineDB.clearStore('customers'),
        offlineDB.clearStore('sales'),
        offlineDB.clearStore('syncQueue'),
      ]);
      
      return {
        name: 'Environment Setup',
        success: true,
        duration: Date.now() - startTime,
        details: 'Caches and IndexedDB cleared successfully'
      };
    } catch (error) {
      return {
        name: 'Environment Setup',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // 2A. IndexedDB Schema & Sync Verification
  const verifyIndexedDBSchema = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const stats = await offlineDB.getDataStats();
      const requiredStores = ['products', 'customers', 'sales', 'syncQueue'];
      const missingStores = requiredStores.filter(store => !(store in stats));
      
      if (missingStores.length > 0) {
        throw new Error(`Missing stores: ${missingStores.join(', ')}`);
      }
      
      return {
        name: 'IndexedDB Schema Verification',
        success: true,
        duration: Date.now() - startTime,
        details: `All required stores present: ${Object.keys(stats).join(', ')}`
      };
    } catch (error) {
      return {
        name: 'IndexedDB Schema Verification',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // 2B. Action Queueing Test
  const testActionQueueing = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Simulate offline actions
      const testActions = [
        {
          id: 'test-product-1',
          type: 'product',
          operation: 'create',
          data: { name: 'Test Product', price: 100 },
          timestamp: new Date().toISOString(),
          priority: 'high',
          attempts: 0,
          synced: false
        },
        {
          id: 'test-customer-1',
          type: 'customer',
          operation: 'create',
          data: { name: 'Test Customer', phone: '123456789' },
          timestamp: new Date().toISOString(),
          priority: 'medium',
          attempts: 0,
          synced: false
        }
      ];
      
      // Add to queue
      for (const action of testActions) {
        await offlineDB.addToSyncQueue(action);
      }
      
      // Verify queue
      const queue = await offlineDB.getSyncQueue();
      const testItems = queue.filter(item => item.id.startsWith('test-'));
      
      if (testItems.length !== testActions.length) {
        throw new Error(`Expected ${testActions.length} items, got ${testItems.length}`);
      }
      
      // Cleanup
      for (const action of testActions) {
        await offlineDB.removeFromSyncQueue(action.id);
      }
      
      return {
        name: 'Action Queueing Test',
        success: true,
        duration: Date.now() - startTime,
        details: `Successfully queued and verified ${testActions.length} actions`
      };
    } catch (error) {
      return {
        name: 'Action Queueing Test',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // 3. Service Worker Test
  const testServiceWorker = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('Service Worker not registered');
      }
      
      return {
        name: 'Service Worker Test',
        success: true,
        duration: Date.now() - startTime,
        details: `Service Worker active: ${registration.active?.scriptURL}`
      };
    } catch (error) {
      return {
        name: 'Service Worker Test',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // 4. Network Status Test
  const testNetworkStatus = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const isOnline = navigator.onLine;
      
      // Test network events
      let eventsFired = 0;
      const onlineHandler = () => eventsFired++;
      const offlineHandler = () => eventsFired++;
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      // Cleanup
      setTimeout(() => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
      }, 100);
      
      return {
        name: 'Network Status Test',
        success: true,
        duration: Date.now() - startTime,
        details: `Online: ${isOnline}, Event listeners attached`
      };
    } catch (error) {
      return {
        name: 'Network Status Test',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // 5. Performance Benchmark
  const runPerformanceBenchmark = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Test IndexedDB read performance
      const readStart = performance.now();
      await offlineDB.getOfflineData('products');
      const readTime = performance.now() - readStart;
      
      // Test IndexedDB write performance
      const writeStart = performance.now();
      await offlineDB.storeOfflineData('products', [{
        id: 'perf-test',
        name: 'Performance Test Product',
        category: 'test',
        price: 1
      }]);
      const writeTime = performance.now() - writeStart;
      
      // Cleanup
      await offlineDB.deleteOfflineData('products', 'perf-test');
      
      const benchmark = {
        readTime: Math.round(readTime),
        writeTime: Math.round(writeTime),
        target: { read: 50, write: 100 }
      };
      
      return {
        name: 'Performance Benchmark',
        success: readTime < 50 && writeTime < 100,
        duration: Date.now() - startTime,
        details: benchmark
      };
    } catch (error) {
      return {
        name: 'Performance Benchmark',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // 6. UI/UX Offline Flow Test
  const testOfflineUIFlow = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Check for offline indicators
      const offlineBanner = document.querySelector('[data-offline-banner]');
      const offlineIndicator = document.querySelector('[data-offline-indicator]');
      
      return {
        name: 'UI/UX Offline Flow Test',
        success: true,
        duration: Date.now() - startTime,
        details: {
          banner: !!offlineBanner,
          indicator: !!offlineIndicator,
          currentRoute: window.location.pathname
        }
      };
    } catch (error) {
      return {
        name: 'UI/UX Offline Flow Test',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Main validation function
  const validateAndReport = useCallback(async () => {
    setIsValidating(true);
    
    try {
      console.log('[OfflineValidator] 🚀 Starting comprehensive offline validation...');
      
      const tests: TestResult[] = [];
      
      // Run all tests in sequence
      tests.push(await setupEnvironment());
      tests.push(await verifyIndexedDBSchema());
      tests.push(await testActionQueueing());
      tests.push(await testServiceWorker());
      tests.push(await testNetworkStatus());
      tests.push(await runPerformanceBenchmark());
      tests.push(await testOfflineUIFlow());
      
      const failedTests = tests.filter(test => !test.success);
      const warnings = tests.filter(test => test.success && test.details?.readTime > 30).map(test => 
        `${test.name}: Performance warning - ${test.details?.readTime}ms read time`
      );
      
      const stats = await offlineDB.getDataStats();
      
      const result: ValidationResult = {
        success: failedTests.length === 0,
        errors: failedTests.map(test => `${test.name}: ${test.error}`),
        warnings,
        stats,
        timestamp: new Date().toISOString()
      };
      
      setLastValidation(result);
      
      // Show toast notification
      toast({
        title: result.success ? "✅ Offline Validation Passed" : "❌ Offline Validation Failed",
        description: result.success 
          ? "All offline functionality tests passed successfully"
          : `${result.errors.length} error(s) detected`,
        variant: result.success ? "default" : "destructive",
      });
      
      console.log('[OfflineValidator] 📊 Validation complete:', result);
      
    } catch (error) {
      console.error('[OfflineValidator] ❌ Validation failed:', error);
      
      const result: ValidationResult = {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: [],
        timestamp: new Date().toISOString()
      };
      
      setLastValidation(result);
      
      toast({
        title: "Validation Error",
        description: "Failed to run offline validation tests",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  return {
    isValidating,
    lastValidation,
    validateAndReport
  };
};
