
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '../../utils/currency';

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
  const getDateRangeLabel = () => {
    switch (resolution) {
      case 'hourly':
        return 'Last 24 hours';
      case 'daily':
        return 'Last 30 days';
      case 'monthly':
        return 'Last 12 months';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white">
            SALES TREND
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">
            {getDateRangeLabel()}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['hourly', 'daily', 'monthly'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onResolutionChange(option)}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                resolution === option
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm font-mono font-bold uppercase'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }}></div>
          <span className="font-mono font-bold uppercase tracking-tight">Sales (KES)</span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
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
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '16px',
                color: '#fff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'Space Mono', monospace"
              }}
              formatter={(value: number) => [`${formatCurrency(value)}`, 'SALES']}
              labelFormatter={(label) => `DATE: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              fill="url(#salesGradient)"
              dot={false}
              activeDot={{ 
                r: 8, 
                stroke: '#8b5cf6', 
                strokeWidth: 3, 
                fill: '#fff',
                style: { filter: 'drop-shadow(0 4px 6px rgba(139, 92, 246, 0.3))' }
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-lg font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white">
          TOTAL: {formatCurrency(totalSales)}
        </p>
      </div>
    </div>
  );
};

export default SalesTrendChart;
