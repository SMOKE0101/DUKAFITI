
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  Calendar,
  Download,
  BarChart3,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { useUnifiedSales } from '../../hooks/useUnifiedSales';
import { useUnifiedSyncManager } from '../../hooks/useUnifiedSyncManager';
import { formatCurrency } from '../../utils/currency';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'custom';

const BlockyReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [selectedChart, setSelectedChart] = useState<'sales' | 'orders'>('sales');
  
  const isMobile = useIsMobile();
  const { customers, loading: customersLoading } = useUnifiedCustomers();
  const { products, loading: productsLoading } = useUnifiedProducts();
  const { sales, loading: salesLoading } = useUnifiedSales();
  const { pendingOperations } = useUnifiedSyncManager();

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

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= fromDate && saleDate <= toDate;
    });
  }, [sales, fromDate, toDate]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = filteredSales.length;
    const activeCustomers = new Set(filteredSales.map(sale => sale.customerId).filter(Boolean)).size;
    const lowStockProducts = products.filter(product => 
      (product.currentStock || 0) <= (product.lowStockThreshold || 10)
    ).length;

    return { totalRevenue, totalOrders, activeCustomers, lowStockProducts };
  }, [filteredSales, products]);

  const chartData = useMemo(() => {
    const groupedData: { [key: string]: { sales: number; orders: number } } = {};
    
    // Create time buckets
    const buckets = [];
    const current = new Date(fromDate);
    while (current <= toDate) {
      const key = current.toISOString().substring(0, 10);
      buckets.push(key);
      groupedData[key] = { sales: 0, orders: 0 };
      current.setDate(current.getDate() + 1);
    }
    
    // Fill data
    filteredSales.forEach(sale => {
      const key = new Date(sale.timestamp).toISOString().substring(0, 10);
      if (groupedData[key]) {
        groupedData[key].sales += sale.total || 0;
        groupedData[key].orders += 1;
      }
    });
    
    return buckets.map(key => ({
      date: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: groupedData[key].sales,
      orders: groupedData[key].orders
    }));
  }, [filteredSales, fromDate, toDate]);

  const lowStockAlerts = products
    .filter(p => (p.currentStock || 0) <= (p.lowStockThreshold || 10))
    .slice(0, 3);

  if (salesLoading || productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground font-medium">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            📊 Business Reports
          </h1>
          <p className="text-muted-foreground">
            Track your business performance and key metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            {(['today', 'week', 'month'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200",
                  dateRange === range
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <Button className="gap-2 font-bold rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Revenue',
            value: formatCurrency(metrics.totalRevenue),
            icon: DollarSign,
            gradient: 'from-emerald-500 to-green-600',
            bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50',
            iconColor: 'text-emerald-600 dark:text-emerald-400'
          },
          {
            title: 'Total Orders',
            value: metrics.totalOrders.toString(),
            icon: ShoppingCart,
            gradient: 'from-blue-500 to-cyan-600',
            bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50',
            iconColor: 'text-blue-600 dark:text-blue-400'
          },
          {
            title: 'Active Customers',
            value: metrics.activeCustomers.toString(),
            icon: Users,
            gradient: 'from-purple-500 to-pink-600',
            bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50',
            iconColor: 'text-purple-600 dark:text-purple-400'
          },
          {
            title: 'Low Stock Items',
            value: metrics.lowStockProducts.toString(),
            icon: Package,
            gradient: 'from-orange-500 to-red-600',
            bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50',
            iconColor: 'text-orange-600 dark:text-orange-400'
          }
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className={cn(
              "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
              `bg-gradient-to-br ${card.bgGradient}`
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      {card.title}
                    </p>
                    <p className="text-3xl font-black text-foreground">
                      {card.value}
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl shadow-lg",
                    `bg-gradient-to-br ${card.gradient}`
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                {/* Decorative element */}
                <div className={cn(
                  "absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-10",
                  `bg-gradient-to-br ${card.gradient}`
                )} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-foreground">
                    Performance Trends
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your business growth over time
                  </p>
                </div>
              </div>
              
              <div className="flex bg-card border border-border rounded-xl p-1">
                {[
                  { key: 'sales', label: 'Sales', icon: DollarSign },
                  { key: 'orders', label: 'Orders', icon: ShoppingCart }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedChart(key as 'sales' | 'orders')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all",
                      selectedChart === key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight={600}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight={600}
                    tickFormatter={(value) => 
                      selectedChart === 'sales' ? formatCurrency(value) : value.toString()
                    }
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontWeight: 600
                    }}
                    formatter={(value: number) => [
                      selectedChart === 'sales' ? formatCurrency(value) : value,
                      selectedChart === 'sales' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedChart}
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="url(#chartGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-black text-foreground">
                Low Stock Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockAlerts.length > 0 ? (
              <>
                {lowStockAlerts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Only {product.currentStock || 0} left
                      </p>
                    </div>
                    <Badge 
                      variant={(product.currentStock || 0) <= 0 ? "destructive" : "secondary"}
                      className="font-bold"
                    >
                      {(product.currentStock || 0) <= 0 ? 'Out' : 'Low'}
                    </Badge>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl inline-block mb-3">
                  <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  All products well stocked! 🎉
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-black text-foreground">
                Quick Stats
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {products.length}
                </p>
                <p className="text-xs font-bold text-muted-foreground">Products</p>
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {customers.length}
                </p>
                <p className="text-xs font-bold text-muted-foreground">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-black text-foreground">
                Quick Actions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'New Sale', path: '/app/sales', icon: ShoppingCart, color: 'from-green-500 to-emerald-600' },
              { label: 'Add Product', path: '/app/inventory', icon: Package, color: 'from-blue-500 to-cyan-600' },
              { label: 'View Customers', path: '/app/customers', icon: Users, color: 'from-purple-500 to-pink-600' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  className={cn(
                    "w-full justify-start gap-3 font-bold rounded-xl text-white border-0 shadow-md hover:shadow-lg transition-all",
                    `bg-gradient-to-r ${action.color} hover:opacity-90`
                  )}
                  onClick={() => window.location.href = action.path}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlockyReportsPage;
