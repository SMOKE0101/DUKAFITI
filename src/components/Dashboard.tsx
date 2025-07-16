
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOfflineSales } from '../hooks/useOfflineSales';
import { offlineDB } from '../utils/offlineDB';
import PremiumDashboard from './PremiumDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wifi, WifiOff, Loader2 } from 'lucide-react';

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
    const handleOnline = () => {
      console.log('[Dashboard] 🌐 Back online');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('[Dashboard] 📴 Gone offline');
      setIsOnline(false);
    };

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
        console.log('[Dashboard] ⚠️ No user ID, skipping data load');
        setLoading(false);
        return;
      }

      try {
        console.log('[Dashboard] 📖 Loading offline data for user:', user.id);
        setLoading(true);
        setError(null);

        // Initialize the database first with enhanced error handling
        try {
          await offlineDB.init();
          console.log('[Dashboard] ✅ Database initialized');
        } catch (initError) {
          console.error('[Dashboard] ❌ Database init failed:', initError);
          throw new Error(`Database initialization failed: ${initError.message}`);
        }
        
        // Test database functionality
        const dbTest = await offlineDB.testDatabase();
        if (!dbTest) {
          console.warn('[Dashboard] ⚠️ Database test failed, attempting reinitialize...');
          try {
            await offlineDB.forceReinitialize();
            console.log('[Dashboard] ✅ Database reinitialized successfully');
          } catch (reinitError) {
            console.error('[Dashboard] ❌ Database reinitialize failed:', reinitError);
            throw new Error('Database is not functioning properly');
          }
        }

        // Load all offline data in parallel with individual error handling
        const [sales, products, customers, stats, syncQueue] = await Promise.allSettled([
          getOfflineSales().catch(err => {
            console.error('[Dashboard] ❌ Failed to load sales:', err);
            return [];
          }),
          offlineDB.getProducts(user.id).catch(err => {
            console.error('[Dashboard] ❌ Failed to load products:', err);
            return [];
          }),
          offlineDB.getCustomers(user.id).catch(err => {
            console.error('[Dashboard] ❌ Failed to load customers:', err);
            return [];
          }),
          getSalesStats().catch(err => {
            console.error('[Dashboard] ❌ Failed to load stats:', err);
            return null;
          }),
          offlineDB.getSyncQueue().catch(err => {
            console.error('[Dashboard] ❌ Failed to load sync queue:', err);
            return [];
          })
        ]);

        // Extract values from settled promises
        const salesData = sales.status === 'fulfilled' ? sales.value : [];
        const productsData = products.status === 'fulfilled' ? products.value : [];
        const customersData = customers.status === 'fulfilled' ? customers.value : [];
        const statsData = stats.status === 'fulfilled' ? stats.value : null;
        const syncQueueData = syncQueue.status === 'fulfilled' ? syncQueue.value : [];

        setOfflineData({
          sales: salesData,
          products: productsData,
          customers: customersData,
          stats: statsData,
          syncQueue: syncQueueData
        });

        console.log('[Dashboard] ✅ Offline data loaded successfully:', {
          salesCount: salesData.length,
          productsCount: productsData.length,
          customersCount: customersData.length,
          syncQueueCount: syncQueueData.length,
          isOnline
        });

      } catch (error) {
        console.error('[Dashboard] ❌ Failed to load offline data:', error);
        setError(`Failed to load dashboard data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadOfflineData();
  }, [user?.id, getOfflineSales, getSalesStats]);

  // Show loading state with enhanced offline indication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-600" />
            )}
            <p className="text-sm text-muted-foreground">
              {isOnline ? 'Online mode' : 'Offline mode - Loading from local storage'}
            </p>
          </div>
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
              <div className="flex items-center justify-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-orange-600" />
                )}
                <p className="text-xs text-muted-foreground">
                  Status: {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced offline indicator with sync status and data info
  const OfflineIndicator = () => {
    const hasUnsyncedData = offlineData.syncQueue.length > 0;
    const hasOfflineData = offlineData.sales.length > 0 || offlineData.products.length > 0 || offlineData.customers.length > 0;

    if (isOnline && !hasUnsyncedData) return null;

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
                {hasUnsyncedData && (
                  <Badge variant="outline" className="bg-yellow-100">
                    {offlineData.syncQueue.length} pending sync
                  </Badge>
                )}
                {!isOnline && hasOfflineData && (
                  <Badge variant="outline" className="bg-green-100">
                    {offlineData.sales.length + offlineData.products.length + offlineData.customers.length} items cached
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
