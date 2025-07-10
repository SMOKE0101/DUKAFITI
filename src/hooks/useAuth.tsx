
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, shopName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider: Initializing with user:', user?.id);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        } else {
          console.log('AuthProvider: Initial session:', session?.user?.id);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('AuthProvider: Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, shopName?: string) => {
    console.log('AuthProvider: Signing up user');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          shop_name: shopName,
        },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Signing in user');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthProvider: Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  console.log('AuthProvider: Rendering with user:', user?.id, 'loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
