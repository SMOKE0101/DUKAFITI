
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const OfflineStatus: React.FC = () => {
  const { syncStatus, conflicts, forceSyncNow, resolveConflict } = useOfflineSync();

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'bg-orange-100 border-orange-200 text-orange-800';
    if (syncStatus.isSyncing) return 'bg-blue-100 border-blue-200 text-blue-800';
    if (syncStatus.queuedActions > 0) return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    return 'bg-green-100 border-green-200 text-green-800';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="w-4 h-4" />;
    if (syncStatus.isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (syncStatus.queuedActions > 0) return <Clock className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return syncStatus.queuedActions > 0 
        ? `Offline Mode - ${syncStatus.queuedActions} actions queued`
        : 'Offline Mode - All changes saved locally';
    }
    if (syncStatus.isSyncing) {
      return `Syncing... ${syncStatus.syncProgress}%`;
    }
    if (syncStatus.queuedActions > 0) {
      return `${syncStatus.queuedActions} actions pending sync`;
    }
    return 'Online - All data synchronized';
  };

  return (
    <div className="space-y-2">
      {/* Main Status Banner */}
      <Alert className={getStatusColor()}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <AlertDescription className="font-medium">
              {getStatusText()}
            </AlertDescription>
          </div>
          
          {syncStatus.isOnline && syncStatus.queuedActions > 0 && !syncStatus.isSyncing && (
            <Button
              size="sm"
              variant="outline"
              onClick={forceSyncNow}
              className="ml-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Sync Now
            </Button>
          )}
        </div>

        {/* Sync Progress Bar */}
        {syncStatus.isSyncing && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncStatus.syncProgress}%` }}
            />
          </div>
        )}
      </Alert>

      {/* Sync Errors */}
      {syncStatus.errors.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <div className="text-red-800">
              <strong>Sync Issues:</strong>
              <ul className="mt-1 text-sm">
                {syncStatus.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {syncStatus.errors.length > 3 && (
                  <li>• And {syncStatus.errors.length - 3} more...</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription>
            <div className="text-yellow-800">
              <strong>Data Conflicts Detected:</strong>
              <div className="mt-2 space-y-2">
                {conflicts.slice(0, 2).map((conflict) => (
                  <div key={conflict.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm">
                      {conflict.type}: Changes made both locally and on server
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'local')}
                      >
                        Keep Local
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveConflict(conflict.id, 'server')}
                      >
                        Use Server
                      </Button>
                    </div>
                  </div>
                ))}
                {conflicts.length > 2 && (
                  <div className="text-sm text-yellow-700">
                    And {conflicts.length - 2} more conflicts...
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Last Sync Time */}
      {syncStatus.lastSyncTime && (
        <div className="text-xs text-muted-foreground text-center">
          Last synchronized: {syncStatus.lastSyncTime.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default OfflineStatus;
