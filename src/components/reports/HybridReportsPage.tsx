
import React, { useState, useMemo } from 'react';
import { DollarSign, ShoppingCart, Users, Package, CreditCard, Banknote, HandCoins } from 'lucide-react';
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

type DateRange = 'today' | 'week' | 'month' | 'custom';
type Filter = {
  type: 'salesType' | 'category' | 'customer';
  label: string;
  value: string;
};

const HybridReportsPage = () => {
  // Global date range for summary cards only
  const [globalDateRange, setGlobalDateRange] = useState<DateRange>('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>();
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  
  // Independent chart controls
  const [salesChartResolution, setSalesChartResolution] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersChartView, setOrdersChartView] = useState<'daily' | 'weekly'>('daily');

  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();

  // Calculate date range for summary cards only
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

  // Filter sales data for summary cards using global date range
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

  // Calculate metrics for summary cards including payment methods
  const summaryMetrics = useMemo(() => {
    const totalRevenue = summaryCardsSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = summaryCardsSales.length;
    const activeCustomers = new Set(summaryCardsSales.map(sale => sale.customerId).filter(Boolean)).size;
    const lowStockProducts = products.filter(product => 
      product.currentStock <= (product.lowStockThreshold || 10)
    ).length;

    // Payment method breakdowns
    const revenueByCash = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.total, 0);
    
    const revenueByMpesa = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'mpesa')
      .reduce((sum, sale) => sum + sale.total, 0);
    
    const revenueByCredit = summaryCardsSales
      .filter(sale => sale.paymentMethod === 'credit')
      .reduce((sum, sale) => sum + sale.total, 0);

    return { 
      totalRevenue, 
      totalOrders, 
      activeCustomers, 
      lowStockProducts,
      revenueByCash,
      revenueByMpesa,
      revenueByCredit
    };
  }, [summaryCardsSales, products]);

  // Prepare chart data - Sales Trend Chart with its own timeframe
  const salesTrendData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    let bucketFormat: string;
    
    switch (salesChartResolution) {
      case 'hourly':
        chartFromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        bucketFormat = 'hour';
        break;
      case 'daily':
        chartFromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        bucketFormat = 'day';
        break;
      case 'monthly':
        chartFromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Last 12 months
        bucketFormat = 'month';
        break;
      default:
        chartFromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        bucketFormat = 'day';
    }

    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

    const groupedData: { [key: string]: number } = {};
    
    chartSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let key: string;
      
      switch (bucketFormat) {
        case 'hour':
          key = saleDate.toISOString().substring(0, 13) + ':00';
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
      
      groupedData[key] = (groupedData[key] || 0) + sale.total;
    });
    
    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString(),
        revenue
      }));
  }, [sales, salesChartResolution]);

  const salesTrendTotal = useMemo(() => {
    return salesTrendData.reduce((sum, item) => sum + item.revenue, 0);
  }, [salesTrendData]);

  // Prepare Orders Per Hour data with its own timeframe
  const ordersPerHourData = useMemo(() => {
    const now = new Date();
    let chartFromDate: Date;
    
    switch (ordersChartView) {
      case 'daily':
        chartFromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        chartFromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        chartFromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const chartSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= chartFromDate && saleDate <= now;
    });

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
  }, [sales, ordersChartView]);

  // Table data using filtered sales for consistency
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

  // Alerts data
  const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10));
  const overdueCustomers = customers.filter(c => c.outstandingDebt > 0);

  const removeFilter = (filterToRemove: Filter) => {
    setActiveFilters(prev => prev.filter(f => 
      f.type !== filterToRemove.type || f.value !== filterToRemove.value
    ));
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    console.log(`Exporting as ${format}`);
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
      {/* Page Title - Blocky Font */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
          REPORTS
        </h1>
      </div>

      {/* Global Filters Panel - Only affects summary cards */}
      <ReportsFiltersPanel
        dateRange={globalDateRange}
        onDateRangeChange={setGlobalDateRange}
        customDateRange={customDateRange}
        onCustomDateRangeChange={setCustomDateRange}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        onExport={handleExport}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Metrics Cards - 7 Cards in Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <MetricCard
            title="TOTAL REVENUE"
            value={formatCurrency(summaryMetrics.totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600 dark:text-green-400"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            delay={0}
            className="font-mono font-black uppercase tracking-tight text-xs"
          />
          <MetricCard
            title="TOTAL ORDERS"
            value={summaryMetrics.totalOrders}
            icon={ShoppingCart}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            delay={100}
            className="font-mono font-black uppercase tracking-tight text-xs"
          />
          <MetricCard
            title="ACTIVE CUSTOMERS"
            value={summaryMetrics.activeCustomers}
            icon={Users}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            delay={200}
            className="font-mono font-black uppercase tracking-tight text-xs"
          />
          <MetricCard
            title="LOW STOCK"
            value={summaryMetrics.lowStockProducts}
            icon={Package}
            iconColor="text-orange-600 dark:text-orange-400"
            iconBgColor="bg-orange-100 dark:bg-orange-900/20"
            delay={300}
            className="font-mono font-black uppercase tracking-tight text-xs"
          />
          <MetricCard
            title="CASH REVENUE"
            value={formatCurrency(summaryMetrics.revenueByCash)}
            icon={Banknote}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBgColor="bg-emerald-100 dark:bg-emerald-900/20"
            delay={400}
            className="font-mono font-black uppercase tracking-tight text-xs"
          />
          <MetricCard
            title="M-PESA REVENUE"
            value={formatCurrency(summaryMetrics.revenueByMpesa)}
            icon={CreditCard}
            iconColor="text-cyan-600 dark:text-cyan-400"
            iconBgColor="bg-cyan-100 dark:bg-cyan-900/20"
            delay={500}
            className="font-mono font-black uppercase tracking-tight text-xs"
          />
          <MetricCard
            title="CREDIT REVENUE"
            value={formatCurrency(summaryMetrics.revenueByCredit)}
            icon={HandCoins}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBgColor="bg-amber-100 dark:bg-amber-900/20"
            delay={600}
            className="font-mono font-black uppercase tracking-tight text-xs"
          />
        </div>

        {/* Charts Section - Each with independent controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Alerts Panel */}
        <AlertsPanel
          lowStockProducts={lowStockProducts}
          overdueCustomers={overdueCustomers}
        />
      </div>
    </div>
  );
};

export default HybridReportsPage;
