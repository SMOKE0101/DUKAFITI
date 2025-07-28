import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileBottomSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const MobileBottomSearch = React.memo(({
  value,
  onValueChange,
  placeholder = "Search products…",
  className = ""
}: MobileBottomSearchProps) => {
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

  // Debounced update to parent - fast for instant filtering
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
    }, 100); // Fast debounce for instant filtering

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

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Prevent blur when actively typing to keep keyboard open
    if (isTyping && isTypingRef.current) {
      e.preventDefault();
      e.target.focus();
      return;
    }
    
    setIsKeyboardActive(false);
    isTypingRef.current = false;
    // Immediately sync on blur
    if (internalValue !== value) {
      onValueChange(internalValue);
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
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
    >
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none z-10"
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
        className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner transition-all"
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
    </div>
  );
});

MobileBottomSearch.displayName = 'MobileBottomSearch';
