import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedLoadingStateProps {
  type?: 'dashboard' | 'table' | 'card' | 'form' | 'page';
  className?: string;
  rows?: number;
  showText?: boolean;
}

const EnhancedLoadingState: React.FC<EnhancedLoadingStateProps> = ({ 
  type = 'page',
  className,
  rows = 3,
  showText = true
}) => {
  const renderDashboardSkeleton = () => (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      
      {/* Chart Area */}
      <div className="border rounded-xl p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex space-x-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="border rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'dashboard':
        return renderDashboardSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'card':
        return renderCardSkeleton();
      case 'form':
        return renderFormSkeleton();
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              {showText && (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn("animate-pulse", className)}>
      {renderContent()}
    </div>
  );
};

export default EnhancedLoadingState;