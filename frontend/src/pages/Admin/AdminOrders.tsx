import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  Eye,
  Printer,
  X,
  Send,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Calendar,
  FileText,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { getAdminOrders, updateOrderStatus } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { OrderDetailDrawer } from '../../components/admin/OrderDetailDrawer';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const CARRIER_OPTIONS = [
  'BlueDart',
  'Delhivery',
  'India Post (Speed Post)',
  'DTDC',
  'DHL Express',
  'FedEx India',
  'Shadowfax',
];

// Valid state machine transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Selected Order for Slide-Over Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Drawer Form State
  const [editStatus, setEditStatus] = useState<OrderStatus>('pending');
  const [carrierName, setCarrierName] = useState<string>('BlueDart');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');

  const { success, error: toastError } = useToast();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminOrders({
        status: activeTab !== 'all' ? activeTab : undefined,
        search: search.trim() || undefined,
      });
      setOrders(data);
    } catch (err) {
      toastError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  // Open Drawer with selected order
  const handleOpenDrawer = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setCarrierName(order.carrier_name || 'BlueDart');
    setTrackingNumber(order.tracking_number || '');
    setAdminNotes(order.notes || '');
  };

  // Check if transition is valid
  const currentStatus = selectedOrder?.status || 'pending';
  const allowedNextStatuses = [
    currentStatus, // Allow re-saving current state
    ...(VALID_TRANSITIONS[currentStatus] || []),
  ];

  // Save status & fulfillment
  const handleSaveFulfillment = async () => {
    if (!selectedOrder) return;

    if (editStatus === 'shipped') {
      if (!carrierName.trim()) {
        toastError('Please select a shipping carrier');
        return;
      }
      if (!trackingNumber.trim()) {
        toastError('Tracking number is required when marking as shipped');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(selectedOrder.id, {
        status: editStatus,
        carrier_name: editStatus === 'shipped' ? carrierName.trim() : undefined,
        tracking_number: editStatus === 'shipped' ? trackingNumber.trim() : undefined,
        notes: adminNotes.trim() || undefined,
      });

      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      success(`Order #${updated.order_number} marked as ${editStatus}`);
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Print Packing Slip
  const handlePrintPackingSlip = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toastError('Pop-up blocked. Please allow pop-ups to print packing slips.');
      return;
    }

    const addr = selectedOrder.shipping_address || {};
    const itemsHtml = selectedOrder.items
      .map(
        (it) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${it.product_name}</strong>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${it.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${it.unit_price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${it.subtotal}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing Slip - ${selectedOrder.order_number}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #3D2E24; padding: 40px; margin: 0; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #5A4335; padding-bottom: 20px; margin-bottom: 30px; }
            .brand { font-size: 24px; font-weight: bold; color: #5A4335; }
            .order-title { font-size: 18px; font-weight: bold; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-block { width: 48%; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th { background: #FAF7F2; padding: 10px; text-align: left; border-bottom: 2px solid #5A4335; font-size: 11px; text-transform: uppercase; }
            .totals { margin-left: auto; width: 250px; font-size: 13px; line-height: 1.8; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #7B6656; border-top: 1px solid #E7DFD7; padding-top: 20px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">AaaS Boutique</div>
              <div style="font-size: 12px; color: #7B6656;">Premium Handcrafted Crochet Creations</div>
            </div>
            <div style="text-align: right;">
              <div class="order-title">PACKING SLIP</div>
              <div style="font-size: 12px; font-family: monospace;">Order: ${selectedOrder.order_number}</div>
              <div style="font-size: 12px; color: #7B6656;">Date: ${formatDate(selectedOrder.created_at)}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <strong>SHIP TO:</strong><br />
              ${selectedOrder.customer_name || addr.fullName || 'Valued Patron'}<br />
              ${addr.address || ''}<br />
              ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}<br />
              Phone: ${selectedOrder.customer_phone || addr.phone || 'N/A'}<br />
              Email: ${selectedOrder.customer_email || addr.email || 'N/A'}
            </div>
            <div class="info-block" style="text-align: right;">
              <strong>DISPATCH DETAILS:</strong><br />
              Status: ${selectedOrder.status.toUpperCase()}<br />
              Payment: ${(selectedOrder.payment_status || 'paid').toUpperCase()} (${(selectedOrder.payment_method || 'razorpay').toUpperCase()})<br />
              Carrier: ${selectedOrder.carrier_name || 'Pending'}<br />
              Tracking: ${selectedOrder.tracking_number || 'Pending'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item & Craft Details</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span>
              <span>₹${selectedOrder.subtotal || selectedOrder.total_amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Shipping Fee:</span>
              <span>₹${selectedOrder.shipping_fee || 0}</span>
            </div>
            ${
              selectedOrder.discount_amount
                ? `
            <div style="display: flex; justify-content: space-between; color: #C96A6A;">
              <span>Discount:</span>
              <span>-₹${selectedOrder.discount_amount}</span>
            </div>`
                : ''
            }
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #5A4335; padding-top: 6px;">
              <span>Grand Total:</span>
              <span>₹${selectedOrder.total_amount}</span>
            </div>
          </div>

          <div class="footer">
            Thank you for supporting slow, sustainable handcrafted artisan crochet! 🌸<br />
            Visit us: www.aaascrochet.com | Follow on Instagram: @aaas_crochet
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
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
            <XCircle className="w-3 h-3" /> {status}
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

  const getPaymentBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'paid' || s === 'completed') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
          Paid
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
          Failed
        </span>
      );
    }
    if (s === 'expired') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-neutral-200 text-neutral-700">
          Expired
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24] flex items-center gap-2.5">
            <Package className="w-7 h-7 text-[#C6A15B]" /> Order Fulfillment Pipeline
          </h1>
          <p className="text-xs text-[#7B6656] mt-1">
            Track customer orders, manage parcel dispatch, assign tracking codes, and print packing slips
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7DFD7] shadow-2xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E7DFD7] pb-3 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-[#5A4335] text-white shadow-xs'
                  : 'text-[#7B6656] hover:bg-[#F8F5F0] hover:text-[#3D2E24]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order #, Customer Name, Email, or Tracking Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders Data Grid */}
      <div className="bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#7B6656]">Loading order records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-[#EADCCF] mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-[#3D2E24]">No orders found</p>
            <p className="text-xs text-[#7B6656] mt-1">
              There are no orders matching your current tab filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7DFD7] bg-[#FAF7F2] text-[11px] font-bold text-[#5A4335] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-center">Fulfillment</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFD7] text-xs">
                {orders.map((o) => {
                  const addr = o.shipping_address || {};
                  const custName = o.customer_name || addr.fullName || 'Guest Customer';
                  const custEmail = o.customer_email || addr.email || 'N/A';

                  return (
                    <tr key={o.id} className="hover:bg-[#F8F5F0]/50 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#3D2E24]">
                        {o.order_number}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#7B6656]">
                        {formatDate(o.created_at)}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-[#3D2E24]">{custName}</p>
                          <p className="text-[11px] text-[#7B6656]">{custEmail}</p>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-bold text-[#3D2E24]">
                        {formatPrice(o.total_amount)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getPaymentBadge(o.payment_status)}
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(o.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(o)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#5A4335] hover:text-white text-[#5A4335] text-xs font-bold rounded-xl border border-[#E7DFD7] transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={(updated) => {
          setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
          setSelectedOrder(updated);
        }}
      />
    </div>
  );
};
