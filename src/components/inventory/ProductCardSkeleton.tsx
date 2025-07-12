
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ProductCardSkeleton: React.FC = () => {
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      <CardContent className="p-0 space-y-3">
        {/* Top: Name and Category */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>

        {/* Middle: Code and Prices */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        {/* Bottom: Stock and Actions */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardSkeleton;
