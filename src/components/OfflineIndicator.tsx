
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
  Loader2
} from 'lucide-react';
import { useRobustOfflineManager } from '../hooks/useRobustOfflineManager';

const OfflineIndicator: React.FC = () => {
  const {
    isOnline,
    isInitialized,
    isSyncing,
    pendingOperations,
    syncProgress,
    lastSyncTime,
    errors,
    forceSyncNow,
    clearSyncErrors,
    testRobustOffline
  } = useRobustOfflineManager();

  const handleTestOffline = async () => {
    const result = await testRobustOffline();
    console.log('Robust Offline Test Result:', result);
  };

  if (!isInitialized) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Initializing enhanced offline system...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border transition-all duration-300 ${
      isOnline 
        ? 'border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20' 
        : 'border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20'
    }`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Online - Enhanced Mode
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Offline Mode - Enhanced
                  </span>
                </>
              )}
            </div>

            {/* Sync Status */}
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {syncProgress}%
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
                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-muted-foreground dark:text-slate-400">
                  Pending Operations
                </span>
              </div>
              <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {pendingOperations}
              </Badge>
            </div>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground dark:text-slate-500" />
              <span className="text-xs text-muted-foreground dark:text-slate-400">
                Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {errors.length} sync error{errors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="max-h-20 overflow-y-auto">
                {errors.map((error, index) => (
                  <p key={index} className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={clearSyncErrors}
                className="text-xs h-6 px-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear Errors
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isOnline && pendingOperations > 0 && (
              <Button
                size="sm"
                onClick={forceSyncNow}
                disabled={isSyncing}
                className="text-xs h-7 px-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Now
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestOffline}
              className="text-xs h-7 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Test Enhanced
            </Button>
          </div>

          {/* Status Message */}
          <p className="text-xs text-muted-foreground dark:text-slate-400">
            {isOnline 
              ? "Enhanced offline mode ready. Data syncs automatically with smart caching."
              : "Working offline with enhanced functionality. Changes sync when connection restores."
            }
          </p>
        </div>
      </CardContent>
    </Card>  
  );
};

export default OfflineIndicator;
