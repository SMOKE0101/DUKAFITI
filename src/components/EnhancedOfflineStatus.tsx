
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Clock, Sync, AlertCircle } from 'lucide-react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useOfflineSync } from '../hooks/useOfflineSync';

const EnhancedOfflineStatus = () => {
  const { isOnline, pendingActions, hasPendingActions } = useOfflineManager();
  const { syncData, isSyncing, lastSyncTime, syncErrors } = useOfflineSync();

  if (isOnline && !hasPendingActions && syncErrors.length === 0) {
    return null; // Hide when everything is normal
  }

  const handleSync = () => {
    if (isOnline && !isSyncing) {
      syncData();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className={`border-2 ${
        !isOnline ? 'border-orange-200 bg-orange-50' : 
        hasPendingActions ? 'border-blue-200 bg-blue-50' : 
        'border-green-200 bg-green-50'
      }`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-600" />
              )}
              <span className="font-medium text-sm">
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            
            {hasPendingActions && (
              <Badge variant="outline" className="bg-blue-100">
                {pendingActions.length} pending
              </Badge>
            )}
          </div>

          {/* Pending Actions */}
          {hasPendingActions && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span>Queued for sync:</span>
              </div>
              <div className="space-y-1">
                {pendingActions.slice(0, 3).map((action) => (
                  <div key={action.id} className="flex items-center justify-between text-xs">
                    <span className="capitalize">
                      {action.operation} {action.type}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {action.priority}
                    </Badge>
                  </div>
                ))}
                {pendingActions.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{pendingActions.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Errors */}
          {syncErrors.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
                <AlertCircle className="h-3 w-3" />
                <span>Sync errors:</span>
              </div>
              <div className="text-xs text-red-600">
                {syncErrors[0]}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            {lastSyncTime && (
              <div className="text-xs text-muted-foreground">
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </div>
            )}
            
            {isOnline && hasPendingActions && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleSync}
                disabled={isSyncing}
                className="h-6 px-2 text-xs"
              >
                {isSyncing ? (
                  <>
                    <Sync className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Sync className="h-3 w-3 mr-1" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Offline Message */}
          {!isOnline && (
            <div className="mt-2 text-xs text-muted-foreground">
              Working offline. Changes will sync when online.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedOfflineStatus;
