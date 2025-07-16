import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Database,
  TestTube,
  Zap
} from 'lucide-react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { offlineDB } from '../utils/indexedDB';

const OfflineIndicator: React.FC = () => {
  const { 
    isOnline, 
    pendingOperations, 
    lastSyncTime, 
    syncErrors,
    forceSyncNow 
  } = useOfflineManager();
  
  const { 
    isInstalling, 
    updateAvailable, 
    triggerSync, 
    clearCache 
  } = useServiceWorker();

  const getStatusColor = () => {
    if (syncErrors.length > 0) return 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20';
    if (!isOnline) return 'border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20';
    if (isInstalling) return 'border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20';
    return 'border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20';
  };

  const testOffline = async () => {
    console.log('[OfflineIndicator] Testing offline functionality...');
    try {
      const testResult = await offlineDB.testOfflineCapabilities();
      console.log('[OfflineIndicator] IndexedDB test result:', testResult);
      
      triggerSync();
      
      console.log('[OfflineIndicator] Offline tests completed');
    } catch (error) {
      console.error('[OfflineIndicator] Testing failed:', error);
    }
  };

  return (
    <Card className={`border transition-all duration-300 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Online - Offline-First Ready
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Offline Mode - Data Available
                  </span>
                </>
              )}
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {isInstalling ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Installing...
                  </span>
                </>
              ) : updateAvailable ? (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    Update Available
                  </span>
                </>
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
          </div>

          {/* Pending Operations */}
          {pendingOperations > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  {pendingOperations} operation{pendingOperations !== 1 ? 's' : ''} pending
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {pendingOperations}
              </Badge>
            </div>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3 text-muted-foreground dark:text-slate-500" />
              <span className="text-xs text-muted-foreground dark:text-slate-400">
                Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Errors */}
          {syncErrors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {syncErrors.length} sync error{syncErrors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="max-h-16 overflow-y-auto">
                {syncErrors.slice(0, 2).map((error, index) => (
                  <p key={index} className="text-xs text-red-500 dark:text-red-400 truncate">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={forceSyncNow}
              disabled={!isOnline}
              className="text-xs h-7 px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={testOffline}
              className="text-xs h-7 px-3"
            >
              <TestTube className="h-3 w-3 mr-1" />
              Test
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={clearCache}
              className="text-xs h-7 px-3"
            >
              <Database className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Offline-First Message */}
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              {isOnline 
                ? "Offline-first mode active. Data loads from cache instantly, syncs in background."
                : "Working offline with cached data. Changes will sync when connection restores."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>  
  );
};

export default OfflineIndicator;
