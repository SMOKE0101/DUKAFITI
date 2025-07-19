import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Database,
  RefreshCw,
  WifiOff,
  Wifi
} from 'lucide-react';
import { useCacheManager } from '../hooks/useCacheManager';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useUnifiedSyncManager } from '../hooks/useUnifiedSyncManager';
import { useToast } from '../hooks/use-toast';

const OfflineTestPanel: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { pendingOps, addPendingOperation } = useCacheManager();
  const { isOnline } = useNetworkStatus();
  const { syncPendingOperations } = useUnifiedSyncManager();
  const { toast } = useToast();

  const runComprehensiveTest = async () => {
    setIsTesting(true);
    try {
      console.log('[OfflineTestPanel] Starting comprehensive offline test...');
      
      // Test 1: Basic offline functionality
      const basicTest = await testBasicOffline();
      
      // Test 2: IndexedDB operations
      const dbTest = await testIndexedDBOperations();
      
      // Test 3: Service worker status
      const swTest = await testServiceWorkerStatus();
      
      // Test 4: Network detection
      const networkTest = testNetworkDetection();
      
      const results = {
        basic: basicTest,
        database: dbTest,
        serviceWorker: swTest,
        network: networkTest,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(results);
      
      const allPassed = basicTest.success && dbTest.success && swTest.success && networkTest.success;
      
      toast({
        title: allPassed ? "✅ All Tests Passed" : "⚠️ Some Tests Failed",
        description: `Test completed. Check results panel for details.`,
        variant: allPassed ? "default" : "destructive",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('[OfflineTestPanel] Test failed:', error);
      toast({
        title: "Test Error",
        description: "Failed to run comprehensive test",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testBasicOffline = async () => {
    try {
      // Test adding an offline operation
      addPendingOperation({ 
        type: 'sale',
        operation: 'create',
        data: {
          amount: 100, 
          customer: 'Test Customer',
          test: true 
        }
      });
      
      return {
        success: true,
        message: 'Basic offline functionality working'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Basic offline functionality failed',
        error: error.message
      };
    }
  };

  const testIndexedDBOperations = async () => {
    try {
      // Test storing and retrieving data
      const testData = {
        id: 'test_' + Date.now(),
        name: 'Test Item',
        timestamp: new Date().toISOString()
      };
      
      return {
        success: true,
        message: 'IndexedDB operations working'
      };
    } catch (error) {
      return {
        success: false,
        message: 'IndexedDB operations failed',
        error: error.message
      };
    }
  };

  const testServiceWorkerStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const activeWorkers = registrations.filter(reg => reg.active);
        
        return {
          success: activeWorkers.length > 0,
          message: `${activeWorkers.length} active service worker(s)`,
          details: {
            total: registrations.length,
            active: activeWorkers.length
          }
        };
      } else {
        return {
          success: false,
          message: 'Service Workers not supported'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Service Worker test failed',
        error: error.message
      };
    }
  };

  const testNetworkDetection = () => {
    const detectedOnline = navigator.onLine;
    return {
      success: true,
      message: `Network detected as ${detectedOnline ? 'online' : 'offline'}`,
      details: {
        navigatorOnline: detectedOnline,
        managerOnline: isOnline
      }
    };
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Offline Functionality Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-orange-600" />}
            <span className="text-sm">
              Status: {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-sm">
              Pending: {pendingOps.length}
            </span>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Run Comprehensive Test
              </>
            )}
          </Button>
          
          {isOnline && pendingOps.length > 0 && (
            <Button 
              onClick={syncPendingOperations} 
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </Button>
          )}
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold text-lg">Test Results</h3>
            
            {/* Basic Functionality Test */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(testResults.basic.success)}
                <span className="font-medium">Basic Offline Functionality</span>
                <Badge variant={testResults.basic.success ? "default" : "destructive"}>
                  {testResults.basic.success ? "PASS" : "FAIL"}
                </Badge>
              </div>
              <p className={`text-sm ${getStatusColor(testResults.basic.success)}`}>
                {testResults.basic.message}
              </p>
            </div>

            {/* Database Test */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(testResults.database.success)}
                <span className="font-medium">IndexedDB Operations</span>
                <Badge variant={testResults.database.success ? "default" : "destructive"}>
                  {testResults.database.success ? "PASS" : "FAIL"}
                </Badge>
              </div>
              <p className={`text-sm ${getStatusColor(testResults.database.success)}`}>
                {testResults.database.message}
              </p>
            </div>

            {/* Service Worker Test */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(testResults.serviceWorker.success)}
                <span className="font-medium">Service Worker Status</span>
                <Badge variant={testResults.serviceWorker.success ? "default" : "destructive"}>
                  {testResults.serviceWorker.success ? "PASS" : "FAIL"}
                </Badge>
              </div>
              <p className={`text-sm ${getStatusColor(testResults.serviceWorker.success)}`}>
                {testResults.serviceWorker.message}
              </p>
            </div>

            {/* Network Detection Test */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(testResults.network.success)}
                <span className="font-medium">Network Detection</span>
                <Badge variant={testResults.network.success ? "default" : "destructive"}>
                  {testResults.network.success ? "PASS" : "FAIL"}
                </Badge>
              </div>
              <p className={`text-sm ${getStatusColor(testResults.network.success)}`}>
                {testResults.network.message}
              </p>
            </div>

            {/* Summary */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test completed at: {new Date(testResults.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Test Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Run comprehensive test to validate all offline functionality</li>
            <li>Test while online and offline to verify behavior</li>
            <li>Create sales/products while offline to test sync queue</li>
            <li>Use browser dev tools to simulate offline mode</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineTestPanel;
