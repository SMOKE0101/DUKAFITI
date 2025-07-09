
import React, { useState } from 'react';
import { Calendar, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

type DateRange = 'today' | 'week' | 'month' | 'custom';

interface Filter {
  type: 'salesType' | 'category' | 'customer';
  label: string;
  value: string;
}

interface ReportsFiltersPanelProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  customDateRange?: { from: Date; to: Date };
  onCustomDateRangeChange?: (range: { from: Date; to: Date }) => void;
  activeFilters: Filter[];
  onRemoveFilter: (filter: Filter) => void;
  onExport: (format: 'pdf' | 'csv') => void;
}

const ReportsFiltersPanel: React.FC<ReportsFiltersPanelProps> = ({
  dateRange,
  onDateRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  activeFilters,
  onRemoveFilter,
  onExport
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateRangeOptions = [
    { value: 'today' as DateRange, label: 'Today' },
    { value: 'week' as DateRange, label: 'This Week' },
    { value: 'month' as DateRange, label: 'This Month' },
    { value: 'custom' as DateRange, label: 'Custom' },
  ];

  return (
    <div className="sticky top-16 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {dateRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onDateRangeChange(option.value);
                    if (option.value === 'custom') {
                      setShowDatePicker(true);
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    dateRange === option.value
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Custom Date Picker */}
            {dateRange === 'custom' && (
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-sm">
                    {customDateRange 
                      ? `${format(customDateRange.from, 'MMM dd')} - ${format(customDateRange.to, 'MMM dd')}`
                      : 'Select dates'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={customDateRange ? { from: customDateRange.from, to: customDateRange.to } : undefined}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        onCustomDateRangeChange?.({ from: range.from, to: range.to });
                        setShowDatePicker(false);
                      }
                    }}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Filter Chips and Export */}
          <div className="flex items-center gap-3">
            {/* Active Filters */}
            <div className="flex items-center gap-2">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 animate-fade-in"
                >
                  {filter.label}
                  <button
                    onClick={() => onRemoveFilter(filter)}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[120px] z-50 animate-fade-in">
                  {['PDF', 'CSV'].map((format) => (
                    <button
                      key={format}
                      onClick={() => {
                        onExport(format.toLowerCase() as 'pdf' | 'csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsFiltersPanel;
