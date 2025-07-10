
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Package,
  AlertTriangle,
  UserPlus,
  Plus,
  Activity,
  Clock,
  ArrowRight,
  Zap
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { supabase } from '@/integrations/supabase/client';

const RoughBlockyDashboard = () => {
  const navigate = useNavigate();
  const { sales, loading: salesLoading } = useSupabaseSales();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const [realtimeData, setRealtimeData] = useState({ sales, products, customers });

  const isLoading = salesLoading || productsLoading || customersLoading;

  // Real-time subscriptions
  useEffect(() => {
    const salesChannel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        console.log('Sales updated:', payload);
        // Trigger data refresh
      })
      .subscribe();

    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Products updated:', payload);
        // Trigger data refresh
      })
      .subscribe();

    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        console.log('Customers updated:', payload);
        // Trigger data refresh
      })
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(customersChannel);
    };
  }, []);

  // Calculate today's metrics
  const todayMetrics = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today && s.total >= 0);
    
    const totalSalesToday = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalOrdersToday = todaySales.length;
    const activeCustomers = customers.length;
    const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10) && p.currentStock > 0).length;

    return {
      totalSalesToday,
      totalOrdersToday,
      activeCustomers,
      lowStockProducts
    };
  }, [sales, customers, products]);

  // Get alerts data
  const alertsData = useMemo(() => {
    const lowStockItems = products
      .filter(p => p.currentStock <= (p.lowStockThreshold || 10) && p.currentStock > 0)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5);

    const overdueCustomers = customers
      .filter(c => c.outstandingDebt > 0)
      .sort((a, b) => b.outstandingDebt - a.outstandingDebt)
      .slice(0, 5);

    return { lowStockItems, overdueCustomers };
  }, [products, customers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. Top Overview Tile */}
        <Card className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-white dark:bg-gray-800 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black font-mono uppercase tracking-widest text-gray-900 dark:text-white mb-2">
                BUSINESS OVERVIEW
              </h1>
              <p className="text-lg italic text-gray-500 dark:text-gray-400 font-light">
                Quick glance at your key metrics
              </p>
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Summary Metrics: Outlined Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Sales Today',
              value: formatCurrency(todayMetrics.totalSalesToday),
              icon: DollarSign,
              color: 'border-green-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10',
              iconColor: 'text-green-600 dark:text-green-400',
              onClick: () => navigate('/sales')
            },
            {
              title: 'Total Orders Today',
              value: todayMetrics.totalOrdersToday.toString(),
              icon: ShoppingCart,
              color: 'border-blue-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10',
              iconColor: 'text-blue-600 dark:text-blue-400',
              onClick: () => navigate('/sales')
            },
            {
              title: 'Active Customers',
              value: todayMetrics.activeCustomers.toString(),
              icon: Users,
              color: 'border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10',
              iconColor: 'text-purple-600 dark:text-purple-400',
              onClick: () => navigate('/customers')
            },
            {
              title: 'Low Stock Products',
              value: todayMetrics.lowStockProducts.toString(),
              icon: AlertTriangle,
              color: 'border-orange-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10',
              iconColor: 'text-orange-600 dark:text-orange-400',
              onClick: () => navigate('/inventory')
            }
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card 
                key={index}
                className={`border-2 ${metric.color} rounded-xl p-6 bg-transparent cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group`}
                onClick={metric.onClick}
                role="button"
                aria-label={`View ${metric.title}`}
                tabIndex={0}
              >
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-black font-mono uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
                        {metric.title}
                      </h3>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
                        {metric.value}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 3. Alerts & Reminders: Outlined Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Low Stock Alerts */}
          <Card className="border-2 border-orange-400 dark:border-orange-500 rounded-lg p-6 bg-transparent">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-black font-mono uppercase tracking-wide text-gray-900 dark:text-white">
                Low Stock Alerts
              </h3>
              {alertsData.lowStockItems.length > 0 && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  {alertsData.lowStockItems.length}
                </Badge>
              )}
            </div>
            
            <div className="space-y-3">
              {alertsData.lowStockItems.length > 0 ? (
                alertsData.lowStockItems.map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/10 cursor-pointer transition-colors"
                    onClick={() => navigate('/inventory')}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {product.currentStock} left
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All products well stocked! 📦</p>
                </div>
              )}
            </div>
          </Card>

          {/* Overdue Customer Payments */}
          <Card className="border-2 border-red-400 dark:border-red-500 rounded-lg p-6 bg-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-black font-mono uppercase tracking-wide text-gray-900 dark:text-white">
                Overdue Payments
              </h3>
              {alertsData.overdueCustomers.length > 0 && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {alertsData.overdueCustomers.length}
                </Badge>
              )}
            </div>
            
            <div className="space-y-3">
              {alertsData.overdueCustomers.length > 0 ? (
                alertsData.overdueCustomers.map((customer) => (
                  <div 
                    key={customer.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors"
                    onClick={() => navigate('/customers')}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600 text-sm">
                        {formatCurrency(customer.outstandingDebt)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All payments up to date! 🎉</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 4. Quick Actions: Floating Outlined Buttons */}
        <Card className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black font-mono uppercase tracking-wide text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { 
                label: 'Add Sale', 
                icon: ShoppingCart, 
                path: '/app', 
                color: 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10' 
              },
              { 
                label: 'Add Product', 
                icon: Plus, 
                path: '/inventory', 
                color: 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10' 
              },
              { 
                label: 'Add Customer', 
                icon: UserPlus, 
                path: '/customers', 
                color: 'border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10' 
              },
              { 
                label: 'View Reports', 
                icon: TrendingUp, 
                path: '/reports', 
                color: 'border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10' 
              }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => navigate(action.path)}
                  className={`border-2 ${action.color} rounded-full px-6 py-3 bg-transparent transition-all duration-300 hover:scale-105 hover:shadow-md group`}
                >
                  <Icon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{action.label}</span>
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
