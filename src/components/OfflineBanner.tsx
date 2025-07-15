import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';
import { cn } from '@/lib/utils';

export const OfflineBanner = () => {
  const { 
    isOnline, 
    syncInProgress, 
    queuedOperations, 
    lastSyncTime, 
    stats,
    forceSync,
    error 
  } = useOfflineFirst();

  const [isVisible, setIsVisible] = useState(false);
  const [lastOnlineState, setLastOnlineState] = useState(isOnline);

  // Show/hide banner based on state changes
  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    } else if (lastOnlineState === false && isOnline) {
      // Just came back online - show briefly then hide
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 3000);
    } else if (queuedOperations > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
    
    setLastOnlineState(isOnline);
  }, [isOnline, queuedOperations, lastOnlineState]);

  // Auto-hide success states
  useEffect(() => {
    if (isOnline && queuedOperations === 0 && !syncInProgress) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queuedOperations, syncInProgress]);

  if (!isVisible) return null;

  const getBannerContent = () => {
    if (!isOnline) {
      return {
        variant: 'destructive' as const,
        icon: WifiOff,
        title: 'Working Offline',
        description: `${stats.cached.products + stats.cached.customers + stats.cached.sales} items cached. Changes will sync automatically when back online.`,
        showQueueBadge: queuedOperations > 0
      };
    }

    if (syncInProgress) {
      return {
        variant: 'default' as const,
        icon: Loader2,
        title: 'Syncing Data',
        description: `Synchronizing ${queuedOperations} pending operations...`,
        showQueueBadge: false,
        iconSpin: true
      };
    }

    if (error) {
      return {
        variant: 'destructive' as const,
        icon: AlertCircle,
        title: 'Sync Error',
        description: error,
        showQueueBadge: queuedOperations > 0
      };
    }

    if (queuedOperations > 0) {
      return {
        variant: 'default' as const,
        icon: Clock,
        title: 'Pending Sync',
        description: `${queuedOperations} operations waiting to sync`,
        showQueueBadge: true
      };
    }

    if (lastSyncTime) {
      const timeSinceSync = Date.now() - lastSyncTime.getTime();
      const secondsAgo = Math.floor(timeSinceSync / 1000);
      
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        title: 'Sync Complete',
        description: `All data synchronized ${secondsAgo < 60 ? 'just now' : `${Math.floor(secondsAgo / 60)}m ago`}`,
        showQueueBadge: false
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  const IconComponent = content.icon;

  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Alert className={cn(
        "rounded-none border-x-0 border-t-0",
        content.variant === 'destructive' && "border-destructive/50 bg-destructive/10"
      )}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <IconComponent 
              className={cn(
                "h-4 w-4",
                content.iconSpin && "animate-spin",
                content.variant === 'destructive' && "text-destructive"
              )} 
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {content.title}
                </span>
                
                {content.showQueueBadge && queuedOperations > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {queuedOperations} queued
                  </Badge>
                )}
                
                {stats.queued.high > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.queued.high} priority
                  </Badge>
                )}
              </div>
              
              <AlertDescription className="text-xs text-muted-foreground mt-0.5">
                {content.description}
              </AlertDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Queue breakdown */}
            {queuedOperations > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                {stats.queued.high > 0 && (
                  <span className="text-destructive">H:{stats.queued.high}</span>
                )}
                {stats.queued.medium > 0 && (
                  <span className="text-orange-500">M:{stats.queued.medium}</span>
                )}
                {stats.queued.low > 0 && (
                  <span>L:{stats.queued.low}</span>
                )}
              </div>
            )}

            {/* Actions */}
            {isOnline && !syncInProgress && (
              <Button
                variant="outline"
                size="sm"
                onClick={forceSync}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Now
              </Button>
            )}

            {/* Connection status indicator */}
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-destructive" />
              )}
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
};