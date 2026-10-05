"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface CustomerProfileState {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CustomerAuthContextValue {
  session: Session | null;
  user: User | null;
  profile: CustomerProfileState | null;
  isLoading: boolean;
  refreshProfile: (sessionOverride?: Session | null) => Promise<void>;
  syncSession: (session: Session | null) => Promise<void>;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | undefined>(undefined);

async function clearSessionOnServer() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch {
    // ignore
  }
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfileState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  const user = session?.user ?? null;
  sessionRef.current = session;

  const refreshProfile = useCallback(async (sessionOverride?: Session | null) => {
    const activeSession = sessionOverride ?? sessionRef.current;

    if (!activeSession?.user) {
      setProfile(null);
      return;
    }

    try {
      const response = await fetch("/api/customer/profile", { method: "GET" });
      if (!response.ok) {
        throw new Error("Failed to load profile.");
      }

      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
        return;
      }
      throw new Error("No profile returned.");
    } catch {
      setProfile({
        id: activeSession.user.id,
        full_name:
          (activeSession.user.user_metadata?.full_name as string | undefined) ??
          (activeSession.user.user_metadata?.name as string | undefined) ??
          activeSession.user.email ??
          null,
        email: activeSession.user.email ?? null,
        avatar_url:
          (activeSession.user.user_metadata?.avatar_url as string | undefined) ??
          (activeSession.user.user_metadata?.picture as string | undefined) ??
          null,
        created_at: activeSession.user.created_at ?? null,
        updated_at: null,
      });
    }
  }, []);

  const syncSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    sessionRef.current = nextSession;

    if (nextSession) {
      await refreshProfile(nextSession);
    } else {
      setProfile(null);
      try {
        await clearSessionOnServer();
      } catch {
        // ignore
      }
    }
  }, [refreshProfile]);

  useEffect(() => {
    let isActive = true;

    // Get current session on mount (ensures instant hydration from cookies)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isActive) return;
      if (initialSession) {
        setSession(initialSession);
        sessionRef.current = initialSession;
        void refreshProfile(initialSession);
      }
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isActive) return;

      setSession(nextSession);
      sessionRef.current = nextSession;

      if (event === "SIGNED_OUT" || !nextSession) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      await refreshProfile(nextSession);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("SignOut error:", err);
    }
    setSession(null);
    sessionRef.current = null;
    setProfile(null);
    try {
      await clearSessionOnServer();
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      session,
      user,
      profile,
      isLoading,
      refreshProfile,
      syncSession,
      signOut,
    }),
    [session, user, profile, isLoading, refreshProfile, syncSession, signOut]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }

  return context;
}
