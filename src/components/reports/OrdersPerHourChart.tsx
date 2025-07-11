
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OrdersPerHourChartProps {
  data: Array<{ hour: string; orders: number }>;
  view: 'daily' | '2weeks';
  onViewChange: (view: 'daily' | '2weeks') => void;
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
          <h3 className="text-xl font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white">
            ORDERS PER {view === 'daily' ? 'HOUR' : 'DAY'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">
            {view === 'daily' ? 'Today' : 'Past 2 Weeks'}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['daily', '2weeks'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onViewChange(option)}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                view === option
                  ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm font-mono font-bold uppercase'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {option === 'daily' ? 'TODAY' : '2 WEEKS'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}></div>
          <span className="font-mono font-bold uppercase tracking-tight">Orders Count</span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="peakBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={1} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="hour" 
              stroke="#6b7280"
              fontSize={12}
              fontFamily="'Space Mono', monospace"
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              fontFamily="'Space Mono', monospace"
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#064e3b',
                border: '2px solid #10b981',
                borderRadius: '8px',
                color: '#fff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: "'Space Mono', monospace"
              }}
              formatter={(value: number) => [value, 'ORDERS']}
              labelFormatter={(label) => `${view === 'daily' ? 'HOUR' : 'DATE'}: ${label}`}
            />
            <Bar 
              dataKey="orders" 
              radius={[2, 2, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.orders === maxOrders && maxOrders > 0 ? "url(#peakBarGradient)" : "url(#barGradient)"} 
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
