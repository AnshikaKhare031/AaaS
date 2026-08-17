import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserProfile, UserRole } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  // Load real profile from Supabase profiles table
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile from Supabase:', error);
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email || email,
          full_name: data.full_name || email.split('@')[0],
          phone: data.phone,
          avatar_url: data.avatar_url,
          role: (data.role === 'admin' ? 'admin' : 'customer') as UserRole,
          created_at: data.created_at,
        });
      } else {
        // Fallback default profile with customer role
        setUser({
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'customer',
        });
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setUser({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'customer',
      });
    }
  }, []);

  // Initialize auth session on mount & subscribe to real auth changes
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setSupabaseUser(currentSession.user);
          localStorage.setItem('aaas_auth_token', currentSession.access_token);
          await fetchProfile(currentSession.user.id, currentSession.user.email || '');
        } else {
          setSession(null);
          setSupabaseUser(null);
          setUser(null);
          localStorage.removeItem('aaas_auth_token');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (newSession?.user) {
          setSession(newSession);
          setSupabaseUser(newSession.user);
          localStorage.setItem('aaas_auth_token', newSession.access_token);
          await fetchProfile(newSession.user.id, newSession.user.email || '');
        } else if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setSupabaseUser(null);
          setUser(null);
          localStorage.removeItem('aaas_auth_token');
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toastError(error.message);
        return { error };
      }

      if (data.session) {
        setSession(data.session);
        setSupabaseUser(data.user);
        localStorage.setItem('aaas_auth_token', data.session.access_token);
        await fetchProfile(data.user.id, data.user.email || '');
        success('Signed in successfully');
      }
      return { error: null };
    } catch (err: any) {
      toastError(err.message || 'Failed to sign in');
      return { error: err };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        toastError(error.message);
        return { error };
      }

      if (data.user) {
        success('Account created successfully!');
        if (data.session) {
          setSession(data.session);
          setSupabaseUser(data.user);
          localStorage.setItem('aaas_auth_token', data.session.access_token);
          await fetchProfile(data.user.id, data.user.email || '');
        }
      }
      return { error: null };
    } catch (err: any) {
      toastError(err.message || 'Registration failed');
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) toastError(error.message);
    } catch (err: any) {
      toastError(err.message || 'Google login failed');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('aaas_auth_token');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signOut error:', err);
    }
    setSession(null);
    setSupabaseUser(null);
    setUser(null);
    success('You have signed out');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
      setUser((prev) => (prev ? { ...prev, ...data } : null));
      success('Profile updated successfully');
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile');
    }
  };

  const role = user?.role || 'customer';
  const isAdmin = role === 'admin';
  const isAuthenticated = Boolean(user && session);

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        role,
        isAdmin,
        isAuthenticated,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
