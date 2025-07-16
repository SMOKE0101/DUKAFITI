
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';
import { usePWAOffline } from '@/hooks/usePWAOffline';
import PWAOfflineBanner from './PWAOfflineBanner';
import { OfflineValidator } from './OfflineValidator';

const Dashboard: React.FC = () => {
  const { stats, isOnline: offlineFirstOnline, queuedOperations } = useOfflineFirst();
  const { isOnline: pwaOnline, isInstalled, cacheStatus } = usePWAOffline();

  // Mock data for dashboard
  const todaySales = 12;
  const todayRevenue = 45600;
  const lowStockItems = 3;
  const totalCustomers = stats.cached.customers;

  return (
    <div className="p-6 space-y-6">
      <PWAOfflineBanner />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {pwaOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-500" />
            )}
            <span className="text-sm text-gray-600">
              {pwaOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {/* PWA Status */}
          {isInstalled && (
            <Badge variant="secondary">
              <Database className="h-3 w-3 mr-1" />
              Installed
            </Badge>
          )}
          
          {/* Cache Status */}
          <Badge variant={cacheStatus === 'ready' ? 'default' : 'destructive'}>
            {cacheStatus === 'ready' ? 'Cache Ready' : 'Cache Loading'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySales}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cached.products}</div>
            <p className="text-xs text-muted-foreground">
              <AlertTriangle className="inline h-3 w-3 mr-1 text-orange-500" />
              {lowStockItems} low stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Offline Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.cached.products + stats.cached.customers + stats.cached.sales}</div>
              <div className="text-sm text-muted-foreground">Cached Items</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">{queuedOperations}</div>
              <div className="text-sm text-muted-foreground">Queued Actions</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">{pwaOnline ? 'Ready' : 'Offline'}</div>
              <div className="text-sm text-muted-foreground">PWA Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Testing Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Offline Testing & Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <OfflineValidator />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
