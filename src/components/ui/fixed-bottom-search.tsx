import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FixedBottomSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FixedBottomSearch: React.FC<FixedBottomSearchProps> = ({
  value,
  onChange,
  placeholder = "Search products…",
  className
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced onChange handler
  const handleChange = useCallback((inputValue: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(inputValue);
    }, 100);
  }, [onChange]);

  // Handle input change with immediate local state update
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    handleChange(newValue);
  }, [handleChange]);

  // Focus handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Only blur if clicking outside the search container
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('[data-search-container]')) {
      setIsFocused(false);
    }
  }, []);

  // Prevent blur on input interaction
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div 
      data-search-container
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50",
        "safe-area-inset-bottom", // Handle safe area for mobile devices
        className
      )}
      style={{
        WebkitBackdropFilter: 'blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="p-3 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            className={cn(
              "w-full h-12 pl-10 pr-4 bg-muted/80 rounded-full",
              "text-foreground placeholder-muted-foreground",
              "border border-border/50 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
              "transition-all duration-200",
              "text-base", // Prevent zoom on iOS
              isFocused && "bg-background shadow-md ring-2 ring-ring/30"
            )}
            style={{
              fontSize: '16px', // Prevent zoom on iOS Safari
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
        </div>
      </div>
    </div>
  );
};