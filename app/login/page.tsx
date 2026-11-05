"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

function LoginContent() {
  const searchParams = useSearchParams();
  const { syncSession } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");
  const errorDescParam = searchParams.get("error_description");

  useEffect(() => {
    const err = errorDescParam || errorParam;
    if (err) {
      if (err === "auth-code-error") {
        setMessage("Authentication link or session has expired. Please try signing in again.");
      } else {
        setMessage(decodeURIComponent(err));
      }
    }
  }, [errorParam, errorDescParam]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await syncSession(data.session);
        window.location.replace(nextPath);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to log in.";
      setMessage(
        errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("credentials")
          ? "Invalid email or password. Please try again."
          : errorMessage.toLowerCase().includes("not confirmed")
          ? "Your email is not confirmed. Please check your inbox or spam folder for the activation link."
          : errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage(null);
    setIsLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        try {
          const testRes = await fetch(data.url, {
            method: "GET",
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
            },
            redirect: "manual",
          });

          if (testRes.status === 400) {
            const errJson = await testRes.json().catch(() => null);
            if (errJson?.msg?.includes("Unsupported provider") || errJson?.msg?.includes("not enabled")) {
              setMessage("Google Sign-In is not enabled yet in your Supabase project. Please enable Google provider in the Supabase Dashboard under Authentication -> Providers.");
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // If pre-flight fetch fails, proceed with navigation
        }

        window.location.assign(data.url);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Google login failed.";
      setMessage(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8EEE2] min-h-screen text-[#3B241C]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#8B454B] hover:text-[#541B1B] transition-colors font-sans">
            <ArrowLeft size={12} />
            Back to Boutique
          </Link>
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#8B454B] font-sans">Patron Account</span>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight text-[#541B1B] font-light">Welcome back.</h1>
            <p className="text-sm sm:text-base text-[#3B241C] leading-relaxed max-w-lg font-sans font-light opacity-85">
              Sign in to manage your orders, saved delivery addresses, and personal atelier selections.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-xs text-[#8B454B] font-sans">
            <div className="rounded-xl border border-[#D9C4B0] bg-[#FFF9F2] p-4 shadow-xs">
              <p className="font-medium text-[#541B1B] mb-1 font-serif text-sm">Order Archive</p>
              <p className="font-light leading-relaxed text-[#3B241C]/80">Track progress and view past artisan creations.</p>
            </div>
            <div className="rounded-xl border border-[#D9C4B0] bg-[#FFF9F2] p-4 shadow-xs">
              <p className="font-medium text-[#541B1B] mb-1 font-serif text-sm">One-Touch Google</p>
              <p className="font-light leading-relaxed text-[#3B241C]/80">Effortless sign in with your verified profile.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl shadow-[0_2px_16px_rgba(84,27,27,0.03)] p-6 sm:p-8 md:p-10">
          <div className="space-y-2 mb-8">
            <h2 className="font-serif text-3xl text-[#541B1B] font-light">Sign In</h2>
            <p className="text-xs text-[#8B454B] font-sans">Access your AaaS account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 font-sans">
              <label htmlFor="login-email" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-3.5 text-[#8B454B]/50" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D9C4B0] bg-[#FFF9F2] text-sm text-[#3B241C] placeholder-[#8B454B]/40 focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label htmlFor="login-password" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 text-[#8B454B]/50" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D9C4B0] bg-[#FFF9F2] text-sm text-[#3B241C] placeholder-[#8B454B]/40 focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] transition-all"
                  required
                />
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-[#D9C4B0] bg-[#EBCDB8]/20 px-4 py-3 text-xs text-[#541B1B] font-sans">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs font-medium tracking-[0.2em] uppercase rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75 font-sans"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border border-[#D9C4B0] text-xs font-medium tracking-[0.15em] uppercase text-[#541B1B] hover:bg-[#F8EEE2] transition-colors disabled:opacity-75 font-sans cursor-pointer"
            >
              Continue with Google
            </button>

            <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.15em] font-medium pt-2 font-sans">
              <Link href={`/forgot-password?next=${encodeURIComponent(nextPath)}`} className="text-[#8B454B] hover:text-[#541B1B] transition-colors">
                Forgot Password?
              </Link>
              <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="text-[#541B1B] hover:text-[#722F37] font-semibold transition-colors">
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8EEE2]" />}>
      <LoginContent />
    </Suspense>
  );
}
