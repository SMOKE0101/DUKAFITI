
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRobustOfflineManager } from '../hooks/useRobustOfflineManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, ArrowLeft } from 'lucide-react';

interface OfflineFirstRouterProps {
  children: React.ReactNode;
}

const OfflineFirstRouter: React.FC<OfflineFirstRouterProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { offlineState, getOfflineData } = useRobustOfflineManager();
  
  const [routeData, setRouteData] = useState<any>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Offline-supported routes
  const offlineRoutes = [
    '/app/dashboard',
    '/app/inventory',
    '/app/products',
    '/app/sales',
    '/app/customers',
    '/app/reports'
  ];

  useEffect(() => {
    handleRouteChange();
    
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoadingRoute && !offlineState.isOnline) {
        console.log('[OfflineFirstRouter] Loading timeout reached, handling gracefully');
        handleLoadingTimeout();
      }
    }, 10000); // 10 second timeout

    setLoadingTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [location.pathname, offlineState.isOnline, offlineState.isInitialized]);

  const handleLoadingTimeout = () => {
    setIsLoadingRoute(false);
    const currentPath = location.pathname;
    
    if (currentPath !== '/app/dashboard') {
      setRouteError(`Loading timeout. This page may not be fully available offline. Redirecting to dashboard.`);
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 3000);
    } else {
      setRouteError('Loading timeout. Some features may be limited offline.');
    }
  };

  const handleRouteChange = async () => {
    if (!offlineState.isInitialized) {
      return;
    }

    setIsLoadingRoute(true);
    setRouteError(null);

    try {
      // If online, let normal routing handle everything
      if (offlineState.isOnline) {
        setRouteData(null);
        setIsLoadingRoute(false);
        if (loadingTimeout) clearTimeout(loadingTimeout);
        return;
      }

      // Offline handling
      const currentPath = location.pathname;
      
      // Check if current route is supported offline
      const isOfflineSupported = offlineRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      );

      if (!isOfflineSupported) {
        // Redirect to dashboard with message
        console.log('[OfflineFirstRouter] Unsupported offline route, redirecting to dashboard');
        setRouteError(`The page "${currentPath}" is not available offline. Redirected to dashboard.`);
        navigate('/app/dashboard', { replace: true });
        return;
      }

      // Load data for offline-supported routes
      await loadOfflineDataForRoute(currentPath);
      
    } catch (error) {
      console.error('[OfflineFirstRouter] Route handling error:', error);
      setRouteError(`Failed to load page offline: ${error.message}`);
      
      // Fallback to dashboard
      if (location.pathname !== '/app/dashboard') {
        setTimeout(() => {
          navigate('/app/dashboard', { replace: true });
        }, 3000);
      }
    } finally {
      setIsLoadingRoute(false);
      if (loadingTimeout) clearTimeout(loadingTimeout);
    }
  };

  const loadOfflineDataForRoute = async (path: string) => {
    if (!user?.id) return;

    try {
      let data = {};

      if (path.includes('/dashboard')) {
        // Load dashboard data
        const [products, customers, sales] = await Promise.all([
          getOfflineData('products'),
          getOfflineData('customers'),
          getOfflineData('sales')
        ]);
        data = { products, customers, sales };
      } else if (path.includes('/inventory') || path.includes('/products')) {
        // Load products data
        data = { products: await getOfflineData('products') };
      } else if (path.includes('/customers')) {
        // Load customers data
        data = { customers: await getOfflineData('customers') };
      } else if (path.includes('/sales')) {
        // Load sales data
        const [sales, products, customers] = await Promise.all([
          getOfflineData('sales'),
          getOfflineData('products'),
          getOfflineData('customers')
        ]);
        data = { sales, products, customers };
      }

      setRouteData(data);
      console.log(`[OfflineFirstRouter] Loaded offline data for ${path}:`, data);
      
    } catch (error) {
      console.error('[OfflineFirstRouter] Failed to load offline data:', error);
      throw error;
    }
  };

  const dismissError = () => {
    setRouteError(null);
  };

  const goToDashboard = () => {
    navigate('/app/dashboard', { replace: true });
    dismissError();
  };

  // Show loading state with timeout protection
  if (!offlineState.isInitialized || isLoadingRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {!offlineState.isInitialized ? 'Initializing app...' : 'Loading page...'}
          </p>
          
          {/* Show timeout warning after 5 seconds */}
          {isLoadingRoute && !offlineState.isOnline && (
            <div className="mt-4">
              <p className="text-sm text-orange-600">
                Taking longer than expected. 
                {location.pathname !== '/app/dashboard' && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={goToDashboard}
                    className="p-0 h-auto ml-1 text-orange-600 underline"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Route Error Alert */}
      {routeError && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <span className="flex-1 pr-2">{routeError}</span>
                <div className="flex gap-1">
                  {location.pathname !== '/app/dashboard' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToDashboard}
                      className="h-auto p-1 text-xs"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Dashboard
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissError}
                    className="h-auto p-1 text-xs"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Offline Data Context Provider */}
      {!offlineState.isOnline && routeData && (
        <div className="sr-only" data-offline-data={JSON.stringify(routeData)} />
      )}

      {/* Main Content */}
      {children}
    </div>
  );
};

export default OfflineFirstRouter;
