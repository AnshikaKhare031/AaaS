import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  FolderTree,
  Sparkles,
  MessageSquare,
  Settings,
  Store,
  LogOut,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  // If user is not admin, show secure authorization guard screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E7DFD7] shadow-xl">
          <div className="w-14 h-14 rounded-full bg-[#C96A6A]/10 text-[#C96A6A] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#3D2E24] mb-2">
            Admin Authorization Required
          </h2>
          <p className="text-xs text-[#7B6656] leading-relaxed mb-6">
            You do not have administrative permissions to view this portal. Only authorized AaaS managers and master artisans can access this workspace.
          </p>

          <Link
            to="/"
            className="w-full py-2.5 px-4 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Inventory Hub', path: '/admin/inventory', icon: Boxes },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Custom Orders', path: '/admin/custom-orders', icon: Sparkles },
    { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { name: 'Store Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8F5F0] text-[#5A4335] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E7DFD7] flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-[#E7DFD7]">
            <Logo size="md" />
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#C6A15B] tracking-wider uppercase">
              <Shield className="w-3.5 h-3.5" /> Management Console
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#5A4335] text-white shadow-xs'
                      : 'text-[#7B6656] hover:bg-[#F8F5F0] hover:text-[#3D2E24]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Storefront link */}
        <div className="p-4 border-t border-[#E7DFD7] space-y-3">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-[#EADCCF]/60 hover:bg-[#EADCCF] text-[#5A4335] text-xs font-semibold rounded-xl transition-colors"
          >
            <Store className="w-3.5 h-3.5" /> View Live Storefront
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#5A4335] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#3D2E24] truncate">
                  {user?.full_name || 'Master Artisan'}
                </p>
                <p className="text-[10px] text-[#7B6656] truncate">
                  {user?.email || 'admin@aaascrochet.com'}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 text-[#7B6656] hover:text-[#C96A6A] rounded-lg transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#E7DFD7] px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-[#7B6656]">
            <span>Portal</span>
            <span>/</span>
            <span className="font-semibold text-[#3D2E24] capitalize">
              {location.pathname.split('/')[2] || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8FA57D]/15 text-[#8FA57D] text-xs font-semibold rounded-full border border-[#8FA57D]/30">
              <span className="w-2 h-2 rounded-full bg-[#8FA57D] animate-pulse" /> Live Store Active
            </span>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
