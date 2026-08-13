import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserProfile, UserRole } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setDemoUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, UserProfile> = {
  customer: {
    id: 'demo-customer-uuid-001',
    email: 'customer@aaascrochet.com',
    full_name: 'Ananya Sharma',
    phone: '+91 98765 12345',
    role: 'customer',
  },
  admin: {
    id: 'demo-admin-uuid-001',
    email: 'admin@aaascrochet.com',
    full_name: 'AaaS Master Artisan (Admin)',
    phone: '+91 98765 43210',
    role: 'admin',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  // Load profile from Supabase profiles table
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email || email,
          full_name: data.full_name || 'Valued Customer',
          phone: data.phone,
          avatar_url: data.avatar_url,
          role: data.role || 'customer',
          created_at: data.created_at,
        });
      } else {
        // Fallback profile
        setUser({
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'customer',
        });
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // Check local storage for demo or saved state
      const savedDemoRole = localStorage.getItem('aaas_demo_role') as UserRole | null;
      if (savedDemoRole && DEMO_USERS[savedDemoRole]) {
        setUser(DEMO_USERS[savedDemoRole]);
        setIsLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          localStorage.setItem('aaas_auth_token', session.access_token);
          await fetchProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            localStorage.setItem('aaas_auth_token', session.access_token);
            await fetchProfile(session.user.id, session.user.email || '');
          } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('aaas_auth_token');
            setUser(null);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!isSupabaseConfigured) {
        // Demo sign in based on email
        const role: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'customer';
        setDemoUser(role);
        success(`Welcome back, ${DEMO_USERS[role].full_name}!`);
        return { error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toastError(error.message);
        return { error };
      }

      if (data.session) {
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
      if (!isSupabaseConfigured) {
        const newUser: UserProfile = {
          id: `customer-${Date.now()}`,
          email,
          full_name: fullName,
          role: 'customer',
        };
        setUser(newUser);
        localStorage.setItem('aaas_demo_role', 'customer');
        success(`Welcome to AaaS, ${fullName}!`);
        return { error: null };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'customer',
          },
        },
      });

      if (error) {
        toastError(error.message);
        return { error };
      }

      if (data.user) {
        success('Account created successfully!');
      }
      return { error: null };
    } catch (err: any) {
      toastError(err.message || 'Registration failed');
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!isSupabaseConfigured) {
        setDemoUser('customer');
        success('Google Sign-in demo activated');
        return;
      }
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
    localStorage.removeItem('aaas_demo_role');
    localStorage.removeItem('aaas_auth_token');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    success('You have signed out');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', user.id);
        if (error) throw error;
      }
      setUser((prev) => (prev ? { ...prev, ...data } : null));
      success('Profile updated successfully');
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile');
    }
  };

  const setDemoUser = (role: UserRole) => {
    const demo = DEMO_USERS[role];
    setUser(demo);
    localStorage.setItem('aaas_demo_role', role);
  };

  const role = user?.role || 'customer';
  const isAdmin = role === 'admin';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isAuthenticated,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateProfile,
        setDemoUser,
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
