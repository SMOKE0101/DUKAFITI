
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

type DateRange = 'today' | 'week' | 'month' | 'custom';
type Filter = {
  type: 'salesType' | 'category' | 'customer';
  label: string;
  value: string;
};

const UltraPolishedReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>();
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [chartResolution, setChartResolution] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersChartView, setOrdersChartView] = useState<'daily' | 'weekly'>('daily');

  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
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

  const { from: fromDate, to: toDate } = getDateRange();

  // Filter sales data
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      const isInDateRange = saleDate >= fromDate && saleDate <= toDate;
      
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
  }, [sales, fromDate, toDate, activeFilters, products]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = filteredSales.length;
    const activeCustomers = new Set(filteredSales.map(sale => sale.customerId).filter(Boolean)).size;
    const lowStockProducts = products.filter(product => 
      product.currentStock <= (product.lowStockThreshold || 10)
    ).length;

    return { totalRevenue, totalOrders, activeCustomers, lowStockProducts };
  }, [filteredSales, products]);

  // Prepare chart data
  const salesTrendData = useMemo(() => {
    const groupedData: { [key: string]: number } = {};
    
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let key: string;
      
      switch (chartResolution) {
        case 'hourly':
          key = saleDate.toISOString().substring(0, 13) + ':00';
          break;
        case 'daily':
          key = saleDate.toISOString().substring(0, 10);
          break;
        case 'monthly':
          key = saleDate.toISOString().substring(0, 7);
          break;
      }
      
      groupedData[key] = (groupedData[key] || 0) + sale.total;
    });
    
    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString(),
        revenue
      }));
  }, [filteredSales, chartResolution]);

  const ordersPerHourData = useMemo(() => {
    const hourlyData: { [key: number]: number } = {};
    
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }
    
    filteredSales.forEach(sale => {
      const hour = new Date(sale.timestamp).getHours();
      hourlyData[hour]++;
    });
    
    return Object.entries(hourlyData).map(([hour, orders]) => ({
      hour: `${hour}:00`,
      orders
    }));
  }, [filteredSales]);

  // Table data
  const salesTableData = useMemo(() => 
    filteredSales.map(sale => ({
      productName: sale.productName,
      quantity: sale.quantity,
      revenue: formatCurrency(sale.total),
      customer: sale.customerName || 'Walk-in Customer',
      date: new Date(sale.timestamp).toLocaleDateString()
    })), [filteredSales]
  );

  const paymentsTableData = useMemo(() => 
    filteredSales
      .filter(sale => sale.customerName)
      .map(sale => ({
        customer: sale.customerName,
        amount: formatCurrency(sale.total),
        method: sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1),
        date: new Date(sale.timestamp).toLocaleDateString()
      })), [filteredSales]
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
      {/* Filters Panel */}
      <ReportsFiltersPanel
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        customDateRange={customDateRange}
        onCustomDateRangeChange={setCustomDateRange}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        onExport={handleExport}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600 dark:text-green-400"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            delay={0}
          />
          <MetricCard
            title="Total Orders"
            value={metrics.totalOrders}
            icon={ShoppingCart}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            delay={100}
          />
          <MetricCard
            title="Active Customers"
            value={metrics.activeCustomers}
            icon={Users}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            delay={200}
          />
          <MetricCard
            title="Low Stock Products"
            value={metrics.lowStockProducts}
            icon={Package}
            iconColor="text-orange-600 dark:text-orange-400"
            iconBgColor="bg-orange-100 dark:bg-orange-900/20"
            delay={300}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesTrendChart
            data={salesTrendData}
            resolution={chartResolution}
            onResolutionChange={setChartResolution}
            totalSales={metrics.totalRevenue}
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

        {/* Alerts Panel */}
        <AlertsPanel
          lowStockProducts={lowStockProducts}
          overdueCustomers={overdueCustomers}
        />
      </div>
    </div>
  );
};

export default UltraPolishedReportsPage;
