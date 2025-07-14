// Performance optimization utilities for production
import React from 'react';

// Debounce function for search inputs and API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility for heavy components
export const createLazyComponent = (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
  return React.lazy(importFn);
};

// Memory-efficient array operations
export const batchProcess = <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await processor(batch);
        
        // Allow other tasks to run
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Local storage with size limits and compression
export const optimizedStorage = {
  set: (key: string, value: any): boolean => {
    try {
      const serialized = JSON.stringify(value);
      
      // Check size (approximate 5MB limit for localStorage)
      if (serialized.length > 5 * 1024 * 1024) {
        console.warn('Data too large for localStorage');
        return false;
      }
      
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Silently fail
    }
  }
};

// Image optimization utilities
export const imageUtils = {
  preload: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  },
  
  lazyLoad: (element: HTMLImageElement, src: string): void => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          element.src = src;
          observer.unobserve(element);
        }
      });
    });
    
    observer.observe(element);
  }
};

// Bundle size monitoring (development only)
export const bundleMonitor = {
  logBundleSize: (): void => {
    if (import.meta.env.DEV) {
      // This would be replaced with actual bundle analysis in a real implementation
      console.info('Bundle monitoring active in development mode');
    }
  }
};