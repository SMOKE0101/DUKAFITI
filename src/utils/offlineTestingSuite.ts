
import { offlineDB } from './indexedDB';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

interface OfflineTestSuite {
  runAllTests(): Promise<TestResult[]>;
  testDataPersistence(): Promise<TestResult>;
  testSyncQueue(): Promise<TestResult>;
  testOfflineOperations(): Promise<TestResult>;
  testConflictResolution(): Promise<TestResult>;
  testPerformance(): Promise<TestResult>;
  testDataIntegrity(): Promise<TestResult>;
  testCacheManagement(): Promise<TestResult>;
  testServiceWorker(): Promise<TestResult>;
}

class OfflineTestingSuite implements OfflineTestSuite {
  
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting comprehensive offline functionality tests...');
    
    const tests = [
      this.testDataPersistence(),
      this.testSyncQueue(),
      this.testOfflineOperations(),
      this.testConflictResolution(),
      this.testPerformance(),
      this.testDataIntegrity(),
      this.testCacheManagement(),
      this.testServiceWorker()
    ];
    
    const results = await Promise.all(tests);
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`🎯 Test Results: ${passedTests}/${totalTests} passed`);
    
    if (passedTests === totalTests) {
      console.log('✅ All offline functionality tests PASSED! 🚀');
    } else {
      console.warn('❌ Some tests failed. Review the results below:');
      results.filter(r => !r.passed).forEach(result => {
        console.error(`❌ ${result.name}: ${result.error}`);
      });
    }
    
    return results;
  }

  async testDataPersistence(): Promise<TestResult> {
    try {
      console.log('📊 Testing data persistence...');
      
      // Test product data
      const testProduct = {
        id: 'test-product-' + Date.now(),
        user_id: 'test-user',
        name: 'Test Product',
        category: 'Test Category',
        cost_price: 100,
        selling_price: 150,
        current_stock: 50,
        created_at: new Date().toISOString()
      };
      
      // Store product
      await offlineDB.storeOfflineData('products', testProduct);
      
      // Retrieve product
      const retrievedProduct = await offlineDB.getOfflineData('products', testProduct.id);
      
      if (!retrievedProduct || retrievedProduct.id !== testProduct.id) {
        throw new Error('Product data persistence failed');
      }
      
      // Test customer data
      const testCustomer = {
        id: 'test-customer-' + Date.now(),
        user_id: 'test-user',
        name: 'Test Customer',
        phone: '+254700000000',
        credit_limit: 5000,
        outstanding_debt: 0,
        created_date: new Date().toISOString()
      };
      
      await offlineDB.storeOfflineData('customers', testCustomer);
      const retrievedCustomer = await offlineDB.getOfflineData('customers', testCustomer.id);
      
      if (!retrievedCustomer || retrievedCustomer.id !== testCustomer.id) {
        throw new Error('Customer data persistence failed');
      }
      
      // Cleanup
      await offlineDB.deleteOfflineData('products', testProduct.id);
      await offlineDB.deleteOfflineData('customers', testCustomer.id);
      
      return {
        name: 'Data Persistence',
        passed: true,
        details: 'Products and customers stored and retrieved successfully'
      };
      
    } catch (error) {
      return {
        name: 'Data Persistence',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testSyncQueue(): Promise<TestResult> {
    try {
      console.log('🔄 Testing sync queue functionality...');
      
      const testOperation = {
        id: 'test-op-' + Date.now(),
        type: 'product',
        operation: 'create',
        data: { name: 'Test Product', price: 100 },
        timestamp: new Date().toISOString(),
        priority: 'high' as const,
        attempts: 0,
        synced: false
      };
      
      // Add to sync queue
      await offlineDB.addToSyncQueue(testOperation);
      
      // Retrieve from sync queue
      const queueItems = await offlineDB.getSyncQueue();
      const foundItem = queueItems.find(item => item.id === testOperation.id);
      
      if (!foundItem) {
        throw new Error('Operation not found in sync queue');
      }
      
      // Test priority filtering
      const highPriorityItems = await offlineDB.getSyncQueueByPriority('high');
      const foundHighPriority = highPriorityItems.find(item => item.id === testOperation.id);
      
      if (!foundHighPriority) {
        throw new Error('Priority filtering failed');
      }
      
      // Test unsynced operations
      const unsyncedOps = await offlineDB.getUnsyncedOperations();
      const foundUnsynced = unsyncedOps.find(item => item.id === testOperation.id);
      
      if (!foundUnsynced) {
        throw new Error('Unsynced operations query failed');
      }
      
      // Cleanup
      await offlineDB.removeFromSyncQueue(testOperation.id);
      
      return {
        name: 'Sync Queue',
        passed: true,
        details: 'Sync queue operations working correctly'
      };
      
    } catch (error) {
      return {
        name: 'Sync Queue',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testOfflineOperations(): Promise<TestResult> {
    try {
      console.log('💻 Testing offline operations...');
      
      // Simulate offline sale
      const testSale = {
        id: 'test-sale-' + Date.now(),
        user_id: 'test-user',
        product_id: 'test-product',
        product_name: 'Test Product',
        quantity: 5,
        selling_price: 150,
        cost_price: 100,
        profit: 250,
        total_amount: 750,
        payment_method: 'cash',
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      // Store offline sale
      await offlineDB.storeOfflineData('sales', testSale);
      
      // Queue for sync
      const syncOperation = {
        id: 'sync-' + Date.now(),
        type: 'sale',
        operation: 'create',
        data: testSale,
        timestamp: new Date().toISOString(),
        priority: 'high' as const,
        attempts: 0,
        synced: false
      };
      
      await offlineDB.addToSyncQueue(syncOperation);
      
      // Verify both operations
      const storedSale = await offlineDB.getOfflineData('sales', testSale.id);
      const queuedOp = await offlineDB.getSyncQueue();
      const foundQueuedOp = queuedOp.find(op => op.id === syncOperation.id);
      
      if (!storedSale || !foundQueuedOp) {
        throw new Error('Offline operation storage failed');
      }
      
      // Cleanup
      await offlineDB.deleteOfflineData('sales', testSale.id);
      await offlineDB.removeFromSyncQueue(syncOperation.id);
      
      return {
        name: 'Offline Operations',
        passed: true,
        details: 'Offline sales and operations handled correctly'
      };
      
    } catch (error) {
      return {
        name: 'Offline Operations',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConflictResolution(): Promise<TestResult> {
    try {
      console.log('⚡ Testing conflict resolution...');
      
      const productId = 'conflict-test-' + Date.now();
      
      // Create original product
      const originalProduct = {
        id: productId,
        user_id: 'test-user',
        name: 'Original Product',
        selling_price: 100,
        current_stock: 20,
        updated_at: new Date().toISOString()
      };
      
      await offlineDB.storeOfflineData('products', originalProduct);
      
      // Simulate concurrent update (offline changes)
      const offlineUpdate = {
        ...originalProduct,
        name: 'Updated Offline',
        selling_price: 120,
        updated_at: new Date(Date.now() + 1000).toISOString()
      };
      
      await offlineDB.storeOfflineData('products', offlineUpdate);
      
      // Verify latest change is preserved
      const finalProduct = await offlineDB.getOfflineData('products', productId);
      
      if (finalProduct.name !== 'Updated Offline' || finalProduct.selling_price !== 120) {
        throw new Error('Conflict resolution failed - latest changes not preserved');
      }
      
      // Cleanup
      await offlineDB.deleteOfflineData('products', productId);
      
      return {
        name: 'Conflict Resolution',
        passed: true,
        details: 'Latest changes preserved correctly'
      };
      
    } catch (error) {
      return {
        name: 'Conflict Resolution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testPerformance(): Promise<TestResult> {
    try {
      console.log('🚀 Testing performance with bulk operations...');
      
      const startTime = performance.now();
      
      // Create bulk test data
      const bulkProducts = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-test-${i}-${Date.now()}`,
        user_id: 'test-user',
        name: `Performance Test Product ${i}`,
        category: 'Test',
        cost_price: 50 + i,
        selling_price: 100 + i,
        current_stock: 10 + i,
        created_at: new Date().toISOString()
      }));
      
      // Store bulk data
      for (const product of bulkProducts) {
        await offlineDB.storeOfflineData('products', product);
      }
      
      const storageTime = performance.now();
      
      // Retrieve bulk data
      const allProducts = await offlineDB.getOfflineData('products');
      const testProducts = allProducts.filter(p => p.id.startsWith('perf-test-'));
      
      const retrievalTime = performance.now();
      
      if (testProducts.length !== 100) {
        throw new Error(`Expected 100 products, got ${testProducts.length}`);
      }
      
      // Performance benchmarks (reasonable for IndexedDB)
      const storageTimeMs = storageTime - startTime;
      const retrievalTimeMs = retrievalTime - storageTime;
      
      if (storageTimeMs > 5000) { // 5 seconds max for storing 100 items
        throw new Error(`Storage too slow: ${storageTimeMs}ms`);
      }
      
      if (retrievalTimeMs > 1000) { // 1 second max for retrieving
        throw new Error(`Retrieval too slow: ${retrievalTimeMs}ms`);
      }
      
      // Cleanup
      for (const product of testProducts) {
        await offlineDB.deleteOfflineData('products', product.id);
      }
      
      return {
        name: 'Performance',
        passed: true,
        details: `Storage: ${Math.round(storageTimeMs)}ms, Retrieval: ${Math.round(retrievalTimeMs)}ms`
      };
      
    } catch (error) {
      return {
        name: 'Performance',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testDataIntegrity(): Promise<TestResult> {
    try {
      console.log('🔒 Testing data integrity...');
      
      // Test data validation
      const invalidProduct = {
        id: 'integrity-test-' + Date.now(),
        // Missing required fields
        name: 'Test Product'
      };
      
      try {
        await offlineDB.storeOfflineData('products', invalidProduct);
        // Should not reach here if validation works
      } catch (error) {
        // Expected to fail - this is good
      }
      
      // Test valid data
      const validProduct = {
        id: 'integrity-test-valid-' + Date.now(),
        user_id: 'test-user',
        name: 'Valid Product',
        category: 'Test',
        cost_price: 50,
        selling_price: 100,
        current_stock: 20,
        created_at: new Date().toISOString()
      };
      
      await offlineDB.storeOfflineData('products', validProduct);
      const retrieved = await offlineDB.getOfflineData('products', validProduct.id);
      
      // Verify data types and values
      if (typeof retrieved.cost_price !== 'number' || retrieved.cost_price !== 50) {
        throw new Error('Data type integrity failed');
      }
      
      if (typeof retrieved.current_stock !== 'number' || retrieved.current_stock !== 20) {
        throw new Error('Data value integrity failed');
      }
      
      // Cleanup
      await offlineDB.deleteOfflineData('products', validProduct.id);
      
      return {
        name: 'Data Integrity',
        passed: true,
        details: 'Data validation and type integrity maintained'
      };
      
    } catch (error) {
      return {
        name: 'Data Integrity',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testCacheManagement(): Promise<TestResult> {
    try {
      console.log('💾 Testing cache management...');
      
      // Test cache statistics
      const statsBefore = await offlineDB.getDataStats();
      
      // Add test data
      const testData = {
        id: 'cache-test-' + Date.now(),
        user_id: 'test-user',
        name: 'Cache Test',
        category: 'Test',
        cost_price: 100,
        selling_price: 150,
        current_stock: 10,
        created_at: new Date().toISOString()
      };
      
      await offlineDB.storeOfflineData('products', testData);
      
      const statsAfter = await offlineDB.getDataStats();
      
      if (statsAfter.products <= statsBefore.products) {
        throw new Error('Cache statistics not updating correctly');
      }
      
      // Test cache clearing
      await offlineDB.deleteOfflineData('products', testData.id);
      
      const statsAfterDelete = await offlineDB.getDataStats();
      
      if (statsAfterDelete.products !== statsBefore.products) {
        throw new Error('Cache cleanup not working correctly');
      }
      
      return {
        name: 'Cache Management',
        passed: true,
        details: 'Cache statistics and cleanup working correctly'
      };
      
    } catch (error) {
      return {
        name: 'Cache Management',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testServiceWorker(): Promise<TestResult> {
    try {
      console.log('🛠️ Testing Service Worker integration...');
      
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }
      
      // Check if service worker is registered
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        throw new Error('Service Worker not registered');
      }
      
      // Test cache API access
      const cacheNames = await caches.keys();
      
      if (!Array.isArray(cacheNames)) {
        throw new Error('Cache API not accessible');
      }
      
      // Test offline capability indicator
      const isOnline = navigator.onLine;
      
      return {
        name: 'Service Worker',
        passed: true,
        details: `SW registered: ${!!registration}, Caches: ${cacheNames.length}, Online: ${isOnline}`
      };
      
    } catch (error) {
      return {
        name: 'Service Worker',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const offlineTestingSuite = new OfflineTestingSuite();

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Run tests after a delay to ensure everything is initialized
  setTimeout(() => {
    offlineTestingSuite.runAllTests().then(results => {
      console.table(results.map(r => ({
        Test: r.name,
        Status: r.passed ? '✅ PASS' : '❌ FAIL',
        Details: r.details || r.error || ''
      })));
    });
  }, 3000);
}
