"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import { Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast("Please enter the password.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        showToast("Login successful!", "success");
        router.push("/admin");
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || "Invalid password.", "error");
      }
    } catch (err) {
      console.error("Login submit error:", err);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-8 shadow-xs relative overflow-hidden text-[#3B241C]">
      <div className="text-center space-y-2 mb-8">
        <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#B58A58] font-sans">Restricted Access</span>
        <h1 className="font-serif text-3xl font-light tracking-wide text-[#541B1B]">
          AaaS <span className="text-[#8B454B] font-light italic font-sans text-sm">Atelier Admin</span>
        </h1>
        <p className="text-xs font-sans text-[#3B241C]/80 font-light leading-relaxed">
          Please enter your atelier administrator passphrase to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5 font-sans">
          <label htmlFor="password" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
            Passphrase
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-[#8B454B]/60">
              <Lock size={16} />
            </span>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D9C4B0] bg-[#FFF9F2] text-sm text-[#3B241C] placeholder-[#3B241C]/40 focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] transition-all font-sans"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs font-medium tracking-[0.2em] uppercase rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-75 font-sans"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Verifying Access...</span>
            </>
          ) : (
            <span>Log In to Atelier</span>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#D9C4B0] flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] font-medium text-[#8B454B] hover:text-[#541B1B] uppercase tracking-[0.2em] transition-colors font-sans"
        >
          <ArrowLeft size={13} />
          <span>Return to Boutique</span>
        </Link>
      </div>
    </div>
  );
}
