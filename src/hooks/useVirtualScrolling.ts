import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from './useProductionOptimization';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
}

interface VirtualScrollResult<T> {
  visibleItems: Array<T & { virtualIndex: number; style: React.CSSProperties }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, containerHeight, overscan = 5, threshold = 100 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  
  const debouncedScrollTop = useDebounce(scrollTop, 16); // ~60fps

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(debouncedScrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((debouncedScrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [debouncedScrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    // Safety check to ensure items is an array
    if (!Array.isArray(items)) {
      console.warn('useVirtualScrolling: items is not an array', items);
      return [];
    }
    
    return items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => ({
      ...item,
      virtualIndex: visibleRange.startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.startIndex + index) * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      }
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = Array.isArray(items) ? items.length * itemHeight : 0;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollElement(target);
    
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (scrollElement) {
      const targetScrollTop = Math.min(
        index * itemHeight,
        totalHeight - containerHeight
      );
      scrollElement.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [scrollElement, itemHeight, totalHeight, containerHeight]);

  const scrollToTop = useCallback(() => {
    if (scrollElement) {
      scrollElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [scrollElement]);

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    onScroll
  };
}