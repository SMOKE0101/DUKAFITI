import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const OfflineHandler: React.FC = () => {
  const { isOnline, updateAvailable, skipWaiting, triggerSync } = useServiceWorker();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    } else {
      // Hide alert when back online, trigger sync
      setTimeout(() => setShowOfflineAlert(false), 3000);
      triggerSync();
    }
  }, [isOnline, triggerSync]);

  useEffect(() => {
    if (updateAvailable) {
      setShowUpdateAlert(true);
    }
  }, [updateAvailable]);

  const handleSync = async () => {
    setSyncing(true);
    triggerSync();
    setTimeout(() => setSyncing(false), 2000);
  };

  const handleUpdate = () => {
    skipWaiting();
    setShowUpdateAlert(false);
    window.location.reload();
  };

  return (
    <>
      {/* Update Available Alert */}
      {showUpdateAlert && (
        <Alert className="fixed top-4 left-4 right-4 z-50 bg-blue-50 border-blue-200">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>A new version is available!</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowUpdateAlert(false)}
              >
                Later
              </Button>
              <Button 
                size="sm" 
                onClick={handleUpdate}
              >
                Update Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Status Alert */}
      {showOfflineAlert && (
        <Alert className="fixed top-4 left-4 right-4 z-40 bg-orange-50 border-orange-200">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>You're offline. Data will sync when connection returns.</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowOfflineAlert(false)}
              >
                Dismiss
              </Button>
              <Button 
                size="sm" 
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Online Status Indicator (Top Right) */}
      <div className="fixed top-4 right-4 z-30">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
          isOnline 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Offline
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OfflineHandler;