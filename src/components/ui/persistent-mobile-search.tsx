import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PersistentMobileSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PersistentMobileSearch = React.memo(({
  value,
  onValueChange,
  placeholder = "Search products...",
  className = ""
}: PersistentMobileSearchProps) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  // Sync with external value when not actively typing
  useEffect(() => {
    if (!isTypingRef.current) {
      setInternalValue(value);
    }
  }, [value]);

  // Debounced update to parent
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (internalValue !== value) {
        onValueChange(internalValue);
      }
      setIsTyping(false);
      isTypingRef.current = false;
    }, 300);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [internalValue, value, onValueChange]);

  const handleFocus = useCallback(() => {
    setIsKeyboardActive(true);
    setIsTyping(true);
    isTypingRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    // Only blur if not actively typing
    if (!isTyping) {
      setIsKeyboardActive(false);
      isTypingRef.current = false;
      // Immediately sync on blur
      if (internalValue !== value) {
        onValueChange(internalValue);
      }
    }
  }, [isTyping, internalValue, value, onValueChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    setIsTyping(true);
    isTypingRef.current = true;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Immediately update parent and dismiss keyboard
      onValueChange(internalValue);
      inputRef.current?.blur();
      setIsKeyboardActive(false);
      setIsTyping(false);
      isTypingRef.current = false;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Revert to original value and dismiss keyboard
      setInternalValue(value);
      inputRef.current?.blur();
      setIsKeyboardActive(false);
      setIsTyping(false);
      isTypingRef.current = false;
    }
  }, [internalValue, value, onValueChange]);

  // Prevent touch events from interfering when keyboard is active
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMobile && isKeyboardActive) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT';
      const isSearchIcon = target.closest('[data-search-icon]');
      
      if (!isInput && !isSearchIcon) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, [isMobile, isKeyboardActive]);

  return (
    <div 
      className={`relative flex-1 ${className}`}
      onTouchStart={handleTouchStart}
    >
      <Search 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none"
        data-search-icon
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full pl-12 pr-4 py-4 bg-muted rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        style={{
          fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
          WebkitUserSelect: 'text',
          WebkitTouchCallout: 'default',
          WebkitAppearance: 'none',
          touchAction: 'manipulation',
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        enterKeyHint="search"
      />
      {isMobile && isKeyboardActive && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          Enter to search
        </div>
      )}
    </div>
  );
});

PersistentMobileSearch.displayName = 'PersistentMobileSearch';