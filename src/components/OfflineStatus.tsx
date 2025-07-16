
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OfflineStatusProps {
  className?: string;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncing(true);
      
      // Simulate sync process
      setTimeout(() => {
        setSyncing(false);
        setQueuedActions(0);
        setLastSync(new Date());
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncing(false);
    };

    // Check for queued actions
    const checkQueuedActions = async () => {
      try {
        const db = await openDB();
        const transaction = db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const count = await store.count();
        setQueuedActions(count);
      } catch (error) {
        console.error('Error checking queued actions:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check queued actions periodically
    checkQueuedActions();
    const interval = setInterval(checkQueuedActions, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queuedActions === 0 && !syncing) {
    return null; // Don't show anything when online with no pending actions
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className={`px-4 py-2 text-sm font-medium text-center transition-all duration-300 ${
        isOnline 
          ? syncing 
            ? 'bg-blue-500 text-white' 
            : 'bg-green-500 text-white'
          : 'bg-orange-500 text-white'
      }`}>
        <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
          {isOnline ? (
            syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Syncing {queuedActions} actions...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>All data synced</span>
                {lastSync && (
                  <span className="text-xs opacity-80">
                    • Last sync: {lastSync.toLocaleTimeString()}
                  </span>
                )}
              </>
            )
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Working Offline</span>
              {queuedActions > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  {queuedActions} queued
                </Badge>
              )}
              <span className="text-xs opacity-80 ml-2">
                • Changes will sync when back online
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Spacer to prevent content from being hidden behind the banner */}
      <div className="h-10"></div>
    </div>
  );
};

// Helper function to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaSmartOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
  });
};

export default OfflineStatus;
