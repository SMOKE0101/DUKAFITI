
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize with safe defaults
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        const previousUserId = user?.id;
        const newUserId = session?.user?.id;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Dispatch auth state change event for cache management
        window.dispatchEvent(new CustomEvent('auth-state-change', {
          detail: { event, session, previousUserId, newUserId }
        }));

        // Handle logout - clear data but don't redirect (signOut function handles redirect)
        if (event === 'SIGNED_OUT') {
          // Clear all localStorage data on logout including user cache
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.startsWith('cache_') || 
            key.startsWith('pendingOperations_') || 
            key === 'lastKnownUser'
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Don't redirect here - let the signOut function handle it to avoid conflicts
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          email_redirect_to: redirectUrl
        }
      }
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    // Use the current domain for redirect
    const currentUrl = window.location.origin;
    const redirectUrl = `${currentUrl}/auth/callback`;
    
    console.log('Google OAuth redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('SignOut: Starting logout process');
      
      // Clear localStorage immediately before calling signOut
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('cache_') || 
        key.startsWith('pendingOperations_') || 
        key === 'lastKnownUser'
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('SignOut: Cleared localStorage keys:', keysToRemove);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      console.log('SignOut: Supabase signOut completed');
      
      // Force immediate redirect - don't wait for auth state change
      console.log('SignOut: Redirecting to landing page');
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if signOut fails, clear local data and redirect
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('cache_') || 
        key.startsWith('pendingOperations_') || 
        key === 'lastKnownUser'
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('SignOut: Error recovery - cleared localStorage and redirecting');
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
