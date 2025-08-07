import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type TimeFrameType = 'today' | 'week' | 'month' | 'custom';

export interface CustomDateRange {
  from: Date;
  to: Date;
}

export interface TimeFrameData {
  type: TimeFrameType;
  startDate: Date;
  endDate: Date;
  label: string;
  customRange?: CustomDateRange;
}

interface EnhancedTimeFramePickerProps {
  selectedTimeFrame: TimeFrameType;
  onTimeFrameChange: (timeFrame: TimeFrameType, customRange?: CustomDateRange) => void;
  customRange?: CustomDateRange;
  disabled?: boolean;
  className?: string;
}

const EnhancedTimeFramePicker: React.FC<EnhancedTimeFramePickerProps> = ({
  selectedTimeFrame,
  onTimeFrameChange,
  customRange,
  disabled = false,
  className
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(customRange?.from);
  const [toDate, setToDate] = useState<Date | undefined>(customRange?.to);

  useEffect(() => {
    if (customRange) {
      setFromDate(customRange.from);
      setToDate(customRange.to);
    }
  }, [customRange]);

  const handlePresetClick = (timeFrame: TimeFrameType) => {
    if (timeFrame === 'custom') {
      setShowCustomPicker(true);
    } else {
      onTimeFrameChange(timeFrame);
      setShowCustomPicker(false);
    }
  };

  const handleCustomRangeApply = () => {
    if (fromDate && toDate) {
      const range = { from: fromDate, to: toDate };
      onTimeFrameChange('custom', range);
      setShowCustomPicker(false);
    }
  };

  const handleCustomRangeClear = () => {
    setFromDate(undefined);
    setToDate(undefined);
    if (selectedTimeFrame === 'custom') {
      onTimeFrameChange('today');
    }
    setShowCustomPicker(false);
  };

  const getCustomLabel = () => {
    if (fromDate && toDate) {
      return `${format(fromDate, 'MMM d')} - ${format(toDate, 'MMM d')}`;
    }
    return 'Custom Range';
  };

  const isApplyDisabled = !fromDate || !toDate || fromDate > toDate;

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      {/* Main timeframe selector */}
      <div className="flex bg-muted rounded-lg p-1">
        {[
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handlePresetClick(option.value as TimeFrameType)}
            disabled={disabled}
            className={`
              text-sm font-medium rounded-md transition-all duration-200 px-3 py-1.5
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${selectedTimeFrame === option.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background"
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom date range button */}
      <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "font-medium gap-2",
              selectedTimeFrame === 'custom' && "border-primary text-primary bg-primary/5"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {selectedTimeFrame === 'custom' ? getCustomLabel() : 'Custom Range'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Select Date Range</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomPicker(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  From Date
                </label>
                <DatePicker
                  date={fromDate}
                  onSelect={setFromDate}
                  placeholder="Select start date"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  To Date
                </label>
                <DatePicker
                  date={toDate}
                  onSelect={setToDate}
                  placeholder="Select end date"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomRangeClear}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                onClick={handleCustomRangeApply}
                size="sm"
                disabled={isApplyDisabled}
                className="flex-1"
              >
                Apply
              </Button>
            </div>

            {isApplyDisabled && fromDate && toDate && fromDate > toDate && (
              <p className="text-xs text-destructive">
                Start date must be before end date
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EnhancedTimeFramePicker;