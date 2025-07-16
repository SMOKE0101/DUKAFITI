
import React, { useState, useEffect } from 'react';
import { useOrderSync } from '../../hooks/useOrderSync';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { offlineOrderManager, OfflineOrder } from '../../utils/offlineOrderManager';
import { SalesDeduplication } from '../../utils/salesDeduplication';
import { useToast } from '../../hooks/use-toast';

const OrderManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isOnline,
    isSyncing,
    pendingOrdersCount,
    lastSyncTime,
    syncErrors,
    forceSyncNow,
    clearSyncErrors
  } = useOrderSync();

  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOfflineOrders = async () => {
    try {
      setIsLoading(true);
      const orders = await offlineOrderManager.getAllOrders();
      setOfflineOrders(orders);
    } catch (error) {
      console.error('Failed to load offline orders:', error);
      toast({
        title: "Error",
        description: "Failed to load offline orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      setIsLoading(true);
      const result = await SalesDeduplication.validateAndCleanup();
      
      if (result.duplicatesRemoved > 0) {
        toast({
          title: "Cleanup Complete",
          description: `Removed ${result.duplicatesRemoved} duplicate orders`,
          duration: 5000,
        });
      } else {
        toast({
          title: "No Duplicates Found",
          description: "Your orders are already clean",
          duration: 3000,
        });
      }

      // Refresh the offline orders
      await loadOfflineOrders();

    } catch (error) {
      console.error('Failed to cleanup duplicates:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to remove duplicate orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSyncedOrders = async () => {
    try {
      setIsLoading(true);
      await offlineOrderManager.clearSyncedOrders();
      await loadOfflineOrders();
      
      toast({
        title: "Synced Orders Cleared",
        description: "Successfully cleared synced orders from local storage",
        duration: 3000,
      });

    } catch (error) {
      console.error('Failed to clear synced orders:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear synced orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOfflineOrders();
    }
  }, [user]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOrderStatusBadge = (order: OfflineOrder) => {
    if (order.synced) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Synced</Badge>;
    }
    
    if ((order.syncAttempts || 0) >= 3) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    
    if ((order.syncAttempts || 0) > 0) {
      return <Badge variant="secondary">Retrying</Badge>;
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  const unsyncedOrders = offlineOrders.filter(order => !order.synced);
  const syncedOrders = offlineOrders.filter(order => order.synced);
  const failedOrders = offlineOrders.filter(order => !order.synced && (order.syncAttempts || 0) >= 3);

  return (
    <div className="space-y-6">
      {/* Sync Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            Order Sync Status
          </CardTitle>
          <CardDescription>
            {isOnline ? 'Connected - Orders will sync automatically' : 'Offline - Orders will sync when connection is restored'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Pending: {pendingOrdersCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Synced: {syncedOrders.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Failed: {failedOrders.length}</span>
            </div>
          </div>

          {lastSyncTime && (
            <p className="text-sm text-muted-foreground">
              Last sync: {formatTimestamp(lastSyncTime)}
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={forceSyncNow}
              disabled={!isOnline || isSyncing || isLoading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>

            <Button
              onClick={handleCleanupDuplicates}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Clean Duplicates
            </Button>

            <Button
              onClick={handleClearSyncedOrders}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Clear Synced
            </Button>
          </div>

          {syncErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-red-800">Sync Errors</h4>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {syncErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
                <Button onClick={clearSyncErrors} variant="ghost" size="sm">
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Offline Orders ({offlineOrders.length})</CardTitle>
          <CardDescription>
            Orders created while offline and their sync status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading orders...</span>
            </div>
          ) : offlineOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No offline orders found
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {offlineOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">
                          Order {order.offlineId.slice(-8)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(order.timestamp)}
                        </p>
                      </div>
                      {getOrderStatusBadge(order)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Items: </span>
                        {order.items.length}
                      </div>
                      <div>
                        <span className="font-medium">Total: </span>
                        KSh {order.totalAmount.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Payment: </span>
                        {order.paymentMethod}
                      </div>
                      <div>
                        <span className="font-medium">Customer: </span>
                        {order.customerName || 'Walk-in'}
                      </div>
                    </div>

                    {order.syncAttempts > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Sync attempts: {order.syncAttempts}
                        {order.lastSyncAttempt && (
                          <span className="ml-2">
                            (Last: {formatTimestamp(order.lastSyncAttempt)})
                          </span>
                        )}
                      </div>
                    )}

                    <Separator className="my-2" />
                    
                    <div className="text-xs space-y-1">
                      <div><strong>Items:</strong></div>
                      {order.items.map((item, index) => (
                        <div key={index} className="ml-2">
                          {item.productName} × {item.quantity} @ KSh {item.sellingPrice}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
