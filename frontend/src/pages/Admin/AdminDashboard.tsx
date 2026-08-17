import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { AdminDashboardMetrics } from '../../types';
import { getDashboardMetrics } from '../../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const dashMetrics = await getDashboardMetrics();
      setMetrics(dashMetrics);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
      const detail = err.response?.data?.detail || "Couldn't load dashboard metrics — please check your connection and try refreshing.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E7DFD7]" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage || !metrics) {
    return (
      <div className="bg-white rounded-3xl border border-[#E7DFD7] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-[#C96A6A]/10 text-[#C96A6A] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#3D2E24]">Dashboard Load Error</h3>
        <p className="text-xs text-[#7B6656] leading-relaxed">
          {errorMessage || "Couldn't load real-time metrics from the server."}
        </p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">
            Store Overview & Metrics
          </h1>
          <p className="text-xs text-[#7B6656] mt-1">
            Real-time catalog, custom commission requests, and review moderation.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/products"
            className="px-4 py-2 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Manage Products
          </Link>
          <Link
            to="/admin/custom-orders"
            className="px-4 py-2 bg-[#C6A15B] text-[#3D2E24] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#b08d47] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" /> Custom Requests
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link
          to="/admin/products"
          className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-xs space-y-2 hover:border-[#C6A15B] transition-all group"
        >
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Products</span>
            <div className="w-8 h-8 rounded-lg bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {metrics.total_products}
          </p>
          <p className="text-[11px] text-[#7B6656] flex items-center gap-1 group-hover:text-[#C6A15B] transition-colors">
            View catalog <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          to="/admin/inventory"
          className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-xs space-y-2 hover:border-[#C6A15B] transition-all group"
        >
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-[#C96A6A]/15 text-[#C96A6A] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {metrics.low_stock_count}
          </p>
          <p className="text-[11px] text-[#C96A6A] font-semibold flex items-center gap-1">
            <Boxes className="w-3 h-3" /> Low stock items
          </p>
        </Link>

        <Link
          to="/admin/custom-orders"
          className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-xs space-y-2 hover:border-[#C6A15B] transition-all group"
        >
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Custom Requests</span>
            <div className="w-8 h-8 rounded-lg bg-[#C6A15B]/20 text-[#3D2E24] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {metrics.custom_order_count}
          </p>
          <p className="text-[11px] text-[#C6A15B] font-semibold flex items-center gap-1">
            Bespoke commissions <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          to="/admin/reviews"
          className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-xs space-y-2 hover:border-[#C6A15B] transition-all group"
        >
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-[#8FA57D]/15 text-[#8FA57D] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="font-sans text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {metrics.pending_reviews_count}
          </p>
          <p className="text-[11px] text-[#8FA57D] font-medium flex items-center gap-1">
            Awaiting moderation <ArrowRight className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <Link
          to="/admin/inventory"
          className="p-6 bg-white rounded-3xl border border-[#E7DFD7] shadow-xs hover:border-[#C6A15B] transition-all space-y-2 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EADCCF] flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#3D2E24]">Inventory Management</h3>
          </div>
          <p className="text-xs text-[#7B6656]">
            Quickly adjust handmade stock counts and restock batches.
          </p>
        </Link>

        <Link
          to="/admin/custom-orders"
          className="p-6 bg-white rounded-3xl border border-[#E7DFD7] shadow-xs hover:border-[#C6A15B] transition-all space-y-2 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EADCCF] flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#3D2E24]">Bespoke Requests</h3>
          </div>
          <p className="text-xs text-[#7B6656]">
            Review custom customer commissions, budgets, and production notes.
          </p>
        </Link>

        <Link
          to="/admin/reviews"
          className="p-6 bg-white rounded-3xl border border-[#E7DFD7] shadow-xs hover:border-[#C6A15B] transition-all space-y-2 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EADCCF] flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#3D2E24]">Customer Feedback</h3>
          </div>
          <p className="text-xs text-[#7B6656]">
            Moderate and approve authentic patron ratings and testimonials.
          </p>
        </Link>
      </div>
    </div>
  );
};
