
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('[Index] Auth state check:', { user: !!user, loading, isOnline: navigator.onLine });
    
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          console.log('[Index] Authenticated user detected, redirecting to dashboard');
          navigate('/app/dashboard', { replace: true });
        } else {
          console.log('[Index] No user found, redirecting to landing');
          navigate('/landing', { replace: true });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  // Show enhanced loading for offline mode
  const isOffline = !navigator.onLine;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 bg-red-100 text-red-700 px-4 py-2 text-center text-sm z-50">
            📵 Offline Mode - Working with cached data
          </div>
        )}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">DukaFiti</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-medium">
            {isOffline ? 'Loading cached data...' : 'Loading DUKAFITI...'}
          </p>
          {isOffline && (
            <p className="text-gray-500 text-xs mt-2">
              All your changes will sync when you're back online
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
