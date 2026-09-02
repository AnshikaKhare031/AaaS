import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BarChart3,
  Boxes,
  Store,
  LogOut,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Orders', path: '/admin/orders', icon: Package },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Inventory Hub', path: '/admin/inventory', icon: Boxes },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8F5F0] text-[#5A4335] font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-[#E7DFD7] flex flex-col justify-between flex-shrink-0 transition-all duration-300 z-20`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-[#E7DFD7] flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <Logo size="md" />
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-[#C6A15B] tracking-wider uppercase">
                  <Shield className="w-3 h-3" /> Management Console
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="mx-auto text-[#5A4335]">
                <Shield className="w-6 h-6 text-[#C6A15B]" />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-[#7B6656] hover:text-[#3D2E24] hover:bg-[#F8F5F0] rounded-lg transition-colors cursor-pointer hidden md:block"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                  } py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#5A4335] text-white shadow-xs'
                      : 'text-[#7B6656] hover:bg-[#F8F5F0] hover:text-[#3D2E24]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Storefront link */}
        <div className="p-3 border-t border-[#E7DFD7] space-y-2">
          <Link
            to="/"
            title="View Live Storefront"
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 py-2 px-3'
            } w-full bg-[#EADCCF]/60 hover:bg-[#EADCCF] text-[#5A4335] text-xs font-semibold rounded-xl transition-colors`}
          >
            <Store className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && <span>Live Storefront</span>}
          </Link>

          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } pt-2`}
          >
            {!isCollapsed && (
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
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#7B6656] hover:text-[#C96A6A] hover:bg-[#C96A6A]/10 rounded-lg transition-colors cursor-pointer"
              title="Sign out of admin console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#E7DFD7] px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-[#7B6656] hover:text-[#3D2E24] rounded-lg md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-[#7B6656]">
              <span>Portal</span>
              <span>/</span>
              <span className="font-semibold text-[#3D2E24] capitalize">
                {location.pathname.split('/')[2] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8FA57D]/15 text-[#8FA57D] text-xs font-semibold rounded-full border border-[#8FA57D]/30">
              <span className="w-2 h-2 rounded-full bg-[#8FA57D] animate-pulse" /> Live Store Active
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-[#C6A15B]/15 text-[#8C6D32] text-xs font-bold rounded-lg uppercase tracking-wider border border-[#C6A15B]/30">
              <Shield className="w-3 h-3" /> Super Admin
            </span>
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5A4335] hover:text-[#3D2E24] hover:bg-[#F8F5F0] rounded-xl transition-colors border border-[#E7DFD7]"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Store Preview
            </Link>
          </div>
        </header>

        {/* Dynamic Content Outlet */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
