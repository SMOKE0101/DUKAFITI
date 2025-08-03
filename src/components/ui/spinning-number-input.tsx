import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinningNumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

/**
 * Spinning number input component with scrollable values
 * Similar to timer/lock interface design
 */
const SpinningNumberInput: React.FC<SpinningNumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  suffix = '',
  className
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [displayValues, setDisplayValues] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Generate surrounding values for spinning effect
  useEffect(() => {
    const values = [];
    for (let i = -3; i <= 3; i++) {
      const newValue = Math.max(min, Math.min(max, value + (i * step)));
      values.push(newValue);
    }
    setDisplayValues(values);
  }, [value, min, max, step]);

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
    setIsScrolling(true);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsScrolling(false), 200);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
    setIsScrolling(true);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsScrolling(false), 200);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleDecrement();
    } else {
      handleIncrement();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      {/* Label */}
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      
      {/* Spinning Container */}
      <div className="relative">
        {/* Up Arrow */}
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 w-8 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        
        {/* Number Display Container */}
        <div 
          ref={containerRef}
          className="relative w-20 h-16 bg-black/90 dark:bg-black/95 rounded-lg overflow-hidden border border-gray-600 dark:border-gray-700"
          onWheel={handleWheel}
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none z-10" />
          
          {/* Spinning values container */}
          <div 
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-transform duration-200",
              isScrolling && "ease-out"
            )}
            style={{
              transform: `translateY(0px)` // Center position for current value
            }}
          >
            {displayValues.map((displayValue, index) => {
              const isCenter = index === 3; // Middle value (current)
              const offset = (index - 3) * 20; // 20px spacing between values
              
              return (
                <div
                  key={index}
                  className={cn(
                    "absolute flex items-center justify-center w-full text-center font-mono transition-all duration-200",
                    isCenter 
                      ? "text-white text-lg font-bold scale-110" 
                      : "text-gray-400 text-sm scale-90 opacity-50"
                  )}
                  style={{
                    transform: `translateY(${offset}px)`
                  }}
                >
                  <span className="tabular-nums">
                    {displayValue.toString().padStart(2, '0')}
                  </span>
                  {suffix && isCenter && (
                    <span className="text-xs ml-1 text-gray-300">{suffix}</span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Center highlight line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-purple-500/30 transform -translate-y-1/2 pointer-events-none z-20" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-purple-400/60 transform -translate-y-1/2 pointer-events-none z-20" />
        </div>
        
        {/* Down Arrow */}
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10 w-8 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SpinningNumberInput;