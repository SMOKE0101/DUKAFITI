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
 * High-end spinning number input with blended background and smooth scrolling
 * Features direct input capability and professional styling
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
    for (let i = -4; i <= 4; i++) {
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
    timeoutRef.current = setTimeout(() => setIsScrolling(false), 300);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
    setIsScrolling(true);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsScrolling(false), 300);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 10) { // Add threshold for smoother scrolling
      if (e.deltaY > 0) {
        handleDecrement();
      } else {
        handleIncrement();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center space-y-3", className)}>
      {/* Label with fade effect to indicate scrollability */}
      <div className="relative">
        <label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
          {label}
        </label>
        <div className="absolute -top-1 -bottom-1 left-0 right-0 bg-gradient-to-b from-transparent via-muted-foreground/20 to-transparent pointer-events-none opacity-30" />
      </div>
      
      {/* Enhanced Spinning Container */}
      <div className="relative">
        {/* Up Arrow - Properly positioned */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleIncrement();
          }}
          disabled={value >= max}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 w-6 h-6 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-background/80 rounded-full shadow-sm border border-border/30"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        
        {/* Main Display Container - Blended with background */}
        <div 
          ref={containerRef}
          className="relative w-24 h-20 rounded-xl overflow-hidden border border-border/20 backdrop-blur-sm"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--background) / 0.8), hsl(var(--muted) / 0.6))',
          }}
          onWheel={handleWheel}
        >
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/10 pointer-events-none z-10" />
          
          {/* Direct Input Field - Hidden until focused */}
          {isFocused && (
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={() => setIsFocused(true)}
              className="absolute inset-0 z-30 text-center bg-background/95 border-primary/50 font-mono text-lg font-semibold"
              autoFocus
            />
          )}
          
          {/* Spinning values container */}
          {!isFocused && (
            <div 
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300",
                isScrolling && "ease-out"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsFocused(true);
              }}
              style={{
                cursor: 'text'
              }}
            >
              {displayValues.map((displayValue, index) => {
                const isCenter = index === 4; // Middle value (current)
                const offset = (index - 4) * 16; // Tighter spacing for smoother scroll
                
                return (
                  <div
                    key={`${displayValue}-${index}`}
                    className={cn(
                      "absolute flex items-center justify-center w-full text-center font-mono transition-all duration-300",
                      isCenter 
                        ? "text-foreground text-lg font-bold scale-100 opacity-100" 
                        : "text-muted-foreground/40 text-sm scale-75 opacity-30"
                    )}
                    style={{
                      transform: `translateY(${offset}px)`,
                      filter: !isCenter ? 'blur(0.5px)' : 'none'
                    }}
                  >
                    <span className="tabular-nums">
                      {displayValue.toLocaleString()}
                    </span>
                    {suffix && isCenter && (
                      <span className="text-xs ml-1 text-muted-foreground/70 font-normal">
                        {suffix}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Subtle center highlight */}
          <div className="absolute top-1/2 left-2 right-2 h-[1px] bg-primary/20 transform -translate-y-1/2 pointer-events-none z-15" />
        </div>
        
        {/* Down Arrow - Properly positioned */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDecrement();
          }}
          disabled={value <= min}
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-20 w-6 h-6 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-background/80 rounded-full shadow-sm border border-border/30"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default SpinningNumberInput;