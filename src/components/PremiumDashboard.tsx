
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, Users, AlertTriangle, DollarSign } from 'lucide-react';
import EnhancedCharts from './dashboard/EnhancedCharts';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { formatCurrency } from '../utils/currency';

const PremiumDashboard: React.FC = () => {
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { sales, loading: salesLoading } = useSupabaseSales();

  const loading = productsLoading || customersLoading || salesLoading;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.current_stock <= (p.low_stock_threshold || 10));
  const outOfStockProducts = products.filter(p => p.current_stock === 0);
  const totalCustomers = customers.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  // Recent sales for trending calculations
  const recentSales = sales.slice(0, 30);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp || sale.created_at || '');
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Today: {formatCurrency(todayRevenue)}
            </p>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="flex gap-2 mt-2">
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {lowStockProducts.length} Low Stock
                </Badge>
              )}
              {outOfStockProducts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {outOfStockProducts.length} Out of Stock
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Active customers
            </p>
          </CardContent>
        </Card>

        {/* Profit Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Profit margin: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <EnhancedCharts sales={sales} products={products} />

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map(product => (
                <div key={product.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{product.name}</span>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    {product.current_stock} left
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <p className="text-sm text-orange-600">
                  And {lowStockProducts.length - 5} more products...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.slice(0, 5).map(sale => (
              <div key={sale.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{sale.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {sale.quantity} • {sale.payment_method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(sale.total_amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(sale.timestamp || sale.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumDashboard;
