
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineAwareData } from '@/hooks/useOfflineAwareData';
import { transformDatabaseProduct, transformDatabaseCustomer, transformDatabaseSale } from '@/utils/dataTransforms';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OfflineValidator from './OfflineValidator';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch data using offline-aware hooks
  const { 
    data: rawProducts = [], 
    loading: loadingProducts, 
    error: productsError,
    refetch: refetchProducts 
  } = useOfflineAwareData({
    table: 'products',
    dependencies: [user?.id]
  });

  const { 
    data: rawCustomers = [], 
    loading: loadingCustomers, 
    error: customersError,
    refetch: refetchCustomers 
  } = useOfflineAwareData({
    table: 'customers',
    dependencies: [user?.id]
  });

  const { 
    data: rawSales = [], 
    loading: loadingSales, 
    error: salesError,
    refetch: refetchSales 
  } = useOfflineAwareData({
    table: 'sales',
    dependencies: [user?.id]
  });

  // Transform data
  const products = rawProducts.map(transformDatabaseProduct);
  const customers = rawCustomers.map(transformDatabaseCustomer);
  const sales = rawSales.map(transformDatabaseSale);

  const isLoading = loadingProducts || loadingCustomers || loadingSales;
  const hasError = productsError || customersError || salesError;

  const handleRetry = () => {
    refetchProducts();
    refetchCustomers();
    refetchSales();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading dashboard data</span>
            </div>
            <div className="space-y-2 text-sm text-red-600 dark:text-red-400 mb-4">
              {productsError && <p>Products: {productsError}</p>}
              {customersError && <p>Customers: {customersError}</p>}
              {salesError && <p>Sales: {salesError}</p>}
            </div>
            <Button onClick={handleRetry} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate dashboard stats - Fixed: use 'total' instead of 'totalAmount'
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your business performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <div className="w-6 h-6 bg-orange-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  KSh {totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Low Stock Alert</span>
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              {lowStockProducts.length} product(s) are running low on stock
            </p>
          </CardContent>
        </Card>
      )}

      {/* Offline System Validator */}
      <div className="mt-8">
        <OfflineValidator />
      </div>
    </div>
  );
};

export default Dashboard;
