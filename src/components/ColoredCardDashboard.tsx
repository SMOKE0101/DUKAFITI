
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Plus,
  UserPlus,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

const ColoredCardDashboard = () => {
  const { sales } = useSupabaseSales();
  const { products } = useSupabaseProducts();
  const { customers } = useSupabaseCustomers();
  const navigate = useNavigate();

  // Calculate today's metrics
  const today = new Date().toDateString();
  const todaySales = sales.filter(sale => 
    new Date(sale.timestamp).toDateString() === today
  );
  const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const ordersToday = todaySales.length;
  const activeCustomers = customers.filter(c => c.totalPurchases > 0).length;
  
  // Low stock products (excluding unspecified stock)
  const lowStockProducts = products.filter(p => 
    p.currentStock !== -1 && p.currentStock <= p.lowStockThreshold
  );

  // Outstanding debts
  const customersWithDebt = customers.filter(c => c.outstandingDebt > 0);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-sale':
        navigate('/app/sales');
        break;
      case 'add-product':
        navigate('/app/inventory');
        break;
      case 'add-customer':
        navigate('/app/customers');
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Sales Today - Green */}
        <Card className="border-l-4 border-l-green-500 bg-card dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              TOTAL SALES TODAY
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {formatCurrency(totalSalesToday)}
            </div>
          </CardContent>
        </Card>

        {/* Orders Today - Blue */}
        <Card className="border-l-4 border-l-blue-500 bg-card dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              ORDERS TODAY
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {ordersToday}
            </div>
          </CardContent>
        </Card>

        {/* Active Customers - Purple */}
        <Card className="border-l-4 border-l-purple-500 bg-card dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              ACTIVE CUSTOMERS
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {activeCustomers}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products - Orange */}
        <Card className="border-l-4 border-l-orange-500 bg-card dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              LOW STOCK PRODUCTS
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {lowStockProducts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="bg-card dark:bg-slate-800/50 shadow-sm border-0 ring-1 ring-border dark:ring-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              LOW STOCK ALERTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50">
                    <div className="flex-1">
                      <div className="font-medium text-foreground dark:text-white">{product.name}</div>
                      <div className="text-sm text-muted-foreground dark:text-slate-400">
                        Stock: {product.currentStock} | Min: {product.lowStockThreshold}
                      </div>
                    </div>
                    <Badge 
                      variant={product.currentStock <= 0 ? "destructive" : "secondary"}
                      className="ml-2"
                    >
                      {product.currentStock <= 0 ? 'Out' : 'Low'}
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/app/inventory')}
                      className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      View All ({lowStockProducts.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground dark:text-slate-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All products are well stocked! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Debts */}
        <Card className="bg-card dark:bg-slate-800/50 shadow-sm border-0 ring-1 ring-border dark:ring-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500 dark:text-red-400" />
              OUTSTANDING DEBTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customersWithDebt.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {customersWithDebt.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
                    <div className="flex-1">
                      <div className="font-medium text-foreground dark:text-white">{customer.name}</div>
                      <div className="text-sm text-muted-foreground dark:text-slate-400">{customer.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(customer.outstandingDebt)}
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-slate-500">
                        Limit: {formatCurrency(customer.creditLimit)}
                      </div>
                    </div>
                  </div>
                ))}
                {customersWithDebt.length > 5 && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/app/customers')}
                      className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      View All ({customersWithDebt.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground dark:text-slate-400">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No outstanding debts! 💚</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card dark:bg-slate-800/50 shadow-sm border-0 ring-1 ring-border dark:ring-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground dark:text-white">
            QUICK ACTIONS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => handleQuickAction('add-sale')}
              className="flex items-center gap-2 h-12 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
            >
              <ShoppingBag className="h-4 w-4" />
              Record Sale
            </Button>
            <Button 
              onClick={() => handleQuickAction('add-product')}
              className="flex items-center gap-2 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
            <Button 
              onClick={() => handleQuickAction('add-customer')}
              className="flex items-center gap-2 h-12 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
            >
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColoredCardDashboard;
