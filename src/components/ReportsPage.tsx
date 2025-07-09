
import { useState, useEffect } from 'react';
import { Customer, Transaction, Sale, Product } from '../types';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Menu, 
  Bell, 
  User, 
  Calendar,
  Download,
  FileText,
  Share,
  TrendingUp,
  DollarSign,
  Smartphone,
  CreditCard,
  Banknote,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Use Supabase hooks
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const { transactions } = useSupabaseTransactions();

  // Filter sales by date range
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
    return saleDate >= dateRange.from && saleDate <= dateRange.to;
  });

  // Calculate metrics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const cashRevenue = filteredSales
    .filter(sale => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.total, 0);
  const mpesaRevenue = filteredSales
    .filter(sale => sale.paymentMethod === 'mpesa')
    .reduce((sum, sale) => sum + sale.total, 0);
  const creditRevenue = filteredSales
    .filter(sale => sale.paymentMethod === 'debt')
    .reduce((sum, sale) => sum + sale.total, 0);

  // Mock data for charts
  const revenueOverTimeData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.floor(Math.random() * 10000) + 5000,
    };
  });

  const salesByCategoryData = [
    { name: 'Electronics', value: 35, color: '#8B5CF6' },
    { name: 'Clothing', value: 25, color: '#06B6D4' },
    { name: 'Food & Beverages', value: 20, color: '#10B981' },
    { name: 'Beauty', value: 12, color: '#F59E0B' },
    { name: 'Others', value: 8, color: '#EF4444' },
  ];

  const profitAnalysisData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en-US', { month: 'short' }),
    revenue: Math.floor(Math.random() * 50000) + 30000,
    profit: Math.floor(Math.random() * 15000) + 8000,
  }));

  // Transaction table data with search
  const transactionTableData = filteredSales
    .filter(sale => 
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const handleDateRangeApply = () => {
    // Trigger data refresh with new date range
    console.log('Applying date range:', dateRange);
  };

  const handleExportCSV = () => {
    const csvData = filteredSales.map(sale => ({
      Date: new Date(sale.timestamp).toLocaleDateString(),
      'Order #': sale.id.slice(0, 8),
      Customer: sale.customerName || 'Walk-in',
      Product: sale.productName,
      'Payment Method': sale.paymentMethod,
      Total: sale.total,
      Profit: sale.profit,
    }));
    
    // Convert to CSV and download
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="sticky top-0 z-50 h-16 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="flex items-center justify-between px-6 h-full">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="font-bold text-xl text-primary">DukaFiti</div>
          </div>

          {/* Center - Date Range Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-40"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-40"
              />
              <Button onClick={handleDateRangeApply} className="px-6">
                Apply
              </Button>
            </div>
            
            {/* Shortcut links */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setDateRange({ from: today, to: today });
                }}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                  setDateRange({
                    from: weekStart.toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                This Week
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  setDateRange({
                    from: monthStart.toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                This Month
              </Button>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-semibold">{formatCurrency(totalRevenue)}</p>
                  <div className="w-full h-8">
                    {/* Mini sparkline placeholder */}
                    <div className="w-full h-1 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Cash Revenue</p>
                  <p className="text-3xl font-semibold">{formatCurrency(cashRevenue)}</p>
                  <div className="w-full h-8">
                    <div className="w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">M-Pesa Revenue</p>
                  <p className="text-3xl font-semibold">{formatCurrency(mpesaRevenue)}</p>
                  <div className="w-full h-8">
                    <div className="w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded"></div>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                  <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Credit Revenue</p>
                  <p className="text-3xl font-semibold">{formatCurrency(creditRevenue)}</p>
                  <div className="w-full h-8">
                    <div className="w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded"></div>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                  <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Charts */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
          <CardContent className="p-6">
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="revenue" className="rounded-full">Revenue Over Time</TabsTrigger>
                <TabsTrigger value="category" className="rounded-full">Sales by Category</TabsTrigger>
                <TabsTrigger value="profit" className="rounded-full">Profit Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="revenue" className="mt-0">
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueOverTimeData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-revenue)" 
                        strokeWidth={3}
                        dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>
              
              <TabsContent value="category" className="mt-0">
                <ChartContainer
                  config={{
                    sales: {
                      label: "Sales",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {salesByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {salesByCategoryData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-sm">{entry.name} ({entry.value}%)</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="profit" className="mt-0">
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--primary))",
                    },
                    profit: {
                      label: "Profit",
                      color: "hsl(var(--secondary))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitAnalysisData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Export & Share Actions */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <h3 className="text-lg font-semibold">Export & Share</h3>
              <div className="flex gap-3">
                <Button 
                  onClick={handleExportCSV}
                  className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Share via WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Order #</th>
                    <th className="text-left py-3 px-4 font-medium">Customer</th>
                    <th className="text-left py-3 px-4 font-medium">Product</th>
                    <th className="text-left py-3 px-4 font-medium">Payment Method</th>
                    <th className="text-right py-3 px-4 font-medium">Total</th>
                    <th className="text-right py-3 px-4 font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionTableData.map((sale, index) => (
                    <tr 
                      key={sale.id} 
                      className={`border-b border-muted/50 hover:bg-muted/30 ${
                        index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm">
                        {new Date(sale.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {sale.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {sale.customerName || 'Walk-in'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {sale.productName}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          sale.paymentMethod === 'cash' ? 'default' :
                          sale.paymentMethod === 'mpesa' ? 'secondary' : 'destructive'
                        }>
                          {sale.paymentMethod.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                        {formatCurrency(sale.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
