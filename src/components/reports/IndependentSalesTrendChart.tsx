
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface IndependentSalesTrendChartProps {
  sales: Sale[];
  timeframe: 'hourly' | 'daily' | 'monthly';
  onTimeframeChange: (timeframe: 'hourly' | 'daily' | 'monthly') => void;
}

const IndependentSalesTrendChart: React.FC<IndependentSalesTrendChartProps> = ({
  sales,
  timeframe,
  onTimeframeChange
}) => {
  const chartData = useMemo(() => {
    const groupedData: { [key: string]: number } = {};
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let key: string;
      
      switch (timeframe) {
        case 'hourly':
          key = saleDate.toISOString().substring(0, 13) + ':00';
          break;
        case 'daily':
          key = saleDate.toISOString().substring(0, 10);
          break;
        case 'monthly':
          key = saleDate.toISOString().substring(0, 7);
          break;
      }
      
      groupedData[key] = (groupedData[key] || 0) + sale.total_amount;
    });
    
    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: timeframe === 'hourly' 
          ? new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : timeframe === 'monthly'
            ? new Date(date + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue
      }));
  }, [sales, timeframe]);

  const totalRevenue = useMemo(() => {
    const cutoffDate = new Date();
    if (timeframe === 'hourly') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    } else if (timeframe === 'daily') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    } else {
      cutoffDate.setMonth(cutoffDate.getMonth() - 12);
    }
    
    return sales
      .filter(sale => new Date(sale.timestamp) >= cutoffDate)
      .reduce((sum, sale) => sum + sale.total_amount, 0);
  }, [sales, timeframe]);

  const averageRevenue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum, item) => sum + item.revenue, 0);
    return total / chartData.length;
  }, [chartData]);

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'hourly': return 'Last 24 Hours';
      case 'daily': return 'Last 30 Days';
      case 'monthly': return 'Last 12 Months';
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-xl font-semibold">
              Sales Trend
            </CardTitle>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['hourly', 'daily', 'monthly'] as const).map((option) => (
              <button
                key={option}
                onClick={() => onTimeframeChange(option)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  timeframe === option
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average per {timeframe.slice(0, -2)}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(averageRevenue)}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{getTimeframeLabel()}</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndependentSalesTrendChart;
