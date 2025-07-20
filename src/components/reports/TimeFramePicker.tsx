
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type TimeFrame = 'today' | 'week' | 'month' | 'custom';

export interface TimeFrameData {
  type: TimeFrame;
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

interface TimeFramePickerProps {
  selectedTimeFrame: TimeFrameData;
  onTimeFrameChange: (timeFrame: TimeFrameData) => void;
  customRange?: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
}

const TimeFramePicker: React.FC<TimeFramePickerProps> = ({
  selectedTimeFrame,
  onTimeFrameChange,
  customRange,
  onCustomRangeChange,
}) => {
  const getPresetTimeFrame = (type: TimeFrame): TimeFrameData => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'today':
        return {
          type: 'today',
          startDate: today,
          endDate: new Date(),
          label: 'Today'
        };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          type: 'week',
          startDate: weekAgo,
          endDate: new Date(),
          label: 'This Week'
        };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          type: 'month',
          startDate: monthAgo,
          endDate: new Date(),
          label: 'This Month'
        };
      case 'custom':
        return {
          type: 'custom',
          startDate: customRange?.from || today,
          endDate: customRange?.to || new Date(),
          label: customRange ? 
            `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}` : 
            'Custom Range'
        };
      default:
        return getPresetTimeFrame('today');
    }
  };

  const handlePresetClick = (type: TimeFrame) => {
    const timeFrame = getPresetTimeFrame(type);
    onTimeFrameChange(timeFrame);
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onCustomRangeChange(range);
      const timeFrame = getPresetTimeFrame('custom');
      onTimeFrameChange({
        ...timeFrame,
        startDate: range.from,
        endDate: range.to,
        label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`
      });
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Time Period:</span>
        
        <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
          {(['today', 'week', 'month'] as TimeFrame[]).map((type) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => handlePresetClick(type)}
              className={cn(
                "text-sm font-bold rounded-lg transition-all duration-200",
                selectedTimeFrame.type === type
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {getPresetTimeFrame(type).label}
            </Button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "font-bold rounded-xl gap-2",
                selectedTimeFrame.type === 'custom' && "border-primary text-primary"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              {selectedTimeFrame.type === 'custom' ? selectedTimeFrame.label : 'Custom Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={(range) => handleCustomRangeSelect(range as DateRange)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default TimeFramePicker;
