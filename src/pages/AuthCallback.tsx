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
        // Get the hash from URL (Supabase uses hash for auth tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('access_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        if (type === 'signup' && token) {
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to your dashboard...');
          
          // Wait a moment for the auth state to update
          setTimeout(() => {
            navigate('/app/dashboard');
          }, 2000);
        } else {
          // Handle other auth callbacks or redirect to sign in
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            setStatus('error');
            setMessage('Failed to get session');
            setTimeout(() => navigate('/signin'), 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            setTimeout(() => navigate('/app/dashboard'), 1500);
          } else {
            setStatus('error');
            setMessage('No valid session found');
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
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-accent/10 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-background rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Confirming your email...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we verify your account.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Email Confirmed!
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
                Confirmation Failed
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