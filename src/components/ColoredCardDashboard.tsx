
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
  AlertTriangle,
  TrendingUp,
  Activity
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="font-mono text-lg md:text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            DASHBOARD
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Sales Today',
              value: formatCurrency(totalSalesToday),
              icon: DollarSign,
              color: 'border-green-600',
              iconColor: 'text-green-600 dark:text-green-400'
            },
            {
              title: 'Orders Today',
              value: ordersToday.toString(),
              icon: ShoppingCart,
              color: 'border-blue-600',
              iconColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              title: 'Active Customers',
              value: activeCustomers.toString(),
              icon: Users,
              color: 'border-purple-600',
              iconColor: 'text-purple-600 dark:text-purple-400'
            },
            {
              title: 'Low Stock Products',
              value: lowStockProducts.length.toString(),
              icon: Package,
              color: 'border-orange-600',
              iconColor: 'text-orange-600 dark:text-orange-400'
            }
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className={`border-2 ${metric.color} rounded-xl p-6 bg-transparent`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-mono text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
                      {metric.title}
                    </h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <div className="border-2 border-orange-600 rounded-xl p-6 bg-transparent">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
                LOW STOCK ALERTS
              </h3>
            </div>
            
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border border-orange-300 dark:border-orange-700 rounded-lg bg-transparent">
                    <div className="flex-1">
                      <div className="font-medium text-foreground dark:text-white">{product.name}</div>
                      <div className="text-sm text-muted-foreground dark:text-slate-400">
                        Stock: {product.currentStock} | Min: {product.lowStockThreshold}
                      </div>
                    </div>
                    <Badge 
                      variant={product.currentStock <= 0 ? "destructive" : "secondary"}
                      className="ml-2 font-mono text-xs uppercase"
                    >
                      {product.currentStock <= 0 ? 'OUT' : 'LOW'}
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <div className="text-center">
                    <button
                      onClick={() => navigate('/app/inventory')}
                      className="px-4 py-2 bg-transparent border-2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg font-mono text-xs font-bold uppercase transition-all duration-200"
                    >
                      View All ({lowStockProducts.length})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">All products are well stocked! 🎉</p>
              </div>
            )}
          </div>

          {/* Outstanding Debts */}
          <div className="border-2 border-red-600 rounded-xl p-6 bg-transparent">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-3 h-3 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
                OUTSTANDING DEBTS
              </h3>
            </div>
            
            {customersWithDebt.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {customersWithDebt.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border border-red-300 dark:border-red-700 rounded-lg bg-transparent">
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
                    <button
                      onClick={() => navigate('/app/customers')}
                      className="px-4 py-2 bg-transparent border-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-mono text-xs font-bold uppercase transition-all duration-200"
                    >
                      View All ({customersWithDebt.length})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No outstanding debts! 💚</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white mb-6">
            QUICK ACTIONS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => handleQuickAction('add-sale')}
              className="flex items-center justify-center gap-2 h-12 bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl font-mono text-sm font-bold uppercase tracking-wide transition-all duration-200"
            >
              <ShoppingBag className="h-4 w-4" />
              Record Sale
            </button>
            <button 
              onClick={() => handleQuickAction('add-product')}
              className="flex items-center justify-center gap-2 h-12 bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-mono text-sm font-bold uppercase tracking-wide transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
            <button 
              onClick={() => handleQuickAction('add-customer')}
              className="flex items-center justify-center gap-2 h-12 bg-transparent border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl font-mono text-sm font-bold uppercase tracking-wide transition-all duration-200"
            >
              <UserPlus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColoredCardDashboard;
