
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OrdersPerHourChartProps {
  data: Array<{ hour: string; orders: number }>;
  view: 'daily' | 'weekly';
  onViewChange: (view: 'daily' | 'weekly') => void;
}

const OrdersPerHourChart: React.FC<OrdersPerHourChartProps> = ({
  data,
  view,
  onViewChange
}) => {
  const maxOrders = Math.max(...data.map(d => d.orders));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Orders Per Hour</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {view === 'daily' ? 'Today' : 'This Week'}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['daily', 'weekly'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onViewChange(option)}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                view === option
                  ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {option === 'daily' ? 'Today' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="peakBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="hour" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              formatter={(value: number) => [value, 'Orders']}
              labelFormatter={(label) => `Hour: ${label}`}
            />
            <Bar 
              dataKey="orders" 
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.orders === maxOrders ? "url(#peakBarGradient)" : "url(#barGradient)"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrdersPerHourChart;
