"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { contactConfig, getWhatsAppLink } from "@/lib/contact";
import AaaSLogo from "@/components/AaaSLogo";

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-[#25382E] text-[#FFFAF1] border-t border-[#405F4C]/40 pt-14 pb-10 md:pt-20 md:pb-14 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
        
        {/* Brand Information */}
        <div className="md:col-span-2 flex flex-col space-y-4">
          <Link href="/" className="inline-block w-fit">
            <AaaSLogo variant="inverted" size="md" />
          </Link>
          <p className="text-[#FFFAF1]/80 text-xs sm:text-sm max-w-sm leading-relaxed font-sans font-light">
            Modern artisan crochet studio meets premium lifestyle boutique. Lovingly crafted heirloom pieces, embroidered fabric pouches, and hand-painted keepsakes.
          </p>
          <div className="pt-2 text-xs font-serif italic text-[#F6C4C2]">
            &ldquo;Thoughtfully crafted by hand, made to cherish.&rdquo;
          </div>
        </div>

        {/* Categories / Quick Links */}
        <div className="flex flex-col space-y-3.5">
          <h4 className="text-[11px] uppercase tracking-[0.24em] font-medium text-[#F6C4C2] font-sans">
            Collections
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#FFFAF1]/85 font-sans font-light">
            <li>
              <Link href="/crochet" className="hover:text-[#EC8D99] transition-colors duration-200">
                Crochet Creations
              </Link>
            </li>
            <li>
              <Link href="/pouches" className="hover:text-[#EC8D99] transition-colors duration-200">
                Hand-painted Pouches
              </Link>
            </li>
            <li>
              <Link href="/mdf" className="hover:text-[#EC8D99] transition-colors duration-200">
                MDF Board Arts
              </Link>
            </li>
            <li>
              <Link href="/magnets" className="hover:text-[#EC8D99] transition-colors duration-200">
                Fridge Magnets
              </Link>
            </li>
            <li>
              <Link href="/rakhis" className="hover:text-[#EC8D99] transition-colors duration-200">
                Handmade Rakhis
              </Link>
            </li>
            <li>
              <Link href="/custom-order" className="text-[#F6C4C2] hover:text-[#EC8D99] transition-colors duration-200">
                Custom Orders &rarr;
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Links */}
        <div className="flex flex-col space-y-3.5">
          <h4 className="text-[11px] uppercase tracking-[0.24em] font-medium text-[#F6C4C2] font-sans">
            Connect
          </h4>
          <ul className="space-y-3 text-xs sm:text-sm text-[#FFFAF1]/85 font-sans font-light">
            <li>
              <a
                href={getWhatsAppLink("Hi AaaS! I'd like to ask about your crochet collections.")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with AaaS on WhatsApp"
                className="flex items-center space-x-2.5 hover:text-[#EC8D99] transition-colors duration-200 group"
              >
                <MessageCircle size={15} className="text-[#FFFAF1] group-hover:text-[#EC8D99] group-hover:scale-110 transition-transform" />
                <span>WhatsApp Direct</span>
              </a>
            </li>
            <li>
              <a
                href={contactConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow AaaS on Instagram"
                className="flex items-center space-x-2.5 hover:text-[#EC8D99] transition-colors duration-200 group"
              >
                <Instagram size={15} className="text-[#FFFAF1] group-hover:text-[#EC8D99] group-hover:scale-110 transition-transform" />
                <span>Instagram Atelier</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contactConfig.supportEmail}`}
                aria-label="Email AaaS"
                className="flex items-center space-x-2.5 hover:text-[#EC8D99] transition-colors duration-200 group"
              >
                <Mail size={15} className="text-[#FFFAF1] group-hover:text-[#EC8D99] group-hover:scale-110 transition-transform" />
                <span>{contactConfig.supportEmail}</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Sub-bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mt-12 md:mt-16 pt-6 border-t border-[#405F4C]/40 flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#FFFAF1]/60 font-sans space-y-3 sm:space-y-0">
        <p>&copy; {currentYear} AaaS Studio. All rights reserved.</p>
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
          <Link href="/privacy-policy" className="hover:text-[#EC8D99] transition-colors">Privacy Policy</Link>
          <Link href="/terms-and-conditions" className="hover:text-[#EC8D99] transition-colors">Terms of Service</Link>
          <Link href="/shipping-policy" className="hover:text-[#EC8D99] transition-colors">Shipping Policy</Link>
          <Link href="/refund-policy" className="hover:text-[#EC8D99] transition-colors">Refunds & Returns</Link>
        </div>
      </div>
    </footer>
  );
}
