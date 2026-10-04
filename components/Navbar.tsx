"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, UserRound, LogOut, CircleUserRound, Loader2, Sparkles } from "lucide-react";
import CartButton from "@/components/Cart/CartButton";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import AaaSLogo from "@/components/AaaSLogo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/crochet", label: "Crochet" },
  { href: "/mdf", label: "MDF Arts" },
  { href: "/pouches", label: "Pouches" },
  { href: "/magnets", label: "Magnets" },
  { href: "/rakhis", label: "Rakhis" },
  { href: "/track-order", label: "Track Order" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, signOut } = useCustomerAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setProfileOpen(false);
    setIsOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? "Customer";
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "A";

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      setProfileOpen(false);
      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const profileMenuItems = [
    { href: "/profile", label: "My Profile", icon: CircleUserRound },
    { href: "/my-orders", label: "My Orders", icon: UserRound },
    { href: "/profile?saved=addresses", label: "Saved Addresses", icon: UserRound },
    { href: "/profile?section=wishlist", label: "Wishlist", icon: Sparkles, muted: true },
    { href: "/profile?section=settings", label: "Account Settings", icon: UserRound },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Announcement Bar from Figma */}
      <div
        className={`bg-[#25382E] text-[#FFFAF1] transition-all duration-300 overflow-hidden border-b border-[#405F4C]/40 ${
          scrolled ? "max-h-0 py-0 opacity-0 pointer-events-none" : "max-h-12 py-2 px-4 sm:px-6 md:px-12 opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-sans font-medium">
          <div className="flex items-center gap-2">
            <span className="text-[#F5C842]">✦</span>
            <span>Complimentary domestic delivery on orders over ₹999</span>
          </div>
          <div className="hidden sm:flex items-center gap-3.5 text-[#F6C4C2]/90 text-[10px]">
            <span>100% Artisan Made</span>
            <span className="text-[#F5C842]">✦</span>
            <a
              href="https://wa.me/917668251162?text=Hello%20AaaS%20Atelier,%20I%20would%20like%20to%20inquire%20about%20a%20handcrafted%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FFFAF1] transition-colors underline-offset-2 hover:underline"
            >
              Atelier Direct: +91 76682 51162
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-[#F8F2E7]/95 backdrop-blur-md border-b border-[#E5DACB] py-3.5 shadow-[0_4px_20px_rgba(37,56,46,0.04)]"
            : "bg-[#F8F2E7] border-b border-[#E5DACB]/60 py-4 md:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex justify-between items-center">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center active:scale-[0.99] transition-transform duration-200"
          aria-label="AaaS Handmade Crochet Home"
        >
          <AaaSLogo variant="dark" size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 text-xs uppercase tracking-[0.16em] font-sans font-medium transition-colors duration-200 ${
                  isActive ? "text-[#25382E] font-semibold" : "text-[#5C745F] hover:text-[#EC8D99]"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="activeNavBorder"
                    className="absolute left-0 right-0 bottom-[-2px] h-[1.5px] bg-[#EC8D99]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}

          <div className="h-4 w-px bg-[#E5DACB]" aria-hidden="true" />

          {/* Cart Trigger */}
          <CartButton />

          {/* User Auth state */}
          {isLoading ? (
            <span className="px-5 py-2 rounded-full text-[11px] uppercase tracking-widest bg-[#F6C4C2]/50 text-[#5C745F] font-medium animate-pulse font-sans">
              Loading
            </span>
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-[#E5DACB] bg-[#FFFAF1] hover:border-[#EC8D99] transition-all duration-200 cursor-pointer shadow-xs"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="w-8 h-8 rounded-full overflow-hidden bg-[#F6C4C2] text-[#25382E] flex items-center justify-center font-semibold text-xs shrink-0 font-sans">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-[#5C745F] transition-transform duration-200 ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl border border-[#E5DACB] bg-[#FFFAF1] shadow-[0_16px_40px_rgba(37,56,46,0.08)] overflow-hidden z-50"
                    role="menu"
                  >
                    <div className="p-4 border-b border-[#E5DACB]/60 bg-[#F8F2E7]">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#5C745F] font-medium font-sans">Signed in as</p>
                      <p className="mt-1 font-serif text-base text-[#25382E] truncate font-medium">{displayName}</p>
                      <p className="text-xs text-[#5C745F] truncate font-sans">{user.email}</p>
                    </div>
                    <div className="p-1.5 font-sans">
                      {profileMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setProfileOpen(false)}
                            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs tracking-wide transition-colors ${
                              item.muted
                                ? "text-[#5C745F]/50 cursor-default"
                                : "text-[#25382E] hover:bg-[#F6C4C2]/30 hover:text-[#25382E]"
                            }`}
                          >
                            <Icon size={14} className="text-[#5C745F]" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                      <div className="my-1 border-t border-[#E5DACB]/60" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2.5 w-full rounded-xl px-3.5 py-2.5 text-xs text-[#C96A6A] hover:bg-rose-50/60 transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-[#C96A6A]" />
                            <span>Logging out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut size={14} />
                            <span>Logout</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href={`/login${pathname !== "/login" ? `?next=${encodeURIComponent(pathname || "/")}` : ""}`}
              className="px-5 py-2 rounded-full text-xs uppercase tracking-[0.16em] font-sans font-medium bg-[#25382E] text-[#FFFAF1] hover:bg-[#405F4C] transition-all duration-200 shadow-xs hover:shadow-sm"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Actions: Cart & Hamburger */}
        <div className="flex lg:hidden items-center space-x-1.5">
          <CartButton />

          {!isLoading && user ? (
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-9 h-9 rounded-full overflow-hidden bg-[#F6C4C2] text-[#25382E] flex items-center justify-center font-semibold text-xs border border-[#E5DACB]"
              aria-label="Open profile"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{initials}</span>
              )}
            </button>
          ) : !isLoading ? (
            <Link
              href={`/login${pathname !== "/login" ? `?next=${encodeURIComponent(pathname || "/")}` : ""}`}
              className="px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-sans font-medium bg-[#25382E] text-[#FFFAF1] hover:bg-[#405F4C]"
            >
              Login
            </Link>
          ) : null}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-[#25382E] hover:text-[#405F4C] transition-colors cursor-pointer"
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden bg-[#F8F2E7] border-b border-[#E5DACB] overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-6 space-y-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-serif tracking-wide py-1.5 transition-colors ${
                      isActive ? "text-[#25382E] font-semibold" : "text-[#5C745F] hover:text-[#EC8D99]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <hr className="border-[#E5DACB] my-1" />

              {!isLoading && user ? (
                <>
                  <div className="flex items-center gap-3 px-1 py-1">
                    <span className="w-10 h-10 rounded-full overflow-hidden bg-[#F6C4C2] text-[#25382E] flex items-center justify-center font-semibold text-xs shrink-0">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </span>
                    <div className="min-w-0 font-sans">
                      <p className="font-serif text-base text-[#25382E] truncate font-medium">{displayName}</p>
                      <p className="text-xs text-[#5C745F] truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="text-center py-2.5 rounded-full text-xs uppercase tracking-wider font-sans font-medium bg-[#25382E] text-[#FFFAF1] hover:bg-[#405F4C]"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/my-orders"
                      onClick={() => setIsOpen(false)}
                      className="text-center py-2.5 rounded-full text-xs uppercase tracking-wider font-sans font-medium border border-[#25382E] text-[#25382E] hover:bg-[#25382E] hover:text-[#FFFAF1]"
                    >
                      Orders
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (isLoggingOut) return;
                      setIsOpen(false);
                      await handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs uppercase tracking-wider font-sans font-medium border border-[#C96A6A]/40 text-[#C96A6A] hover:bg-rose-50 transition-colors disabled:opacity-75 cursor-pointer"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-[#C96A6A]" />
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <span>Logout</span>
                    )}
                  </button>
                </>
              ) : (
                <Link
                  href={`/login${pathname !== "/login" ? `?next=${encodeURIComponent(pathname || "/")}` : ""}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-3 rounded-full text-xs uppercase tracking-widest font-sans font-medium bg-[#4A382D] text-[#F8F3EC]"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
