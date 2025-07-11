import React, { useState, useMemo } from 'react';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (globalDateRange) {
      case 'today':
        return { from: today, to: new Date() };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: weekAgo, to: new Date() };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { from: monthAgo, to: new Date() };
      case 'custom':
        return customDateRange || { from: today, to: new Date() };
      default:
        return { from: today, to: new Date() };
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
    const totalRevenue = summaryCardsSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = summaryCardsSales.length;
    const activeCustomers = new Set(summaryCardsSales.map(sale => sale.customerId).filter(Boolean)).size;
    const lowStockProducts = products.filter(product => 
      product.currentStock <= (product.lowStockThreshold || 10)
    ).length;

    return { totalRevenue, totalOrders, activeCustomers, lowStockProducts };
  }, [summaryCardsSales, products]);

  const salesTrendData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    let bucketFormat: string;
    let timePoints: string[] = [];
    
    switch (salesChartResolution) {
      case 'hourly':
        chartFromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        bucketFormat = 'hour';
        // Generate 24 consecutive hourly buckets from 24 hours ago to now
        for (let i = 0; i < 24; i++) {
          const hourTime = new Date(chartFromDate.getTime() + i * 60 * 60 * 1000);
          timePoints.push(hourTime.toISOString().substring(0, 13) + ':00:00.000Z');
        }
        break;
      case 'daily':
        chartFromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        bucketFormat = 'day';
        for (let i = 0; i < 30; i++) {
          const day = new Date(chartFromDate);
          day.setDate(day.getDate() + i);
          timePoints.push(day.toISOString().substring(0, 10));
        }
        break;
      case 'monthly':
        chartFromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        bucketFormat = 'month';
        for (let i = 0; i < 12; i++) {
          const month = new Date(chartFromDate);
          month.setMonth(month.getMonth() + i);
          timePoints.push(month.toISOString().substring(0, 7));
        }
        break;
      default:
        chartFromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        bucketFormat = 'day';
    }

    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

    const groupedData: Record<string, number> = {};
    timePoints.forEach(point => {
      groupedData[point] = 0;
    });
    
    chartSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let key: string;
      
      switch (bucketFormat) {
        case 'hour':
          key = saleDate.toISOString().substring(0, 13) + ':00:00.000Z';
          break;
        case 'day':
          key = saleDate.toISOString().substring(0, 10);
          break;
        case 'month':
          key = saleDate.toISOString().substring(0, 7);
          break;
        default:
          key = saleDate.toISOString().substring(0, 10);
      }
      
      if (groupedData.hasOwnProperty(key)) {
        groupedData[key] += sale.total;
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
        chartFromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '2weeks':
        chartFromDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      default:
        chartFromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

    if (ordersChartView === 'daily') {
      const hourlyData: { [key: number]: number } = {};
      
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = 0;
      }
      
      chartSales.forEach(sale => {
        const hour = new Date(sale.timestamp).getHours();
        hourlyData[hour]++;
      });
      
      return Object.entries(hourlyData).map(([hour, orders]) => ({
        hour: `${hour}:00`,
        orders
      }));
    } else {
      const dailyData: { [key: string]: number } = {};
      
      for (let i = 0; i < 14; i++) {
        const date = new Date(chartFromDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().substring(0, 10);
        dailyData[dateKey] = 0;
      }
      
      chartSales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        const dateKey = saleDate.toISOString().substring(0, 10);
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
      productName: sale.productName,
      quantity: sale.quantity,
      revenue: formatCurrency(sale.total),
      customer: sale.customerName || 'Walk-in Customer',
      date: new Date(sale.timestamp).toLocaleDateString()
    })), [summaryCardsSales]
  );

  const paymentsTableData = useMemo(() => 
    summaryCardsSales
      .filter(sale => sale.customerName)
      .map(sale => ({
        customer: sale.customerName,
        amount: formatCurrency(sale.total),
        method: sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1),
        date: new Date(sale.timestamp).toLocaleDateString()
      })), [summaryCardsSales]
  );

  const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10));
  const overdueCustomers = customers.filter(c => c.outstandingDebt > 0);

  const removeFilter = (filterToRemove: Filter) => {
    setActiveFilters(prev => prev.filter(f => 
      f.type !== filterToRemove.type || f.value !== filterToRemove.value
    ));
  };

  const handleDownloadSalesCSV = () => {
    const csvContent = [
      ['Product Name', 'Quantity', 'Revenue', 'Customer', 'Date'],
      ...salesTableData.map(row => [row.productName, row.quantity, row.revenue, row.customer, row.date])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-report.csv';
    a.click();
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
    a.download = 'payments-report.csv';
    a.click();
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
