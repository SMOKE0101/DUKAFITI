import { useState, useEffect } from 'react';
import { Customer, Transaction, Sale, Product } from '../types';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  Package, 
  Clock,
  ShoppingCart,
  UserPlus,
  Upload,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import DashboardTopbar from './DashboardTopbar';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSalesToday: 0,
    activeCustomers: 0,
    inventoryValue: 0,
    pendingPayments: 0,
    lowStockItems: 0,
    overdueCustomers: 0,
  });

  // Use Supabase hooks
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const { transactions } = useSupabaseTransactions();

  // Mock data for charts
  const salesTrendData = [
    { day: 'Mon', sales: 4200 },
    { day: 'Tue', sales: 3800 },
    { day: 'Wed', sales: 5100 },
    { day: 'Thu', sales: 4600 },
    { day: 'Fri', sales: 6200 },
    { day: 'Sat', sales: 7800 },
    { day: 'Sun', sales: 5900 },
  ];

  const hourlyOrdersData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    orders: Math.floor(Math.random() * 20) + 5,
  }));

  useEffect(() => {
    calculateStats();
  }, [customers, products, sales, transactions]);

  const calculateStats = () => {
    // Today's sales
    const today = new Date().toDateString();
    const todaySales = sales
      .filter(s => new Date(s.timestamp).toDateString() === today)
      .reduce((sum, s) => sum + s.total, 0);

    // Inventory value
    const inventoryValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0);

    // Pending payments
    const pendingPayments = transactions
      .filter(t => !t.paid)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Low stock items
    const lowStockItems = products.filter(p => p.currentStock <= p.lowStockThreshold).length;

    // Overdue customers (>7 days)
    const overdueCustomers = new Set(
      transactions
        .filter(t => !t.paid && new Date(t.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .map(t => t.customerId)
    ).size;

    setStats({
      totalSalesToday: todaySales,
      activeCustomers: customers.length,
      inventoryValue,
      pendingPayments,
      lowStockItems,
      overdueCustomers,
    });
  };

  // Top selling products (mock for now)
  const topProducts = products.slice(0, 5).map(p => ({
    ...p,
    soldQty: Math.floor(Math.random() * 50) + 10,
    revenue: (Math.floor(Math.random() * 50) + 10) * p.sellingPrice,
  }));

  // Low stock alerts
  const lowStockAlerts = products.filter(p => p.currentStock <= p.lowStockThreshold).slice(0, 5);

  // Credit reminders
  const creditReminders = customers
    .filter(c => c.outstandingDebt > 0)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Topbar */}
      <DashboardTopbar />

      <div className="p-6 space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Sales Today</p>
                  <p className="text-3xl font-semibold">{formatCurrency(stats.totalSalesToday)}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Customers</p>
                  <p className="text-3xl font-semibold">{stats.activeCustomers}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-3xl font-semibold">{formatCurrency(stats.inventoryValue)}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-800/30 transition-colors">
                  <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-3xl font-semibold">{formatCurrency(stats.pendingPayments)}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl group-hover:bg-orange-200 dark:group-hover:bg-orange-800/30 transition-colors">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sales Trend</CardTitle>
              <select className="text-sm border rounded px-2 py-1">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
              </select>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sales: {
                    label: "Sales",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrendData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="var(--color-sales)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-sales)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Orders by Hour</CardTitle>
              <select className="text-sm border rounded px-2 py-1">
                <option>Today</option>
                <option>Yesterday</option>
              </select>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  orders: {
                    label: "Orders",
                    color: "hsl(var(--secondary))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyOrdersData}>
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Items & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.soldQty} sold</p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts Panel */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Alerts & Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Low Stock Alerts */}
              {lowStockAlerts.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-orange-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Low Stock Items ({stats.lowStockItems})
                  </h4>
                  <div className="space-y-2">
                    {lowStockAlerts.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-2 rounded border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.currentStock} left</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Restock
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credit Reminders */}
              {creditReminders.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-red-600 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Overdue Customers ({stats.overdueCustomers})
                  </h4>
                  <div className="space-y-2">
                    {creditReminders.map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-2 rounded border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                        <div>
                          <p className="font-medium text-sm">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(customer.outstandingDebt)} overdue</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Remind
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Footer */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Add Sale
              </Button>
              <Button className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Customer
              </Button>
              <Button className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Import CSV
              </Button>
              <Button className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Sync Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
