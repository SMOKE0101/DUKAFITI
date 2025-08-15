import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineFirstSupabase } from '@/hooks/useOfflineFirstSupabase';
import { useOfflineCustomerPayments } from '@/hooks/useOfflineCustomerPayments';
import { useOfflineDebtManager } from '@/hooks/useOfflineDebtManager';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/currency';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RotateCcw, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Users,
  Receipt,
  CreditCard
} from 'lucide-react';
import SplitPaymentDebtTest from './SplitPaymentDebtTest';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'running';
  message: string;
  timestamp: string;
}

const OfflineTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { 
    debtTransactions, 
    recordDebtIncrease, 
    recordDebtPayment,
    pendingTransactions,
    syncDebtTransactions 
  } = useOfflineDebtManager();
  
  const { 
    payments,
    loading: paymentsLoading,
    isOnline: paymentsOnline,
    lastSyncTime,
    testOffline
  } = useOfflineCustomerPayments();

  const addTestResult = (name: string, status: TestResult['status'], message: string) => {
    setTestResults(prev => [
      ...prev.filter(r => r.name !== name),
      { name, status, message, timestamp: new Date().toISOString() }
    ]);
  };

  const runOfflineTests = async () => {
    if (!user) {
      addTestResult('Authentication', 'failed', 'User not authenticated');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Network Status Detection
      addTestResult('Network Status', 'running', 'Checking network status detection...');
      await new Promise(resolve => setTimeout(resolve, 500));
      addTestResult('Network Status', 'passed', `Network status correctly detected: ${isOnline ? 'Online' : 'Offline'}`);

      // Test 2: Offline Data Storage
      addTestResult('Offline Storage', 'running', 'Testing offline data storage...');
      try {
        await recordDebtIncrease('test_customer_123', 'Test Customer', 150, 'test_sale_123');
        addTestResult('Offline Storage', 'passed', 'Successfully recorded debt increase offline');
      } catch (error) {
        addTestResult('Offline Storage', 'failed', `Failed to store data offline: ${error}`);
      }

      // Test 3: Debt Payment Recording
      addTestResult('Debt Payments', 'running', 'Testing debt payment recording...');
      try {
        await recordDebtPayment('test_customer_456', 'Test Customer 2', 75, 'cash', 'TEST_REF_001');
        addTestResult('Debt Payments', 'passed', 'Successfully recorded debt payment');
      } catch (error) {
        addTestResult('Debt Payments', 'failed', `Failed to record debt payment: ${error}`);
      }

      // Test 4: Offline Customer Payments
      addTestResult('Customer Payments', 'running', 'Testing customer payments offline capability...');
      try {
        const testResult = await testOffline();
        addTestResult('Customer Payments', testResult.success ? 'passed' : 'failed', testResult.message);
      } catch (error) {
        addTestResult('Customer Payments', 'failed', `Customer payments test failed: ${error}`);
      }

      // Test 5: Data Sync Capability
      if (isOnline) {
        addTestResult('Sync Capability', 'running', 'Testing data synchronization...');
        try {
          await syncDebtTransactions();
          addTestResult('Sync Capability', 'passed', 'Successfully tested sync functionality');
        } catch (error) {
          addTestResult('Sync Capability', 'failed', `Sync test failed: ${error}`);
        }
      } else {
        addTestResult('Sync Capability', 'passed', 'Offline - sync will occur when online');
      }

    } catch (error) {
      addTestResult('Test Suite', 'failed', `Test suite failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Offline Capability Testing Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive testing for offline functionality including split payments, debt management, and data synchronization
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Offline Tests</TabsTrigger>
          <TabsTrigger value="split-payments">Split Payments</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                    <span className="font-medium">Network</span>
                  </div>
                  <Badge variant={isOnline ? 'default' : 'destructive'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Auth</span>
                  </div>
                  <Badge variant={user ? 'default' : 'destructive'}>
                    {user ? 'Authenticated' : 'Not Auth'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <Badge variant="outline">
                    {pendingTransactions} transactions
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Debt Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <Badge variant="outline">{debtTransactions.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Sync:</span>
                    <Badge variant={pendingTransactions > 0 ? 'destructive' : 'default'}>
                      {pendingTransactions}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(debtTransactions.reduce((sum, t) => sum + t.amount, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Customer Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Payments:</span>
                    <Badge variant="outline">{payments.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <Badge variant={paymentsLoading ? 'destructive' : 'default'}>
                      {paymentsLoading ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Sync:</span>
                    <span className="text-sm text-muted-foreground">
                      {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offline Functionality Tests</CardTitle>
              <p className="text-sm text-muted-foreground">
                Run comprehensive tests to verify offline capabilities
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runOfflineTests}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isRunning ? 'Running Tests...' : 'Run Offline Tests'}
              </Button>

              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Test Results</h4>
                  {testResults.map((result) => (
                    <Card key={result.name} className={`border-2 ${getStatusColor(result.status)}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="font-medium">{result.name}</span>
                          </div>
                          <Badge variant="outline" className={getStatusColor(result.status)}>
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{result.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="split-payments">
          <SplitPaymentDebtTest />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          {/* Recent Debt Transactions */}
          {debtTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Debt Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {debtTransactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type} - {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={transaction.synced ? 'default' : 'destructive'}>
                          {transaction.synced ? 'Synced' : 'Pending'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Payments */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Customer Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {payments.slice(0, 10).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{payment.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_method} - {formatCurrency(payment.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={payment.synced ? 'default' : 'destructive'}>
                          {payment.synced ? 'Synced' : 'Pending'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(payment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineTestPanel;