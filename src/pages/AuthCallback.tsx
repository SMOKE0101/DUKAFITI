import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle auth callback from OAuth providers
        const { data, error } = await supabase.auth.getSession();
        
        // Check for error in URL params (both hash and search params)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const authError = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (authError) {
          console.error('Auth callback error:', authError, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        if (error) {
          console.error('Session error:', error);
          setStatus('error');
          setMessage('Failed to establish session');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting to your dashboard...');
          
          // Give the auth state time to update
          setTimeout(() => {
            navigate('/app/dashboard', { replace: true });
          }, 1500);
        } else {
          // Try to handle the auth flow
          const type = hashParams.get('type');
          const token = hashParams.get('access_token');
          
          if (type && token) {
            // OAuth flow detected, wait for session to be established
            setStatus('success');
            setMessage('Completing authentication...');
            
            // Wait longer for OAuth session establishment
            setTimeout(async () => {
              const { data: newSession } = await supabase.auth.getSession();
              if (newSession.session) {
                navigate('/app/dashboard', { replace: true });
              } else {
                setStatus('error');
                setMessage('Session establishment failed');
                setTimeout(() => navigate('/signin'), 2000);
              }
            }, 2500);
          } else {
            setStatus('error');
            setMessage('No valid authentication found');
            setTimeout(() => navigate('/signin'), 3000);
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => navigate('/signin'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-accent/10 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-background rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Completing sign in...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we complete your authentication.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Sign In Successful!
              </h1>
              <p className="text-muted-foreground">
                {message}
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Sign In Failed
              </h1>
              <p className="text-muted-foreground">
                {message}
              </p>
            </>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          You will be redirected automatically...
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;