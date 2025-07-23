
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Wifi, WifiOff, Clock } from 'lucide-react';
import { useUnifiedSales } from '@/hooks/useUnifiedSales';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useUnifiedCustomers } from '@/hooks/useUnifiedCustomers';
import { useOfflineReports } from '@/hooks/useOfflineReports';
import ModernSummaryCards from './ModernSummaryCards';
import AlwaysCurrentPanels from './AlwaysCurrentPanels';
import EnhancedSalesTrendChart from './EnhancedSalesTrendChart';
import OrdersBarChart from './OrdersBarChart';
import SalesReportTable from './SalesReportTable';
import ProductProfitsTable from './ProductProfitsTable';
import DebtTransactionsTable from './DebtTransactionsTable';

const EnhancedOfflineReportsPage = () => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'quarter'>('today');
  const { sales, loading: salesLoading } = useUnifiedSales();
  const { products, loading: productsLoading } = useUnifiedProducts();
  const { customers, loading: customersLoading } = useUnifiedCustomers();
  const { 
    isOnline, 
    cachedSnapshot, 
    lastSyncedAt, 
    cacheSnapshot, 
    isLoadingCache,
    readOnly 
  } = useOfflineReports();

  // Cache data when online and data is available
  useEffect(() => {
    if (isOnline && sales.length > 0 && products.length > 0 && customers.length > 0) {
      cacheSnapshot(sales, products, customers);
    }
  }, [isOnline, sales, products, customers, cacheSnapshot]);

  // Use cached data when offline, live data when online
  const effectiveSales = useMemo(() => {
    return !isOnline && cachedSnapshot ? cachedSnapshot.sales : sales;
  }, [isOnline, cachedSnapshot, sales]);

  const effectiveProducts = useMemo(() => {
    return !isOnline && cachedSnapshot ? cachedSnapshot.products : products;
  }, [isOnline, cachedSnapshot, products]);

  const effectiveCustomers = useMemo(() => {
    return !isOnline && cachedSnapshot ? cachedSnapshot.customers : customers;
  }, [isOnline, cachedSnapshot, customers]);

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

  const isLoading = isOnline ? (salesLoading || productsLoading || customersLoading) : isLoadingCache;

  // Safe timeframe change handler
  const handleTimeframeChange = (newTimeframe: 'today' | 'week' | 'month' | 'quarter') => {
    try {
      setTimeframe(newTimeframe);
    } catch (error) {
      console.error('[Reports] Error changing timeframe:', error);
    }
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

            <div className="flex items-center gap-4">
              {/* Offline Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                {!isOnline && (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Cached Data
                    </Badge>
                  </>
                )}
              </div>

              {/* Last Sync Indicator */}
              {!isOnline && lastSyncedAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last sync: {new Date(lastSyncedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="max-w-7xl mx-auto px-6 pb-4">
        <div className="flex justify-center">
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
                onClick={() => handleTimeframeChange(option.value as any)}
                disabled={!isOnline && !cachedSnapshot}
                className={`
                  text-sm font-medium rounded-md transition-all duration-200 px-3 py-1.5
                  ${timeframe === option.value
                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                  ${!isOnline && !cachedSnapshot ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {option.label}
              </Button>
            ))}
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {timeframe === 'today' ? 'Today' : 
                 timeframe === 'week' ? 'Last 7 days' :
                 timeframe === 'month' ? 'Last 30 days' : 'Last 90 days'}
              </Badge>
              {!isOnline && (
                <Badge variant="secondary" className="text-xs">
                  Offline Mode
                </Badge>
              )}
            </div>
          </div>
          <ModernSummaryCards
            sales={effectiveSales}
            products={effectiveProducts}
            customers={effectiveCustomers}
            dateRange={dateRange}
          />
        </div>

        {/* Sales Trend Chart */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales Analytics
          </h2>
          <EnhancedSalesTrendChart sales={effectiveSales} />
        </div>

        {/* Orders Bar Chart */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Orders Analytics
          </h2>
          <OrdersBarChart sales={effectiveSales} />
        </div>

        {/* Sales Report Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Sales Report
          </h2>
          <SalesReportTable 
            sales={effectiveSales} 
            loading={isLoading}
            readOnly={readOnly}
          />
        </div>

        {/* Product Profits Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Product Profits Report
          </h2>
          <ProductProfitsTable 
            sales={effectiveSales} 
            loading={isLoading}
            readOnly={readOnly}
          />
        </div>

        {/* Debt Transactions Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Debt Transactions Report
          </h2>
          <DebtTransactionsTable 
            sales={effectiveSales} 
            loading={isLoading}
            readOnly={readOnly}
          />
        </div>

        {/* Always Current Data Panels */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Status
          </h2>
          <AlwaysCurrentPanels
            products={effectiveProducts}
            customers={effectiveCustomers}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedOfflineReportsPage;
