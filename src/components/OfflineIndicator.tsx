
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingOperations, isSyncing } = useOfflineSync();

  if (isOnline && pendingOperations.length === 0) {
    return null;
  }

  return (
    <Alert className={isOnline ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        <AlertDescription>
          {!isOnline ? (
            'You are offline. Changes will be saved locally and synced when connection is restored.'
          ) : pendingOperations.length > 0 ? (
            `${isSyncing ? 'Syncing' : 'Pending sync'}: ${pendingOperations.length} operations`
          ) : null}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default OfflineIndicator;
