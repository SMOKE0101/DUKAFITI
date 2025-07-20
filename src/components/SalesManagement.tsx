
import React, { Suspense } from 'react';
import SalesErrorBoundary from './sales/SalesErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy load the main sales component to catch loading errors
const OptimizedModernSalesPage = React.lazy(() => import('./OptimizedModernSalesPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
    <Card className="w-full max-w-md text-center">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Sales Page</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Preparing your sales interface...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SalesManagement = () => {
  console.log('🔥 SalesManagement component loaded - rendering with error boundary and suspense');
  
  return (
    <SalesErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <OptimizedModernSalesPage />
      </Suspense>
    </SalesErrorBoundary>
  );
};

export default SalesManagement;
