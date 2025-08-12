
import React, { useState, useMemo } from 'react';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';
import { addDays, addMonths, addHours, startOfDay, startOfMonth, startOfHour, formatDateForBucket, safeNumber } from '../../utils/dateUtils';
import ReportsFiltersPanel from './ReportsFiltersPanel';
import MetricCard from './MetricCard';
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

const UltraPolishedReportsPage = () => {
  const [globalDateRange, setGlobalDateRange] = useState<DateRange>('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>();
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [salesChartResolution, setSalesChartResolution] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersChartView, setOrdersChartView] = useState<'daily' | '2weeks'>('daily');

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();

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

  const { from: globalFromDate, to: globalToDate } = getGlobalDateRange();

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
    
    // Ultra-accurate low stock calculation
    const lowStockProducts = products.filter(product => {
      const currentStock = safeNumber(product.currentStock, 0);
      const threshold = safeNumber(product.lowStockThreshold, 10);
      return currentStock >= 0 && currentStock <= threshold;
    }).length;

    return { totalRevenue, totalOrders, activeCustomers, lowStockProducts };
  }, [summaryCardsSales, products]);

  const salesTrendData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    let bucketFormat: 'hour' | 'day' | 'month';
    let timePoints: Date[] = [];
    
    switch (salesChartResolution) {
      case 'hourly':
        chartFromDate = addHours(now, -71);
        chartFromDate = startOfHour(chartFromDate);
        bucketFormat = 'hour';
        for (let i = 0; i < 72; i++) {
          timePoints.push(addHours(chartFromDate, i));
        }
        break;
      case 'daily':
        chartFromDate = addDays(now, -89);
        chartFromDate = startOfDay(chartFromDate);
        bucketFormat = 'day';
        for (let i = 0; i < 90; i++) {
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
        chartFromDate = addDays(startOfDay(now), -59);
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
      
      for (let i = 0; i < 60; i++) {
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
      date: new Date(sale.timestamp).toLocaleDateString()
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
      ['Product Name', 'Quantity', 'Revenue', 'Customer', 'Date'],
      ...salesTableData.map(row => [row.productName, row.quantity.toString(), row.revenue, row.customer, row.date])
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ReportsFiltersPanel
        dateRange={globalDateRange}
        onDateRangeChange={setGlobalDateRange}
        customDateRange={customDateRange}
        onCustomDateRangeChange={setCustomDateRange}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
      />

      <div className={`max-w-7xl mx-auto space-y-${isMobile ? '2' : '6 md:space-y-8'} ${
        isMobile ? 'px-1 py-2' : isTablet ? 'px-4 py-6' : 'px-6 py-8'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(summaryMetrics.totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600 dark:text-green-400"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            delay={0}
          />
          <MetricCard
            title="Total Orders"
            value={summaryMetrics.totalOrders}
            icon={ShoppingCart}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            delay={100}
          />
          <MetricCard
            title="Active Customers"
            value={summaryMetrics.activeCustomers}
            icon={Users}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            delay={200}
          />
          <MetricCard
            title="Low Stock Products"
            value={summaryMetrics.lowStockProducts}
            icon={Package}
            iconColor="text-orange-600 dark:text-orange-400"
            iconBgColor="bg-orange-100 dark:bg-orange-900/20"
            delay={300}
          />
        </div>

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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReportsTable
            title="Sales Report"
            data={salesTableData}
            columns={[
              { key: 'productName', label: 'Product Name', sortable: true },
              { key: 'quantity', label: 'Quantity', sortable: true },
              { key: 'revenue', label: 'Revenue', sortable: true },
              { key: 'customer', label: 'Customer', sortable: true },
              { key: 'date', label: 'Date', sortable: true }
            ]}
            searchPlaceholder="Filter sales..."
            onDownloadCSV={handleDownloadSalesCSV}
          />
          <ReportsTable
            title="Payments Report"
            data={paymentsTableData}
            columns={[
              { key: 'customer', label: 'Customer', sortable: true },
              { key: 'amount', label: 'Amount', sortable: true },
              { key: 'method', label: 'Method', sortable: true },
              { key: 'date', label: 'Date', sortable: true }
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

export default UltraPolishedReportsPage;
