import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to manage app state restoration for mobile environments
 * Handles scenarios where the app is backgrounded and restored
 */
export const useAppStateManager = () => {
  const { session, user } = useAuth();
  const lastActiveTime = useRef<number>(Date.now());
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleAppStateChange = () => {
      // Update last active time when app becomes active
      lastActiveTime.current = Date.now();
      
      // Log session status
      console.log('[AppStateManager] App became active, session:', !!session, 'user:', !!user);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleAppStateChange();
        
        // Check if we need to refresh the session after being hidden for too long
        const timeSinceLastActive = Date.now() - lastActiveTime.current;
        const FIVE_MINUTES = 5 * 60 * 1000;
        
        if (timeSinceLastActive > FIVE_MINUTES && session) {
          console.log('[AppStateManager] App was hidden for a while, checking session validity');
          // Session will be automatically validated by Supabase client
        }
      }
    };

    const handleFocus = () => {
      handleAppStateChange();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // Handle page show event (important for mobile browsers)
      if (event.persisted) {
        console.log('[AppStateManager] Page restored from cache');
        handleAppStateChange();
      }
    };

    // Add event listeners for different app state scenarios
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    // Set up periodic session validation for mobile
    sessionCheckInterval.current = setInterval(() => {
      if (session && document.visibilityState === 'visible') {
        // This will trigger token refresh if needed
        const currentTime = Date.now();
        console.log('[AppStateManager] Periodic session check', {
          hasSession: !!session,
          hasUser: !!user,
          timestamp: new Date(currentTime).toISOString()
        });
      }
    }, 60000); // Check every minute when app is active

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [session, user]);

  return {
    isSessionActive: !!session && !!user,
    lastActiveTime: lastActiveTime.current,
  };
};