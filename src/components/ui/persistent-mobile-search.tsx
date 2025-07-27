import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useProductionOptimization';
import { isTouchDevice } from '@/utils/mobileUtils';

interface PersistentMobileSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const PersistentMobileSearch: React.FC<PersistentMobileSearchProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  onFocus,
  onBlur
}) => {
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Internal state to prevent parent re-renders from affecting input
  const [internalValue, setInternalValue] = useState(value);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [hasUserCommitted, setHasUserCommitted] = useState(false);
  
  // Debounced search to reduce parent updates
  const debouncedValue = useDebounce(internalValue, 300);
  
  // Update parent only when debounced value changes and user has committed
  useEffect(() => {
    if (hasUserCommitted && debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, hasUserCommitted, value]);
  
  // Sync with external value changes
  useEffect(() => {
    if (value !== internalValue && !isKeyboardActive) {
      setInternalValue(value);
    }
  }, [value, internalValue, isKeyboardActive]);
  
  const handleFocus = useCallback(() => {
    console.log('[PersistentSearch] Focus event');
    setIsKeyboardActive(true);
    setHasUserCommitted(true);
    onFocus?.();
    
    if (isMobile && inputRef.current) {
      // Prevent any interference from touch events
      inputRef.current.style.pointerEvents = 'auto';
      inputRef.current.style.userSelect = 'text';
    }
  }, [isMobile, onFocus]);
  
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    console.log('[PersistentSearch] Blur event');
    
    // Only allow blur if it's intentional or if we're not in mobile keyboard mode
    const isIntentionalBlur = !isKeyboardActive || e.relatedTarget !== null;
    
    if (isIntentionalBlur) {
      setIsKeyboardActive(false);
      // Commit final value
      if (internalValue !== value) {
        onChange(internalValue);
      }
      onBlur?.();
    } else if (isMobile && inputRef.current) {
      // Prevent unintentional blur on mobile
      e.preventDefault();
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isKeyboardActive, isMobile, internalValue, value, onChange, onBlur]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('[PersistentSearch] Key pressed:', e.key);
    
    if (e.key === 'Enter') {
      // Explicit commit and close keyboard
      e.preventDefault();
      setIsKeyboardActive(false);
      onChange(internalValue);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      // Revert and close keyboard
      e.preventDefault();
      setInternalValue(value);
      setIsKeyboardActive(false);
      inputRef.current?.blur();
    }
  }, [internalValue, value, onChange]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('[PersistentSearch] Value changed:', newValue);
    setInternalValue(newValue);
    setHasUserCommitted(true);
  }, []);
  
  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);
  
  // Aggressive touch event prevention during keyboard session
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMobile && isKeyboardActive) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT';
      const isClearButton = target.closest('[data-clear-button]');
      
      if (!isInput && !isClearButton) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, [isMobile, isKeyboardActive]);
  
  return (
    <div className={`relative ${className}`} onTouchStart={handleTouchStart}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full pl-12 pr-12 py-4 bg-muted rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        style={{
          fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
          WebkitUserSelect: 'text',
          WebkitTouchCallout: 'default',
          WebkitAppearance: 'none',
          touchAction: 'manipulation',
        }}
      />
      {internalValue && (
        <button
          data-clear-button
          onClick={handleClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          type="button"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Visual indicator for mobile keyboard state */}
      {isMobile && isKeyboardActive && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
            Press Enter to close keyboard
          </span>
        </div>
      )}
    </div>
  );
};