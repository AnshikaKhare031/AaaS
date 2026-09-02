import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Package,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Award,
} from 'lucide-react';
import { AdminAnalyticsResponse, AnalyticsTimeRange } from '../../types';
import { getAdminAnalytics } from '../../services/api';
import { formatPrice } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

const RANGES: { label: string; value: AnalyticsTimeRange }[] = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Year to Date', value: 'ytd' },
];

export const AdminAnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChartPoint, setActiveChartPoint] = useState<any | null>(null);

  const { error: toastError } = useToast();

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminAnalytics(timeRange);
      setAnalytics(data);
      if (data.timeline.length > 0) {
        setActiveChartPoint(data.timeline[data.timeline.length - 1]);
      }
    } catch (err) {
      toastError('Failed to load analytics metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  // Compute SVG coordinates for Area/Line Chart
  const timeline = analytics?.timeline || [];
  const maxRevenue = Math.max(...timeline.map((t) => t.revenue), 1000);
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 30;
  const paddingY = 20;

  const points = timeline.map((t, idx) => {
    const x =
      paddingX + (idx / Math.max(timeline.length - 1, 1)) * (chartWidth - 2 * paddingX);
    const y =
      chartHeight -
      paddingY -
      (t.revenue / maxRevenue) * (chartHeight - 2 * paddingY);
    return { x, y, data: t };
  });

  const pathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : '';

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
          points[0].x
        } ${chartHeight - paddingY} Z`
      : '';

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header with Time-Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24] flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-[#C6A15B]" /> Analytics & Financial Intelligence
          </h1>
          <p className="text-xs text-[#7B6656] mt-1">
            Real-time revenue performance, order volume growth, and product category trends
          </p>
        </div>

        {/* Time-Range Selector */}
        <div className="inline-flex bg-white p-1 rounded-2xl border border-[#E7DFD7] shadow-2xs">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === r.value
                  ? 'bg-[#5A4335] text-white shadow-xs'
                  : 'text-[#7B6656] hover:text-[#3D2E24]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !analytics ? (
        <div className="p-16 bg-white rounded-2xl border border-[#E7DFD7] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#7B6656]">Aggregating financial reports...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Summary Cards with Trend Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B6656]">
                  Total Revenue
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#5A4335]/10 text-[#5A4335] flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#C6A15B]" />
                </div>
              </div>

              <div>
                <p className="font-serif text-2xl font-bold text-[#3D2E24]">
                  {formatPrice(analytics.total_revenue)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {analytics.revenue_change_pct >= 0 ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +{analytics.revenue_change_pct}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {analytics.revenue_change_pct}%
                    </span>
                  )}
                  <span className="text-[10px] text-[#7B6656]">vs previous period</span>
                </div>
              </div>
            </div>

            {/* Order Volume */}
            <div className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B6656]">
                  Order Volume
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#C6A15B]" />
                </div>
              </div>

              <div>
                <p className="font-serif text-2xl font-bold text-[#3D2E24]">
                  {analytics.order_volume}{' '}
                  <span className="text-xs font-normal text-[#7B6656]">orders</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {analytics.order_volume_change_pct >= 0 ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +{analytics.order_volume_change_pct}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {analytics.order_volume_change_pct}%
                    </span>
                  )}
                  <span className="text-[10px] text-[#7B6656]">vs previous period</span>
                </div>
              </div>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B6656]">
                  Average Order Value (AOV)
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#8FA57D]/15 text-[#8FA57D] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#8FA57D]" />
                </div>
              </div>

              <div>
                <p className="font-serif text-2xl font-bold text-[#3D2E24]">
                  {formatPrice(analytics.aov)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {analytics.aov_change_pct >= 0 ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +{analytics.aov_change_pct}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {analytics.aov_change_pct}%
                    </span>
                  )}
                  <span className="text-[10px] text-[#7B6656]">basket size</span>
                </div>
              </div>
            </div>

            {/* Payment Health Breakdown */}
            <div className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B6656]">
                  Payment Health
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#EADCCF]/70 text-[#5A4335] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#C6A15B]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {analytics.payment_health?.paid ?? 0} Paid
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                    {analytics.payment_health?.pending ?? 0} Pending
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                    {analytics.payment_health?.failed ?? 0} Failed
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200 text-neutral-700">
                    {analytics.payment_health?.expired ?? 0} Expired
                  </span>
                </div>
                <p className="text-[10px] text-[#7B6656] mt-2">
                  Revenue strictly derived from qualifying paid orders
                </p>
              </div>
            </div>
          </div>

          {/* Area & Line Chart: Revenue & Order Trends */}
          <div className="p-6 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DFD7] pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-[#3D2E24]">
                  Revenue & Order Trajectory
                </h2>
                <p className="text-xs text-[#7B6656]">
                  Daily gross revenue and order frequency across the selected timeline
                </p>
              </div>

              {activeChartPoint && (
                <div className="px-3 py-1 bg-[#FAF7F2] rounded-xl border border-[#E7DFD7] text-xs">
                  <span className="text-[#7B6656]">{activeChartPoint.date}:</span>{' '}
                  <strong className="text-[#5A4335]">{formatPrice(activeChartPoint.revenue)}</strong>{' '}
                  <span className="text-[#7B6656]">({activeChartPoint.orders} orders)</span>
                </div>
              )}
            </div>

            {/* SVG Interactive Chart */}
            <div className="relative overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-56 sm:h-64 overflow-visible"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6A15B" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#C6A15B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                  const y =
                    chartHeight -
                    paddingY -
                    ratio * (chartHeight - 2 * paddingY);
                  return (
                    <line
                      key={ratio}
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#E7DFD7"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Area Fill */}
                {areaD && <path d={areaD} fill="url(#areaGradient)" />}

                {/* Primary Trend Line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#5A4335"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Data Points */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={activeChartPoint?.date === p.data.date ? '5' : '3'}
                      fill={activeChartPoint?.date === p.data.date ? '#C6A15B' : '#5A4335'}
                      className="transition-all cursor-pointer"
                      onMouseEnter={() => setActiveChartPoint(p.data)}
                    />
                  </g>
                ))}
              </svg>

              {/* Date Labels on X-Axis */}
              <div className="flex justify-between text-[10px] text-[#7B6656] px-4 pt-2">
                <span>{timeline[0]?.date}</span>
                <span>{timeline[Math.floor(timeline.length / 2)]?.date}</span>
                <span>{timeline[timeline.length - 1]?.date}</span>
              </div>
            </div>
          </div>

          {/* Two Columns: Category Breakdown & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown (Donut / Progress Share) */}
            <div className="p-6 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-4">
              <h2 className="font-serif text-base font-bold text-[#3D2E24] flex items-center gap-2 border-b border-[#E7DFD7] pb-3">
                <Layers className="w-4 h-4 text-[#C6A15B]" /> Revenue Contribution by Category
              </h2>

              <div className="space-y-3">
                {analytics.category_breakdown.map((cat, idx) => {
                  const colors = ['#5A4335', '#C6A15B', '#8FA57D', '#6A9BC9'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={cat.category} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#3D2E24]">{cat.category}</span>
                        <span className="text-[#5A4335]">
                          {formatPrice(cat.revenue)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#FAF7F2] overflow-hidden border border-[#E7DFD7]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(cat.percentage, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top-Performing Products */}
            <div className="p-6 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-4">
              <h2 className="font-serif text-base font-bold text-[#3D2E24] flex items-center gap-2 border-b border-[#E7DFD7] pb-3">
                <Award className="w-4 h-4 text-[#C6A15B]" /> Top-Performing Creations
              </h2>

              <div className="divide-y divide-[#E7DFD7]">
                {analytics.top_products.map((prod, idx) => (
                  <div key={prod.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-5 font-serif font-bold text-[#C6A15B]">
                        #{idx + 1}
                      </span>
                      <img
                        src={prod.image || '/images/tulip_bouquet.jpg'}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#E7DFD7]"
                      />
                      <div>
                        <p className="font-bold text-[#3D2E24]">{prod.name}</p>
                        <p className="text-[11px] text-[#7B6656]">
                          {prod.units_sold} units sold
                        </p>
                      </div>
                    </div>

                    <span className="font-bold text-[#3D2E24]">
                      {formatPrice(prod.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
