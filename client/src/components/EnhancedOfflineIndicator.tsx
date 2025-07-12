
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database
} from 'lucide-react';
import { useEnhancedOfflineSync } from '../hooks/useEnhancedOfflineSync';

const EnhancedOfflineIndicator: React.FC = () => {
  const { syncStatus, forceSyncNow, clearSyncErrors } = useEnhancedOfflineSync();

  if (syncStatus.isOnline && syncStatus.pendingOperations === 0 && syncStatus.errors.length === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'bg-red-50 border-red-200';
    if (syncStatus.isSyncing) return 'bg-blue-50 border-blue-200';
    if (syncStatus.errors.length > 0) return 'bg-orange-50 border-orange-200';
    if (syncStatus.pendingOperations > 0) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="w-4 h-4 text-red-600" />;
    if (syncStatus.isSyncing) return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    if (syncStatus.errors.length > 0) return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    if (syncStatus.pendingOperations > 0) return <Clock className="w-4 h-4 text-yellow-600" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const getStatusMessage = () => {
    if (!syncStatus.isOnline) {
      return 'You are offline. Changes are saved locally and will sync when connection is restored.';
    }
    if (syncStatus.isSyncing) {
      return `Syncing data... ${syncStatus.syncProgress}%`;
    }
    if (syncStatus.errors.length > 0) {
      return `Sync issues detected. ${syncStatus.errors.length} error(s) need attention.`;
    }
    if (syncStatus.pendingOperations > 0) {
      return `${syncStatus.pendingOperations} operations pending sync.`;
    }
    return 'All data is synced.';
  };

  return (
    <div className="space-y-2">
      <Alert className={`${getStatusColor()} transition-all duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <AlertDescription className="text-sm font-medium">
                {getStatusMessage()}
              </AlertDescription>
              
              {syncStatus.lastSyncTime && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Database className="w-3 h-3" />
                  Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncStatus.pendingOperations > 0 && (
              <Badge variant="secondary" className="text-xs">
                {syncStatus.pendingOperations} pending
              </Badge>
            )}

            {syncStatus.errors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {syncStatus.errors.length} errors
              </Badge>
            )}

            {syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingOperations > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={forceSyncNow}
                className="h-7 px-3 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
            )}

            {syncStatus.errors.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearSyncErrors}
                className="h-7 px-3 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {syncStatus.isSyncing && (
          <div className="mt-3">
            <Progress value={syncStatus.syncProgress} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              Syncing operations... {syncStatus.syncProgress}%
            </div>
          </div>
        )}

        {syncStatus.errors.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs font-medium text-orange-800">Recent Errors:</div>
            {syncStatus.errors.slice(0, 3).map((error, index) => (
              <div key={index} className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                {error}
              </div>
            ))}
            {syncStatus.errors.length > 3 && (
              <div className="text-xs text-orange-600">
                +{syncStatus.errors.length - 3} more errors...
              </div>
            )}
          </div>
        )}
      </Alert>
    </div>
  );
};

export default EnhancedOfflineIndicator;
