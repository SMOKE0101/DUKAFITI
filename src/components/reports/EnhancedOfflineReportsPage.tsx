
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Info,
  Calendar,
  WifiOff,
  TrendingUp
} from 'lucide-react';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { useUnifiedSales } from '../../hooks/useUnifiedSales';
import { useOfflineReports } from '../../hooks/useOfflineReports';
import { formatCurrency } from '../../utils/currency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '@/lib/utils';

type TimeFrame = 'today' | 'week' | 'month';

const EnhancedOfflineReportsPage = () => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('today');
  const isMobile = useIsMobile();
  
  const { customers, loading: customersLoading } = useUnifiedCustomers();
  const { products, loading: productsLoading } = useUnifiedProducts();
  const { sales, loading: salesLoading } = useUnifiedSales();
  const { isOnline, cachedSnapshot, lastSyncedAt, cacheSnapshot, readOnly } = useOfflineReports();

  const getTimeFrameData = (frame: TimeFrame) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (frame) {
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
    }
  };

  // Use cached data when offline, live data when online
  const activeData = useMemo(() => {
    if (readOnly && cachedSnapshot) {
      return {
        sales: cachedSnapshot.sales,
        products: cachedSnapshot.products,
        customers: cachedSnapshot.customers,
        loading: false
      };
    }
    return {
      sales,
      products,
      customers,
      loading: salesLoading || productsLoading || customersLoading
    };
  }, [readOnly, cachedSnapshot, sales, products, customers, salesLoading, productsLoading, customersLoading]);

  const { from: fromDate, to: toDate } = getTimeFrameData(timeFrame);

  const filteredSales = useMemo(() => {
    return activeData.sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= fromDate && saleDate <= toDate;
    });
  }, [activeData.sales, fromDate, toDate]);

  const metrics = useMemo(() => {
    if (readOnly && cachedSnapshot) {
      return cachedSnapshot.metrics;
    }

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = filteredSales.length;
    const activeCustomers = new Set(filteredSales.map(sale => sale.customerId).filter(Boolean)).size;
    const lowStockProducts = activeData.products.filter(product => 
      (product.currentStock || 0) <= (product.lowStockThreshold || 10)
    ).length;

    const calculatedMetrics = { totalRevenue, totalOrders, activeCustomers, lowStockProducts };
    
    // Cache metrics when online
    if (isOnline && !activeData.loading) {
      cacheSnapshot(activeData.sales, activeData.products, activeData.customers, calculatedMetrics, chartData);
    }

    return calculatedMetrics;
  }, [filteredSales, activeData.products, activeData.customers, readOnly, cachedSnapshot, isOnline, activeData.loading]);

  const chartData = useMemo(() => {
    if (readOnly && cachedSnapshot) {
      return cachedSnapshot.chartData;
    }

    const groupedData: { [key: string]: { sales: number; orders: number } } = {};
    
    // Create time buckets based on timeframe
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
    })).slice(-7); // Show last 7 days for chart
  }, [filteredSales, fromDate, toDate, readOnly, cachedSnapshot]);

  if (activeData.loading && !cachedSnapshot) {
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Offline Banner */}
      {readOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 text-amber-700 dark:text-amber-300 p-4 rounded-lg flex items-start gap-3">
          <div className="flex items-center gap-2 mt-0.5">
            <WifiOff className="w-5 h-5" />
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Offline mode: showing last synced snapshot</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            📊 Business Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your business performance and metrics
            {readOnly && (
              <Badge variant="outline" className="ml-2">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </p>
        </div>
        
        {/* Time Frame Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            {(['today', 'week', 'month'] as TimeFrame[]).map((frame) => (
              <button
                key={frame}
                onClick={() => !readOnly && setTimeFrame(frame)}
                disabled={readOnly}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                  timeFrame === frame
                    ? "bg-white dark:bg-gray-700 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  readOnly && "opacity-50 cursor-not-allowed"
                )}
              >
                {frame === 'today' ? 'Today' : frame === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          {readOnly && (
            <p className="text-xs italic text-muted-foreground text-center">
              Controls disabled while offline
            </p>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            title: 'Total Revenue',
            value: formatCurrency(metrics.totalRevenue),
            icon: DollarSign,
            gradient: 'from-emerald-500 to-green-600',
            bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50'
          },
          {
            title: 'Total Orders',
            value: metrics.totalOrders.toString(),
            icon: ShoppingCart,
            gradient: 'from-blue-500 to-cyan-600',
            bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50'
          },
          {
            title: 'Active Customers',
            value: metrics.activeCustomers.toString(),
            icon: Users,
            gradient: 'from-purple-500 to-pink-600',
            bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50'
          },
          {
            title: 'Low Stock Items',
            value: metrics.lowStockProducts.toString(),
            icon: Package,
            gradient: 'from-orange-500 to-red-600',
            bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50'
          }
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className={cn(
              "relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800 rounded-3xl",
              `bg-gradient-to-br ${card.bgGradient}`,
              readOnly && "opacity-90"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {card.title}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">
                      {card.value}
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl shadow-lg",
                    `bg-gradient-to-br ${card.gradient}`
                  )}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales Trend Chart */}
      <Card className={cn(
        "border-0 shadow-lg bg-white dark:bg-gray-800 rounded-3xl",
        readOnly && "opacity-90"
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Sales Trend (Last 7 Days)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily sales and revenue performance
                {readOnly && <span className="text-amber-600 dark:text-amber-400 ml-2">(Cached)</span>}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    fontWeight: 600
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales Table */}
      <Card className={cn(
        "border-0 shadow-lg bg-white dark:bg-gray-800 rounded-3xl",
        readOnly && "opacity-90"
      )}>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            Recent Sales
            {readOnly && (
              <Badge variant="outline" className="text-xs">
                Cached Data
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice(0, 5).map((sale, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="p-2 text-sm font-medium">{sale.productName || 'Unknown Product'}</td>
                    <td className="p-2 text-sm text-muted-foreground">{sale.customerName || 'Walk-in Customer'}</td>
                    <td className="p-2 text-sm font-medium text-green-600">{formatCurrency(sale.total || 0)}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sales data available for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedOfflineReportsPage;
