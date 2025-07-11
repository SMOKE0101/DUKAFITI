
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currency';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Responsive margins
  const getMargins = () => {
    if (isMobile) {
      return { top: 10, right: 15, left: 85, bottom: 30 };
    } else if (isTablet) {
      return { top: 15, right: 20, left: 90, bottom: 25 };
    }
    return { top: 20, right: 30, left: 70, bottom: 20 };
  };

  // Responsive font sizes
  const getAxisFontSize = () => {
    if (isMobile) return 11;
    if (isTablet) return 12;
    return 12;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 md:p-6 lg:p-8">
      <div className={`flex items-center justify-between mb-4 md:mb-6 ${isMobile ? 'flex-col gap-4' : ''}`}>
        <div className={isMobile ? 'text-center' : ''}>
          <h3 className={`font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
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
              className={`transition-all ${
                isMobile ? 'px-4 py-3 text-xs' : isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'
              } font-medium rounded ${
                resolution === option
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm font-mono font-bold uppercase'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              style={{ minHeight: isMobile ? '44px' : 'auto' }}
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

      <div className={`w-full ${isMobile ? 'h-64' : isTablet ? 'h-72' : 'h-80'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={getMargins()}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={getAxisFontSize()}
              tickFormatter={(value) => value}
              interval={isMobile ? 'preserveStartEnd' : 0}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={getAxisFontSize()}
              tickFormatter={(value) => formatCurrency(value)}
              width={isMobile ? 80 : 60}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: isMobile ? '14px' : '12px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={isMobile ? 2 : 1}
              dot={false}
              activeDot={{ 
                r: isMobile ? 8 : 6, 
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
