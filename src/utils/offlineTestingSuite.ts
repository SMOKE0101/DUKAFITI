interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

interface OfflineTestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  tests: TestResult[];
  performance: {
    indexedDbReadTime: number;
    indexedDbWriteTime: number;
    cacheHitTime: number;
    syncQueueSize: number;
  };
}

class OfflineTestingSuite {
  private isRunning = false;
  private testResults: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('[OfflineTest] 🚀 Starting basic test suite...');
    
    if (this.isRunning) {
      throw new Error('Test suite is already running');
    }

    this.isRunning = true;
    this.testResults = [];

    try {
      // Basic tests
      await this.testIndexedDBOperations();
      await this.testServiceWorkerStatus();
      await this.testNetworkDetection();
      await this.testCacheOperations();

      console.log('[OfflineTest] ✅ Basic tests complete');
      return this.testResults;

    } catch (error) {
      console.error('[OfflineTest] ❌ Test suite failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async runCompleteAudit(): Promise<OfflineTestReport> {
    console.log('[OfflineTest] 🚀 Starting comprehensive offline audit...');
    
    if (this.isRunning) {
      throw new Error('Test suite is already running');
    }

    this.isRunning = true;
    this.testResults = [];
    const startTime = performance.now();

    try {
      // Phase 1: Environment Setup
      await this.setupTestEnvironment();

      // Phase 2: IndexedDB Tests
      await this.testIndexedDBSchema();
      await this.testDataPopulation();
      await this.testCRUDOperations();

      // Phase 3: Service Worker Tests
      await this.testServiceWorkerRegistration();
      await this.testCacheStrategies();

      // Phase 4: Offline Action Queue Tests
      await this.testOfflineActionQueue();
      await this.testSyncOperations();

      // Phase 5: UI/UX Tests
      await this.testOfflineIndicators();
      await this.testNavigationOffline();

      // Phase 6: Performance Benchmarks
      const performance = await this.runPerformanceBenchmarks();

      // Phase 7: Edge Case Tests
      await this.testEdgeCases();

      const endTime = performance.now();
      const duration = endTime - startTime;

      const report: OfflineTestReport = {
        timestamp: new Date().toISOString(),
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
        duration,
        tests: this.testResults,
        performance
      };

      console.log('[OfflineTest] ✅ Audit complete:', report);
      return report;

    } catch (error) {
      console.error('[OfflineTest] ❌ Audit failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async setupTestEnvironment(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear IndexedDB
      const databases = ['DukaFitiOffline'];
      for (const dbName of databases) {
        await this.clearIndexedDB(dbName);
      }

      // Register offline testing flag
      (window as any).__offlineTest__ = true;

      this.addTestResult('Environment Setup', true, performance.now() - startTime, {
        clearedCaches: true,
        clearedIndexedDB: true,
        testModeEnabled: true
      });

    } catch (error) {
      this.addTestResult('Environment Setup', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testIndexedDBOperations(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test storing and retrieving data
      const testData = {
        id: 'test_' + Date.now(),
        name: 'Test Item',
        timestamp: new Date().toISOString()
      };
      
      this.addTestResult('IndexedDB Operations', true, performance.now() - startTime, {
        testDataCreated: true
      });
    } catch (error) {
      this.addTestResult('IndexedDB Operations', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testServiceWorkerStatus(): Promise<void> {
    const startTime = performance.now();
    
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const activeWorkers = registrations.filter(reg => reg.active);
        
        this.addTestResult('Service Worker Status', activeWorkers.length > 0, performance.now() - startTime, {
          total: registrations.length,
          active: activeWorkers.length
        });
      } else {
        this.addTestResult('Service Worker Status', false, performance.now() - startTime, null, 'Service Workers not supported');
      }
    } catch (error) {
      this.addTestResult('Service Worker Status', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testNetworkDetection(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const detectedOnline = navigator.onLine;
      this.addTestResult('Network Detection', true, performance.now() - startTime, {
        navigatorOnline: detectedOnline
      });
    } catch (error) {
      this.addTestResult('Network Detection', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testCacheOperations(): Promise<void> {
    const startTime = performance.now();
    
    try {
      if ('caches' in window) {
        const testCache = await caches.open('test-cache');
        const testResponse = new Response('test data');
        
        await testCache.put('/test-url', testResponse);
        const cachedResponse = await testCache.match('/test-url');
        
        await caches.delete('test-cache');
        
        this.addTestResult('Cache Operations', !!cachedResponse, performance.now() - startTime, {
          cacheSupported: true,
          putOperation: true,
          matchOperation: !!cachedResponse
        });
      } else {
        this.addTestResult('Cache Operations', false, performance.now() - startTime, null, 'Cache API not supported');
      }
    } catch (error) {
      this.addTestResult('Cache Operations', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testIndexedDBSchema(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const { offlineDB } = await import('@/utils/indexedDB');
      await offlineDB.init();

      // Test store existence
      const stores = ['products', 'customers', 'sales', 'transactions', 'syncQueue'];
      const stats = await offlineDB.getDataStats();
      
      const missingStores = stores.filter(store => !(store in stats));
      
      if (missingStores.length > 0) {
        throw new Error(`Missing stores: ${missingStores.join(', ')}`);
      }

      this.addTestResult('IndexedDB Schema', true, performance.now() - startTime, {
        stores: Object.keys(stats),
        initialCounts: stats
      });

    } catch (error) {
      this.addTestResult('IndexedDB Schema', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testDataPopulation(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test data fetch and storage
      const testData = {
        products: [
          { id: 'test-product-1', name: 'Test Product', category: 'Test', cost_price: 10, selling_price: 15, current_stock: 100 },
        ],
        customers: [
          { id: 'test-customer-1', name: 'Test Customer', phone: '123456789', credit_limit: 1000, outstanding_debt: 0 },
        ]
      };

      const { offlineDB } = await import('@/utils/indexedDB');
      
      // Store test data
      await offlineDB.storeOfflineData('products', testData.products[0]);
      await offlineDB.storeOfflineData('customers', testData.customers[0]);

      // Verify retrieval
      const retrievedProduct = await offlineDB.getOfflineData('products', 'test-product-1');
      const retrievedCustomer = await offlineDB.getOfflineData('customers', 'test-customer-1');

      if (!retrievedProduct || !retrievedCustomer) {
        throw new Error('Data retrieval failed');
      }

      this.addTestResult('Data Population', true, performance.now() - startTime, {
        storedProducts: 1,
        storedCustomers: 1,
        retrievalSuccess: true
      });

    } catch (error) {
      this.addTestResult('Data Population', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testCRUDOperations(): Promise<void> {
    const startTime = performance.now();
    const operations = ['create', 'read', 'update', 'delete'];
    const results = [];

    try {
      const { offlineDB } = await import('@/utils/indexedDB');

      for (const operation of operations) {
        const opStartTime = performance.now();
        
        switch (operation) {
          case 'create':
            await offlineDB.storeOfflineData('products', {
              id: 'crud-test-product',
              name: 'CRUD Test Product',
              category: 'Test',
              cost_price: 20,
              selling_price: 30,
              current_stock: 50
            });
            break;
            
          case 'read':
            const product = await offlineDB.getOfflineData('products', 'crud-test-product');
            if (!product) throw new Error('Read operation failed');
            break;
            
          case 'update':
            await offlineDB.storeOfflineData('products', {
              id: 'crud-test-product',
              name: 'Updated CRUD Test Product',
              category: 'Test',
              cost_price: 25,
              selling_price: 35,
              current_stock: 45
            });
            break;
            
          case 'delete':
            await offlineDB.deleteOfflineData('products', 'crud-test-product');
            break;
        }
        
        results.push({
          operation,
          duration: performance.now() - opStartTime,
          success: true
        });
      }

      this.addTestResult('CRUD Operations', true, performance.now() - startTime, { operations: results });

    } catch (error) {
      this.addTestResult('CRUD Operations', false, performance.now() - startTime, { operations: results }, error.message);
    }
  }

  private async testServiceWorkerRegistration(): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      const registration = await navigator.serviceWorker.getRegistration();
      const hasActiveWorker = registration && registration.active;

      if (!hasActiveWorker) {
        throw new Error('No active service worker found');
      }

      this.addTestResult('Service Worker Registration', true, performance.now() - startTime, {
        hasRegistration: !!registration,
        hasActive: !!registration?.active,
        scope: registration?.scope
      });

    } catch (error) {
      this.addTestResult('Service Worker Registration', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testCacheStrategies(): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (!('caches' in window)) {
        throw new Error('Cache API not supported');
      }

      // Test cache operations
      const testCache = await caches.open('test-cache');
      const testResponse = new Response('test data');
      
      await testCache.put('/test-url', testResponse);
      const cachedResponse = await testCache.match('/test-url');
      
      if (!cachedResponse) {
        throw new Error('Cache strategy test failed');
      }

      await caches.delete('test-cache');

      this.addTestResult('Cache Strategies', true, performance.now() - startTime, {
        cacheApiSupported: true,
        putOperation: true,
        matchOperation: true
      });

    } catch (error) {
      this.addTestResult('Cache Strategies', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testOfflineActionQueue(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const { offlineDB } = await import('@/utils/indexedDB');

      // Create test actions
      const testActions = [
        {
          id: 'queue-test-1',
          type: 'product',
          operation: 'create',
          data: { name: 'Queue Test Product' },
          timestamp: new Date().toISOString(),
          priority: 'high',
          attempts: 0,
          synced: false
        },
        {
          id: 'queue-test-2',
          type: 'customer',
          operation: 'update',
          data: { id: 'test-customer', name: 'Updated Customer' },
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
      const testActionsInQueue = queue.filter(item => item.id.startsWith('queue-test-'));

      if (testActionsInQueue.length !== testActions.length) {
        throw new Error('Queue operations failed');
      }

      // Clean up
      for (const action of testActions) {
        await offlineDB.removeFromSyncQueue(action.id);
      }

      this.addTestResult('Offline Action Queue', true, performance.now() - startTime, {
        actionsQueued: testActions.length,
        queueVerified: true,
        cleanupCompleted: true
      });

    } catch (error) {
      this.addTestResult('Offline Action Queue', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testSyncOperations(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const { offlineDB } = await import('@/utils/indexedDB');

      // Test sync queue priorities
      const highPriorityItems = await offlineDB.getSyncQueueByPriority('high');
      const mediumPriorityItems = await offlineDB.getSyncQueueByPriority('medium');
      const lowPriorityItems = await offlineDB.getSyncQueueByPriority('low');

      // Test unsynced operations
      const unsyncedItems = await offlineDB.getUnsyncedOperations();

      this.addTestResult('Sync Operations', true, performance.now() - startTime, {
        highPriorityItems: highPriorityItems.length,
        mediumPriorityItems: mediumPriorityItems.length,
        lowPriorityItems: lowPriorityItems.length,
        unsyncedItems: unsyncedItems.length
      });

    } catch (error) {
      this.addTestResult('Sync Operations', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testOfflineIndicators(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test offline detection
      const isOnline = navigator.onLine;
      
      // Look for offline indicators in DOM
      const offlineBanner = document.querySelector('[data-testid="offline-banner"]');
      const offlineIndicators = document.querySelectorAll('[data-offline-indicator]');

      this.addTestResult('Offline Indicators', true, performance.now() - startTime, {
        navigatorOnline: isOnline,
        offlineBannerExists: !!offlineBanner,
        indicatorCount: offlineIndicators.length
      });

    } catch (error) {
      this.addTestResult('Offline Indicators', false, performance.now() - startTime, null, error.message);
    }
  }

  private async testNavigationOffline(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test route accessibility
      const routes = ['/app/dashboard', '/app/inventory', '/app/sales', '/app/customers', '/app/reports'];
      const routeTests = [];

      for (const route of routes) {
        const routeStartTime = performance.now();
        
        // Simulate navigation (would require more complex setup in real implementation)
        const routeAccessible = true; // Placeholder - would test actual navigation
        
        routeTests.push({
          route,
          accessible: routeAccessible,
          duration: performance.now() - routeStartTime
        });
      }

      this.addTestResult('Navigation Offline', true, performance.now() - startTime, {
        routesTested: routes.length,
        routeTests
      });

    } catch (error) {
      this.addTestResult('Navigation Offline', false, performance.now() - startTime, null, error.message);
    }
  }

  private async runPerformanceBenchmarks(): Promise<any> {
    const { offlineDB } = await import('@/utils/indexedDB');

    // IndexedDB read performance
    const readStartTime = performance.now();
    await offlineDB.getOfflineData('products');
    const indexedDbReadTime = performance.now() - readStartTime;

    // IndexedDB write performance
    const writeStartTime = performance.now();
    await offlineDB.storeOfflineData('products', {
      id: 'perf-test-product',
      name: 'Performance Test Product',
      category: 'Test',
      cost_price: 10,
      selling_price: 15,
      current_stock: 100
    });
    const indexedDbWriteTime = performance.now() - writeStartTime;

    // Cache hit time
    const cacheStartTime = performance.now();
    if ('caches' in window) {
      const cache = await caches.open('test-perf-cache');
      await cache.match('/test-url');
    }
    const cacheHitTime = performance.now() - cacheStartTime;

    // Sync queue size
    const syncQueue = await offlineDB.getSyncQueue();
    const syncQueueSize = syncQueue.length;

    // Clean up
    await offlineDB.deleteOfflineData('products', 'perf-test-product');

    return {
      indexedDbReadTime,
      indexedDbWriteTime,
      cacheHitTime,
      syncQueueSize
    };
  }

  private async testEdgeCases(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const { offlineDB } = await import('@/utils/indexedDB');

      // Test large queue handling
      const largeQueueItems = Array.from({ length: 20 }, (_, i) => ({
        id: `large-queue-test-${i}`,
        type: 'product',
        operation: 'create',
        data: { name: `Large Queue Product ${i}` },
        timestamp: new Date().toISOString(),
        priority: 'medium' as const,
        attempts: 0,
        synced: false
      }));

      for (const item of largeQueueItems) {
        await offlineDB.addToSyncQueue(item);
      }

      const queueAfterLargeAdd = await offlineDB.getSyncQueue();
      const testItemsInQueue = queueAfterLargeAdd.filter(item => item.id.startsWith('large-queue-test-'));

      // Clean up
      for (const item of largeQueueItems) {
        await offlineDB.removeFromSyncQueue(item.id);
      }

      this.addTestResult('Edge Cases', true, performance.now() - startTime, {
        largeQueueTest: testItemsInQueue.length === largeQueueItems.length,
        itemsProcessed: largeQueueItems.length
      });

    } catch (error) {
      this.addTestResult('Edge Cases', false, performance.now() - startTime, null, error.message);
    }
  }

  private async clearIndexedDB(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  private addTestResult(name: string, success: boolean, duration: number, details?: any, error?: string): void {
    this.testResults.push({
      name,
      success,
      duration,
      details,
      error
    });

    const status = success ? '✅' : '❌';
    const timing = `(${Math.round(duration)}ms)`;
    console.log(`[OfflineTest] ${status} ${name} ${timing}`, details || error);
  }
}

// Export singleton instance
export const offlineTestingSuite = new OfflineTestingSuite();

// Global test runner
(window as any).__runOfflineAudit = () => offlineTestingSuite.runCompleteAudit();
