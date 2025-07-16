
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';
import EnhancedStatsCards from './dashboard/EnhancedStatsCards';
import EnhancedCharts from './dashboard/EnhancedCharts';

const PremiumDashboard = () => {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { sales, loading: salesLoading } = useSupabaseSales();

  // Calculate enhanced low stock items
  const lowStockItems = products.filter(product => {
    const currentStock = product.current_stock ?? 0;
    const threshold = product.low_stock_threshold ?? 10;
    
    // Only consider items with specified stock (not -1 which means unspecified)
    return currentStock !== -1 && currentStock <= threshold;
  });

  // Recent sales (last 5)
  const recentSales = sales
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background via-background to-muted/10 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground text-lg">
          Complete view of your business performance
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <EnhancedStatsCards 
        sales={sales}
        products={products}
        customers={customers}
      />

      {/* Enhanced Charts */}
      <EnhancedCharts sales={sales} />

      {/* Low Stock Alert Section */}
      <Card className="border-2 border-dashed border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
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
              <p className="text-destructive text-sm">
                {lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} running low on stock:
              </p>
              <div className="grid gap-2">
                {lowStockItems.slice(0, 5).map((product) => {
                  const currentStock = product.current_stock ?? 0;
                  const threshold = product.low_stock_threshold ?? 10;
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-destructive/20">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
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

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="border-0 shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{sale.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {sale.quantity} • {sale.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.timestamp).toLocaleDateString()}
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
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent sales</p>
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
        <Card className="border-0 shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
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

export default PremiumDashboard;
