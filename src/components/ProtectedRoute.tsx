import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();
  const [lastKnownUser, setLastKnownUser] = useState(null);

  // Store user info when online for offline access
  useEffect(() => {
    if (user && isOnline) {
      localStorage.setItem('lastKnownUser', JSON.stringify({
        id: user.id,
        email: user.email,
        timestamp: Date.now()
      }));
      setLastKnownUser(user);
    }
  }, [user, isOnline]);

  // Load last known user when offline
  useEffect(() => {
    if (!user && !isOnline && !loading) {
      try {
        const stored = localStorage.getItem('lastKnownUser');
        if (stored) {
          const userData = JSON.parse(stored);
          // Allow access if user was authenticated within last 7 days
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - userData.timestamp < sevenDaysMs) {
            console.log('[ProtectedRoute] Allowing offline access for cached user');
            setLastKnownUser(userData);
            return;
          }
        }
      } catch (error) {
        console.error('[ProtectedRoute] Error loading cached user:', error);
      }
      
      // Only redirect to signin if online and no cached user
      if (isOnline) {
        navigate('/signin');
      }
    }
  }, [user, loading, navigate, isOnline]);

  // Redirect to signin only when online and no user
  useEffect(() => {
    if (!loading && !user && !lastKnownUser && isOnline) {
      navigate('/signin');
    }
  }, [user, loading, navigate, isOnline, lastKnownUser]);

  if (loading && isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show offline loading while trying to authenticate
  if (loading && !isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offline data...</p>
        </div>
      </div>
    );
  }

  // If online and no user, show redirecting message
  if (!user && !lastKnownUser && isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Allow access if user exists (online) or last known user exists (offline)
  if (user || lastKnownUser) {
    return <>{children}</>;
  }

  // Offline with no cached user - show offline message
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">
          Please connect to the internet to sign in to DukaFiti.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;