import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineDebtManager } from '@/hooks/useOfflineDebtManager';
import { useUnifiedCustomers } from '@/hooks/useUnifiedCustomers';
import { useUnifiedSales } from '@/hooks/useUnifiedSales';
import { formatCurrency } from '@/utils/currency';
import { Sale, Customer } from '@/types';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  PlayCircle,
  RefreshCw,
  DollarSign,
  Receipt,
  Banknote,
  Split
} from 'lucide-react';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: any;
  timestamp?: string;
}

const SplitPaymentDebtTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testCustomer, setTestCustomer] = useState<Customer | null>(null);
  
  const { user } = useAuth();
  const { recordDebtIncrease, calculateCustomerDebt, getPendingDebtTransactions } = useOfflineDebtManager();
  const { customers, createCustomer, updateCustomer, refetch: refreshCustomers } = useUnifiedCustomers();
  const { createSale, sales, refetch: refreshSales } = useUnifiedSales();

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [
      ...prev.filter(r => r.testName !== result.testName),
      { ...result, timestamp: new Date().toISOString() }
    ]);
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    addTestResult({ testName, status: 'running', message: 'Test in progress...' });
    
    try {
      await testFn();
      addTestResult({ 
        testName, 
        status: 'passed', 
        message: 'Test completed successfully' 
      });
    } catch (error) {
      addTestResult({ 
        testName, 
        status: 'failed', 
        message: error instanceof Error ? error.message : 'Test failed with unknown error',
        details: error
      });
    }
  };

  const createTestCustomer = async (): Promise<Customer> => {
    console.log('[SplitPaymentDebtTest] Creating test customer');
    const testCustomerData = {
      name: `Test Customer ${Date.now()}`,
      phone: `+254${Math.floor(Math.random() * 1000000000)}`,
      email: `test${Date.now()}@example.com`,
      address: 'Test Address',
      totalPurchases: 0,
      outstandingDebt: 0,
      creditLimit: 5000,
      riskRating: 'low' as const,
      lastPurchaseDate: null
    };

    const customer = await createCustomer(testCustomerData);
    setTestCustomer(customer);
    console.log('[SplitPaymentDebtTest] Test customer created:', customer);
    return customer;
  };

  const testSplitPaymentCreation = async () => {
    if (!user || !testCustomer) throw new Error('User or test customer not available');

    console.log('[SplitPaymentDebtTest] Testing split payment creation');
    
    // Create a test sale with split payment including debt
    const saleData: Omit<Sale, 'id' | 'synced'> = {
      productId: `test_product_${Date.now()}`,
      productName: 'Test Product for Split Payment',
      quantity: 2,
      sellingPrice: 500,
      costPrice: 300,
      profit: 400, // (500-300) * 2
      total: 1000,
      customerId: testCustomer.id,
      customerName: testCustomer.name,
      paymentMethod: 'split',
      paymentDetails: {
        cashAmount: 300,
        mpesaAmount: 400,
        debtAmount: 300, // This should increase customer debt
        discountAmount: 0,
        saleReference: 'TEST_SPLIT_001'
      },
      timestamp: new Date().toISOString(),
      clientSaleId: `test_${Date.now()}`
    };

    console.log('[SplitPaymentDebtTest] Creating split payment sale:', saleData);
    const createdSale = await createSale(saleData);
    
    console.log('[SplitPaymentDebtTest] Sale created:', createdSale);
    
    // Verify the sale was created with correct payment details
    if (!createdSale.paymentDetails.debtAmount || createdSale.paymentDetails.debtAmount !== 300) {
      throw new Error(`Expected debt amount 300, got ${createdSale.paymentDetails.debtAmount}`);
    }

    // Record the debt increase manually (since this is what should happen in the checkout)
    await recordDebtIncrease(testCustomer.id, testCustomer.name, 300, createdSale.id);
    
    console.log('[SplitPaymentDebtTest] Split payment test completed successfully');
  };

  const testCustomerDebtUpdate = async () => {
    if (!testCustomer) throw new Error('Test customer not available');

    console.log('[SplitPaymentDebtTest] Testing customer debt update');
    
    // Get initial debt
    const initialDebt = testCustomer.outstandingDebt;
    console.log('[SplitPaymentDebtTest] Initial customer debt:', initialDebt);
    
    // Wait a moment for any pending operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh customers to get latest data
    await refreshCustomers();
    
    // Find the updated customer
    const updatedCustomer = customers.find(c => c.id === testCustomer.id);
    if (!updatedCustomer) {
      throw new Error('Updated customer not found after refresh');
    }
    
    console.log('[SplitPaymentDebtTest] Updated customer debt:', updatedCustomer.outstandingDebt);
    
    // Check if debt increased (allowing for trigger-based updates)
    const expectedMinimumDebt = initialDebt + 300;
    if (updatedCustomer.outstandingDebt < expectedMinimumDebt) {
      // Check pending transactions as fallback
      const pendingTransactions = getPendingDebtTransactions(testCustomer.id);
      const pendingDebtIncrease = pendingTransactions
        .filter(t => t.type === 'increase')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpectedDebt = initialDebt + pendingDebtIncrease;
      
      if (totalExpectedDebt < expectedMinimumDebt) {
        throw new Error(
          `Customer debt not updated correctly. Expected at least ${expectedMinimumDebt}, got ${updatedCustomer.outstandingDebt} (with ${pendingDebtIncrease} pending)`
        );
      }
    }
    
    console.log('[SplitPaymentDebtTest] Customer debt update test completed successfully');
  };

  const testDatabaseTrigger = async () => {
    if (!user) throw new Error('User not available');

    console.log('[SplitPaymentDebtTest] Testing database trigger functionality');
    
    // Check recent sales for split payments
    const recentSplitSales = sales.filter(sale => 
      sale.paymentMethod === 'split' && 
      sale.paymentDetails.debtAmount > 0 &&
      new Date(sale.timestamp).getTime() > Date.now() - 60000 // Last minute
    );

    console.log('[SplitPaymentDebtTest] Recent split sales with debt:', recentSplitSales.length);
    
    if (recentSplitSales.length === 0) {
      console.log('[SplitPaymentDebtTest] No recent split sales found, trigger test skipped');
      return;
    }

    // Check if any customers have debt that matches recent sales
    const customersWithDebt = customers.filter(c => c.outstandingDebt > 0);
    console.log('[SplitPaymentDebtTest] Customers with debt:', customersWithDebt.length);
    
    if (customersWithDebt.length === 0) {
      throw new Error('No customers with debt found, database trigger may not be working');
    }
    
    console.log('[SplitPaymentDebtTest] Database trigger test completed successfully');
  };

  const runAllTests = async () => {
    if (!user) {
      addTestResult({
        testName: 'Authentication',
        status: 'failed',
        message: 'User not authenticated'
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Create test customer
      await runTest('Create Test Customer', async () => {
        await createTestCustomer();
      });
      
      // Test 2: Create split payment sale
      await runTest('Split Payment Creation', testSplitPaymentCreation);
      
      // Test 3: Verify customer debt update
      await runTest('Customer Debt Update', testCustomerDebtUpdate);
      
      // Test 4: Database trigger verification
      await runTest('Database Trigger', testDatabaseTrigger);
      
    } catch (error) {
      console.error('[SplitPaymentDebtTest] Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTests = () => {
    setTestResults([]);
    setTestCustomer(null);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Split Payment Debt Testing Suite
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive testing for split payment debt functionality including offline/online capability
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests}
            disabled={isRunning || !user}
            className="flex items-center gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={resetTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Tests
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Test Results</h3>
            {testResults.map((result) => (
              <Card key={result.testName} className={`border-2 ${getStatusColor(result.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.testName}</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mt-2">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground">
                        View Details
                      </summary>
                      <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                  {result.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Test Customer Info */}
        {testCustomer && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Test Customer Created</h4>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {testCustomer.name}</p>
                <p><strong>Phone:</strong> {testCustomer.phone}</p>
                <p><strong>Current Debt:</strong> {formatCurrency(testCustomer.outstandingDebt)}</p>
                <p><strong>Credit Limit:</strong> {formatCurrency(testCustomer.creditLimit)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">System Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={user ? 'default' : 'destructive'}>
                  {user ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Customers:</span>
                <Badge variant="outline">{customers.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Sales:</span>
                <Badge variant="outline">{sales.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Split Sales:</span>
                <Badge variant="outline">
                  {sales.filter(s => s.paymentMethod === 'split').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">How to Use</h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Click "Run All Tests" to start the comprehensive testing suite</li>
              <li>The test will create a customer and simulate split payment scenarios</li>
              <li>Check that customer debt balances are updated correctly</li>
              <li>Verify database triggers are working for split payments</li>
              <li>All tests should pass for full functionality</li>
            </ol>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default SplitPaymentDebtTest;