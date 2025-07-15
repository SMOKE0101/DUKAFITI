
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';

const OfflineBanner: React.FC = () => {
  const { isOnline, queuedOperations } = useOfflineFirst();

  if (isOnline && queuedOperations === 0) {
    return null;
  }

  return (
    <Alert className={`mb-4 ${isOnline ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-blue-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-600" />
        )}
        <AlertDescription className={isOnline ? 'text-blue-800' : 'text-orange-800'}>
          {isOnline ? (
            queuedOperations > 0 ? (
              `Connected - Syncing ${queuedOperations} pending operation${queuedOperations > 1 ? 's' : ''}...`
            ) : (
              'Connected and synced'
            )
          ) : (
            'Working offline - Changes will sync when connection is restored'
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default OfflineBanner;
