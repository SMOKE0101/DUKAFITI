
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Filter, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useUnifiedSales } from '@/hooks/useUnifiedSales';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '@/hooks/useUnifiedCustomers';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from 'sonner';
import ModernSummaryCards from './ModernSummaryCards';
import AlwaysCurrentPanels from './AlwaysCurrentPanels';
import EnhancedSalesTrendChart from './EnhancedSalesTrendChart';
import OrdersBarChart from './OrdersBarChart';
import SalesReportTable from './SalesReportTable';
import ProductProfitsTable from './ProductProfitsTable';

const EnhancedOfflineReportsPage = () => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'quarter'>('today');
  const { sales, loading: salesLoading } = useUnifiedSales();
  const { products, loading: productsLoading } = useUnifiedProducts();
  const { customers, loading: customersLoading } = useUnifiedCustomers();
  const { isOnline } = useNetworkStatus();

  // Calculate date range based on timeframe
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeframe) {
      case 'today':
        return {
          from: today.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          from: weekStart.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return {
          from: monthStart.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      case 'quarter':
        const quarterStart = new Date(today);
        quarterStart.setDate(today.getDate() - 90);
        return {
          from: quarterStart.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      default:
        return {
          from: today.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
    }
  }, [timeframe]);

  const isLoading = salesLoading || productsLoading || customersLoading;

  const handleExportData = () => {
    // Filter sales based on current timeframe
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    });

    const csvContent = [
      ['Date', 'Product', 'Customer', 'Quantity', 'Revenue', 'Profit', 'Payment Method'],
      ...filteredSales.map(sale => [
        new Date(sale.timestamp).toLocaleDateString(),
        sale.productName || 'Unknown',
        sale.customerName || 'Walk-in',
        sale.quantity || 0,
        formatCurrency(sale.total || 0),
        formatCurrency(sale.profit || 0),
        sale.paymentMethod || 'Cash'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Business Reports
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track your business performance and metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timeframe Selector - Button Style */}
              <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setTimeframe(option.value as any)}
                    className={`
                      text-sm font-medium rounded-md transition-all duration-200 px-3 py-1.5
                      ${timeframe === option.value
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Summary Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Overview
            </h2>
            <Badge variant="outline" className="text-xs">
              {timeframe === 'today' ? 'Today' : 
               timeframe === 'week' ? 'Last 7 days' :
               timeframe === 'month' ? 'Last 30 days' : 'Last 90 days'}
            </Badge>
          </div>
          <ModernSummaryCards
            sales={sales}
            products={products}
            customers={customers}
            dateRange={dateRange}
          />
        </div>

        {/* Sales Trend Chart */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales Analytics
          </h2>
          <EnhancedSalesTrendChart sales={sales} />
        </div>

        {/* Orders Bar Chart */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Orders Analytics
          </h2>
          <OrdersBarChart sales={sales} />
        </div>

        {/* Sales Report Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Sales Report
          </h2>
          <SalesReportTable sales={sales} loading={isLoading} />
        </div>

        {/* Product Profits Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Product Profits Report
          </h2>
          <ProductProfitsTable sales={sales} loading={isLoading} />
        </div>

        {/* Always Current Data Panels */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Status
          </h2>
          <AlwaysCurrentPanels
            products={products}
            customers={customers}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedOfflineReportsPage;
