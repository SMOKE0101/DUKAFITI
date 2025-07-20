
import React, { Suspense, useState, useEffect } from 'react';
import SalesErrorBoundary from './sales/SalesErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

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

const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
    <Card className="w-full max-w-lg text-center">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Failed to Load Sales Page
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Lazy load with error handling
const OptimizedModernSalesPage = React.lazy(() => 
  import('./OptimizedModernSalesPage').catch(error => {
    console.error('[SalesManagement] Failed to load OptimizedModernSalesPage:', error);
    return Promise.reject(error);
  })
);

const SalesManagement = () => {
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  console.log('🔥 SalesManagement component loaded - rendering with enhanced error handling');

  const handleRetry = () => {
    setLoadError(null);
    setRetryCount(prev => prev + 1);
  };

  // Handle component load errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[SalesManagement] Runtime error caught:', event.error);
      if (event.error && event.error.message?.includes('sales')) {
        setLoadError(event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (loadError) {
    return <ErrorFallback error={loadError} resetError={handleRetry} />;
  }
  
  return (
    <SalesErrorBoundary key={retryCount}>
      <Suspense fallback={<LoadingFallback />}>
        <OptimizedModernSalesPage />
      </Suspense>
    </SalesErrorBoundary>
  );
};

export default SalesManagement;
