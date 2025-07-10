
import React, { useState, useMemo } from 'react';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Calendar,
  Download
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const ReportsPage = () => {
  const { sales, loading } = useSupabaseSales();
  const [timeFilter, setTimeFilter] = useState('30days');

  const filteredSales = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (timeFilter) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startDate && sale.total >= 0; // Exclude negative amounts (payments)
    });
  }, [sales, timeFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalTransactions = filteredSales.length;
    const uniqueCustomers = new Set(filteredSales.map(sale => sale.customerId).filter(Boolean)).size;

    return {
      totalRevenue,
      totalProfit,
      totalTransactions,
      uniqueCustomers
    };
  }, [filteredSales]);

  const chartData = useMemo(() => {
    const dailyData = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, profit: 0, transactions: 0 };
      }
      acc[date].revenue += sale.total;
      acc[date].profit += sale.profit;
      acc[date].transactions += 1;
      return acc;
    }, {} as Record<string, { date: string; revenue: number; profit: number; transactions: number }>);

    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredSales]);

  const productData = useMemo(() => {
    const productStats = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.productName]) {
        acc[sale.productName] = { name: sale.productName, value: 0, count: 0 };
      }
      acc[sale.productName].value += sale.total;
      acc[sale.productName].count += sale.quantity;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    return Object.values(productStats)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredSales]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Title - Consistent with other pages */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  REPORTS
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Analyze your business performance and trends
                </p>
              </div>
              
              <div className="flex gap-3">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline"
                  className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                >
                  <Download className="w-4 h-4 mr-2 stroke-2" />
                  EXPORT
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-green-600 dark:text-green-400">
                    TOTAL REVENUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                    TOTAL PROFIT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats.totalProfit)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-purple-600 dark:text-purple-400">
                    TRANSACTIONS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalTransactions}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-purple-600 dark:text-purple-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-orange-600 dark:text-orange-400">
                    CUSTOMERS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.uniqueCustomers}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
                  <Users className="w-8 h-8 text-orange-600 dark:text-orange-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trend Chart */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white mb-4">
                REVENUE TREND
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white mb-4">
                TOP PRODUCTS
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {productData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white mb-4">
              RECENT SALES
            </h3>
            <div className="space-y-3">
              {filteredSales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{sale.productName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {sale.customerName || 'Walk-in Customer'} • {sale.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(sale.total)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
