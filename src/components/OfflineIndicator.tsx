
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

const OfflineIndicator = () => {
  const { isOnline, pendingOperations, isSyncing, syncPendingOperations } = useOfflineSync();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Show indicator when going offline or when there are pending operations
    if (!isOnline || pendingOperations.length > 0) {
      setShowDetails(true);
      const timer = setTimeout(() => setShowDetails(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOperations.length]);

  if (isOnline && pendingOperations.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`glass-card p-3 border-l-4 cursor-pointer transition-all duration-300 ${
          isOnline 
            ? 'border-dukafiti-green bg-dukafiti-green/10' 
            : 'border-orange-500 bg-orange-500/10'
        } ${showDetails ? 'min-w-64' : 'w-auto'}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            isOnline ? 'bg-dukafiti-green/20' : 'bg-orange-500/20'
          }`}>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-dukafiti-green" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-500" />
            )}
          </div>
          
          <div className="flex-1">
            <div className={`font-medium ${
              isOnline ? 'text-dukafiti-green' : 'text-orange-500'
            }`}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </div>
            {showDetails && (
              <div className="text-sm text-slate-300 mt-1">
                {pendingOperations.length > 0 ? (
                  <span>{pendingOperations.length} pending operations</span>
                ) : (
                  <span>All data synced</span>
                )}
              </div>
            )}
          </div>

          {isOnline && pendingOperations.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                syncPendingOperations();
              }}
              disabled={isSyncing}
              className="p-1 hover:bg-dukafiti-green/20 rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-dukafiti-green ${
                isSyncing ? 'animate-spin' : ''
              }`} />
            </button>
          )}
        </div>

        {showDetails && pendingOperations.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs text-slate-400 mb-2">Pending sync:</div>
            {pendingOperations.slice(0, 3).map((op) => (
              <div key={op.id} className="text-xs text-slate-300 bg-slate-800/50 rounded p-2">
                <span className="capitalize">{op.type}</span> operation
                <div className="text-slate-400">
                  {new Date(op.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {pendingOperations.length > 3 && (
              <div className="text-xs text-slate-400">
                +{pendingOperations.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
