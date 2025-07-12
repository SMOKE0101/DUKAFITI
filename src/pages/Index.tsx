
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('[Index] Auth state check:', { user: !!user, loading });
    
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          console.log('[Index] Authenticated user detected, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('[Index] No user found, redirecting to modern landing');
          navigate('/modern-landing', { replace: true });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-medium">Loading DUKAFITI...</p>
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
