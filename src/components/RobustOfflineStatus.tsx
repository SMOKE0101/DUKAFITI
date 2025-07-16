
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  Database,
  Queue
} from 'lucide-react';
import { useRobustOfflineManager } from '../hooks/useRobustOfflineManager';

const RobustOfflineStatus = () => {
  const { 
    offlineState, 
    pendingActions, 
    forceSyncNow, 
    clearSyncErrors,
    hasPendingActions 
  } = useRobustOfflineManager();

  // Don't show when everything is normal and online
  if (offlineState.isOnline && !hasPendingActions && offlineState.errors.length === 0) {
    return null;
  }

  const handleSync = () => {
    if (offlineState.isOnline && !offlineState.isSyncing) {
      forceSyncNow();
    }
  };

  const getStatusColor = () => {
    if (!offlineState.isOnline) return 'border-orange-200 bg-orange-50';
    if (offlineState.errors.length > 0) return 'border-red-200 bg-red-50';
    if (hasPendingActions) return 'border-blue-200 bg-blue-50';
    return 'border-green-200 bg-green-50';
  };

  const getStatusIcon = () => {
    if (!offlineState.isOnline) return <WifiOff className="h-4 w-4 text-orange-600" />;
    if (offlineState.errors.length > 0) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (hasPendingActions) return <Clock className="h-4 w-4 text-blue-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (!offlineState.isOnline) return 'Offline Mode';
    if (offlineState.isSyncing) return 'Syncing...';
    if (offlineState.errors.length > 0) return 'Sync Errors';
    if (hasPendingActions) return 'Pending Sync';
    return 'Online';
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className={`border-2 shadow-lg ${getStatusColor()}`}>
        <CardContent className="pt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium text-sm">{getStatusText()}</span>
            </div>
            
            {hasPendingActions && (
              <Badge variant="outline" className="bg-blue-100">
                {offlineState.pendingOperations} pending
              </Badge>
            )}
          </div>

          {/* Sync Progress */}
          {offlineState.isSyncing && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Syncing operations...</span>
                <span>{offlineState.syncProgress}%</span>
              </div>
              <Progress value={offlineState.syncProgress} className="h-2" />
            </div>
          )}

          {/* Pending Actions */}
          {hasPendingActions && !offlineState.isSyncing && (
            <div className="mb-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Queue className="h-3 w-3" />
                <span>Queued actions:</span>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {pendingActions.slice(0, 4).map((action) => (
                  <div key={action.id} className="flex items-center justify-between text-xs">
                    <span className="capitalize truncate flex-1">
                      {action.operation} {action.type}
                    </span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {action.priority}
                    </Badge>
                  </div>
                ))}
                {pendingActions.length > 4 && (
                  <div className="text-xs text-muted-foreground">
                    +{pendingActions.length - 4} more actions
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Errors */}
          {offlineState.errors.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
                <AlertCircle className="h-3 w-3" />
                <span>Sync errors ({offlineState.errors.length}):</span>
              </div>
              <div className="text-xs text-red-600 max-h-16 overflow-y-auto">
                {offlineState.errors.slice(0, 2).map((error, index) => (
                  <div key={index} className="truncate">{error}</div>
                ))}
                {offlineState.errors.length > 2 && (
                  <div className="text-muted-foreground">
                    +{offlineState.errors.length - 2} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Stats (when offline) */}
          {!offlineState.isOnline && Object.keys(offlineState.dataStats).length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Database className="h-3 w-3" />
                <span>Cached data:</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(offlineState.dataStats).map(([key, count]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            {/* Last Sync Time */}
            {offlineState.lastSyncTime && (
              <div className="text-xs text-muted-foreground">
                Last sync: {new Date(offlineState.lastSyncTime).toLocaleTimeString()}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
              {offlineState.errors.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearSyncErrors}
                  className="h-6 px-2 text-xs"
                >
                  Clear Errors
                </Button>
              )}
              
              {offlineState.isOnline && hasPendingActions && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSync}
                  disabled={offlineState.isSyncing}
                  className="h-6 px-2 text-xs"
                >
                  {offlineState.isSyncing ? (
                    <>
                      <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Sync Now
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Offline Message */}
          {!offlineState.isOnline && (
            <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
              <div className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                <span>Working offline. All features available. Changes will sync when online.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RobustOfflineStatus;
