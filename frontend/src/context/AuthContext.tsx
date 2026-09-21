import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { UserProfile, UserRole } from '../types';
import { useToast } from './ToastContext';
import { adminLogin, adminLogout, getAdminMe } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; session?: Session | null }>;
  signInWithGoogle: () => Promise<void>;
  loginAsAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  // Load real profile from Supabase profiles table with non-blocking timeout
  const fetchProfile = useCallback(async (userId: string, email: string): Promise<UserProfile | null> => {
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
        const loadedProfile: UserProfile = {
          id: data.id,
          email: data.email || email,
          full_name: data.full_name || email.split('@')[0],
          role: (data.role === 'admin' ? 'admin' : 'customer') as UserRole,
          created_at: data.created_at,
        };
        setUser(loadedProfile);
        return loadedProfile;
      }
      return null;
    } catch (err) {
      console.warn('Profile fetch completed with existing profile:', err);
      return null;
    }
  }, []);

  // Helper to construct immediate base profile from Supabase User (auth session)
  const buildBaseProfile = (authUser: User, emailFallback?: string): UserProfile => ({
    id: authUser.id,
    email: authUser.email || emailFallback || '',
    full_name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      (authUser.email || emailFallback || '').split('@')[0],
    role: (authUser.user_metadata?.role === 'admin' ? 'admin' : 'customer') as UserRole,
  });

  // Explicit profile refresh function that components can invoke to reload the profile
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const targetId = supabaseUser?.id || user?.id;
    const targetEmail = supabaseUser?.email || user?.email || '';
    if (targetId) {
      return await fetchProfile(targetId, targetEmail);
    }
    return null;
  }, [supabaseUser?.id, supabaseUser?.email, user?.id, user?.email, fetchProfile]);

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
          // Check for admin session
          const adminToken = localStorage.getItem('admin_token');
          if (adminToken) {
            try {
              const adminData = await getAdminMe();
              if (adminData?.user) {
                setUser({
                  id: adminData.user.id,
                  email: adminData.user.email,
                  full_name: adminData.user.full_name || 'AaaS Master Artisan',
                  role: 'admin',
                });
              }
            } catch {
              localStorage.removeItem('admin_token');
              setSession(null);
              setSupabaseUser(null);
              setUser(null);
            }
          } else {
            setSession(null);
            setSupabaseUser(null);
            setUser(null);
            localStorage.removeItem('aaas_auth_token');
          }
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
          const adminToken = localStorage.getItem('admin_token');
          if (!adminToken) {
            setUser(null);
            localStorage.removeItem('aaas_auth_token');
          }
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

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: Error | null; session?: Session | null }> => {
    try {
      const trimmedEmail = email.trim();
      const trimmedFullName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
          },
        },
      });

      // 1. Explicitly check error BEFORE displaying any success state
      if (error) {
        console.error('Supabase signup error:', error);
        toastError(error.message || 'Registration failed');
        return { error };
      }

      // 2. Ensure data and data.user exist
      if (!data?.user) {
        const noUserErr = new Error('Registration failed: No user account was returned by Supabase.');
        console.error('Supabase signup notice:', noUserErr);
        toastError(noUserErr.message);
        return { error: noUserErr };
      }

      // 3. Detect duplicate existing email: Supabase GoTrue returns empty identities array when email is already registered
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const duplicateErr = new Error('An account with this email address already exists. Please sign in instead.');
        console.warn('Signup notice: Email already registered:', trimmedEmail);
        toastError(duplicateErr.message);
        return { error: duplicateErr };
      }

      // 4. Handle email confirmation vs immediate session
      if (data.session) {
        setSession(data.session);
        setSupabaseUser(data.user);
        localStorage.setItem('aaas_auth_token', data.session.access_token);

        const immediateProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || trimmedEmail,
          full_name: trimmedFullName || (data.user.email || trimmedEmail).split('@')[0],
          role: 'customer',
        };
        setUser(immediateProfile);

        fetchProfile(data.user.id, data.user.email || trimmedEmail).catch(() => {});
        success('Account created successfully!');
        return { error: null, session: data.session };
      } else {
        // Email confirmation enabled: User created in auth.users, but requires email verification before signing in
        success('Account created! Please check your email to verify your account before signing in.');
        return { error: null, session: null };
      }
    } catch (err: any) {
      console.error('Unexpected signup exception:', err);
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

  const loginAsAdmin = async (email: string, pass: string) => {
    try {
      const res = await adminLogin(email, pass);
      if (res.success && res.user) {
        setUser({
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name || 'AaaS Master Artisan',
          role: 'admin',
        });
        success('Welcome to AaaS Management Console');
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Invalid admin credentials';
      toastError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('aaas_auth_token');
    localStorage.removeItem('admin_token');
    try {
      await adminLogout();
    } catch (e) {
      console.warn('Admin logout notice:', e);
    }
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
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.full_name !== undefined) updatePayload.full_name = data.full_name;

      const { data: updatedRecord, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (!updatedRecord) {
        throw new Error('Profile update did not return any records');
      }

      // Refresh UI state directly from the persisted database value
      setUser({
        id: updatedRecord.id,
        email: updatedRecord.email || user.email,
        full_name: updatedRecord.full_name || user.email.split('@')[0],
        role: (updatedRecord.role === 'admin' ? 'admin' : 'customer') as UserRole,
        created_at: updatedRecord.created_at,
      });

      success('Profile updated successfully');
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const role = user?.role || 'customer';
  const isAdmin = role === 'admin';
  const isAuthenticated = Boolean(user);

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
        loginAsAdmin,
        signOut,
        updateProfile,
        refreshProfile,
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
