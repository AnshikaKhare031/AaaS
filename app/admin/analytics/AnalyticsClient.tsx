"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Clock, 
  Users, 
  ClipboardList 
} from "lucide-react";
import RevenueChart from "@/components/admin/RevenueChart";
import BestSellingProducts from "@/components/admin/BestSellingProducts";
import CategoryPerformance from "@/components/admin/CategoryPerformance";
import RevenueSummary from "@/components/admin/RevenueSummary";
import TopCustomers from "@/components/admin/TopCustomers";
import VisitorOverview from "@/components/admin/VisitorOverview";
import TrafficSources from "@/components/admin/TrafficSources";
import DeviceBreakdown from "@/components/admin/DeviceBreakdown";
import TopPages from "@/components/admin/TopPages";
import GeoDistribution from "@/components/admin/GeoDistribution";
import ProductPerformance from "@/components/admin/ProductPerformance";
import AnalyticsTimestamp from "@/components/admin/AnalyticsTimestamp";

export default function AnalyticsClient() {
  const [analytics, setAnalytics] = useState<{
    kpis: {
      ordersToday: number;
      pendingOrders: number;
      revenueToday: number;
      visitorsToday: number | null;
    };
    revenue30Days: { date: string; revenue: number }[];
    recentOrders: {
      id: string;
      order_number: string;
      customer_name: string;
      total: number;
      order_status: string;
      payment_status: string;
      created_at: string;
    }[];
    bestSellingProducts: {
      name: string;
      quantity: number;
      revenue: number;
      category: string;
    }[];
    categoryPerformance: {
      category: string;
      revenue: number;
      percentage: number;
    }[];
    topCustomers: {
      name: string;
      orders: number;
      spent: number;
    }[];
    summary: {
      averageOrderValue: number;
      revenueThisWeek: number;
      revenueThisMonth: number;
      revenueThisYear: number;
    };
    traffic: {
      visitorsToday: number | null;
      pageViewsToday: number | null;
      uniqueVisitors: number | null;
      bounceRate: number | null;
      averageSessionDuration: number | null;
    };
    sources: {
      name: string;
      visitors: number;
      percentage: number;
    }[] | null;
    devices: {
      type: string;
      percentage: number;
    }[] | null;
    countries: {
      country: string;
      visitors: number;
    }[] | null;
    topPages: {
      path: string;
      views: number;
    }[] | null;
    productPerformance: {
      productId: string;
      name: string;
      views: number | null;
      orders: number;
      revenue: number;
      conversion: number | null;
      lastPurchased: string | null;
    }[];
    lastUpdated: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) {
          throw new Error("Failed to fetch business analytics");
        }
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error("Error loading admin analytics page:", err);
        setError(err instanceof Error ? err.message : "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5DACB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#EC8D99] font-medium font-sans">Business Intelligence</span>
          <h1 className="font-serif text-3xl md:text-4xl text-[#25382E] mt-1">Atelier Performance</h1>
          <p className="text-xs text-[#5C745F] font-light mt-1 mb-2">
            Overview of creation acquisitions, patron engagement, and boutique commerce metrics.
          </p>
          {analytics && <AnalyticsTimestamp timestamp={analytics.lastUpdated} />}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-[#FFFAF1] p-6 border border-[#E5DACB] rounded-2xl animate-pulse h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl animate-pulse h-64" />
            <div className="lg:col-span-5 bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl animate-pulse h-64" />
          </div>
        </div>
      ) : error ? (
        <div className="bg-[#FFFAF1] border border-[#C96A6A]/30 rounded-2xl p-6 text-[#C96A6A] text-xs flex items-center gap-3">
          <span>Failed to load atelier business analytics. Please reload the page.</span>
        </div>
      ) : analytics ? (
        <div className="space-y-8">
          {/* Sales Overview KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* KPI 1: Orders Today */}
            <div className="bg-[#FFFAF1] p-4 md:p-6 border border-[#E5DACB] rounded-2xl shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] text-[#5C745F] font-medium uppercase tracking-[0.15em] block">
                  Orders Today
                </span>
                <p className="text-xl md:text-3xl font-serif font-semibold text-[#25382E]">
                  {analytics.kpis.ordersToday}
                </p>
              </div>
              <div className="p-2.5 md:p-3 border bg-[#EC8D99]/20 text-[#25382E] border-[#EC8D99]/40 rounded-xl shrink-0">
                <ClipboardList size={18} />
              </div>
            </div>

            {/* KPI 2: Revenue Today */}
            <div className="bg-[#FFFAF1] p-4 md:p-6 border border-[#E5DACB] rounded-2xl shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] text-[#5C745F] font-medium uppercase tracking-[0.15em] block">
                  Revenue Today
                </span>
                <p className="text-xl md:text-3xl font-serif font-semibold text-[#25382E]">
                  ₹{analytics.kpis.revenueToday.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-2.5 md:p-3 border bg-[#405F4C]/15 text-[#405F4C] border-[#405F4C]/25 rounded-xl shrink-0">
                <TrendingUp size={18} />
              </div>
            </div>

            {/* KPI 3: Pending Orders */}
            <div className="bg-[#FFFAF1] p-4 md:p-6 border border-[#E5DACB] rounded-2xl shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] text-[#5C745F] font-medium uppercase tracking-[0.15em] block">
                  Pending Orders
                </span>
                <p className="text-xl md:text-3xl font-serif font-semibold text-[#25382E]">
                  {analytics.kpis.pendingOrders}
                </p>
              </div>
              <div className="p-2.5 md:p-3 border bg-[#F5C842]/20 text-[#25382E] border-[#F5C842]/40 rounded-xl shrink-0">
                <Clock size={18} />
              </div>
            </div>

            {/* KPI 4: Visitors Today */}
            <div className="bg-[#FFFAF1] p-4 md:p-6 border border-[#E5DACB] rounded-2xl shadow-xs flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] text-[#5C745F] font-medium uppercase tracking-[0.15em] block">
                  Visitors Today
                </span>
                <p className={`font-serif font-semibold ${analytics.traffic.visitorsToday === null ? "text-[11px] text-[#5C745F]/70 uppercase tracking-[0.15em] font-sans" : "text-xl md:text-3xl text-[#25382E]"}`}>
                  {analytics.traffic.visitorsToday !== null ? analytics.traffic.visitorsToday.toLocaleString() : "Tracking Soon"}
                </p>
              </div>
              <div className="p-2.5 md:p-3 border bg-[#F8F2E7] text-[#5C745F] border-[#E5DACB] rounded-xl shrink-0">
                <Users size={18} />
              </div>
            </div>
          </div>

          {/* Revenue chart & Revenue summary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <RevenueChart data={analytics.revenue30Days} />
            </div>
            <div className="lg:col-span-5">
              <RevenueSummary summary={analytics.summary} />
            </div>
          </div>

          {/* Business Intelligence Row (Phase 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BestSellingProducts products={analytics.bestSellingProducts} />
            <CategoryPerformance categories={analytics.categoryPerformance} />
            <TopCustomers customers={analytics.topCustomers} />
          </div>

          {/* Traffic Overview & Details Row (Phase 3) */}
          <div className="space-y-6 border-t border-[#E5DACB] pt-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#25382E]">Patron Traffic & Footfall</h3>
              <p className="text-xs text-[#5C745F] font-sans mt-0.5">Visitor exploration channels and interaction funnel</p>
            </div>
            
            <VisitorOverview traffic={analytics.traffic} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TrafficSources sources={analytics.sources} />
              <DeviceBreakdown devices={analytics.devices} />
              <GeoDistribution countries={analytics.countries} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <TopPages pages={analytics.topPages} />
              </div>
              <div className="lg:col-span-8">
                <ProductPerformance products={analytics.productPerformance} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
