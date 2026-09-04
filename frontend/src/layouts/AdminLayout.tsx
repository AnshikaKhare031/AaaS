import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Menu,
  X,
  ArrowLeft,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { ToastProvider } from "../components/admin/Toast";
import { useAuth } from "../context/AuthContext";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: ShoppingBag },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      navigate("/admin/login");
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50/50 flex text-slate-800 font-sans">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 px-6 flex items-center justify-between">
          <Link to="/admin" className="font-serif text-lg font-semibold tracking-wide">
            AaaS <span className="text-accent font-light italic">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 bottom-0 w-[228px] min-w-[228px] max-w-[228px] bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } h-screen shrink-0`}
        >
          <div className="overflow-y-auto flex-1 min-h-0">
            {/* Sidebar Logo Header */}
            <div className="h-16 border-b border-slate-100 px-5 flex items-center justify-between shrink-0">
              <Link to="/admin" className="font-serif text-lg font-semibold tracking-wide text-slate-900">
                AaaS <span className="text-accent font-normal italic">Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Menu */}
            <nav className="p-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Link back to public site */}
          <div className="p-3.5 border-t border-slate-100 space-y-2 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-rose-200 hover:bg-rose-50/50 text-xs font-semibold text-rose-600 tracking-wider uppercase transition-colors cursor-pointer"
            >
              <span>Log Out</span>
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 tracking-wider uppercase transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Store</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col min-h-screen min-w-0 bg-[#FAF7F2]">
          <main className="flex-grow p-6 md:p-8 lg:p-10 pt-20 lg:pt-10 overflow-x-hidden max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

export default AdminLayout;
