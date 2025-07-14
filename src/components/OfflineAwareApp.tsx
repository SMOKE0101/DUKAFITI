import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';

interface OfflineAwareAppProps {
  children: React.ReactNode;
}

const OfflineAwareApp: React.FC<OfflineAwareAppProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    // Initialize offline awareness
    const initializeApp = async () => {
      setIsInitializing(false);
      
      // Show offline status if offline on initial load
      if (!navigator.onLine) {
        setShowOfflineAlert(true);
        setTimeout(() => setShowOfflineAlert(false), 5000);
      }
    };

    const handleOnline = () => {
      console.log('[OfflineAwareApp] Back online');
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      console.log('[OfflineAwareApp] Gone offline');
      setIsOnline(false);
      setShowOfflineAlert(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowOfflineAlert(false), 5000);
    };

    // Listen for online/offline changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize
    initializeApp();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading DukaFiti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Offline Status Badge - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-2 shadow-lg"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </Badge>
      </div>

      {/* Offline Alert - Dismissible */}
      {showOfflineAlert && !isOnline && (
        <div className="fixed top-16 right-4 left-4 z-40 max-w-md ml-auto">
          <Alert className="shadow-lg border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  <strong>Working Offline</strong> - All features available. Data will sync when online.
                </span>
                <button 
                  onClick={() => setShowOfflineAlert(false)}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main App Content */}
      {children}
    </div>
  );
};

export default OfflineAwareApp;