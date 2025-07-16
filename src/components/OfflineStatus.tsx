
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Zap
} from 'lucide-react';
import { useOfflineManager } from '../hooks/useOfflineManager';

const OfflineStatus: React.FC = () => {
  const { 
    isOnline, 
    isSyncing, 
    pendingOperations, 
    lastSyncTime, 
    syncErrors,
    forceSyncNow,
    clearSyncErrors
  } = useOfflineManager();

  // Don't show if online and no pending operations or errors
  if (isOnline && pendingOperations === 0 && syncErrors.length === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
    if (isSyncing) return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
    if (syncErrors.length > 0) return 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800';
    if (pendingOperations > 0) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
    return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />;
    if (syncErrors.length > 0) return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    if (pendingOperations > 0) return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
  };

  const getStatusMessage = () => {
    if (!isOnline) {
      return 'Offline Mode Active - All changes saved locally and will sync automatically when connection returns.';
    }
    if (isSyncing) {
      return 'Syncing data...';
    }
    if (syncErrors.length > 0) {
      return `Sync completed with ${syncErrors.length} issue(s) that need attention.`;
    }
    if (pendingOperations > 0) {
      return `${pendingOperations} operation(s) waiting to sync.`;
    }
    return 'All data synchronized successfully.';
  };

  return (
    <div className="space-y-2">
      <Alert className={`${getStatusColor()} transition-all duration-300 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <AlertDescription className="text-sm font-medium">
                {getStatusMessage()}
              </AlertDescription>
              
              {lastSyncTime && !isSyncing && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Database className="w-3 h-3" />
                  Last sync: {new Date(lastSyncTime).toLocaleString()}
                </div>
              )}

              {!isOnline && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Zap className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Offline-first technology active - Your work continues seamlessly
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingOperations > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {pendingOperations} pending
              </Badge>
            )}

            {syncErrors.length > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-1">
                {syncErrors.length} error{syncErrors.length > 1 ? 's' : ''}
              </Badge>
            )}

            {isOnline && !isSyncing && pendingOperations > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={forceSyncNow}
                className="h-7 px-3 text-xs font-medium"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
            )}

            {syncErrors.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearSyncErrors}
                className="h-7 px-3 text-xs"
              >
                Clear Errors
              </Button>
            )}
          </div>
        </div>

        {syncErrors.length > 0 && !isSyncing && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-orange-800 dark:text-orange-200">
              Recent Sync Issues:
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {syncErrors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-wrap">
                  {error}
                </div>
              ))}
              {syncErrors.length > 3 && (
                <div className="text-xs text-orange-600 dark:text-orange-400 italic">
                  +{syncErrors.length - 3} more error{syncErrors.length - 3 > 1 ? 's' : ''}...
                </div>
              )}
            </div>
          </div>
        )}
      </Alert>
    </div>
  );
};

export default OfflineStatus;
