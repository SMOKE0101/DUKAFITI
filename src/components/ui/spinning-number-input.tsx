import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
 * Professional, compact spinning number input for mobile-optimized forms
 * Features smooth scrolling, touch-friendly controls, and keyboard input
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
  const [isFocused, setIsFocused] = useState(false);
  const [displayValues, setDisplayValues] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState(value.toString());
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Generate surrounding values for spinning effect
  useEffect(() => {
    const values = [];
    for (let i = -2; i <= 2; i++) {
      const newValue = Math.max(min, Math.min(max, value + (i * step)));
      values.push(newValue);
    }
    setDisplayValues(values);
    setInputValue(value.toString());
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
    e.stopPropagation();
    if (Math.abs(e.deltaY) > 10) {
      if (e.deltaY > 0) {
        handleDecrement();
      } else {
        handleIncrement();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const numValue = parseInt(newValue) || 0;
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const numValue = parseInt(inputValue) || 0;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    onChange(clampedValue);
    setInputValue(clampedValue.toString());
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFocused(true);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Compact Label */}
      <label className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wide mb-1 text-center">
        {label}
      </label>
      
      {/* Compact Spinning Container */}
      <div className="relative flex flex-col items-center">
        {/* Up Button - Above container */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleIncrement();
          }}
          disabled={value >= max}
          className="w-full h-6 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-muted/30 hover:bg-muted/50 rounded-t-md border border-b-0 border-border/40"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        
        {/* Main Display Container - Compact */}
        <div 
          ref={containerRef}
          className="relative w-16 h-12 bg-background border-l border-r border-border/40 flex items-center justify-center cursor-text"
          onWheel={handleWheel}
          onClick={handleContainerClick}
        >
          {/* Direct Input Field - Hidden until focused */}
          {isFocused ? (
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={() => setIsFocused(true)}
              className="absolute inset-0 text-center bg-background border-0 font-mono text-sm font-semibold p-0 h-full focus:ring-1 focus:ring-primary"
              autoFocus
            />
          ) : (
            /* Spinning values display */
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {displayValues.map((displayValue, index) => {
                const isCenter = index === 2; // Middle value (current)
                const offset = (index - 2) * 12; // Compact spacing
                
                return (
                  <div
                    key={`${displayValue}-${index}`}
                    className={cn(
                      "absolute flex items-center justify-center w-full text-center font-mono transition-all duration-200",
                      isCenter 
                        ? "text-foreground text-sm font-bold opacity-100" 
                        : "text-muted-foreground/30 text-xs opacity-40"
                    )}
                    style={{
                      transform: `translateY(${offset}px)`,
                      filter: !isCenter ? 'blur(0.3px)' : 'none'
                    }}
                  >
                    <span className="tabular-nums">
                      {displayValue.toLocaleString()}
                    </span>
                    {suffix && isCenter && (
                      <span className="text-[10px] ml-1 text-muted-foreground/60 font-normal">
                        {suffix}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Down Button - Below container */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDecrement();
          }}
          disabled={value <= min}
          className="w-full h-6 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-muted/30 hover:bg-muted/50 rounded-b-md border border-t-0 border-border/40"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default SpinningNumberInput;