
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'table' | 'grid' | 'text' | 'button';
  count?: number;
}

const LoadingSkeleton = ({ className, variant = 'card', count = 1 }: LoadingSkeletonProps) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="bg-white rounded-lg border p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="bg-white rounded-lg border overflow-hidden animate-pulse">
            <div className="h-12 bg-gray-100 border-b"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 border-b flex items-center px-4 space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        );
      case 'grid':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        );
      case 'text':
        return (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        );
      case 'button':
        return <div className="h-10 bg-gray-200 rounded animate-pulse"></div>;
      default:
        return <div className="h-4 bg-gray-200 rounded animate-pulse"></div>;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {renderSkeleton()}
    </div>
  );
};

export default LoadingSkeleton;
