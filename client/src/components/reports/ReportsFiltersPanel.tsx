
import React from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type DateRange = 'today' | 'week' | 'month' | 'custom';
type Filter = {
  type: 'salesType' | 'category' | 'customer';
  label: string;
  value: string;
};

interface ReportsFiltersPanelProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  customDateRange?: { from: Date; to: Date };
  onCustomDateRangeChange: (range: { from: Date; to: Date }) => void;
  activeFilters: Filter[];
  onRemoveFilter: (filter: Filter) => void;
}

const ReportsFiltersPanel: React.FC<ReportsFiltersPanelProps> = ({
  dateRange,
  onDateRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  activeFilters,
  onRemoveFilter
}) => {
  const formatDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        return 'Today';
      case 'week':
        return 'Last 7 days';
      case 'month':
        return 'Last 30 days';
      case 'custom':
        if (customDateRange) {
          return `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`;
        }
        return 'Custom range';
      default:
        return 'Today';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Time Period:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month'] as DateRange[]).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDateRangeChange(range)}
                className="capitalize"
              >
                {range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
              </Button>
            ))}
            <Button
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDateRangeChange('custom')}
            >
              Custom
            </Button>
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {formatDateRange()}
          </span>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Filters:
            </span>
            {activeFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
              >
                {filter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-purple-200 dark:hover:bg-purple-800"
                  onClick={() => onRemoveFilter(filter)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Custom Date Range Picker */}
      {dateRange === 'custom' && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                value={customDateRange?.from.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const newFrom = new Date(e.target.value);
                  onCustomDateRangeChange({
                    from: newFrom,
                    to: customDateRange?.to || new Date()
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                value={customDateRange?.to.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const newTo = new Date(e.target.value);
                  onCustomDateRangeChange({
                    from: customDateRange?.from || new Date(),
                    to: newTo
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsFiltersPanel;
