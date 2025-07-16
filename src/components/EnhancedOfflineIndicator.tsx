
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { cn } from '@/lib/utils';

const EnhancedOfflineIndicator: React.FC = () => {
  const { 
    isOnline, 
    isSyncing, 
    pendingOperations, 
    syncProgress, 
    lastSyncTime,
    errors 
  } = useOfflineManager();

  const getStatusColor = () => {
    if (errors.length > 0) return 'destructive';
    if (!isOnline) return 'secondary';
    if (isSyncing) return 'default';
    return 'default';
  };

  const getStatusText = () => {
    if (errors.length > 0) return `${errors.length} Sync Error${errors.length > 1 ? 's' : ''}`;
    if (isSyncing) return `Syncing... ${syncProgress}%`;
    if (!isOnline && pendingOperations > 0) return `Offline - ${pendingOperations} Pending`;
    if (!isOnline) return 'Offline Mode';
    if (pendingOperations > 0) return `${pendingOperations} Pending`;
    return 'Online';
  };

  const getIcon = () => {
    if (errors.length > 0) return <AlertTriangle className="w-3 h-3" />;
    if (isSyncing) return <RefreshCw className="w-3 h-3 animate-spin" />;
    if (!isOnline) return <WifiOff className="w-3 h-3" />;
    if (pendingOperations === 0) return <CheckCircle className="w-3 h-3" />;
    return <Wifi className="w-3 h-3" />;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={getStatusColor()}
        className={cn(
          "flex items-center gap-1 text-xs font-medium transition-all duration-200",
          errors.length > 0 && "bg-red-100 text-red-700 border-red-200",
          !isOnline && errors.length === 0 && "bg-orange-100 text-orange-700 border-orange-200",
          isOnline && pendingOperations === 0 && errors.length === 0 && "bg-green-100 text-green-700 border-green-200"
        )}
      >
        {getIcon()}
        <span>{getStatusText()}</span>
      </Badge>

      {lastSyncTime && (
        <span className="text-xs text-muted-foreground">
          Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default EnhancedOfflineIndicator;
