
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useBackgroundSync } from '../hooks/useBackgroundSync';

const NetworkStatusIndicator: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const { pendingOperationsCount } = useBackgroundSync();

  if (isOnline && pendingOperationsCount === 0) {
    return null; // Don't show indicator when everything is normal
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isOnline ? "secondary" : "destructive"}
        className="flex items-center gap-1"
      >
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {isOnline ? "Online" : "Offline"}
      </Badge>
      
      {pendingOperationsCount > 0 && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {pendingOperationsCount} pending
        </Badge>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
