
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { Sale } from '../../types';

interface ReportsChartsProps {
  sales: Sale[];
  dateRange: { from: string; to: string };
}

const ReportsCharts: React.FC<ReportsChartsProps> = ({ sales, dateRange }) => {
  const [salesTrendView, setSalesTrendView] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [ordersView, setOrdersView] = useState<'daily' | 'weekly'>('daily');

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    });
  }, [sales, dateRange]);

  const salesTrendData = useMemo(() => {
    if (salesTrendView === 'hourly') {
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        period: hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
        sales: 0
      }));

      filteredSales.forEach(sale => {
        const hour = new Date(sale.timestamp).getHours();
        hourlyData[hour].sales += sale.total;
      });

      return hourlyData;
    }

    if (salesTrendView === 'daily') {
      const dailyMap = new Map();
      
      filteredSales.forEach(sale => {
        const date = new Date(sale.timestamp).toISOString().split('T')[0];
        const displayDate = new Date(sale.timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { period: displayDate, sales: 0 });
        }
        dailyMap.get(date).sales += sale.total;
      });

      return Array.from(dailyMap.values()).sort((a, b) => 
        new Date(a.period).getTime() - new Date(b.period).getTime()
      );
    }

    // Monthly view
    const monthlyMap = new Map();
    
    filteredSales.forEach(sale => {
      const month = new Date(sale.timestamp).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { period: month, sales: 0 });
      }
      monthlyMap.get(month).sales += sale.total;
    });

    return Array.from(monthlyMap.values());
  }, [filteredSales, salesTrendView]);

  const ordersPerHourData = useMemo(() => {
    if (ordersView === 'daily') {
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: 0,
        displayHour: hour === 0 ? '12AM' : hour === 12 ? '12PM' : hour > 12 ? `${hour - 12}PM` : `${hour}AM`
      }));

      const today = new Date().toISOString().split('T')[0];
      const todaySales = filteredSales.filter(sale => 
        sale.timestamp.startsWith(today)
      );

      todaySales.forEach(sale => {
        const hour = new Date(sale.timestamp).getHours();
        hourlyData[hour].orders += 1;
      });

      return hourlyData;
    }

    // Weekly view - aggregate by day of week
    const weeklyData = Array.from({ length: 7 }, (_, day) => ({
      hour: day,
      orders: 0,
      displayHour: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
    }));

    filteredSales.forEach(sale => {
      const dayOfWeek = new Date(sale.timestamp).getDay();
      weeklyData[dayOfWeek].orders += 1;
    });

    return weeklyData;
  }, [filteredSales, ordersView]);

  const totalSales = salesTrendData.reduce((sum, item) => sum + item.sales, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Trend Chart */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Sales Trend
          </CardTitle>
          <Select value={salesTrendView} onValueChange={(value: any) => setSalesTrendView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sales: {
                label: "Sales",
                color: "#10b981",
              },
            }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData}>
                <XAxis 
                  dataKey="period" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalSales)}
            </p>
            <p className="text-sm text-muted-foreground">Total Sales</p>
          </div>
        </CardContent>
      </Card>

      {/* Orders Per Hour Chart */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Orders Per {ordersView === 'daily' ? 'Hour' : 'Day'}
          </CardTitle>
          <Select value={ordersView} onValueChange={(value: any) => setOrdersView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              orders: {
                label: "Orders",
                color: "#3b82f6",
              },
            }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersPerHourData}>
                <XAxis 
                  dataKey="displayHour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                          <p className="text-lg font-bold text-blue-600">
                            {payload[0].value} orders
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsCharts;
