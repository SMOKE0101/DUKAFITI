
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';
import { useDragPanWindow } from '../../hooks/useDragPanWindow';

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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const maxOrders = Math.max(...data.map(d => d.orders));

  // Highly optimized margins for maximum chart utilization
  const getMargins = () => {
    if (isMobile) {
      return { top: 2, right: 2, left: 20, bottom: 30 };
    } else if (isTablet) {
      return { top: 5, right: 10, left: 25, bottom: 30 };
    }
    return { top: 5, right: 30, left: 40, bottom: 5 };
  };

  // Responsive font sizes
  const getAxisFontSize = () => {
    if (isMobile) return 10;
    if (isTablet) return 11;
    return 12;
  };
  const defaultWindow = useMemo(() => {
    if (view === 'daily') return Math.min(24, data.length);
    return Math.min(14, data.length);
  }, [view, data.length]);

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
            ORDERS PER {view === 'daily' ? 'HOUR' : 'DAY'}
          </h3>
          <p className={`text-gray-500 dark:text-gray-400 font-normal ${
            isMobile ? 'text-xs mt-0' : 'text-sm mt-1'
          }`}>
            {view === 'daily' ? 'Today' : 'Past 2 Weeks'}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['daily', '2weeks'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onViewChange(option)}
              className={`transition-all ${
                isMobile ? 'px-1.5 py-1 text-xs' : isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'
              } font-medium rounded ${
                view === option
                  ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm font-mono font-bold uppercase'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              style={{ minHeight: isMobile ? '32px' : 'auto' }}
            >
              {option === 'daily' ? 'TODAY' : '2 WEEKS'}
            </button>
          ))}
        </div>
      </div>

      <div className={`mb-${isMobile ? '0.5' : '2'}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}></div>
          <span className={`font-mono font-bold uppercase tracking-tight ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>Orders Count</span>
        </div>
      </div>

      <div ref={containerRef} className={`${isMobile ? 'h-80' : isTablet ? 'h-84' : 'h-80'} relative`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visibleData} margin={getMargins()}>
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
              fontSize={getAxisFontSize()}
              fontFamily="'Space Mono', monospace"
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              interval={isMobile ? 'preserveStartEnd' : 0}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 35 : 30}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={getAxisFontSize()}
              fontFamily="'Space Mono', monospace"
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              width={isMobile ? 25 : undefined}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#064e3b',
                border: '2px solid #10b981',
                borderRadius: '8px',
                color: '#fff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                fontSize: isMobile ? '10px' : '14px',
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
              {visibleData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.orders === maxOrders && maxOrders > 0 ? "url(#peakBarGradient)" : "url(#barGradient)"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 z-10" style={{ touchAction: 'pan-y' }} {...overlayHandlers} />
      </div>
    </div>
  );
};

export default OrdersPerHourChart;
