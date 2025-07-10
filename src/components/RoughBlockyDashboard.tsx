
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  Package,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Activity,
  Plus
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';

// Mock data for charts
const salesData = [
  { name: 'Jan', sales: 4000, profit: 2400 },
  { name: 'Feb', sales: 3000, profit: 1398 },
  { name: 'Mar', sales: 2000, profit: 9800 },
  { name: 'Apr', sales: 2780, profit: 3908 },
  { name: 'May', sales: 1890, profit: 4800 },
  { name: 'Jun', sales: 2390, profit: 3800 },
];

const categoryData = [
  { name: 'Electronics', value: 400, color: '#8884d8' },
  { name: 'Clothing', value: 300, color: '#82ca9d' },
  { name: 'Food', value: 300, color: '#ffc658' },
  { name: 'Books', value: 200, color: '#ff7300' },
];

const dailySales = [
  { day: 'Mon', amount: 1200 },
  { day: 'Tue', amount: 1900 },
  { day: 'Wed', amount: 800 },
  { day: 'Thu', amount: 1500 },
  { day: 'Fri', amount: 2200 },
  { day: 'Sat', amount: 2800 },
  { day: 'Sun', amount: 1600 },
];

const RoughBlockyDashboard = () => {
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { sales, loading: salesLoading } = useSupabaseSales();

  const loading = productsLoading || customersLoading || salesLoading;

  // Calculate metrics
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalSales = sales.length;
  const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10)).length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const outstandingDebt = customers.reduce((sum, customer) => sum + customer.outstandingDebt, 0);

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
              DASHBOARD
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
              Overview of your business performance and key metrics
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2 stroke-2" />
              QUICK SALE
            </Button>
            
            <Button 
              className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Activity className="w-4 h-4 mr-2 stroke-2" />
              VIEW REPORTS
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                    TOTAL REVENUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    +12% from last month
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                  <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-green-600 dark:text-green-400">
                    TOTAL PROFIT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(totalProfit)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    +8% from last month
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-purple-600 dark:text-purple-400">
                    TOTAL SALES
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {totalSales}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    +15% from last month
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
                    OUTSTANDING DEBT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(outstandingDebt)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                    -5% from last month
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
                  <CreditCard className="w-8 h-8 text-orange-600 dark:text-orange-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                    PRODUCTS
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {totalProducts}
                  </p>
                </div>
                <Package className="w-6 h-6 text-gray-500 stroke-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                    CUSTOMERS
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {totalCustomers}
                  </p>
                </div>
                <Users className="w-6 h-6 text-gray-500 stroke-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                    LOW STOCK
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {lowStockProducts}
                  </p>
                </div>
                <AlertTriangle className="w-6 h-6 text-orange-500 stroke-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400">
                    TODAY'S SALES
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(2800)}
                  </p>
                </div>
                <Target className="w-6 h-6 text-green-500 stroke-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Trend Chart */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                  SALES TREND
                </h3>
                <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700 font-mono font-bold uppercase">
                  +12% THIS MONTH
                </Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                      labelClassName="text-gray-900"
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Sales Chart */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                  DAILY SALES
                </h3>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700 font-mono font-bold uppercase">
                  THIS WEEK
                </Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
                      labelClassName="text-gray-900"
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white mb-6">
              QUICK ACTIONS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold h-12">
                <Plus className="w-4 h-4 mr-2 stroke-2" />
                ADD PRODUCT
              </Button>
              <Button className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold h-12">
                <ShoppingCart className="w-4 h-4 mr-2 stroke-2" />
                NEW SALE
              </Button>
              <Button className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold h-12">
                <Users className="w-4 h-4 mr-2 stroke-2" />
                ADD CUSTOMER
              </Button>
              <Button className="bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 border-2 border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold h-12">
                <Package className="w-4 h-4 mr-2 stroke-2" />
                ADD STOCK
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
