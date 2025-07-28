import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search products…",
  className
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange to parent component
  const debouncedOnChange = useCallback((newValue: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 150);
  }, [onChange]);

  // Handle input changes with immediate internal state update
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  // Handle focus - prevent keyboard hiding
  const handleFocus = useCallback(() => {
    setIsActive(true);
    // Prevent keyboard from hiding on mobile by ensuring proper focus
    if (inputRef.current) {
      inputRef.current.setAttribute('inputmode', 'search');
    }
  }, []);

  // Handle blur with delay to prevent premature hiding
  const handleBlur = useCallback(() => {
    // Add small delay to prevent keyboard from hiding during text selection
    setTimeout(() => {
      setIsActive(false);
    }, 100);
  }, []);

  // Prevent default touch behaviors that might interfere
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  // Handle clear button
  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);

  // Handle container interaction to prevent blur
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent blur when clicking within the search container
    if (e.target !== inputRef.current) {
      e.preventDefault();
    }
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9999]",
        "bg-background/95 backdrop-blur-md border-t border-border",
        "shadow-lg",
        className
      )}
      style={{
        position: 'fixed',
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitBackdropFilter: 'blur(16px)',
        transform: 'translateZ(0)', // Force hardware acceleration
        willChange: 'transform' // Optimize for animations
      }}
      onMouseDown={handleContainerMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="p-4">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10 pointer-events-none" 
          />
          
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={placeholder}
            value={internalValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "w-full h-14 pl-12 pr-12",
              "bg-muted/90 rounded-xl",
              "text-foreground placeholder-muted-foreground",
              "border-2 border-transparent",
              "focus:outline-none focus:border-primary/50 focus:bg-background",
              "transition-all duration-200 ease-in-out",
              "text-[16px] leading-tight", // Prevent zoom on iOS
              isActive && "border-primary/50 bg-background shadow-lg"
            )}
            style={{
              fontSize: '16px', // Critical for iOS to prevent zoom
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
              transform: 'translateZ(0)' // Hardware acceleration
            }}
          />
          
          {internalValue && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "absolute right-3 top-1/2 transform -translate-y-1/2",
                "w-6 h-6 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30",
                "flex items-center justify-center",
                "transition-colors duration-150"
              )}
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};