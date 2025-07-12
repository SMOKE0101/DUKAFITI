
import React, { useState, useEffect } from 'react';
import { Bell, Package, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useProductQueries } from '@/hooks/products/useProductQueries';
import { Product } from '@/types';

interface LowStockNotification {
  id: string;
  type: 'inventory';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  productId: string;
}

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const { products, loading } = useProductQueries();
  const [notifications, setNotifications] = useState<LowStockNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Generate low stock notifications from products
  useEffect(() => {
    if (!loading && products.length > 0) {
      const lowStockProducts = products.filter((product: Product) => 
        product.low_stock_threshold != null && 
        product.current_stock <= product.low_stock_threshold
      );

      const lowStockNotifications: LowStockNotification[] = lowStockProducts.map(product => ({
        id: product.id,
        type: 'inventory' as const,
        title: 'Low Stock Alert',
        message: `${product.name} has only ${product.current_stock} units remaining (threshold: ${product.low_stock_threshold})`,
        timestamp: new Date(product.updatedAt),
        read: false,
        productId: product.id,
      }));

      setNotifications(lowStockNotifications);
    }
  }, [products, loading]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className={cn("relative", className)}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:bg-white/10 relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Low Stock Alerts</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="max-h-96">
              {notifications.length > 0 ? (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer relative group",
                        !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Package className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No low stock alerts</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};
