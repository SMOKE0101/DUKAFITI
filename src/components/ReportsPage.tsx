
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
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
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Calendar,
  Filter,
  FileText,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

// Mock data for reports
const salesData = [
  { name: 'Jan', sales: 4000, profit: 2400, orders: 240 },
  { name: 'Feb', sales: 3000, profit: 1398, orders: 139 },
  { name: 'Mar', sales: 2000, profit: 9800, orders: 980 },
  { name: 'Apr', sales: 2780, profit: 3908, orders: 390 },
  { name: 'May', sales: 1890, profit: 4800, orders: 480 },
  { name: 'Jun', sales: 2390, profit: 3800, orders: 380 },
];

const topProducts = [
  { name: 'iPhone 13', sales: 89, revenue: 45000, profit: 15000 },
  { name: 'Samsung TV', sales: 67, revenue: 35000, profit: 12000 },
  { name: 'Laptop', sales: 45, revenue: 25000, profit: 8000 },
  { name: 'Headphones', sales: 34, revenue: 15000, profit: 5000 },
  { name: 'Tablet', sales: 23, revenue: 12000, profit: 4000 },
];

const categoryData = [
  { name: 'Electronics', value: 400, color: '#3b82f6' },
  { name: 'Clothing', value: 300, color: '#10b981' },
  { name: 'Food', value: 300, color: '#f59e0b' },
  { name: 'Books', value: 200, color: '#ef4444' },
];

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState<any>(null);
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('monthly');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Title - Consistent with other pages */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
              REPORTS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
              Analyze your business performance with detailed insights
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Download className="w-4 h-4 mr-2 stroke-2" />
              EXPORT PDF
            </Button>
            
            <Button 
              className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <FileText className="w-4 h-4 mr-2 stroke-2" />
              GENERATE REPORT
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Filters */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 stroke-2" />
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Report</SelectItem>
                    <SelectItem value="inventory">Inventory Report</SelectItem>
                    <SelectItem value="customers">Customer Report</SelectItem>
                    <SelectItem value="profit">Profit Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500 stroke-2" />
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <DatePickerWithRange 
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                    TOTAL REVENUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(125000)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    +12% from last period
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
                    {formatCurrency(45000)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    +8% from last period
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
                    TOTAL ORDERS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    856
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    +15% from last period
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
                    AVG ORDER VALUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(146)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                    -3% from last period
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Trend */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                  SALES TREND
                </CardTitle>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700 font-mono font-bold uppercase">
                  6 MONTHS
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), '']}
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

          {/* Category Distribution */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
                  SALES BY CATEGORY
                </CardTitle>
                <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700 font-mono font-bold uppercase">
                  THIS MONTH
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Sales']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products Table */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-mono font-bold uppercase tracking-tight text-gray-900 dark:text-white">
              TOP PERFORMING PRODUCTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 font-mono font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Product</th>
                    <th className="text-right py-3 font-mono font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Sales</th>
                    <th className="text-right py-3 font-mono font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Revenue</th>
                    <th className="text-right py-3 font-mono font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td className="py-3 text-right font-bold text-purple-600 dark:text-purple-400">{product.sales}</td>
                      <td className="py-3 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.revenue)}</td>
                      <td className="py-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(product.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
