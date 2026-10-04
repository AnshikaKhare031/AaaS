"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Menu, X, ArrowLeft, ClipboardList, BarChart3 } from "lucide-react";
import { ToastProvider } from "@/components/admin/Toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: ShoppingBag },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (pathname === "/admin/login") {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-[#F8F2E7] flex items-center justify-center p-4 font-sans text-[#25382E]">
          {children}
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8F2E7] flex text-[#25382E] font-sans">
        
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#FFFAF1] border-b border-[#E5DACB] z-40 px-6 flex items-center justify-between">
          <Link href="/admin" className="font-serif text-lg font-light tracking-wide text-[#25382E]">
            AaaS <span className="text-[#EC8D99] font-light italic font-sans text-xs">Atelier Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-[#5C745F] hover:text-[#25382E] transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-[#25382E]/30 backdrop-blur-xs z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 bottom-0 w-64 bg-[#FFFAF1] border-r border-[#E5DACB] z-50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } h-screen`}
        >
          <div>
            {/* Sidebar Logo Header */}
            <div className="h-20 border-b border-[#E5DACB] px-6 flex items-center justify-between">
              <Link href="/admin" className="font-serif text-xl font-light tracking-wide text-[#25382E]">
                AaaS <span className="text-[#EC8D99] font-light italic font-sans text-xs">Atelier</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-[#5C745F] hover:text-[#25382E] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Menu */}
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-[0.15em] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#25382E] text-[#FFFAF1]"
                        : "text-[#5C745F] hover:bg-[#F8F2E7] hover:text-[#25382E]"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Link back to public site */}
          <div className="p-4 border-t border-[#E5DACB] space-y-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/admin/logout", { method: "POST" });
                  if (res.ok) {
                    window.location.href = "/admin/login";
                  }
                } catch (err) {
                  console.error("Logout failed:", err);
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-[#EC8D99]/40 hover:bg-[#EC8D99]/10 text-[10px] font-medium text-[#25382E] tracking-[0.2em] uppercase transition-colors cursor-pointer"
            >
              <span>Log Out</span>
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-[#E5DACB] hover:bg-[#F8F2E7] text-[10px] font-medium text-[#5C745F] hover:text-[#25382E] tracking-[0.2em] uppercase transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to Boutique</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col min-h-screen">
          <main className="flex-grow p-4 md:p-6 lg:p-10 pt-20 lg:pt-10 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
