
import { useState, useEffect } from 'react';

interface NotificationState {
  unreadCount: number;
  lastViewedAt: number;
  notificationIds: string[];
}

export const useNotificationState = () => {
  const [notificationState, setNotificationState] = useState<NotificationState>(() => {
    const saved = localStorage.getItem('notification-state');
    return saved ? JSON.parse(saved) : {
      unreadCount: 0,
      lastViewedAt: Date.now(),
      notificationIds: []
    };
  });

  const updateNotificationState = (newState: Partial<NotificationState>) => {
    const updated = { ...notificationState, ...newState };
    setNotificationState(updated);
    localStorage.setItem('notification-state', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    updateNotificationState({
      unreadCount: 0,
      lastViewedAt: Date.now()
    });
  };

  const setUnreadCount = (count: number, ids: string[] = []) => {
    // Only update if the count has actually changed or we have new IDs
    if (count !== notificationState.unreadCount || 
        JSON.stringify(ids.sort()) !== JSON.stringify(notificationState.notificationIds.sort())) {
      updateNotificationState({
        unreadCount: count,
        notificationIds: ids
      });
    }
  };

  const hasNewNotifications = (currentIds: string[]) => {
    const currentTime = Date.now();
    const timeSinceLastView = currentTime - notificationState.lastViewedAt;
    
    // If it's been less than 1 second since last view, don't show as new
    if (timeSinceLastView < 1000) return false;
    
    return currentIds.some(id => !notificationState.notificationIds.includes(id));
  };

  return {
    notificationState,
    markAllAsRead,
    setUnreadCount,
    hasNewNotifications
  };
};
