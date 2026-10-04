"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Mail, Send, CheckCircle2, Heart } from "lucide-react";
import { contactConfig, getWhatsAppLink } from "@/lib/contact";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:${contactConfig.supportEmail}?subject=${encodeURIComponent(
      formData.subject || "Inquiry for AaaS Atelier"
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    window.location.href = mailto;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F2E7] text-[#25382E] pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#5C745F] hover:text-[#25382E] transition-colors mb-8 font-sans"
        >
          <ArrowLeft size={12} />
          <span>Return to Boutique</span>
        </Link>

        {/* Header Block */}
        <div className="text-center mb-14 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#EC8D99] font-sans font-medium">
            ✦ Atelier Inquiries ✦
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#25382E] font-light tracking-tight">
            GET IN TOUCH
          </h1>
          <p className="text-sm sm:text-base text-[#5C745F] max-w-md mx-auto font-sans font-light leading-relaxed">
            Have a question about a piece, sizing, or caring for your handmade knitwear? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct channels */}
          <div className="md:col-span-5 space-y-4">
            {/* WhatsApp Card */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] p-6 hover:border-[#25382E] transition-all group shadow-xs"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#405F4C]/15 text-[#405F4C] flex items-center justify-center shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-[#25382E] font-medium group-hover:text-[#405F4C] transition-colors">
                    WhatsApp Atelier
                  </h3>
                  <p className="text-xs text-[#5C745F] leading-relaxed font-sans">
                    Fastest response for order status, custom inquiries, and questions.
                  </p>
                  <p className="text-xs font-medium text-[#25382E] pt-1 font-sans">
                    {contactConfig.whatsAppDisplay}
                  </p>
                </div>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${contactConfig.supportEmail}`}
              className="block bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] p-6 hover:border-[#25382E] transition-all group shadow-xs"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#EC8D99]/20 text-[#EC8D99] flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-[#25382E] font-medium group-hover:text-[#EC8D99] transition-colors">
                    Email Correspondence
                  </h3>
                  <p className="text-xs text-[#5C745F] leading-relaxed font-sans">
                    Send us detailed inquiries, collaboration proposals, or press notes.
                  </p>
                  <p className="text-xs font-medium text-[#25382E] pt-1 font-sans">
                    {contactConfig.supportEmail}
                  </p>
                </div>
              </div>
            </a>

            {/* Handcrafted Promise */}
            <div className="bg-[#F6C4C2]/30 rounded-2xl border border-[#E5DACB] p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#25382E]">
                <Heart size={15} className="text-[#EC8D99]" />
                <span className="font-serif text-base font-medium">Crafted with Intention</span>
              </div>
              <p className="text-xs text-[#5C745F] leading-relaxed font-sans font-light">
                Each stitch is crafted by hand in India using selected organic cotton and premium yarn. We take pride in personal, attentive service for every patron.
              </p>
            </div>
          </div>

          {/* Right Column: Contact form */}
          <div className="md:col-span-7 bg-[#FFFAF1] rounded-2xl border border-[#E5DACB] p-8 shadow-[0_2px_12px_rgba(37,56,46,0.03)]">
            {sent ? (
              <div className="text-center py-10 space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-[#405F4C]/15 text-[#405F4C] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-serif text-2xl text-[#25382E]">Message Prepared</h3>
                <p className="text-xs text-[#5C745F] font-sans font-light leading-relaxed">
                  Your mail client has been opened. If it didn&apos;t open automatically, write directly to {contactConfig.supportEmail}.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs uppercase tracking-[0.15em] font-medium text-[#25382E] hover:underline pt-2 font-sans cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 font-sans">
                <h2 className="font-serif text-xl sm:text-2xl text-[#25382E] font-normal border-b border-[#E5DACB] pb-3">
                  Write to Us
                </h2>

                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Your Name <span className="text-[#C96A6A]">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#F8F2E7] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Email Address <span className="text-[#C96A6A]">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#F8F2E7] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we assist you?"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#F8F2E7] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                    Message <span className="text-[#C96A6A]">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your note here..."
                    className="w-full px-4 py-3 rounded-xl border border-[#E5DACB] bg-[#F8F2E7] text-sm text-[#25382E] placeholder-[#5C745F]/40 focus:outline-none focus:border-[#EC8D99] focus:ring-1 focus:ring-[#EC8D99] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Send size={13} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
