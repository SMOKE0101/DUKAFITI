
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Moon, 
  Sun, 
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUnifiedSyncManager } from '../../hooks/useUnifiedSyncManager';
import UserMenu from '../UserMenu';

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { isOnline, pendingOperations, syncPendingOperations } = useUnifiedSyncManager();

  const handleSync = () => {
    if (isOnline) {
      syncPendingOperations();
    }
  };

  const handleThemeToggle = () => {
    console.log('TopBar theme toggle - current theme:', theme);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('TopBar setting theme to:', newTheme);
    setTheme(newTheme);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          
          {/* Network Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:inline">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:inline">Offline</span>
              </div>
            )}
            
            {pendingOperations > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingOperations} pending
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Button */}
          {pendingOperations > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={!isOnline}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">
                Sync
              </span>
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            {pendingOperations > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThemeToggle}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
