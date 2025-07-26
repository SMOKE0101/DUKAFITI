
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import ModernLandingComponent from './ModernLanding';

// Force rebuild marker - version 2.0

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [hasCheckedCache, setHasCheckedCache] = useState(false);

  useEffect(() => {
    console.log('[Index] Auth state check:', { 
      user: !!user, 
      loading, 
      isOnline, 
      hasCheckedCache 
    });
    
    if (!loading && !hasCheckedCache) {
      setHasCheckedCache(true);
      
      // Check for cached user if no authenticated user
      if (!user) {
        try {
          const stored = localStorage.getItem('lastKnownUser');
          if (stored) {
            const userData = JSON.parse(stored);
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - userData.timestamp < sevenDaysMs) {
              console.log('[Index] Cached user found, redirecting to dashboard');
              navigate('/app/dashboard', { replace: true });
              return;
            } else {
              console.log('[Index] Cached user expired, removing from storage');
              localStorage.removeItem('lastKnownUser');
            }
          }
        } catch (error) {
          console.error('[Index] Error checking cached user:', error);
          localStorage.removeItem('lastKnownUser');
        }
      }
      
      // Route based on authentication status
      if (user) {
        console.log('[Index] Authenticated user detected, redirecting to dashboard');
        navigate('/app/dashboard', { replace: true });
      } else {
        console.log('[Index] No user found, staying on index to show landing');
        // Don't redirect - show landing content directly
      }
    }
  }, [user, loading, navigate, isOnline, hasCheckedCache]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">DukaFiti</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-medium">Loading DUKAFITI...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user && hasCheckedCache) {
    console.log('[Index] Showing ModernLanding component for unauthenticated user');
    return <ModernLandingComponent />;
  }

  // Show loading state
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
