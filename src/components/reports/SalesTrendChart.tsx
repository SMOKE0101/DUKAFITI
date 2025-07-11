
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currency';

interface SalesTrendChartProps {
  data: Array<{ date: string; revenue: number }>;
  resolution: 'hourly' | 'daily' | 'monthly';
  onResolutionChange: (resolution: 'hourly' | 'daily' | 'monthly') => void;
  totalSales: number;
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  resolution,
  onResolutionChange,
  totalSales
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white">
            SALES TREND
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">
            Total: {formatCurrency(totalSales)}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['hourly', 'daily', 'monthly'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onResolutionChange(option)}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                resolution === option
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm font-mono font-bold uppercase'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {option === 'hourly' ? 'HOURLY' : option === 'daily' ? 'DAILY' : 'MONTHLY'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
          <span className="font-mono font-bold uppercase tracking-tight">Revenue</span>
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 70,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => value}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
              width={60}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={1}
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: '#3b82f6',
                stroke: '#ffffff',
                strokeWidth: 2,
                style: { cursor: 'pointer' }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesTrendChart;
