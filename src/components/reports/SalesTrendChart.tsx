
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currency';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';
import { useDragPanWindow } from '../../hooks/useDragPanWindow';

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

  // Highly optimized margins for maximum chart utilization
  const getMargins = () => {
    if (isMobile) {
      return { top: 2, right: 2, left: 25, bottom: 20 };
    } else if (isTablet) {
      return { top: 5, right: 10, left: 45, bottom: 25 };
    }
    return { top: 20, right: 30, left: 70, bottom: 20 };
  };

  // Responsive font sizes
  const getAxisFontSize = () => {
    if (isMobile) return 10;
    if (isTablet) return 11;
    return 12;
  };

  // Mobile-optimized currency formatter
  const formatCurrencyMobile = (value: number) => {
    if (!isMobile) return formatCurrency(value);
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Dynamic tooltip label formatter based on resolution
  const getTooltipLabelFormatter = () => {
    switch (resolution) {
      case 'hourly':
        return (label: string) => `Hour: ${label}`;
      case 'daily':
        return (label: string) => `Date: ${label}`;
      case 'monthly':
        return (label: string) => `Month: ${label}`;
      default:
        return (label: string) => `Date: ${label}`;
    }
  };

  // Pan window for mobile-friendly horizontal history navigation
  const defaultWindow = useMemo(() => {
    if (resolution === 'hourly') return Math.min(24, data.length);
    if (resolution === 'daily') return Math.min(30, data.length);
    return data.length;
  }, [resolution, data.length]);

  const { start, end, containerRef, overlayHandlers } = useDragPanWindow({
    dataLength: data.length,
    windowSize: defaultWindow,
  });

  const visibleData = useMemo(() => data.slice(start, end), [data, start, end]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md ${
      isMobile ? 'p-0.5' : isTablet ? 'p-3' : 'p-6 lg:p-8'
    }`}>
      <div className={`flex items-center justify-between ${
        isMobile ? 'mb-1 flex-col gap-1' : 'mb-4 md:mb-6'
      }`}>
        <div className={isMobile ? 'text-center' : ''}>
          <h3 className={`font-mono font-black uppercase tracking-tight text-gray-900 dark:text-white ${
            isMobile ? 'text-sm' : 'text-xl'
          }`}>
            SALES TREND
          </h3>
          <p className={`text-gray-500 dark:text-gray-400 font-normal ${
            isMobile ? 'text-xs mt-0' : 'text-sm mt-1'
          }`}>
            Total: {formatCurrency(totalSales)}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['hourly', 'daily', 'monthly'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onResolutionChange(option)}
              className={`transition-all ${
                isMobile ? 'px-1.5 py-1 text-xs' : isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'
              } font-medium rounded ${
                resolution === option
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm font-mono font-bold uppercase'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              style={{ minHeight: isMobile ? '32px' : 'auto' }}
            >
              {option === 'hourly' ? 'HOURLY' : option === 'daily' ? 'DAILY' : 'MONTHLY'}
            </button>
          ))}
        </div>
      </div>

      <div className={`mb-${isMobile ? '0.5' : '2'}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
          <span className={`font-mono font-bold uppercase tracking-tight ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>Revenue</span>
        </div>
      </div>

      <div ref={containerRef} className={`relative w-full ${isMobile ? 'h-80' : isTablet ? 'h-84' : 'h-80'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
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
              height={isMobile ? 35 : 30}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={getAxisFontSize()}
              tickFormatter={formatCurrencyMobile}
              width={isMobile ? 30 : 60}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              labelFormatter={getTooltipLabelFormatter()}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: isMobile ? '11px' : '12px',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={isMobile ? 2.5 : 1}
              dot={false}
              activeDot={{ 
                r: isMobile ? 5 : 6, 
                fill: '#3b82f6',
                stroke: '#ffffff',
                strokeWidth: 2,
                style: { cursor: 'pointer' }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 z-10" style={{ touchAction: 'pan-y' }} {...overlayHandlers} />
      </div>
    </div>
  );
};

export default SalesTrendChart;
