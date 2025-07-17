
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  X
} from 'lucide-react';
import { useSyncContext } from './SyncStatusProvider';
import { cn } from '@/lib/utils';

export const UnifiedSyncIndicator: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingOperations,
    lastSyncTime,
    syncProgress,
    errors,
    completedOperations,
    forceSyncNow,
    clearSyncErrors
  } = useSyncContext();

  const getStatusColor = () => {
    if (errors.length > 0) return 'destructive';
    if (!isOnline) return 'secondary';
    if (isSyncing) return 'default';
    if (pendingOperations === 0) return 'default';
    return 'outline';
  };

  const getStatusText = () => {
    if (isSyncing) return `Syncing... ${completedOperations}/${completedOperations + pendingOperations}`;
    if (errors.length > 0) return `${errors.length} Sync Error${errors.length > 1 ? 's' : ''}`;
    if (!isOnline && pendingOperations > 0) return `Offline - ${pendingOperations} Pending`;
    if (!isOnline) return 'Offline Mode';
    if (pendingOperations > 0) return `${pendingOperations} Pending`;
    return 'All Synced';
  };

  const getIcon = () => {
    if (isSyncing) return <RefreshCw className="w-3 h-3 animate-spin" />;
    if (errors.length > 0) return <AlertTriangle className="w-3 h-3" />;
    if (!isOnline) return <WifiOff className="w-3 h-3" />;
    if (pendingOperations === 0) return <CheckCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={getStatusColor()}
        className={cn(
          "flex items-center gap-1 text-xs font-medium transition-all duration-200",
          errors.length > 0 && "bg-red-100 text-red-700 border-red-200",
          !isOnline && errors.length === 0 && "bg-orange-100 text-orange-700 border-orange-200",
          isOnline && pendingOperations === 0 && errors.length === 0 && "bg-green-100 text-green-700 border-green-200",
          isSyncing && "bg-blue-100 text-blue-700 border-blue-200"
        )}
      >
        {getIcon()}
        <span>{getStatusText()}</span>
      </Badge>

      {isOnline && !isSyncing && pendingOperations > 0 && (
        <Button
          onClick={forceSyncNow}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sync Now
        </Button>
      )}

      {lastSyncTime && (
        <span className="text-xs text-muted-foreground">
          Last: {new Date(lastSyncTime).toLocaleTimeString()}
        </span>
      )}

      {/* Sync Progress Overlay */}
      {isSyncing && (
        <Card className="fixed top-4 right-4 z-50 w-80 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Syncing Data...</h4>
              <Badge variant="outline" className="text-xs">
                {completedOperations}/{completedOperations + pendingOperations}
              </Badge>
            </div>
            <Progress value={syncProgress} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {completedOperations} operations completed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="fixed top-4 right-4 z-50 w-80 shadow-lg border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-red-800">Sync Errors</h4>
              <Button
                onClick={clearSyncErrors}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <ul className="text-xs text-red-700 space-y-1">
              {errors.slice(0, 3).map((error, index) => (
                <li key={index} className="truncate">{error}</li>
              ))}
              {errors.length > 3 && (
                <li className="text-xs text-red-600">
                  +{errors.length - 3} more errors
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
