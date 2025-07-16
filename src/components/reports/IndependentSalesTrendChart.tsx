
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { Sale } from '../../types';

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
    const now = new Date();
    let groupedData: { [key: string]: number } = {};
    
    if (timeframe === 'hourly') {
      // Last 24 hours
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Initialize all 24 hours
      for (let i = 0; i < 24; i++) {
        const hour = String(i).padStart(2, '0') + ':00';
        groupedData[hour] = 0;
      }
      
      // Group sales by hour
      sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= startDate && saleDate <= now) {
          const hour = String(saleDate.getHours()).padStart(2, '0') + ':00';
          groupedData[hour] = (groupedData[hour] || 0) + sale.total;
        }
      });
      
      return Object.entries(groupedData).map(([time, revenue]) => ({
        time,
        revenue,
        displayTime: time,
        fullTime: time
      }));
      
    } else if (timeframe === 'daily') {
      // Last 14 days
      const startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      // Initialize all 14 days
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        groupedData[dateKey] = 0;
      }
      
      // Group sales by day
      sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= startDate && saleDate <= now) {
          const dateKey = saleDate.toISOString().split('T')[0];
          groupedData[dateKey] = (groupedData[dateKey] || 0) + sale.total;
        }
      });
      
      return Object.entries(groupedData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({
          time: date,
          revenue,
          displayTime: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullTime: date
        }));
        
    } else {
      // Last 12 months
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      
      // Initialize all 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        groupedData[monthKey] = 0;
      }
      
      // Group sales by month
      sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= startDate && saleDate <= now) {
          const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
          groupedData[monthKey] = (groupedData[monthKey] || 0) + sale.total;
        }
      });
      
      return Object.entries(groupedData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({
          time: month,
          revenue,
          displayTime: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          fullTime: month
        }));
    }
  }, [sales, timeframe]);

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'hourly': return 'Last 24 Hours';
      case 'daily': return 'Last 14 Days';
      case 'monthly': return 'Last 12 Months';
      default: return '';
    }
  };

  return (
    <Card className="border-2 rounded-2xl bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📈 SALES TREND
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getTimeframeLabel()}
          </p>
        </div>
        <Select value={timeframe} onValueChange={(value: any) => onTimeframeChange(value)}>
          <SelectTrigger className="w-32 font-mono font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hourly">HOURLY</SelectItem>
            <SelectItem value="daily">DAILY</SelectItem>
            <SelectItem value="monthly">MONTHLY</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="displayTime" 
                stroke="#6b7280" 
                fontSize={12} 
                fontFamily="'Space Mono', monospace"
                fontWeight="bold"
                tickLine={false} 
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12} 
                fontFamily="'Space Mono', monospace"
                fontWeight="bold"
                tickLine={false} 
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '12px', 
                  color: '#fff',
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 'bold'
                }}
                formatter={(value: number) => [formatCurrency(value), 'REVENUE']}
                labelFormatter={(label) => {
                  if (timeframe === 'hourly') {
                    return `${label} — TODAY`;
                  } else if (timeframe === 'daily') {
                    return `${label} — 2024`;
                  } else {
                    return label;
                  }
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#salesGradient)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ 
                  r: 6, 
                  stroke: '#8b5cf6', 
                  strokeWidth: 3, 
                  fill: '#fff'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white">
            TOTAL: {formatCurrency(totalRevenue)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndependentSalesTrendChart;
