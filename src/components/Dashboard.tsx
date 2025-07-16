
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOfflineSales } from '../hooks/useOfflineSales';
import { offlineDB } from '../utils/offlineDB';
import PremiumDashboard from './PremiumDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { getOfflineSales, getSalesStats } = useOfflineSales();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState({
    sales: [],
    products: [],
    customers: [],
    stats: null,
    syncQueue: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data on component mount and when user changes
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log('[Dashboard] Loading offline data for user:', user.id);
        setLoading(true);
        setError(null);

        // Initialize the database first
        await offlineDB.init();
        
        // Test database functionality
        const dbTest = await offlineDB.testDatabase();
        if (!dbTest) {
          console.warn('[Dashboard] Database test failed, attempting reinitialize...');
          await offlineDB.forceReinitialize();
        }

        // Load all offline data in parallel
        const [sales, products, customers, stats, syncQueue] = await Promise.all([
          getOfflineSales().catch(err => {
            console.error('[Dashboard] Failed to load sales:', err);
            return [];
          }),
          offlineDB.getProducts(user.id).catch(err => {
            console.error('[Dashboard] Failed to load products:', err);
            return [];
          }),
          offlineDB.getCustomers(user.id).catch(err => {
            console.error('[Dashboard] Failed to load customers:', err);
            return [];
          }),
          getSalesStats().catch(err => {
            console.error('[Dashboard] Failed to load stats:', err);
            return null;
          }),
          offlineDB.getSyncQueue().catch(err => {
            console.error('[Dashboard] Failed to load sync queue:', err);
            return [];
          })
        ]);

        setOfflineData({
          sales,
          products,
          customers,
          stats,
          syncQueue
        });

        console.log('[Dashboard] Offline data loaded successfully:', {
          salesCount: sales.length,
          productsCount: products.length,
          customersCount: customers.length,
          syncQueueCount: syncQueue.length
        });

      } catch (error) {
        console.error('[Dashboard] Failed to load offline data:', error);
        setError(`Failed to load dashboard data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadOfflineData();
  }, [user?.id, getOfflineSales, getSalesStats]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isOnline ? 'Online mode' : 'Offline mode - Loading from local storage'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if critical error occurred
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Reload Dashboard
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Status: {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show offline indicator with sync status
  const OfflineIndicator = () => {
    if (isOnline && offlineData.syncQueue.length === 0) return null;

    return (
      <div className="mb-4">
        <Card className={`border-2 ${isOnline ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-blue-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-orange-600" />
                )}
                <span className="font-medium">
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
                {offlineData.syncQueue.length > 0 && (
                  <Badge variant="outline">
                    {offlineData.syncQueue.length} pending sync
                  </Badge>
                )}
              </div>
              {!isOnline && (
                <p className="text-sm text-muted-foreground">
                  Data loaded from local storage
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <PremiumDashboard />
    </div>
  );
};

export default Dashboard;
