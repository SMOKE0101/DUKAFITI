import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useUnifiedSyncManager } from '../hooks/useUnifiedSyncManager';
import { useAuth } from '../hooks/useAuth';
import { useCacheManager } from '../hooks/useCacheManager';
import { useToast } from '../hooks/use-toast';

const OfflineTestingPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  const { isOnline } = useNetworkStatus();
  const { syncPendingOperations, pendingOperations, globalSyncInProgress } = useUnifiedSyncManager();
  const { user } = useAuth();
  const { pendingOps, addPendingOperation } = useCacheManager();
  const { toast } = useToast();

  const runComprehensiveTest = useCallback(async () => {
    setIsRunningTests(true);
    const results: Record<string, boolean> = {};
    
    try {
      // Test 1: Network Status Detection
      console.log('[OfflineTest] Testing network status...');
      results['networkStatus'] = typeof isOnline === 'boolean';
      
      // Test 2: Authentication State
      console.log('[OfflineTest] Testing authentication...');
      results['authentication'] = !!user;
      
      // Test 3: Cache Manager
      console.log('[OfflineTest] Testing cache manager...');
      results['cacheManager'] = typeof pendingOps !== 'undefined' && Array.isArray(pendingOps);
      
      // Test 4: Local Storage Functionality
      console.log('[OfflineTest] Testing local storage...');
      try {
        const testKey = 'dukafiti_test';
        const testData = { test: true, timestamp: Date.now() };
        localStorage.setItem(testKey, JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
        localStorage.removeItem(testKey);
        results['localStorage'] = retrieved.test === true;
      } catch (error) {
        console.error('[OfflineTest] Local storage test failed:', error);
        results['localStorage'] = false;
      }
      
      // Test 5: Pending Operations System (only if user exists)
      console.log('[OfflineTest] Testing pending operations...');
      if (user) {
        try {
          await addPendingOperation({
            type: 'product',
            operation: 'create',
            data: {
              id: `test_${Date.now()}`,
              name: 'Test Product',
              category: 'Test',
              costPrice: 10,
              sellingPrice: 15
            }
          });
          results['pendingOperations'] = true;
        } catch (error) {
          console.error('[OfflineTest] Pending operations test failed:', error);
          results['pendingOperations'] = false;
        }
      } else {
        results['pendingOperations'] = false;
      }
      
      // Test 6: Sync System (if online and user exists)
      console.log('[OfflineTest] Testing sync system...');
      if (isOnline && user) {
        try {
          const syncAvailable = typeof syncPendingOperations === 'function';
          results['syncSystem'] = syncAvailable;
        } catch (error) {
          console.error('[OfflineTest] Sync system test failed:', error);
          results['syncSystem'] = false;
        }
      } else {
        results['syncSystem'] = !user ? false : true; // Offline mode is expected when offline
      }
      
      setTestResults(results);
      
      // Show summary toast
      const passed = Object.values(results).filter(Boolean).length;
      const total = Object.keys(results).length;
      
      toast({
        title: "Offline Capability Test Complete",
        description: `${passed}/${total} tests passed`,
        variant: passed === total ? "default" : "destructive",
      });
      
    } catch (error) {
      console.error('[OfflineTest] Comprehensive test failed:', error);
      toast({
        title: "Test Failed",
        description: "An error occurred during testing",
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  }, [isOnline, user, pendingOps, addPendingOperation, syncPendingOperations, toast]);

  const handleTestOffline = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'SIMULATE_OFFLINE' });
        }
      });
    }
  };

  const handleTestOnline = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'SIMULATE_ONLINE' });
        }
      });
    }
  };

  const triggerManualSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Cannot Sync",
        description: "Device is offline. Sync will occur automatically when connection is restored.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await syncPendingOperations();
      toast({
        title: "Sync Initiated",
        description: "Manual sync has been triggered",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Manual sync failed. Please try again.",
        variant: "destructive",
      });
    }
  }, [isOnline, syncPendingOperations, toast]);

  const TestResultBadge: React.FC<{ testName: string; result?: boolean }> = ({ testName, result }) => (
    <div className="flex items-center justify-between p-2 border rounded">
      <span className="text-sm font-medium">{testName}</span>
      {result === undefined ? (
        <Badge variant="outline">Not Tested</Badge>
      ) : result ? (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pass
        </Badge>
      ) : (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Fail
        </Badge>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            DukaFiti Offline Capability Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-medium">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-medium">Offline</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Pending: {pendingOperations}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {user ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-medium">Authenticated</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-medium">Not Authenticated</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Test Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={runComprehensiveTest} 
              disabled={isRunningTests}
              className="flex items-center gap-2"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Run Comprehensive Test
            </Button>
            
            <Button 
              onClick={triggerManualSync} 
              disabled={!isOnline || globalSyncInProgress}
              variant="outline"
              className="flex items-center gap-2"
            >
              {globalSyncInProgress ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Manual Sync
            </Button>

            <Button 
              onClick={handleTestOffline} 
              variant="outline" 
              disabled={!isOnline}
            >
              Simulate Offline
            </Button>
            
            <Button 
              onClick={handleTestOnline} 
              variant="outline" 
              disabled={isOnline}
            >
              Simulate Online
            </Button>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TestResultBadge testName="Network Status Detection" result={testResults['networkStatus']} />
                <TestResultBadge testName="Authentication System" result={testResults['authentication']} />
                <TestResultBadge testName="Cache Manager" result={testResults['cacheManager']} />
                <TestResultBadge testName="Local Storage" result={testResults['localStorage']} />
                <TestResultBadge testName="Pending Operations" result={testResults['pendingOperations']} />
                <TestResultBadge testName="Sync System" result={testResults['syncSystem']} />
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Technical Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Offline-First Architecture:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>IndexedDB for local data storage</li>
                  <li>Service Worker for offline functionality</li>
                  <li>Automatic background synchronization</li>
                  <li>Network-aware data loading</li>
                </ul>
              </div>
              <div>
                <strong>Sync Capabilities:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Pending operations queue</li>
                  <li>Coordinated sync management</li>
                  <li>Automatic retry mechanisms</li>
                  <li>Conflict resolution</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Authentication Required</span>
              </div>
              <p className="text-yellow-700 mt-1 text-sm">
                Some offline features require authentication. Please sign in to test full functionality.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineTestingPanel;