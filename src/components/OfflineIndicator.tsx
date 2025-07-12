
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Database,
  Loader2,
  TestTube
} from 'lucide-react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';

const OfflineIndicator: React.FC = () => {
  const { 
    isOnline: customersOnline, 
    lastSyncTime: customersSync, 
    loading: customersLoading,
    error: customersError,
    testOffline: testCustomersOffline 
  } = useSupabaseCustomers();
  
  const { 
    isOnline: productsOnline, 
    lastSyncTime: productsSync, 
    loading: productsLoading,
    error: productsError,
    testOffline: testProductsOffline 
  } = useSupabaseProducts();
  
  const { 
    isOnline: salesOnline, 
    lastSyncTime: salesSync, 
    loading: salesLoading,
    error: salesError,
    testOffline: testSalesOffline 
  } = useSupabaseSales();

  const isOnline = customersOnline && productsOnline && salesOnline;
  const isLoading = customersLoading || productsLoading || salesLoading;
  const hasErrors = !!(customersError || productsError || salesError);
  const errors = [customersError, productsError, salesError].filter(Boolean);

  const lastSyncTimes = [customersSync, productsSync, salesSync].filter(Boolean);
  const mostRecentSync = lastSyncTimes.length > 0 
    ? new Date(Math.max(...lastSyncTimes.map(time => new Date(time!).getTime())))
    : null;

  const handleTestOffline = async () => {
    console.log('[OfflineIndicator] Testing offline functionality...');
    
    try {
      const [customersTest, productsTest, salesTest] = await Promise.all([
        testCustomersOffline(),
        testProductsOffline(),
        testSalesOffline()
      ]);

      console.log('[OfflineIndicator] Test results:', {
        customers: customersTest,
        products: productsTest,
        sales: salesTest
      });

      const allPassed = customersTest.success && productsTest.success && salesTest.success;
      
      console.log('[OfflineIndicator] All tests passed:', allPassed);
    } catch (error) {
      console.error('[OfflineIndicator] Testing failed:', error);
    }
  };

  const getStatusColor = () => {
    if (hasErrors) return 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20';
    if (!isOnline) return 'border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20';
    if (isLoading) return 'border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20';
    return 'border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20';
  };

  return (
    <Card className={`border transition-all duration-300 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Online - Offline-First Ready
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Offline Mode - Data Available
                  </span>
                </>
              )}
            </div>

            {/* Loading Status */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Loading...
                  </span>
                </>
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
          </div>

          {/* Data Status */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <Database className="h-3 w-3 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
              <div className="text-muted-foreground">Customers</div>
              <Badge variant={customersOnline ? "default" : "secondary"} className="text-xs mt-1">
                {customersOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <div className="text-center">
              <Database className="h-3 w-3 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
              <div className="text-muted-foreground">Products</div>
              <Badge variant={productsOnline ? "default" : "secondary"} className="text-xs mt-1">
                {productsOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <div className="text-center">
              <Database className="h-3 w-3 mx-auto mb-1 text-indigo-600 dark:text-indigo-400" />
              <div className="text-muted-foreground">Sales</div>
              <Badge variant={salesOnline ? "default" : "secondary"} className="text-xs mt-1">
                {salesOnline ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>

          {/* Last Sync Time */}
          {mostRecentSync && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground dark:text-slate-500" />
              <span className="text-xs text-muted-foreground dark:text-slate-400">
                Last sync: {mostRecentSync.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Errors */}
          {hasErrors && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {errors.length} error{errors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="max-h-20 overflow-y-auto">
                {errors.map((error, index) => (
                  <p key={index} className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestOffline}
              className="text-xs h-7 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <TestTube className="h-3 w-3 mr-1" />
              Test Offline
            </Button>
          </div>

          {/* Status Message */}
          <p className="text-xs text-muted-foreground dark:text-slate-400">
            {isOnline 
              ? "Offline-first mode active. Data loads from cache instantly, syncs in background."
              : "Working offline with cached data. Changes will sync when connection restores."
            }
          </p>
        </div>
      </CardContent>
    </Card>  
  );
};

export default OfflineIndicator;
