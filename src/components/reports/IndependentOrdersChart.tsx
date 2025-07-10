
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale } from '../../types';

interface IndependentOrdersChartProps {
  sales: Sale[];
  timeframe: 'daily' | 'weekly';
  onTimeframeChange: (timeframe: 'daily' | 'weekly') => void;
}

const IndependentOrdersChart: React.FC<IndependentOrdersChartProps> = ({
  sales,
  timeframe,
  onTimeframeChange
}) => {
  const chartData = useMemo(() => {
    const now = new Date();
    let groupedData: { [key: string]: number } = {};
    
    if (timeframe === 'daily') {
      // Last 14 days
      const startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      // Initialize all 14 days
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        groupedData[dateKey] = 0;
      }
      
      // Count orders by day
      sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= startDate && saleDate <= now) {
          const dateKey = saleDate.toISOString().split('T')[0];
          groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
        }
      });
      
      return Object.entries(groupedData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, orders]) => ({
          time: date,
          orders,
          displayTime: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
        
    } else {
      // Last 14 weeks
      const startDate = new Date(now.getTime() - 14 * 7 * 24 * 60 * 60 * 1000);
      
      // Initialize all 14 weeks
      for (let i = 13; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        // Get the Monday of the week
        const monday = new Date(weekStart);
        monday.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekKey = monday.toISOString().split('T')[0];
        groupedData[weekKey] = 0;
      }
      
      // Count orders by week
      sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate >= startDate && saleDate <= now) {
          // Get the Monday of the sale's week
          const monday = new Date(saleDate);
          monday.setDate(saleDate.getDate() - saleDate.getDay() + 1);
          const weekKey = monday.toISOString().split('T')[0];
          groupedData[weekKey] = (groupedData[weekKey] || 0) + 1;
        }
      });
      
      return Object.entries(groupedData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, orders], index) => ({
          time: week,
          orders,
          displayTime: `Wk ${index + 1}`
        }));
    }
  }, [sales, timeframe]);

  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'daily': return 'Last 14 Days';
      case 'weekly': return 'Last 14 Weeks';
      default: return '';
    }
  };

  return (
    <Card className="border-2 rounded-2xl bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📊 ORDERS PER {timeframe.toUpperCase()}
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getTimeframeLabel()}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['daily', 'weekly'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onTimeframeChange(option)}
              className={`px-4 py-2 text-sm font-mono font-bold rounded-lg transition-all duration-200 ${
                timeframe === option
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                formatter={(value: number) => [value, 'ORDERS']}
                labelFormatter={(label) => {
                  if (timeframe === 'daily') {
                    return `${label} — 2024`;
                  } else {
                    return `${label} — Week Range`;
                  }
                }}
              />
              <Bar 
                dataKey="orders" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white">
            TOTAL: {totalOrders} ORDERS
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndependentOrdersChart;
