
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  Filter,
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

type DateRange = 'today' | 'week' | 'month' | 'custom';
type Filter = {
  type: 'salesType' | 'category' | 'customer';
  label: string;
  value: string;
};

const PremiumReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [chartResolution, setChartResolution] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersChartView, setOrdersChartView] = useState<'daily' | 'weekly'>('daily');
  const [showExportMenu, setShowExportMenu] = useState(false);

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
      
      // Apply active filters
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

    return {
      totalRevenue,
      totalOrders,
      activeCustomers,
      lowStockProducts
    };
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
    
    // Initialize all hours
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

  // Get low stock alerts
  const lowStockAlerts = products
    .filter(p => p.currentStock <= (p.lowStockThreshold || 10))
    .slice(0, 3);

  // Get overdue customers
  const overdueCustomers = customers
    .filter(c => c.outstandingDebt > 0)
    .slice(0, 3);

  const removeFilter = (filterToRemove: Filter) => {
    setActiveFilters(prev => prev.filter(f => 
      f.type !== filterToRemove.type || f.value !== filterToRemove.value
    ));
  };

  const handleExport = (format: 'pdf' | 'csv' | 'email') => {
    // Implementation for export functionality
    console.log(`Exporting as ${format}`);
    setShowExportMenu(false);
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
      {/* Filters & Actions Panel */}
      <div className="sticky top-16 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(['today', 'week', 'month'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      dateRange === range
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Export & Filter */}
            <div className="flex items-center gap-3">
              {/* Active Filters */}
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter)}
                    className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              
              {/* Export Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[120px] z-50">
                    {['PDF', 'CSV', 'Email'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExport(format.toLowerCase() as 'pdf' | 'csv' | 'email')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Revenue',
              value: formatCurrency(metrics.totalRevenue),
              icon: DollarSign,
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50 dark:bg-green-900/20'
            },
            {
              title: 'Total Orders',
              value: metrics.totalOrders.toString(),
              icon: ShoppingCart,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50 dark:bg-blue-900/20'
            },
            {
              title: 'Active Customers',
              value: metrics.activeCustomers.toString(),
              icon: Users,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50 dark:bg-purple-900/20'
            },
            {
              title: 'Low Stock Products',
              value: metrics.lowStockProducts.toString(),
              icon: Package,
              color: 'from-orange-500 to-orange-600',
              bgColor: 'bg-orange-50 dark:bg-orange-900/20'
            }
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="bg-white dark:bg-gray-800 border-0 shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                        {card.title}
                      </p>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                    <div className={`p-4 ${card.bgColor} rounded-2xl shadow-lg`}>
                      <Icon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Sales Trend
              </CardTitle>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {(['hourly', 'daily', 'monthly'] as const).map((resolution) => (
                  <button
                    key={resolution}
                    onClick={() => setChartResolution(resolution)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      chartResolution === resolution
                        ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {resolution.charAt(0).toUpperCase() + resolution.slice(1)}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `${formatCurrency(value)}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders Per Hour Chart */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Orders Per Hour
              </CardTitle>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {(['daily', 'weekly'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setOrdersChartView(view)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      ordersChartView === view
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersPerHourData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [value, 'Orders']}
                    />
                    <Bar 
                      dataKey="orders" 
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockAlerts.length > 0 ? (
                <>
                  {lowStockAlerts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Only {product.currentStock} left
                        </p>
                      </div>
                      <Badge variant={product.currentStock <= 0 ? "destructive" : "secondary"} className="text-xs">
                        {product.currentStock <= 0 ? 'Out' : 'Low'}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-orange-600 hover:text-orange-700 text-sm">
                    View All
                  </Button>
                </>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No low stock alerts
                </p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Payments */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overdueCustomers.length > 0 ? (
                <>
                  {overdueCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Owes {formatCurrency(customer.outstandingDebt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-red-600 hover:text-red-700 text-sm">
                    View All
                  </Button>
                </>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No overdue payments
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-green-600 dark:text-green-400">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Add Sale', icon: Plus, path: '/sales' },
                { label: 'Add Product', icon: Package, path: '/inventory' },
                { label: 'Add Customer', icon: Users, path: '/customers' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    className="w-full justify-start gap-3 bg-green-600 hover:bg-green-500 text-white"
                    onClick={() => window.location.href = action.path}
                  >
                    <Icon className="w-5 h-5" />
                    {action.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PremiumReportsPage;
