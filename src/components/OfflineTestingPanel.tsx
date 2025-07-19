
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useUnifiedOfflineManager } from '../hooks/useUnifiedOfflineManager';

const OfflineTestingPanel: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const { pendingOperations, syncPendingOperations } = useUnifiedOfflineManager();

  const handleTestOffline = () => {
    if ('serviceWorker' in navigator) {
      // Simulate going offline by using service worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'SIMULATE_OFFLINE' });
        }
      });
    }
  };

  const handleTestOnline = () => {
    if ('serviceWorker' in navigator) {
      // Simulate going online by using service worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'SIMULATE_ONLINE' });
        }
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Offline Testing Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Network Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Pending Operations:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {pendingOperations}
          </span>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleTestOffline} 
            variant="outline" 
            className="w-full"
            disabled={!isOnline}
          >
            Simulate Offline
          </Button>
          
          <Button 
            onClick={handleTestOnline} 
            variant="outline" 
            className="w-full"
            disabled={isOnline}
          >
            Simulate Online
          </Button>
          
          <Button 
            onClick={syncPendingOperations} 
            className="w-full"
            disabled={!isOnline || pendingOperations === 0}
          >
            Sync Pending Operations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineTestingPanel;
