"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/profile";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setMessage("Password reset email sent. Check your inbox for the recovery link.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to send reset email.";
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
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#8B454B] font-sans">Account Recovery</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#541B1B] font-light">Recover Your Account</h1>
            <p className="text-xs text-[#8B454B] font-sans font-light">We will send a secure recovery link to your registered email address.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 font-sans">
              <label htmlFor="forgot-email" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-3.5 text-[#8B454B]/50" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
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
                  <span>Sending Recovery Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F8EEE2]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
