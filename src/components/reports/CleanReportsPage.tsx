import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';
import { addDays, startOfDay, safeNumber } from '../../utils/dateUtils';

type DateRange = 'today' | 'week' | 'month';

const CleanReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();

  const getDateRange = () => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (dateRange) {
      case 'today':
        return { from: today, to: now };
      case 'week':
        return { from: addDays(today, -7), to: now };
      case 'month':
        return { from: addDays(today, -30), to: now };
      default:
        return { from: addDays(today, -30), to: now };
    }
  };

  const { from: fromDate, to: toDate } = getDateRange();

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= fromDate && saleDate <= toDate && safeNumber(sale.total) > 0;
    });
  }, [sales, fromDate, toDate]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + safeNumber(sale.total), 0);
    const totalOrders = filteredSales.length;
    
    const uniqueCustomerIds = new Set(
      filteredSales
        .map(sale => sale.customerId)
        .filter(id => id && id.trim() !== '')
    );
    const activeCustomers = uniqueCustomerIds.size;
    
    const lowStockProducts = products.filter(product => {
      const currentStock = safeNumber(product.currentStock, 0);
      const threshold = safeNumber(product.lowStockThreshold, 10);
      return currentStock >= 0 && currentStock <= threshold;
    }).length;

    const cashRevenue = filteredSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + safeNumber(sale.total), 0);
    
    const mpesaRevenue = filteredSales
      .filter(s => s.paymentMethod === 'mpesa')
      .reduce((sum, sale) => sum + safeNumber(sale.total), 0);

    const totalDebt = customers.reduce((sum, customer) => sum + safeNumber(customer.outstandingDebt, 0), 0);

    return {
      totalRevenue,
      totalOrders,
      activeCustomers,
      lowStockProducts,
      cashRevenue,
      mpesaRevenue,
      totalDebt
    };
  }, [filteredSales, products, customers]);

  const cards = [
    {
      title: 'TOTAL REVENUE',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: 'border-green-200 hover:border-green-400 dark:border-green-800 dark:hover:border-green-600',
      iconBg: 'bg-green-50 dark:bg-green-950',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'TOTAL ORDERS',
      value: metrics.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600',
      iconBg: 'bg-blue-50 dark:bg-blue-950',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'ACTIVE CUSTOMERS',
      value: metrics.activeCustomers.toString(),
      icon: Users,
      color: 'border-purple-200 hover:border-purple-400 dark:border-purple-800 dark:hover:border-purple-600',
      iconBg: 'bg-purple-50 dark:bg-purple-950',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'LOW STOCK',
      value: metrics.lowStockProducts.toString(),
      icon: metrics.lowStockProducts > 0 ? AlertTriangle : Package,
      color: metrics.lowStockProducts > 0 
        ? 'border-orange-200 hover:border-orange-400 dark:border-orange-800 dark:hover:border-orange-600'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600',
      iconBg: metrics.lowStockProducts > 0 
        ? 'bg-orange-50 dark:bg-orange-950' 
        : 'bg-gray-50 dark:bg-gray-950',
      iconColor: metrics.lowStockProducts > 0 
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-gray-600 dark:text-gray-400'
    },
    {
      title: 'CASH REVENUE',
      value: formatCurrency(metrics.cashRevenue),
      icon: DollarSign,
      color: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-800 dark:hover:border-emerald-600',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'M-PESA REVENUE',
      value: formatCurrency(metrics.mpesaRevenue),
      icon: TrendingUp,
      color: 'border-teal-200 hover:border-teal-400 dark:border-teal-800 dark:hover:border-teal-600',
      iconBg: 'bg-teal-50 dark:bg-teal-950',
      iconColor: 'text-teal-600 dark:text-teal-400'
    }
  ];

  if (salesLoading || productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Analytics and insights for your business</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['today', 'week', 'month'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 capitalize ${
                  dateRange === range
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className={`border-2 ${card.color} rounded-xl bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200 cursor-pointer`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                    <div className={`p-3 ${card.iconBg} rounded-full`}>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Content Placeholder */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trend</h3>
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Chart will be displayed here
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Product list will be displayed here
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CleanReportsPage;
