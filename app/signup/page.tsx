"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

function SignupContent() {

  const searchParams = useSearchParams();
  const { syncSession } = useCustomerAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/profile";

  const validate = () => {
    if (fullName.trim().length < 2) return "Please enter your full name.";
    if (!email.trim()) return "Email is required.";
    if (password.length < 8) return "Password should be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const validationMessage = validate();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setIsLoading(true);

    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await syncSession(data.session);
        window.location.replace(nextPath);
        return;
      }

      setMessage("Account created successfully! Please check your email (including Spam folder) for the verification link to activate your account.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to create account.";
      setMessage(
        errorMessage.toLowerCase().includes("already")
          ? "An account already exists with this email address."
          : errorMessage.toLowerCase().includes("rate limit")
          ? "Email rate limit exceeded. Supabase built-in email service is currently throttled. Please try again later or contact support."
          : errorMessage.toLowerCase().includes("password")
          ? "Please choose a stronger password."
          : errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setMessage(null);
    setIsLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Google signup failed.";
      setMessage(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8F2E7] min-h-screen text-[#25382E]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-xl order-2 lg:order-1">
          <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] transition-colors font-sans">
            <ArrowLeft size={12} />
            Back to Boutique
          </Link>
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#EC8D99] font-sans">New Patron</span>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight text-[#25382E] font-light">Join the AaaS Atelier.</h1>
            <p className="text-sm sm:text-base text-[#5C745F] leading-relaxed max-w-lg font-sans font-light">
              Create an account to save your delivery addresses, track custom crochet commissions, and enjoy an effortless checkout.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-xs text-[#5C745F] font-sans">
            <div className="rounded-xl border border-[#E5DACB] bg-[#FFFAF1] p-4 shadow-xs">
              <p className="font-medium text-[#25382E] mb-1 font-serif text-sm">Patron Profile</p>
              <p className="font-light leading-relaxed">Seamlessly manage your preferred delivery details.</p>
            </div>
            <div className="rounded-xl border border-[#E5DACB] bg-[#FFFAF1] p-4 shadow-xs">
              <p className="font-medium text-[#25382E] mb-1 font-serif text-sm">Artisan Archive</p>
              <p className="font-light leading-relaxed">Review past hand-stitched orders anytime.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl shadow-[0_2px_16px_rgba(37,56,46,0.03)] p-6 sm:p-8 md:p-10 order-1 lg:order-2">
          <div className="space-y-2 mb-8">
            <h2 className="font-serif text-3xl text-[#25382E] font-light">Create Account</h2>
            <p className="text-xs text-[#5C745F] font-sans">Join AaaS Handmade Crochet.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 font-sans">
              <label htmlFor="signup-name" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                Full Name
              </label>
              <div className="relative">
                <UserRound size={16} className="absolute left-4 top-3.5 text-[#5C745F]/50" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label htmlFor="signup-email" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-3.5 text-[#5C745F]/50" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label htmlFor="signup-password" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 text-[#5C745F]/50" />
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label htmlFor="signup-confirm" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 text-[#5C745F]/50" />
                <input
                  id="signup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  required
                />
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-[#EC8D99]/40 bg-[#EC8D99]/10 px-4 py-3 text-xs text-[#25382E] font-sans">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium tracking-[0.2em] uppercase rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75 font-sans"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border border-[#E5DACB] text-xs font-medium tracking-[0.15em] uppercase text-[#25382E] hover:bg-[#F8F2E7] transition-colors disabled:opacity-75 font-sans cursor-pointer"
            >
              Continue with Google
            </button>

            <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.15em] font-medium pt-2 font-sans">
              <span className="text-[#5C745F]">Already a patron?</span>
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-[#EC8D99] hover:text-[#25382E] transition-colors">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 bg-background" />}>
      <SignupContent />
    </Suspense>
  );
}
