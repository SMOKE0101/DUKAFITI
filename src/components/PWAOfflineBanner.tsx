
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { usePWAOffline } from '@/hooks/usePWAOffline';

const PWAOfflineBanner: React.FC = () => {
  const { 
    isOnline, 
    isInstalled, 
    updateAvailable, 
    syncInProgress,
    cacheStatus,
    showInstallPrompt,
    forceSyncNow,
    preCacheData
  } = usePWAOffline();

  // Don't show banner if everything is normal
  if (isOnline && !updateAvailable && !syncInProgress && cacheStatus === 'ready') {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4 text-orange-600" />,
        message: "You're offline - Changes will sync when connection is restored",
        color: "border-orange-200 bg-orange-50 text-orange-800"
      };
    }
    
    if (syncInProgress) {
      return {
        icon: <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />,
        message: "Syncing offline changes...",
        color: "border-blue-200 bg-blue-50 text-blue-800"
      };
    }
    
    if (updateAvailable) {
      return {
        icon: <Download className="h-4 w-4 text-green-600" />,
        message: "App update available",
        color: "border-green-200 bg-green-50 text-green-800"
      };
    }
    
    if (cacheStatus === 'loading') {
      return {
        icon: <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />,
        message: "Preparing app for offline use...",
        color: "border-blue-200 bg-blue-50 text-blue-800"
      };
    }
    
    if (cacheStatus === 'error') {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        message: "Offline features may not work properly",
        color: "border-red-200 bg-red-50 text-red-800"
      };
    }
    
    return null;
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <Alert className={`mb-4 ${statusInfo.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <AlertDescription>{statusInfo.message}</AlertDescription>
        </div>
        
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={preCacheData}
              disabled={syncInProgress}
            >
              Cache Data
            </Button>
          )}
          
          {isOnline && !isInstalled && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={showInstallPrompt}
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>
          )}
          
          {isOnline && syncInProgress && (
            <Button 
              variant="outline" 
              size="sm"
              disabled
            >
              Syncing...
            </Button>
          )}
          
          {isOnline && !syncInProgress && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={forceSyncNow}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync
            </Button>
          )}
          
          {updateAvailable && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Update
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default PWAOfflineBanner;
