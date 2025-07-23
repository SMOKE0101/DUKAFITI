
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Give enough time for session restoration on mobile
    const authCheckTimeout = setTimeout(() => {
      setHasCheckedAuth(true);
    }, 1000); // 1 second should be enough for session restoration

    return () => clearTimeout(authCheckTimeout);
  }, []);

  useEffect(() => {
    // Only redirect if we've finished loading and checking auth
    if (!loading && hasCheckedAuth && !user && !session) {
      console.log('[ProtectedRoute] No authenticated user found, redirecting to signin');
      navigate('/signin', { replace: true });
    }
  }, [user, session, loading, hasCheckedAuth, navigate]);

  // Show loading while auth is being checked or session is being restored
  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Authenticating...' : 'Loading app...'}
          </p>
        </div>
      </div>
    );
  }

  // Show redirect message if no user after auth check
  if (!user && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
