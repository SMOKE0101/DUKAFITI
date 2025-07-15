import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  Download,
  Upload,
  Info
} from 'lucide-react';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Progress } from '@/components/ui/progress';

export const OfflineDataManager = () => {
  const { 
    stats, 
    isOnline, 
    syncInProgress, 
    forceSync, 
    clearOfflineData, 
    seedOfflineData,
    updateStats 
  } = useOfflineFirst();
  
  const { cacheStats, getCacheStats, clearCache } = useServiceWorker();

  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      getCacheStats?.();
      updateStats();
    }
  }, [isOpen, getCacheStats, updateStats]);

  const totalCachedItems = stats.cached.products + stats.cached.customers + stats.cached.sales + stats.cached.transactions;
  const totalQueuedItems = stats.queued.total;

  const getStorageEstimate = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }
    return null;
  };

  const [storageInfo, setStorageInfo] = React.useState<any>(null);

  React.useEffect(() => {
    if (isOpen) {
      getStorageEstimate().then(setStorageInfo);
    }
  }, [isOpen]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsagePercentage = () => {
    if (!storageInfo?.quota || !storageInfo?.usage) return 0;
    return Math.round((storageInfo.usage / storageInfo.quota) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Offline Data
          <Badge variant="secondary" className="ml-2">
            {totalCachedItems}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Data Management
          </DialogTitle>
          <DialogDescription>
            Manage your offline data cache and sync queue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Storage Overview */}
          {storageInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HardDrive className="h-5 w-5" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Used: {formatBytes(storageInfo.usage || 0)}</span>
                    <span>Available: {formatBytes(storageInfo.available || 0)}</span>
                  </div>
                  <Progress value={getUsagePercentage()} />
                  <div className="text-xs text-muted-foreground">
                    {getUsagePercentage()}% of {formatBytes(storageInfo.quota || 0)} quota used
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cached Data Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                Cached Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.cached.products}</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.cached.customers}</div>
                  <div className="text-sm text-muted-foreground">Customers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.cached.sales}</div>
                  <div className="text-sm text-muted-foreground">Sales</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.cached.transactions}</div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className={`h-5 w-5 ${syncInProgress ? 'animate-spin' : ''}`} />
                Sync Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{stats.queued.high}</div>
                  <div className="text-xs text-muted-foreground">High Priority</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">{stats.queued.medium}</div>
                  <div className="text-xs text-muted-foreground">Medium Priority</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{stats.queued.low}</div>
                  <div className="text-xs text-muted-foreground">Low Priority</div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{totalQueuedItems}</div>
                <div className="text-sm text-muted-foreground">
                  {totalQueuedItems === 0 ? 'All synced!' : 'Operations waiting to sync'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cache Statistics */}
          {cacheStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Service Worker Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(cacheStats).map(([cacheName, count]) => (
                    <div key={cacheName} className="text-center">
                      <div className="text-lg font-bold">{count as number}</div>
                      <div className="text-xs text-muted-foreground">{cacheName}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={seedOfflineData} 
                  disabled={!isOnline}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isOnline ? 'Refresh Offline Data' : 'Requires Internet'}
                </Button>
                
                <Button 
                  onClick={forceSync} 
                  disabled={!isOnline || syncInProgress}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {syncInProgress ? 'Syncing...' : 'Force Sync Now'}
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={clearOfflineData}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Offline Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cache Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={getCacheStats} 
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Cache Stats
                </Button>
                
                <Button 
                  onClick={clearCache} 
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Browser Cache
                </Button>
                
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>Note:</strong> Clearing cache will remove all cached assets and require re-downloading when online.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};