"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading: authLoading } = useCustomerAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/profile";

  const hasSession = Boolean(session);

  if (authLoading) {
    return (
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8EEE2] min-h-screen flex items-center justify-center text-[#3B241C]">
        <div className="w-full max-w-md bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-8 shadow-xs text-center space-y-4 font-sans">
          <Loader2 size={24} className="mx-auto animate-spin text-[#541B1B]" />
          <h1 className="font-serif text-3xl text-[#541B1B] font-light">Verifying Session</h1>
          <p className="text-xs text-[#8B454B]">Please wait while we confirm your recovery credentials.</p>
        </div>
      </section>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("Password should be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      setMessage("Password updated successfully.");
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to update password.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8EEE2] min-h-screen text-[#3B241C]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#8B454B] hover:text-[#541B1B] transition-colors mb-8 font-sans">
          <ArrowLeft size={12} />
          Back to Sign In
        </Link>

        <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl shadow-[0_2px_16px_rgba(84,27,27,0.03)] p-6 sm:p-8 md:p-10 max-w-xl mx-auto">
          <div className="space-y-2 mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#8B454B] font-sans">Patron Credentials</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#541B1B] font-light">Set a New Password</h1>
            <p className="text-xs text-[#8B454B] font-sans font-light">
              {hasSession
                ? "Choose a new secure password for your atelier account."
                : "Open this page from your email recovery link to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 font-sans">
              <label htmlFor="reset-password" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 text-[#8B454B]/50" />
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D9C4B0] bg-[#FFF9F2] text-sm text-[#3B241C] placeholder-[#8B454B]/40 focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label htmlFor="reset-confirm" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 text-[#8B454B]/50" />
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
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
              disabled={isLoading || !hasSession}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs font-medium tracking-[0.2em] uppercase rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75 font-sans"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8EEE2]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
