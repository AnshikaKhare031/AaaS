"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles, MessageCircle, CheckCircle2, Clock, Palette } from "lucide-react";
import { getWhatsAppLink } from "@/lib/contact";

export default function CustomOrderPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    itemType: "",
    colors: "",
    targetDate: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build WhatsApp message for direct consultation
    const message = `*Custom Order Inquiry - AaaS Atelier*%0A%0A*Name:* ${encodeURIComponent(formData.fullName)}%0A*Phone:* ${encodeURIComponent(formData.phone)}%0A*Item:* ${encodeURIComponent(formData.itemType)}%0A*Preferred Colors:* ${encodeURIComponent(formData.colors)}%0A*Target Date:* ${encodeURIComponent(formData.targetDate || "Flexible")}%0A*Notes:* ${encodeURIComponent(formData.notes || "None")}`;
    
    // Set submitted state
    setSubmitted(true);

    // Open WhatsApp after a brief delay
    const waUrl = getWhatsAppLink(message);
    window.open(waUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8F2E7] text-[#25382E] pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] transition-colors mb-8 font-sans"
        >
          <ArrowLeft size={12} />
          <span>Return to Boutique</span>
        </Link>

        {/* Header Block */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6C4C2]/50 border border-[#F6C4C2] text-[10px] tracking-[0.25em] uppercase text-[#25382E] font-sans">
            <Sparkles size={11} className="text-[#F5C842]" />
            <span>Artisan Consultation</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#25382E] font-light tracking-tight">
            SOMETHING SPECIAL IN MIND?
          </h1>
          <p className="text-sm sm:text-base text-[#5C745F] max-w-lg mx-auto font-light leading-relaxed font-sans">
            Tell us what you&apos;re imagining, and we&apos;ll bring it to life, one stitch at a time.
          </p>
        </div>

        {/* Main Consultation Card */}
        <div className="bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] p-8 sm:p-12 shadow-[0_4px_24px_rgba(37,56,46,0.04)]">
          {submitted ? (
            <div className="text-center py-10 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#405F4C]/15 text-[#405F4C] flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-2xl sm:text-3xl text-[#25382E] font-normal">
                  Thank You for Your Consultation Request
                </h3>
                <p className="text-sm text-[#5C745F] max-w-md mx-auto font-sans font-light leading-relaxed">
                  We have forwarded your vision to our atelier. Our artisan will personally reach out on WhatsApp to discuss yarns, sizing, and lead times.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#25382E] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.2em] hover:bg-[#405F4C] transition-all font-sans"
                >
                  <MessageCircle size={15} />
                  <span>Open WhatsApp Directly</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center px-6 py-3.5 rounded-full border border-[#E5DACB] text-xs font-medium uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] hover:bg-[#FFFAF1] transition-all font-sans"
                >
                  Submit Another Idea
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Your Name <span className="text-[#C96A6A]">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  />
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Phone / WhatsApp <span className="text-[#C96A6A]">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  />
                </div>
              </div>

              {/* What are you looking for? */}
              <div className="space-y-1.5">
                <label htmlFor="itemType" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                  What are you looking for? <span className="text-[#C96A6A]">*</span>
                </label>
                <input
                  type="text"
                  id="itemType"
                  required
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                  placeholder="e.g. Heirloom baby blanket, botanical tote, custom crochet bouquet, cardigan"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Preferred Colors */}
                <div className="space-y-1.5">
                  <label htmlFor="colors" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F] flex items-center gap-1.5">
                    <Palette size={12} className="text-[#EC8D99]" />
                    <span>Preferred Colors</span>
                  </label>
                  <input
                    type="text"
                    id="colors"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="e.g. Warm ivory, forest green, blush pink"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  />
                </div>

                {/* Target Date */}
                <div className="space-y-1.5">
                  <label htmlFor="targetDate" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F] flex items-center gap-1.5">
                    <Clock size={12} className="text-[#5C745F]" />
                    <span>Target Date</span>
                  </label>
                  <input
                    type="date"
                    id="targetDate"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  />
                </div>
              </div>

              {/* Notes / Special Details */}
              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                  Details & Special Requests
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Describe dimensions, intended recipient, specific yarn textures, or references..."
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#FFFAF1] text-sm text-[#25382E] placeholder-[#5C745F]/50 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all resize-none"
                />
              </div>

              {/* Artisan Note */}
              <div className="p-4 rounded-xl bg-[#F6C4C2]/30 border border-[#F6C4C2]/60 text-xs text-[#25382E] leading-relaxed">
                <p>
                  <span className="text-[#F5C842]">✦</span> <strong>Artisan Lead Time:</strong> Handcrafted custom orders typically take 1–3 weeks depending on complexity. We will confirm exact yarn choices and milestones with you before commencing work.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Send size={13} />
                  <span>Submit Consultation Request</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
