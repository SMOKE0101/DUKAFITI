
import React, { useState, useMemo } from 'react';
import { DollarSign, ShoppingCart, Users, Package, CreditCard, Banknote, HandCoins, Activity, Clock } from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';
import { addDays, addMonths, addHours, startOfDay, startOfMonth, startOfHour, formatDateForBucket, safeNumber } from '../../utils/dateUtils';
import ReportsFiltersPanel from './ReportsFiltersPanel';
import BlockyMetricCard from './BlockyMetricCard';
import SalesTrendChart from './SalesTrendChart';
import OrdersPerHourChart from './OrdersPerHourChart';
import ReportsTable from './ReportsTable';
import AlertsPanel from './AlertsPanel';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

type DateRange = 'today' | 'week' | 'month' | 'custom';
type Filter = {
  type: 'salesType' | 'category' | 'customer';
  label: string;
  value: string;
};

const formatDateLabel = (dateStr: string, format: string): string => {
  const date = new Date(dateStr);
  switch (format) {
    case 'hour':
      return date.getHours().toString().padStart(2, '0') + ':00';
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default:
      return date.toLocaleDateString();
  }
};

const BlockyReportsPage = () => {
  const [globalDateRange, setGlobalDateRange] = useState<DateRange>('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>();
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [salesChartResolution, setSalesChartResolution] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersChartView, setOrdersChartView] = useState<'daily' | '2weeks'>('daily');

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const { customers = [], loading: customersLoading } = useSupabaseCustomers();
  const { products = [], loading: productsLoading } = useSupabaseProducts();
  const { sales = [], loading: salesLoading } = useSupabaseSales();

  const getGlobalDateRange = () => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (globalDateRange) {
      case 'today':
        return { from: today, to: now };
      case 'week':
        return { from: addDays(today, -7), to: now };
      case 'month':
        return { from: addDays(today, -30), to: now };
      case 'custom':
        return customDateRange || { from: today, to: now };
      default:
        return { from: today, to: now };
    }
  };

  const dateRange = getGlobalDateRange();
  const globalFromDate = dateRange.from;
  const globalToDate = dateRange.to;

  const summaryCardsSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      const isInDateRange = saleDate >= globalFromDate && saleDate <= globalToDate;
      
      const matchesFilters = activeFilters.every(filter => {
        switch (filter.type) {
          case 'salesType':
            return sale.paymentMethod === filter.value;
          case 'category':
            const product = products.find(p => p.id === sale.productId);
            return product?.category === filter.value;
          case 'customer':
            return sale.customerId === filter.value;
          default:
            return true;
        }
      });
      
      return isInDateRange && matchesFilters;
    });
  }, [sales, globalFromDate, globalToDate, activeFilters, products]);

  const summaryMetrics = useMemo(() => {
    const totalRevenue = summaryCardsSales.reduce((sum, sale) => sum + safeNumber(sale.total), 0);
    const totalOrders = summaryCardsSales.length;
    
    // Ultra-accurate active customers calculation
    const uniqueCustomerIds = new Set(
      summaryCardsSales
        .map(sale => sale.customerId)
        .filter(id => id && id.trim() !== '')
    );
    const activeCustomers = uniqueCustomerIds.size;
    
    // Ultra-accurate low stock calculation - exclude unspecified stock (-1) and null values
    const lowStockProducts = products.filter(product => {
      const currentStock = safeNumber(product.currentStock, 0);
      const threshold = safeNumber(product.lowStockThreshold, 10);
      return currentStock >= 0 && currentStock <= threshold;
    }).length;

    // Ultra-accurate payment method breakdown
    const revenueByCash = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + safeNumber(sale.total), 0);
    
    const revenueByMpesa = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'mpesa')
      .reduce((sum, sale) => sum + safeNumber(sale.total), 0);
    
    const revenueByDebt = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'debt')
      .reduce((sum, sale) => sum + safeNumber(sale.total), 0);

    return { 
      totalRevenue, 
      totalOrders, 
      activeCustomers, 
      lowStockProducts,
      revenueByCash,
      revenueByMpesa,
      revenueByDebt
    };
  }, [summaryCardsSales, products]);

  const salesTrendData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    let bucketFormat: 'hour' | 'day' | 'month';
    let timePoints: Date[] = [];
    
    switch (salesChartResolution) {
      case 'hourly':
        chartFromDate = addHours(now, -23);
        chartFromDate = startOfHour(chartFromDate);
        bucketFormat = 'hour';
        for (let i = 0; i < 24; i++) {
          timePoints.push(addHours(chartFromDate, i));
        }
        break;
      case 'daily':
        chartFromDate = addDays(now, -29);
        chartFromDate = startOfDay(chartFromDate);
        bucketFormat = 'day';
        for (let i = 0; i < 30; i++) {
          timePoints.push(addDays(chartFromDate, i));
        }
        break;
      case 'monthly':
        chartFromDate = addMonths(now, -11);
        chartFromDate = startOfMonth(chartFromDate);
        bucketFormat = 'month';
        for (let i = 0; i < 12; i++) {
          timePoints.push(addMonths(chartFromDate, i));
        }
        break;
      default:
        chartFromDate = addDays(now, -29);
        chartFromDate = startOfDay(chartFromDate);
        bucketFormat = 'day';
        for (let i = 0; i < 30; i++) {
          timePoints.push(addDays(chartFromDate, i));
        }
    }

    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

    const groupedData: Record<string, number> = {};
    timePoints.forEach(point => {
      const key = formatDateForBucket(point, bucketFormat);
      groupedData[key] = 0;
    });
    
    chartSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let bucketDate: Date;
      
      switch (bucketFormat) {
        case 'hour':
          bucketDate = startOfHour(saleDate);
          break;
        case 'day':
          bucketDate = startOfDay(saleDate);
          break;
        case 'month':
          bucketDate = startOfMonth(saleDate);
          break;
        default:
          bucketDate = startOfDay(saleDate);
      }
      
      const key = formatDateForBucket(bucketDate, bucketFormat);
      if (groupedData.hasOwnProperty(key)) {
        groupedData[key] += safeNumber(sale.total);
      }
    });
    
    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: formatDateLabel(date, bucketFormat),
        revenue
      }));
  }, [sales, salesChartResolution]);

  const salesTrendTotal = useMemo(() => {
    return salesTrendData.reduce((sum, item) => sum + item.revenue, 0);
  }, [salesTrendData]);

  const ordersPerHourData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    
    switch (ordersChartView) {
      case 'daily':
        chartFromDate = startOfDay(now);
        break;
      case '2weeks':
        chartFromDate = addDays(startOfDay(now), -13);
        break;
      default:
        chartFromDate = startOfDay(now);
    }

    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

    if (ordersChartView === 'daily') {
      const hourlyData: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = 0;
      }
      
      chartSales.forEach(sale => {
        const hour = new Date(sale.timestamp).getHours();
        hourlyData[hour]++;
      });
      
      return Object.entries(hourlyData).map(([hour, orders]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        orders
      }));
    } else {
      const dailyData: Record<string, number> = {};
      
      for (let i = 0; i < 14; i++) {
        const date = addDays(chartFromDate, i);
        const dateKey = formatDateForBucket(date, 'day');
        dailyData[dateKey] = 0;
      }
      
      chartSales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        const dateKey = formatDateForBucket(startOfDay(saleDate), 'day');
        if (dailyData.hasOwnProperty(dateKey)) {
          dailyData[dateKey]++;
        }
      });
      
      return Object.entries(dailyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, orders]) => ({
          hour: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          orders
        }));
    }
  }, [sales, ordersChartView]);

  const salesTableData = useMemo(() => 
    summaryCardsSales.map(sale => ({
      productName: sale.productName || 'Unknown Product',
      quantity: safeNumber(sale.quantity, 0),
      revenue: formatCurrency(safeNumber(sale.total)),
      customer: sale.customerName || 'Walk-in Customer',
      date: new Date(sale.timestamp).toLocaleDateString(),
      paymentMethod: sale.paymentMethod || 'unknown'
    })), [summaryCardsSales]
  );

  const paymentsTableData = useMemo(() => 
    summaryCardsSales
      .filter(sale => sale.customerName && sale.customerName.trim() !== '')
      .map(sale => ({
        customer: sale.customerName || 'Unknown Customer',
        amount: formatCurrency(safeNumber(sale.total)),
        method: sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Unknown',
        date: new Date(sale.timestamp).toLocaleDateString()
      })), [summaryCardsSales]
  );

  // Ultra-accurate low stock and overdue calculations
  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const currentStock = safeNumber(p.currentStock, 0);
      const threshold = safeNumber(p.lowStockThreshold, 10);
      return currentStock >= 0 && currentStock <= threshold;
    });
  }, [products]);

  const overdueCustomers = useMemo(() => {
    return customers.filter(c => safeNumber(c.outstandingDebt, 0) > 0);
  }, [customers]);

  const removeFilter = (filterToRemove: Filter) => {
    setActiveFilters(prev => prev.filter(f => 
      f.type !== filterToRemove.type || f.value !== filterToRemove.value
    ));
  };

  const handleDownloadSalesCSV = () => {
    const csvContent = [
      ['Product Name', 'Quantity', 'Revenue', 'Customer', 'Date', 'Payment Method'],
      ...salesTableData.map(row => [
        row.productName, 
        row.quantity.toString(), 
        row.revenue, 
        row.customer, 
        row.date,
        row.paymentMethod
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPaymentsCSV = () => {
    const csvContent = [
      ['Customer', 'Amount', 'Method', 'Date'],
      ...paymentsTableData.map(row => [row.customer, row.amount, row.method, row.date])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (salesLoading || productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className={`
        space-y-${isMobile ? '2' : '6'} max-w-7xl mx-auto
        ${isMobile ? 'p-1' : isTablet ? 'p-4' : 'p-6'}
      `}>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className={`
              font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white
              ${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'}
            `}>
              REPORTS
            </h1>
          </div>
          <div className={`
            flex items-center gap-2 text-gray-500 dark:text-gray-400
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Last updated: {new Date().toLocaleTimeString()}</span>
            <span className="sm:hidden">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        <ReportsFiltersPanel
          dateRange={globalDateRange}
          onDateRangeChange={setGlobalDateRange}
          customDateRange={customDateRange}
          onCustomDateRangeChange={setCustomDateRange}
          activeFilters={activeFilters}
          onRemoveFilter={removeFilter}
        />

        {/* Summary Metrics Cards */}
        <div className={`
          grid gap-4
          ${isMobile 
            ? 'grid-cols-1' 
            : isTablet 
              ? 'grid-cols-2 lg:grid-cols-4 xl:grid-cols-7' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7'
          }
        `}>
          <BlockyMetricCard
            title="TOTAL REVENUE"
            value={formatCurrency(summaryMetrics.totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600 dark:text-green-400"
            borderColor="border-green-600"
            hoverColor="hover:border-green-500 hover:bg-green-50/30 dark:hover:bg-green-900/10"
            delay={0}
          />
          <BlockyMetricCard
            title="TOTAL ORDERS"
            value={summaryMetrics.totalOrders}
            icon={ShoppingCart}
            iconColor="text-blue-600 dark:text-blue-400"
            borderColor="border-blue-600"
            hoverColor="hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
            delay={100}
          />
          <BlockyMetricCard
            title="ACTIVE CUSTOMERS"
            value={summaryMetrics.activeCustomers}
            icon={Users}
            iconColor="text-purple-600 dark:text-purple-400"
            borderColor="border-purple-600"
            hoverColor="hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-900/10"
            delay={200}
          />
          <BlockyMetricCard
            title="LOW STOCK"
            value={summaryMetrics.lowStockProducts}
            icon={Package}
            iconColor="text-orange-600 dark:text-orange-400"
            borderColor="border-orange-600"
            hoverColor="hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-900/10"
            delay={300}
          />
          <BlockyMetricCard
            title="CASH REVENUE"
            value={formatCurrency(summaryMetrics.revenueByCash)}
            icon={Banknote}
            iconColor="text-emerald-600 dark:text-emerald-400"
            borderColor="border-emerald-600"
            hoverColor="hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10"
            delay={400}
          />
          <BlockyMetricCard
            title="M-PESA REVENUE"
            value={formatCurrency(summaryMetrics.revenueByMpesa)}
            icon={CreditCard}
            iconColor="text-cyan-600 dark:text-cyan-400"
            borderColor="border-cyan-600"
            hoverColor="hover:border-cyan-500 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10"
            delay={500}
          />
          <BlockyMetricCard
            title="DEBT REVENUE"
            value={formatCurrency(summaryMetrics.revenueByDebt)}
            icon={HandCoins}
            iconColor="text-amber-600 dark:text-amber-400"
            borderColor="border-amber-600"
            hoverColor="hover:border-amber-500 hover:bg-amber-50/30 dark:hover:bg-amber-900/10"
            delay={600}
          />
        </div>

        {/* Charts Section */}
        <div className={`grid gap-${isMobile ? '2' : '6'} grid-cols-1`}>
          <SalesTrendChart
            data={salesTrendData}
            resolution={salesChartResolution}
            onResolutionChange={setSalesChartResolution}
            totalSales={salesTrendTotal}
          />
          <OrdersPerHourChart
            data={ordersPerHourData}
            view={ordersChartView}
            onViewChange={setOrdersChartView}
          />
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReportsTable
            title="SALES REPORT"
            data={salesTableData}
            columns={[
              { key: 'productName', label: 'PRODUCT NAME', sortable: true },
              { key: 'quantity', label: 'QUANTITY', sortable: true },
              { key: 'revenue', label: 'REVENUE', sortable: true },
              { key: 'customer', label: 'CUSTOMER', sortable: true },
              { key: 'date', label: 'DATE', sortable: true }
            ]}
            searchPlaceholder="Filter sales..."
            onDownloadCSV={handleDownloadSalesCSV}
          />
          <ReportsTable
            title="PAYMENTS REPORT"
            data={paymentsTableData}
            columns={[
              { key: 'customer', label: 'CUSTOMER', sortable: true },
              { key: 'amount', label: 'AMOUNT', sortable: true },
              { key: 'method', label: 'METHOD', sortable: true },
              { key: 'date', label: 'DATE', sortable: true }
            ]}
            searchPlaceholder="Filter payments..."
            onDownloadCSV={handleDownloadPaymentsCSV}
          />
        </div>

        <AlertsPanel
          lowStockProducts={lowStockProducts}
          overdueCustomers={overdueCustomers}
        />
      </div>
    </div>
  );
};

export default BlockyReportsPage;
