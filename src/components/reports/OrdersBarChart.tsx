import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale } from '@/types';
import { ShoppingCart } from 'lucide-react';
import { useDragPanWindow } from '@/hooks/useDragPanWindow';

interface OrdersBarChartProps {
  sales: Sale[];
}

type OrdersTimeframe = 'hourly' | 'daily' | 'monthly';

interface ChartDataPoint {
  label: string;
  orders: number;
  timestamp: string;
  displayLabel: string;
}

const OrdersBarChart: React.FC<OrdersBarChartProps> = ({ sales }) => {
  const [timeframe, setTimeframe] = useState<OrdersTimeframe>('daily');

  const chartData = useMemo((): ChartDataPoint[] => {
    const now = new Date();
    const ordersMap = new Map<string, number>();

    // Determine earliest sale date for full history in daily/monthly views
    const earliestSaleDate = sales.length
      ? new Date(Math.min(...sales.map((s) => new Date(s.timestamp).getTime())))
      : null;

    if (timeframe === 'hourly') {
      // Last 48 hours - initialize all hours
      for (let i = 47; i >= 0; i--) {
        const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
        const key = `${hourDate.getFullYear()}-${String(hourDate.getMonth() + 1).padStart(2, '0')}-${String(hourDate.getDate()).padStart(2, '0')}-${String(hourDate.getHours()).padStart(2, '0')}`;
        ordersMap.set(key, 0);
      }

      // Count orders by hour (last 48h only)
      sales.forEach((sale) => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= new Date(now.getTime() - 48 * 60 * 60 * 1000)) {
          const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}-${String(saleDate.getHours()).padStart(2, '0')}`;
          ordersMap.set(key, (ordersMap.get(key) || 0) + 1);
        }
      });

      return Array.from(ordersMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, orders]) => {
          const [year, month, day, hour] = key.split('-');
          return {
            label: key,
            orders,
            timestamp: key,
            displayLabel: `${String(parseInt(hour)).padStart(2, '0')}:00`
          };
        });

    } else if (timeframe === 'daily') {
      // Cap to last 365 days for offline
      const capStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const candidate = earliestSaleDate
        ? new Date(earliestSaleDate.getFullYear(), earliestSaleDate.getMonth(), earliestSaleDate.getDate())
        : capStart;
      const startDate = new Date(Math.max(candidate.getTime(), capStart.getTime()));

      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        ordersMap.set(key, 0);
      }

      // Count orders by day across full range
      sales.forEach((sale) => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= startDate && saleDate <= now) {
          const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
          ordersMap.set(key, (ordersMap.get(key) || 0) + 1);
        }
      });

      return Array.from(ordersMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, orders]) => {
          const [year, month, day] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return {
            label: key,
            orders,
            timestamp: key,
            displayLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
        });

    } else {
      // Cap to last 36 months for offline
      const capStartMonth = new Date(now.getFullYear(), now.getMonth() - 35, 1);
      const candidateMonth = earliestSaleDate
        ? new Date(earliestSaleDate.getFullYear(), earliestSaleDate.getMonth(), 1)
        : capStartMonth;
      const startMonth = new Date(Math.max(candidateMonth.getTime(), capStartMonth.getTime()));

      const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      for (
        let m = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);
        m <= endMonth;
        m.setMonth(m.getMonth() + 1)
      ) {
        const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
        ordersMap.set(key, 0);
      }

      // Count orders by month across full range
      sales.forEach((sale) => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= startMonth && saleDate <= now) {
          const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
          ordersMap.set(key, (ordersMap.get(key) || 0) + 1);
        }
      });

      return Array.from(ordersMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, orders]) => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          return {
            label: key,
            orders,
            timestamp: key,
            displayLabel: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          };
        });
    }
  }, [sales, timeframe]);

  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
  const windowSize = useMemo(() => (timeframe === 'hourly' ? 24 : timeframe === 'daily' ? 30 : 12), [timeframe]);
  const { start, end, containerRef, overlayHandlers } = useDragPanWindow({
    dataLength: chartData.length,
    windowSize,
  });
  const visibleData = useMemo(() => chartData.slice(start, end), [chartData, start, end]);
  const maxOrders = Math.max(...visibleData.map(item => item.orders), 0);
  const getTimeframeDisplay = () => {
    switch (timeframe) {
      case 'hourly': return 'Today';
      case 'daily': return 'Past 2 Weeks';
      case 'monthly': return 'Past 12 Months';
    }
  };

  const getChartTitle = () => {
    switch (timeframe) {
      case 'hourly': return 'ORDERS PER HOUR';
      case 'daily': return 'ORDERS PER DAY';
      case 'monthly': return 'ORDERS PER MONTH';
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {getChartTitle()}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getTimeframeDisplay()}
              </p>
            </div>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['hourly', 'daily', 'monthly'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTimeframe(option)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-w-[80px]
                  ${timeframe === option
                    ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                {option === 'hourly' ? 'TODAY' : option === 'daily' ? '2 WEEKS' : 'MONTHLY'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Orders Count Indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              ORDERS COUNT
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalOrders}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Peak: {maxOrders} orders
            </p>
          </div>
        </div>

        {/* Chart */}
        <div ref={containerRef} className="relative h-80 w-full select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visibleData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="displayLabel" 
                stroke="#64748b"
                fontSize={11}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                interval={timeframe === 'hourly' ? 2 : 0}
                angle={timeframe === 'hourly' ? 0 : -45}
                textAnchor={timeframe === 'hourly' ? 'middle' : 'end'}
                height={timeframe === 'hourly' ? 30 : 60}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                width={25}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [value, 'Orders']}
                labelFormatter={(label) => {
                  if (timeframe === 'hourly') {
                    return `Hour: ${label}`;
                  } else if (timeframe === 'daily') {
                    return `Date: ${label}`;
                  } else {
                    return `Month: ${label}`;
                  }
                }}
              />
              <Bar
                dataKey="orders"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 cursor-grab active:cursor-grabbing" {...overlayHandlers} />
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersBarChart;