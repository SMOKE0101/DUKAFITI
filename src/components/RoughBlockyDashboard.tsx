
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

const RoughBlockyDashboard = () => {
  const navigate = useNavigate();
  const { products, isLoading: productsLoading } = useSupabaseProducts();
  const { customers, isLoading: customersLoading } = useSupabaseCustomers();
  const { sales, isLoading: salesLoading } = useSupabaseSales();

  console.log('Dashboard - Products data:', products);
  console.log('Dashboard - Products loading:', productsLoading);

  // Calculate metrics
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalSales = sales.length;

  // Enhanced low stock calculation with better logging
  const lowStockItems = products.filter(product => {
    console.log(`Product: ${product.name}, Stock: ${product.current_stock}, Threshold: ${product.low_stock_threshold}`);
    
    // Handle different possible field names and ensure proper comparison
    const currentStock = product.current_stock ?? product.currentStock ?? 0;
    const threshold = product.low_stock_threshold ?? product.lowStockThreshold ?? 10;
    
    // Only consider items with specified stock (not -1 which means unspecified)
    const isLowStock = currentStock !== -1 && currentStock <= threshold;
    
    if (isLowStock) {
      console.log(`LOW STOCK DETECTED: ${product.name} - Stock: ${currentStock}, Threshold: ${threshold}`);
    }
    
    return isLowStock;
  });

  console.log('Dashboard - Low stock items:', lowStockItems);
  console.log('Dashboard - Low stock count:', lowStockItems.length);

  // Calculate total sales amount
  const totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  // Calculate profit
  const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  // Recent sales (last 5)
  const recentSales = sales
    .sort((a, b) => new Date(b.created_at || b.timestamp || 0).getTime() - new Date(a.created_at || a.timestamp || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-caesar">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete view of your business performance
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</CardTitle>
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalProducts}</div>
            {productsLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalCustomers}</div>
            {customersLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</CardTitle>
            <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalSales}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(totalSalesAmount)}
            </p>
            {salesLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Section */}
      <Card className="border-2 border-dashed border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alert
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockItems.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} running low on stock:
              </p>
              <div className="grid gap-2">
                {lowStockItems.slice(0, 5).map((product) => {
                  const currentStock = product.current_stock ?? product.currentStock ?? 0;
                  const threshold = product.low_stock_threshold ?? product.lowStockThreshold ?? 10;
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Stock: {currentStock === -1 ? 'Unspecified' : currentStock} 
                          {threshold && ` (Threshold: ${threshold})`}
                        </p>
                      </div>
                      <Badge 
                        variant={currentStock <= 0 ? "destructive" : "secondary"}
                        className="ml-2"
                      >
                        {currentStock <= 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {lowStockItems.length > 5 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  And {lowStockItems.length - 5} more items...
                </p>
              )}
              <Button 
                onClick={() => navigate('/app/inventory')} 
                className="w-full mt-4"
                variant="destructive"
              >
                <Package className="w-4 h-4 mr-2" />
                Manage Inventory
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✅ All products are well stocked!
              </p>
              <Button 
                onClick={() => navigate('/app/inventory')} 
                variant="outline" 
                className="mt-2"
              >
                <Package className="w-4 h-4 mr-2" />
                View Inventory
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Activity className="h-5 w-5" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{sale.product_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {sale.quantity} • {sale.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(sale.created_at || sale.timestamp || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  onClick={() => navigate('/app/sales')} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View All Sales
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent sales</p>
                <Button 
                  onClick={() => navigate('/app/sales')} 
                  className="mt-4"
                >
                  Make First Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => navigate('/app/sales')} 
                className="h-20 flex flex-col items-center justify-center gap-2"
                variant="outline"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="text-sm">New Sale</span>
              </Button>
              <Button 
                onClick={() => navigate('/app/inventory')} 
                className="h-20 flex flex-col items-center justify-center gap-2"
                variant="outline"
              >
                <Package className="h-6 w-6" />
                <span className="text-sm">Add Product</span>
              </Button>
              <Button 
                onClick={() => navigate('/app/customers')} 
                className="h-20 flex flex-col items-center justify-center gap-2"
                variant="outline"
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Add Customer</span>
              </Button>
              <Button 
                onClick={() => navigate('/app/reports')} 
                className="h-20 flex flex-col items-center justify-center gap-2"
                variant="outline"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
