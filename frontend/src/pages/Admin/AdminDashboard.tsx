import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  Package,
  BarChart3,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AdminDashboardOverviewResponse, Order } from '../../types';
import { getAdminDashboardOverview, runPaymentRecoverySweep } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { OrderDetailDrawer } from '../../components/admin/OrderDetailDrawer';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { success, error: toastError, info } = useToast();

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const overview = await getAdminDashboardOverview();
      setData(overview);
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
      const detail =
        err.response?.data?.detail ||
        "Couldn't load dashboard data — please check your server connection and try refreshing.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRunRecoverySweep = async () => {
    setIsSweeping(true);
    try {
      const res = await runPaymentRecoverySweep(30);
      if (res.recovered_paid > 0) {
        success(
          `Payment recovery complete: ${res.recovered_paid} pending order(s) successfully confirmed to PAID!`
        );
      } else if (res.marked_failed_or_expired > 0) {
        info(
          `Recovery sweep complete: ${res.marked_failed_or_expired} stale checkout(s) marked EXPIRED.`
        );
      } else {
        info('Recovery sweep completed: all payment records are healthy and synchronized.');
      }
      await loadDashboard();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to execute payment recovery sweep.');
    } finally {
      setIsSweeping(false);
    }
  };

  const getPaymentBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'paid' || s === 'completed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
          Paid
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
          Failed
        </span>
      );
    }
    if (s === 'expired') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-200 text-neutral-700">
          Expired
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
        Pending
      </span>
    );
  };

  const getOrderStatusBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8FA57D]/15 text-[#5C734B]">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6A9BC9]/15 text-[#3D719F]">
            <Truck className="w-3 h-3" /> Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5B869]/20 text-[#A67B28]">
            <Clock className="w-3 h-3" /> Processing
          </span>
        );
      case 'cancelled':
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C96A6A]/15 text-[#C96A6A]">
            <XCircle className="w-3 h-3" /> {s}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F2] text-[#7B6656] border border-[#E7DFD7]">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E7DFD7]" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-[#E7DFD7]" />
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="bg-white rounded-3xl border border-[#E7DFD7] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-[#C96A6A]/10 text-[#C96A6A] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#3D2E24]">Dashboard Load Error</h3>
        <p className="text-xs text-[#7B6656] leading-relaxed">
          {errorMessage || "Couldn't load operational metrics from the server."}
        </p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] transition-colors cursor-pointer"
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
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            Operational Command Center
          </h1>
          <p className="text-xs text-[#7B6656] mt-1">
            Real database metrics, payment reconciliation health, and live customer orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunRecoverySweep}
            disabled={isSweeping}
            className="px-3.5 py-2 bg-white border border-[#E7DFD7] hover:bg-[#EADCCF]/40 text-[#5A4335] text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Scan gateway ledger for captured payments missing webhooks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
            {isSweeping ? 'Sweeping...' : 'Payment Sweep'}
          </button>
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Package className="w-3.5 h-3.5" /> All Orders
          </Link>
          <Link
            to="/admin/analytics"
            className="px-4 py-2 bg-[#C6A15B] text-[#3D2E24] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#b08d47] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </Link>
        </div>
      </div>

      {/* Operational KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Paid Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Paid Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#8FA57D]/15 text-[#5C734B] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {formatPrice(data.total_revenue)}
          </p>
          <p className="text-[11px] text-[#5C734B] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Derived only from qualifying paid orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#5A4335]/10 text-[#5A4335] flex items-center justify-center">
              <Package className="w-4 h-4 text-[#C6A15B]" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {data.total_orders}
          </p>
          <p className="text-[11px] text-[#7B6656]">
            {data.paid_orders} paid &middot; {data.pending_orders} pending checkout
          </p>
        </div>

        {/* Payment Health */}
        <div className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Payment Health</span>
            <div className="w-8 h-8 rounded-lg bg-[#EADCCF] text-[#5A4335] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {data.payment_health?.paid ?? data.paid_orders} Paid
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
              {data.payment_health?.pending ?? data.pending_orders} Pending
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
              {data.payment_health?.failed ?? data.failed_payments} Failed
            </span>
          </div>
          <p className="text-[11px] text-[#7B6656]">
            {data.payment_health?.expired ?? data.expired_payments} expired checkouts
          </p>
        </div>

        {/* Inventory Stock Alerts */}
        <Link
          to="/admin/inventory"
          className="p-5 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-2 hover:border-[#C6A15B] transition-all group"
        >
          <div className="flex items-center justify-between text-[#7B6656]">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-[#C96A6A]/15 text-[#C96A6A] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {data.low_stock_count}
          </p>
          <p className="text-[11px] text-[#C96A6A] font-semibold flex items-center gap-1 group-hover:text-[#3D2E24] transition-colors">
            <Boxes className="w-3 h-3" /> Handcrafted items needing restock &rarr;
          </p>
        </Link>
      </div>

      {/* Operational Alerts Section */}
      {data.operational_alerts && data.operational_alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#5A4335]">
            Operational Alerts & Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.operational_alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  alert.type === 'danger'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : alert.type === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-sky-50/70 border-sky-200 text-sky-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold">{alert.title}</h4>
                    <p className="text-[11px] opacity-80 mt-0.5">{alert.description}</p>
                  </div>
                </div>
                {alert.action_link && (
                  <Link
                    to={alert.action_link}
                    className="text-[11px] font-bold underline flex items-center gap-1 flex-shrink-0 hover:opacity-75"
                  >
                    Resolve <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table (Clickable to inspect in drawer) */}
      <div className="bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E7DFD7] flex items-center justify-between bg-[#FAF7F2]">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#3D2E24]">Recent Customer Orders</h2>
            <p className="text-[11px] text-[#7B6656]">
              Click any order to inspect customer info, line items, and fulfillment actions in the drawer.
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-[#5A4335] hover:text-[#C6A15B] flex items-center gap-1 transition-colors"
          >
            View all ({data.total_orders}) <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {data.recent_orders && data.recent_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7DFD7] bg-[#FAF7F2]/60 text-[11px] font-bold text-[#5A4335] uppercase tracking-wider">
                  <th className="py-3 px-4">Order No.</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Order Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFD7] text-xs">
                {data.recent_orders.map((order) => {
                  const addr = order.shipping_address || {};
                  const custName = order.customer_name || addr.fullName || 'Guest Patron';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-[#F8F5F0] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#3D2E24]">
                        {order.order_number}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#3D2E24]">{custName}</p>
                        <p className="text-[10px] text-[#7B6656]">{order.customer_email || addr.email || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-4 text-[#7B6656]">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#3D2E24]">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getPaymentBadge(order.payment_status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getOrderStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#5A4335] hover:text-white text-[#5A4335] font-bold text-[11px] rounded-lg border border-[#E7DFD7] transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#7B6656] text-xs">
            No recent orders available in the database yet.
          </div>
        )}
      </div>

      {/* Quick Access Operational Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
        <Link
          to="/admin/products"
          className="p-6 bg-white rounded-3xl border border-[#E7DFD7] shadow-2xs hover:border-[#C6A15B] transition-all space-y-2 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EADCCF] flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">Products Catalog</h3>
              <span className="text-[10px] text-[#7B6656]">{data.total_products} Active Items</span>
            </div>
          </div>
          <p className="text-xs text-[#7B6656] pt-1">
            Create new creations, upload images, manage pricing, descriptions, and stock quantities.
          </p>
        </Link>

        <Link
          to="/admin/orders"
          className="p-6 bg-white rounded-3xl border border-[#E7DFD7] shadow-2xs hover:border-[#C6A15B] transition-all space-y-2 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EADCCF] flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">Order Fulfillment</h3>
              <span className="text-[10px] text-[#7B6656]">{data.total_orders} Total Orders</span>
            </div>
          </div>
          <p className="text-xs text-[#7B6656] pt-1">
            Assign logistics carriers, update tracking codes, validate fulfillment states, and print packing slips.
          </p>
        </Link>

        <Link
          to="/admin/analytics"
          className="p-6 bg-white rounded-3xl border border-[#E7DFD7] shadow-2xs hover:border-[#C6A15B] transition-all space-y-2 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EADCCF] flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">Financial Analytics</h3>
              <span className="text-[10px] text-[#7B6656]">Revenue Intelligence</span>
            </div>
          </div>
          <p className="text-xs text-[#7B6656] pt-1">
            Examine paid sales trajectories, average order value, top performing items, and payment health.
          </p>
        </Link>
      </div>

      {/* Interactive Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={(updated) => {
          setSelectedOrder(updated);
          loadDashboard();
        }}
      />
    </div>
  );
};
