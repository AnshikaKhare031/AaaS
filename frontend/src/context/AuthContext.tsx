import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
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

  // Load real profile from Supabase profiles table with non-blocking timeout
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
      );

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch notice:', error.message || error);
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
      }
    } catch (err) {
      console.warn('Profile fetch completed with existing profile:', err);
    }
  }, []);

  // Helper to construct immediate profile from Supabase User
  const buildBaseProfile = (authUser: User, emailFallback?: string): UserProfile => ({
    id: authUser.id,
    email: authUser.email || emailFallback || '',
    full_name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      (authUser.email || emailFallback || '').split('@')[0],
    phone: authUser.phone || authUser.user_metadata?.phone,
    avatar_url: authUser.user_metadata?.avatar_url,
    role: (authUser.user_metadata?.role === 'admin' ? 'admin' : 'customer') as UserRole,
  });

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
          setUser(buildBaseProfile(currentSession.user));
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
      (event, newSession) => {
        if (newSession?.user) {
          setSession(newSession);
          setSupabaseUser(newSession.user);
          localStorage.setItem('aaas_auth_token', newSession.access_token);
          setUser((prev) => prev || buildBaseProfile(newSession.user));
          fetchProfile(newSession.user.id, newSession.user.email || '').catch(() => {});
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
        toastError(error.message || 'Invalid login credentials');
        return { error };
      }

      if (data?.session && data?.user) {
        setSession(data.session);
        setSupabaseUser(data.user);
        localStorage.setItem('aaas_auth_token', data.session.access_token);
        
        // Immediately activate the user profile to prevent any redirect race condition
        const immediateProfile = buildBaseProfile(data.user, email.trim());
        setUser(immediateProfile);

        // Fetch additional custom fields from database in background
        fetchProfile(data.user.id, data.user.email || email.trim()).catch(() => {});
        success('Signed in successfully');
      }
      return { error: null };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to sign in';
      toastError(errMsg);
      return { error: err instanceof Error ? err : new Error(errMsg) };
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
        toastError(error.message || 'Registration failed');
        return { error };
      }

      if (data?.user) {
        if (data?.session) {
          setSession(data.session);
          setSupabaseUser(data.user);
          localStorage.setItem('aaas_auth_token', data.session.access_token);

          const immediateProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email.trim(),
            full_name: fullName.trim() || (data.user.email || email.trim()).split('@')[0],
            phone: data.user.phone,
            avatar_url: data.user.user_metadata?.avatar_url,
            role: 'customer',
          };
          setUser(immediateProfile);

          fetchProfile(data.user.id, data.user.email || email.trim()).catch(() => {});
          success('Account created successfully!');
        } else {
          success('Account created! Please check your email to confirm your account.');
        }
      }
      return { error: null };
    } catch (err: any) {
      const errMsg = err?.message || 'Registration failed';
      toastError(errMsg);
      return { error: err instanceof Error ? err : new Error(errMsg) };
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
