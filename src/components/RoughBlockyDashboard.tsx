
import React, { useMemo } from 'react';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Package,
  AlertTriangle,
  Calendar,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { Badge } from '@/components/ui/badge';

const RoughBlockyDashboard = () => {
  const { sales, loading: salesLoading } = useSupabaseSales();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();

  const isLoading = salesLoading || productsLoading || customersLoading;

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    // Filter out payment records (negative amounts)
    const validSales = sales.filter(sale => sale.total >= 0);
    
    const totalRevenue = validSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = validSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalTransactions = validSales.length;
    
    const totalCustomers = customers.length;
    const customersWithDebt = customers.filter(c => c.outstandingDebt > 0).length;
    const totalDebt = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
    
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10)).length;
    const outOfStockProducts = products.filter(p => p.currentStock === 0).length;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0);

    return {
      totalRevenue,
      totalProfit,
      totalTransactions,
      totalCustomers,
      customersWithDebt,
      totalDebt,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue
    };
  }, [sales, customers, products]);

  // Get recent sales
  const recentSales = useMemo(() => {
    return sales
      .filter(sale => sale.total >= 0) // Exclude payment records
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [sales]);

  // Get low stock products
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.currentStock <= (p.lowStockThreshold || 10) && p.currentStock > 0)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5);
  }, [products]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Title - Consistent with other pages */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  DASHBOARD
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Overview of your business performance
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-green-600 dark:text-green-400">
                    TOTAL REVENUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                    TOTAL PROFIT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats.totalProfit)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-purple-600 dark:text-purple-400">
                    TRANSACTIONS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalTransactions}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-purple-600 dark:text-purple-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-orange-600 dark:text-orange-400">
                    CUSTOMERS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalCustomers}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
                  <Users className="w-8 h-8 text-orange-600 dark:text-orange-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-indigo-200 dark:border-indigo-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-indigo-600 dark:text-indigo-400">
                    INVENTORY VALUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats.totalInventoryValue)}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl">
                  <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-amber-200 dark:border-amber-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-amber-600 dark:text-amber-400">
                    LOW STOCK ITEMS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.lowStockProducts}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-red-200 dark:border-red-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-red-600 dark:text-red-400">
                    TOTAL DEBT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats.totalDebt)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl">
                  <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-teal-200 dark:border-teal-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-teal-600 dark:text-teal-400">
                    CUSTOMERS WITH DEBT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.customersWithDebt}
                  </p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-700 rounded-xl">
                  <Users className="w-8 h-8 text-teal-600 dark:text-teal-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sales */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                RECENT SALES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSales.length > 0 ? recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{sale.productName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {sale.customerName || 'Walk-in Customer'} • {sale.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(sale.total)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(sale.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 dark:text-gray-500 text-center py-8">No recent sales</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                LOW STOCK ALERT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                        {product.currentStock} left
                      </Badge>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Alert at {product.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 dark:text-gray-500 text-center py-8">All products well stocked</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
