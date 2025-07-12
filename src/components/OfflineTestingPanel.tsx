
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  WifiOff,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useToast } from '../hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'running';
  message: string;
  details?: any;
  timestamp?: string;
}

const OfflineTestingPanel: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testProgress, setTestProgress] = useState(0);
  
  const { testOffline: testCustomers, isOnline: customersOnline, lastSyncTime: customersSync } = useSupabaseCustomers();
  const { testOffline: testProducts, isOnline: productsOnline, lastSyncTime: productsSync } = useSupabaseProducts();
  const { testOffline: testSales, isOnline: salesOnline, lastSyncTime: salesSync } = useSupabaseSales();
  const { toast } = useToast();

  const runComprehensiveTests = async () => {
    setIsRunningTests(true);
    setTestProgress(0);
    
    const tests: TestResult[] = [
      { name: 'Network Status Check', status: 'pending', message: '' },
      { name: 'Customers Offline Test', status: 'pending', message: '' },
      { name: 'Products Offline Test', status: 'pending', message: '' },
      { name: 'Sales Offline Test', status: 'pending', message: '' },
      { name: 'Cache Persistence Test', status: 'pending', message: '' },
      { name: 'Data Sync Status Check', status: 'pending', message: '' },
      { name: 'Service Worker Status', status: 'pending', message: '' },
      { name: 'IndexedDB Functionality', status: 'pending', message: '' }
    ];

    setTestResults(tests);

    try {
      // Test 1: Network Status Check
      setTestProgress(12.5);
      const networkTest = await testNetworkStatus();
      tests[0] = networkTest;
      setTestResults([...tests]);

      // Test 2: Customers Offline Test
      setTestProgress(25);
      const customersTestResult = await testCustomers();
      tests[1] = {
        name: 'Customers Offline Test',
        status: customersTestResult.success ? 'passed' : 'failed',
        message: customersTestResult.message,
        details: customersTestResult,
        timestamp: new Date().toISOString()
      };
      setTestResults([...tests]);

      // Test 3: Products Offline Test
      setTestProgress(37.5);
      const productsTestResult = await testProducts();
      tests[2] = {
        name: 'Products Offline Test',
        status: productsTestResult.success ? 'passed' : 'failed',
        message: productsTestResult.message,
        details: productsTestResult,
        timestamp: new Date().toISOString()
      };
      setTestResults([...tests]);

      // Test 4: Sales Offline Test
      setTestProgress(50);
      const salesTestResult = await testSales();
      tests[3] = {
        name: 'Sales Offline Test',
        status: salesTestResult.success ? 'passed' : 'failed',
        message: salesTestResult.message,
        details: salesTestResult,
        timestamp: new Date().toISOString()
      };
      setTestResults([...tests]);

      // Test 5: Cache Persistence Test
      setTestProgress(62.5);
      const cacheTest = await testCachePersistence();
      tests[4] = cacheTest;
      setTestResults([...tests]);

      // Test 6: Data Sync Status Check
      setTestProgress(75);
      const syncTest = testDataSyncStatus();
      tests[5] = syncTest;
      setTestResults([...tests]);

      // Test 7: Service Worker Status
      setTestProgress(87.5);
      const swTest = await testServiceWorkerStatus();
      tests[6] = swTest;
      setTestResults([...tests]);

      // Test 8: IndexedDB Functionality
      setTestProgress(100);
      const idbTest = await testIndexedDBFunctionality();
      tests[7] = idbTest;
      setTestResults([...tests]);

      // Summary
      const passedTests = tests.filter(t => t.status === 'passed').length;
      const failedTests = tests.filter(t => t.status === 'failed').length;
      
      toast({
        title: "Testing Complete",
        description: `${passedTests} passed, ${failedTests} failed out of ${tests.length} tests`,
        variant: failedTests > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error('[OfflineTestingPanel] Test execution error:', error);
      toast({
        title: "Testing Error",
        description: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const testNetworkStatus = async (): Promise<TestResult> => {
    const isOnline = navigator.onLine;
    const allOnline = customersOnline && productsOnline && salesOnline;
    
    return {
      name: 'Network Status Check',
      status: 'passed',
      message: `Browser: ${isOnline ? 'Online' : 'Offline'}, Data hooks: ${allOnline ? 'Online' : 'Offline'}`,
      details: { browserOnline: isOnline, dataHooksOnline: allOnline },
      timestamp: new Date().toISOString()
    };
  };

  const testCachePersistence = async (): Promise<TestResult> => {
    try {
      // Test IndexedDB availability
      if (!window.indexedDB) {
        return {
          name: 'Cache Persistence Test',
          status: 'failed',
          message: 'IndexedDB not available in this browser',
          timestamp: new Date().toISOString()
        };
      }

      // Test cache write/read
      const testData = { test: true, timestamp: Date.now() };
      localStorage.setItem('offline_test', JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem('offline_test') || '{}');
      localStorage.removeItem('offline_test');

      const success = retrieved.test === true;
      
      return {
        name: 'Cache Persistence Test',
        status: success ? 'passed' : 'failed',
        message: success ? 'Cache read/write operations successful' : 'Cache operations failed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'Cache Persistence Test',
        status: 'failed',
        message: `Cache test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testDataSyncStatus = (): TestResult => {
    const syncTimes = [customersSync, productsSync, salesSync].filter(Boolean);
    const hasSyncData = syncTimes.length > 0;
    
    return {
      name: 'Data Sync Status Check',
      status: hasSyncData ? 'passed' : 'failed',
      message: hasSyncData 
        ? `${syncTimes.length} data types have sync timestamps` 
        : 'No sync data available',
      details: { customersSync, productsSync, salesSync },
      timestamp: new Date().toISOString()
    };
  };

  const testServiceWorkerStatus = async (): Promise<TestResult> => {
    try {
      if (!('serviceWorker' in navigator)) {
        return {
          name: 'Service Worker Status',
          status: 'failed',
          message: 'Service Worker not supported in this browser',
          timestamp: new Date().toISOString()
        };
      }

      const registration = await navigator.serviceWorker.getRegistration();
      const isActive = registration && registration.active;
      
      return {
        name: 'Service Worker Status',
        status: isActive ? 'passed' : 'failed',
        message: isActive 
          ? `Service Worker active: ${registration.active?.scriptURL}` 
          : 'No active Service Worker found',
        details: { 
          registration: !!registration, 
          active: !!registration?.active,
          scope: registration?.scope 
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'Service Worker Status',
        status: 'failed',
        message: `Service Worker check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testIndexedDBFunctionality = async (): Promise<TestResult> => {
    try {
      return new Promise((resolve) => {
        const request = indexedDB.open('test-db', 1);
        
        request.onerror = () => {
          resolve({
            name: 'IndexedDB Functionality',
            status: 'failed',
            message: 'Failed to open IndexedDB',
            timestamp: new Date().toISOString()
          });
        };

        request.onsuccess = () => {
          const db = request.result;
          db.close();
          indexedDB.deleteDatabase('test-db');
          
          resolve({
            name: 'IndexedDB Functionality',
            status: 'passed',
            message: 'IndexedDB operations successful',
            timestamp: new Date().toISOString()
          });
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('test-store')) {
            db.createObjectStore('test-store', { keyPath: 'id' });
          }
        };
      });
    } catch (error) {
      return {
        name: 'IndexedDB Functionality',
        status: 'failed',
        message: `IndexedDB test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            <CardTitle>Offline Functionality Testing</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {navigator.onLine ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-600" />
            )}
            <span className="text-sm text-muted-foreground">
              {navigator.onLine ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={runComprehensiveTests}
            disabled={isRunningTests}
            className="flex items-center gap-2"
          >
            {isRunningTests ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRunningTests ? 'Running Tests...' : 'Run Comprehensive Tests'}
          </Button>
          
          {isRunningTests && (
            <div className="flex-1">
              <Progress value={testProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {testProgress.toFixed(0)}% Complete
              </p>
            </div>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium text-sm">{result.name}</p>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {testResults.filter(t => t.status === 'passed').length}
            </p>
            <p className="text-sm text-muted-foreground">Tests Passed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {testResults.filter(t => t.status === 'failed').length}
            </p>
            <p className="text-sm text-muted-foreground">Tests Failed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {testResults.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Tests</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineTestingPanel;
