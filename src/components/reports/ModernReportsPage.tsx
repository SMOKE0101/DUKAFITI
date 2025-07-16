
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  X,
  Search,
  ChevronUp,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { formatCurrency } from '../../utils/currency';
import IndependentSalesTrendChart from './IndependentSalesTrendChart';
import IndependentOrdersChart from './IndependentOrdersChart';

type DateRange = 'today' | 'week' | 'month' | 'custom';
type Filter = {
  type: 'salesType' | 'category' | 'customer';
  label: string;
  value: string;
};

const ModernReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [paymentsSearchTerm, setPaymentsSearchTerm] = useState('');
  const [salesSortConfig, setSalesSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Independent chart states
  const [salesTrendTimeframe, setSalesTrendTimeframe] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersTimeframe, setOrdersTimeframe] = useState<'daily' | 'weekly'>('daily');

  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading } = useSupabaseSales();

  // Calculate date range for summary cards
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

  // Filter sales data for summary cards
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      const isInDateRange = saleDate >= fromDate && saleDate <= toDate;
      
      const matchesFilters = activeFilters.every(filter => {
        switch (filter.type) {
          case 'salesType':
            return sale.payment_method === filter.value;
          case 'category':
            const product = products.find(p => p.id === sale.product_id);
            return product?.category === filter.value;
          case 'customer':
            return sale.customer_id === filter.value;
          default:
            return true;
        }
      });
      
      return isInDateRange && matchesFilters && sale.total_amount >= 0;
    });
  }, [sales, fromDate, toDate, activeFilters, products]);

  // Calculate metrics for summary cards
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalOrders = filteredSales.length;
    const activeCustomers = new Set(filteredSales.map(sale => sale.customer_id).filter(Boolean)).size;
    const lowStockProducts = products.filter(product => 
      product.current_stock !== -1 && product.current_stock <= (product.low_stock_threshold || 10)
    ).length;
    const cashRevenue = filteredSales
      .filter(s => s.payment_method === 'cash')
      .reduce((sum, sale) => sum + sale.total_amount, 0);
    const mpesaRevenue = filteredSales
      .filter(s => s.payment_method === 'mpesa')
      .reduce((sum, sale) => sum + sale.total_amount, 0);

    return {
      totalRevenue,
      totalOrders,
      activeCustomers,
      lowStockProducts,
      cashRevenue,
      mpesaRevenue
    };
  }, [filteredSales, products]);

  const salesTableData = useMemo(() => {
    let data = filteredSales.map(sale => ({
      productName: sale.product_name,
      quantity: sale.quantity,
      revenue: sale.total_amount,
      customer: sale.customer_name || 'Walk-in Customer',
      date: new Date(sale.timestamp).toLocaleDateString()
    }));

    if (salesSearchTerm) {
      data = data.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(salesSearchTerm.toLowerCase())
        )
      );
    }

    if (salesSortConfig) {
      data.sort((a, b) => {
        const aValue = a[salesSortConfig.key as keyof typeof a];
        const bValue = b[salesSortConfig.key as keyof typeof b];
        
        if (aValue < bValue) return salesSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return salesSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [filteredSales, salesSearchTerm, salesSortConfig]);

  const paymentsTableData = useMemo(() => 
    filteredSales
      .filter(sale => sale.customer_name)
      .map(sale => ({
        customer: sale.customer_name,
        amount: sale.total_amount,
        method: sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1),
        date: new Date(sale.timestamp).toLocaleDateString()
      })), [filteredSales]
  );

  const lowStockProducts = products.filter(p => p.current_stock !== -1 && p.current_stock <= (p.low_stock_threshold || 10)).slice(0, 5);
  const overdueCustomers = customers.filter(c => c.outstanding_debt > 0).slice(0, 5);

  const removeFilter = (filterToRemove: Filter) => {
    setActiveFilters(prev => prev.filter(f => 
      f.type !== filterToRemove.type || f.value !== filterToRemove.value
    ));
  };

  const handleSort = (key: string) => {
    setSalesSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'csv') {
      const csvContent = [
        ['Product Name', 'Quantity', 'Revenue', 'Customer', 'Date'],
        ...salesTableData.map(row => [
          row.productName, 
          row.quantity, 
          row.revenue, 
          row.customer, 
          row.date
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales-report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
              REPORTS
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
              Your sales and performance overview
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { title: 'TOTAL REVENUE', value: formatCurrency(metrics.totalRevenue), icon: DollarSign, color: 'border-green-300 hover:border-green-500' },
            { title: 'TOTAL ORDERS', value: metrics.totalOrders.toString(), icon: ShoppingCart, color: 'border-blue-300 hover:border-blue-500' },
            { title: 'ACTIVE CUSTOMERS', value: metrics.activeCustomers.toString(), icon: Users, color: 'border-purple-300 hover:border-purple-500' },
            { title: 'LOW STOCK', value: metrics.lowStockProducts.toString(), icon: Package, color: 'border-orange-300 hover:border-orange-500' },
            { title: 'CASH REVENUE', value: formatCurrency(metrics.cashRevenue), icon: DollarSign, color: 'border-emerald-300 hover:border-emerald-500' },
            { title: 'M-PESA REVENUE', value: formatCurrency(metrics.mpesaRevenue), icon: DollarSign, color: 'border-teal-300 hover:border-teal-500' }
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className={`border-2 ${card.color} rounded-xl p-6 bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer`}>
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-mono font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                        {card.title}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters Panel */}
        <Card className="border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {(['today', 'week', 'month'] as DateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-4 py-2 text-sm font-mono font-medium rounded-lg transition-all duration-200 ${
                        dateRange === range
                          ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1 rounded-full"
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
              </div>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="gap-2 border-gray-300 dark:border-gray-600"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[120px] z-50">
                    {['PDF', 'CSV'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExport(format.toLowerCase() as 'pdf' | 'csv')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Independent Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IndependentSalesTrendChart
            sales={sales}
            timeframe={salesTrendTimeframe}
            onTimeframeChange={setSalesTrendTimeframe}
          />
          <IndependentOrdersChart
            sales={sales}
            timeframe={ordersTimeframe}
            onTimeframeChange={setOrdersTimeframe}
          />
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Sales Report Table */}
          <Card className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-mono font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                  SALES REPORT
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-500 text-white"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Filter sales..."
                  value={salesSearchTerm}
                  onChange={(e) => setSalesSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {[
                        { key: 'productName', label: 'Product' },
                        { key: 'quantity', label: 'Qty' },
                        { key: 'revenue', label: 'Revenue' },
                        { key: 'customer', label: 'Customer' },
                        { key: 'date', label: 'Date' }
                      ].map((column) => (
                        <th
                          key={column.key}
                          className="px-6 py-3 text-left text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleSort(column.key)}
                        >
                          <div className="flex items-center gap-1">
                            {column.label}
                            <div className="flex flex-col">
                              <ChevronUp className={`w-3 h-3 ${
                                salesSortConfig?.key === column.key && salesSortConfig.direction === 'asc' 
                                  ? 'text-purple-600' : 'text-gray-300'
                              }`} />
                              <ChevronDown className={`w-3 h-3 -mt-1 ${
                                salesSortConfig?.key === column.key && salesSortConfig.direction === 'desc' 
                                  ? 'text-purple-600' : 'text-gray-300'
                              }`} />
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {salesTableData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(row.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payments Report Table */}
          <Card className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-mono font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                  PAYMENTS REPORT
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-500 text-white"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paymentsTableData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(row.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.method}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-orange-300 dark:border-orange-600 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Package className="w-5 h-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No low stock alerts
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                      </div>
                      <Badge variant="destructive">
                        {product.current_stock} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-red-300 dark:border-red-600 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Users className="w-5 h-5" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueCustomers.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No overdue payments
                </p>
              ) : (
                <div className="space-y-3">
                  {overdueCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(customer.outstanding_debt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">overdue</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernReportsPage;
