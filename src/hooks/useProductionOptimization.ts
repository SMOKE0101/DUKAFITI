import { useEffect, useCallback, useMemo, useState } from 'react';
import { debounce, throttle } from '@/utils/performance';

// Production optimization hooks

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  return throttledCallback as T;
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  return debouncedCallback as T;
};

// Memory optimization for large lists
export const useVirtualization = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop: useCallback((top: number) => setScrollTop(top), [])
  };
};

// Connection optimization
export const useConnectionOptimization = () => {
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnection = () => {
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType));
      };

      updateConnection();
      connection.addEventListener('change', updateConnection);

      return () => {
        connection.removeEventListener('change', updateConnection);
      };
    }
  }, []);

  return { connectionType, isSlowConnection };
};

// Image optimization
export const useImageOptimization = () => {
  const { isSlowConnection } = useConnectionOptimization();

  const getOptimizedImageProps = useCallback((src: string) => {
    const props: any = {
      loading: 'lazy',
      decoding: 'async'
    };

    if (isSlowConnection) {
      // Use smaller images or placeholders for slow connections
      props.style = { filter: 'blur(2px)' };
    }

    return props;
  }, [isSlowConnection]);

  return { getOptimizedImageProps };
};