
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

  const isLoading = salesLoading || productsLoading || customersLoading;

  // Real-time subscriptions
  useEffect(() => {
    const salesChannel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        console.log('Sales updated:', payload);
      })
      .subscribe();

    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Products updated:', payload);
      })
      .subscribe();

    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        console.log('Customers updated:', payload);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Modern Top Bar */}
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-6">
          <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            DASHBOARD
          </h1>
        </div>
        
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            DASHBOARD
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        
        {/* Welcome Card */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-8 bg-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 border border-purple-300 dark:border-purple-700 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-mono text-2xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">
                BUSINESS OVERVIEW
              </h2>
              <p className="text-gray-600 dark:text-gray-400 font-light">
                Quick glance at your key metrics and performance indicators
              </p>
            </div>
          </div>
        </div>

        {/* Summary Metrics: Outlined Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Sales Today',
              value: formatCurrency(todayMetrics.totalSalesToday),
              icon: DollarSign,
              color: 'border-green-600 hover:border-green-500 hover:bg-green-50/30 dark:hover:bg-green-900/10',
              iconColor: 'text-green-600 dark:text-green-400',
              onClick: () => navigate('/sales')
            },
            {
              title: 'Orders Today',
              value: todayMetrics.totalOrdersToday.toString(),
              icon: ShoppingCart,
              color: 'border-blue-600 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10',
              iconColor: 'text-blue-600 dark:text-blue-400',
              onClick: () => navigate('/sales')
            },
            {
              title: 'Active Customers',
              value: todayMetrics.activeCustomers.toString(),
              icon: Users,
              color: 'border-purple-600 hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-900/10',
              iconColor: 'text-purple-600 dark:text-purple-400',
              onClick: () => navigate('/customers')
            },
            {
              title: 'Low Stock Products',
              value: todayMetrics.lowStockProducts.toString(),
              icon: AlertTriangle,
              color: 'border-orange-600 hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-900/10',
              iconColor: 'text-orange-600 dark:text-orange-400',
              onClick: () => navigate('/inventory')
            }
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div 
                key={index}
                className={`border-2 ${metric.color} rounded-xl p-6 bg-transparent cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group`}
                onClick={metric.onClick}
                role="button"
                aria-label={`View ${metric.title}`}
                tabIndex={0}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-mono text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
                      {metric.title}
                    </h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
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

        {/* Alerts & Reminders: Outlined Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Low Stock Alerts */}
          <div className="border-2 border-orange-400 dark:border-orange-600 rounded-xl p-6 bg-transparent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-orange-300 dark:border-orange-700 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
                LOW STOCK ALERTS
              </h3>
            </div>
            
            {alertsData.lowStockItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                All products are well stocked
              </p>
            ) : (
              <div className="space-y-3">
                {alertsData.lowStockItems.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/20 dark:bg-orange-900/10">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                    </div>
                    <Badge variant="outline" className="border-orange-400 text-orange-700 dark:text-orange-300 rounded-full">
                      {product.currentStock} units
                    </Badge>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/inventory')}
                  className="w-full mt-3 border-2 border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full font-mono font-bold uppercase tracking-wide"
                >
                  VIEW INVENTORY
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Outstanding Debts */}
          <div className="border-2 border-red-400 dark:border-red-600 rounded-xl p-6 bg-transparent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-red-300 dark:border-red-700 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
                OUTSTANDING DEBTS
              </h3>
            </div>
            
            {alertsData.overdueCustomers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No outstanding debts
              </p>
            ) : (
              <div className="space-y-3">
                {alertsData.overdueCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50/20 dark:bg-red-900/10">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
                    </div>
                    <Badge variant="outline" className="border-red-400 text-red-700 dark:text-red-300 rounded-full">
                      {formatCurrency(customer.outstandingDebt)}
                    </Badge>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/customers')}
                  className="w-full mt-3 border-2 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full font-mono font-bold uppercase tracking-wide"
                >
                  MANAGE CUSTOMERS
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white mb-6">
            QUICK ACTIONS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/sales')}
              className="h-16 bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 border border-green-300 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              NEW SALE
            </Button>
            
            <Button
              onClick={() => navigate('/customers')}
              className="h-16 bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 border border-blue-300 rounded-full flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              ADD CUSTOMER
            </Button>
            
            <Button
              onClick={() => navigate('/inventory')}
              className="h-16 bg-transparent border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 border border-purple-300 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              MANAGE INVENTORY
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
