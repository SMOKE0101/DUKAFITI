import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';
import { TimeFrameData } from './TimeFramePicker';
import { Sale } from '@/types';
import { formatDateForBucket, addHours, addDays, startOfHour, startOfDay, startOfWeek, isValidNumber, safeNumber } from '@/utils/dateUtils';

interface ChartDataPoint {
  label: string;
  sales: number;
  orders: number;
  timestamp: string;
}

interface AdvancedChartsProps {
  sales: Sale[];
  timeFrame: TimeFrameData;
  loading?: boolean;
}

type ChartType = 'sales' | 'orders';

const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
  sales,
  timeFrame,
  loading = false
}) => {
  const [selectedChart, setSelectedChart] = React.useState<ChartType>('sales');

  const getGranularity = (timeFrame: TimeFrameData): 'hour' | 'day' | 'week' => {
    if (timeFrame.type === 'today') return 'hour';
    if (timeFrame.type === 'week') return 'day';
    if (timeFrame.type === 'month') return 'day';
    
    // Custom range logic
    const daysDiff = Math.ceil((timeFrame.endDate.getTime() - timeFrame.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 2) return 'hour';
    if (daysDiff <= 60) return 'day';
    return 'week';
  };

  const chartData = useMemo((): ChartDataPoint[] => {
    const granularity = getGranularity(timeFrame);
    const buckets = new Map<string, { sales: number; orders: number }>();

    // Filter sales by time frame
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= timeFrame.startDate && saleDate <= timeFrame.endDate;
    });

    // Generate time buckets
    const generateBuckets = () => {
      const bucketKeys: string[] = [];
      let current = new Date(timeFrame.startDate);
      
      while (current <= timeFrame.endDate) {
        const key = formatDateForBucket(current, granularity);
        bucketKeys.push(key);
        buckets.set(key, { sales: 0, orders: 0 });
        
        if (granularity === 'hour') {
          current = addHours(current, 1);
        } else if (granularity === 'day') {
          current = addDays(current, 1);
        } else {
          current = addDays(current, 7);
        }
      }
      return bucketKeys;
    };

    const bucketKeys = generateBuckets();

    // Aggregate sales data into buckets
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      let bucketDate: Date;
      
      if (granularity === 'hour') {
        bucketDate = startOfHour(saleDate);
      } else if (granularity === 'week') {
        bucketDate = startOfWeek(saleDate);
      } else {
        bucketDate = startOfDay(saleDate);
      }
      
      const key = formatDateForBucket(bucketDate, granularity);
      const bucket = buckets.get(key);
      
      if (bucket) {
        bucket.sales += safeNumber(sale.total);
        bucket.orders += 1;
      }
    });

    // Convert to chart data
    return bucketKeys.map(key => {
      const bucket = buckets.get(key) || { sales: 0, orders: 0 };
      const date = new Date(key.replace('-week', ''));
      
      let label: string;
      if (granularity === 'hour') {
        label = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (granularity === 'day') {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = `Week ${Math.ceil(date.getDate() / 7)}`;
      }
      
      return {
        label,
        sales: bucket.sales,
        orders: bucket.orders,
        timestamp: key
      };
    });
  }, [sales, timeFrame]);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-60 animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 mb-8">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-foreground">
                Performance Trends
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your business growth over time
              </p>
            </div>
          </div>
          
          <div className="flex bg-card border border-border rounded-xl p-1">
            {[
              { key: 'sales', label: 'Sales', icon: DollarSign },
              { key: 'orders', label: 'Orders', icon: ShoppingCart }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedChart(key as ChartType)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all",
                  selectedChart === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="label" 
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickFormatter={(value) => 
                  selectedChart === 'sales' ? formatCurrency(value) : value.toString()
                }
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  fontWeight: 600
                }}
                formatter={(value: number) => [
                  selectedChart === 'sales' ? formatCurrency(value) : value,
                  selectedChart === 'sales' ? 'Revenue' : 'Orders'
                ]}
              />
              <Area
                type="monotone"
                dataKey={selectedChart}
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedCharts;
