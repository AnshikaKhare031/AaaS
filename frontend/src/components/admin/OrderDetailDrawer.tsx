import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  MapPin,
  Mail,
  Phone,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Package,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { updateOrderStatus } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

const CARRIER_OPTIONS = [
  'BlueDart',
  'Delhivery',
  'India Post (Speed Post)',
  'DTDC',
  'DHL Express',
  'FedEx India',
  'Shadowfax',
];

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const [editStatus, setEditStatus] = useState<OrderStatus>('pending');
  const [carrierName, setCarrierName] = useState<string>('BlueDart');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (order) {
      setEditStatus(order.status);
      setCarrierName(order.carrier_name || 'BlueDart');
      setTrackingNumber(order.tracking_number || '');
      setAdminNotes(order.notes || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const currentStatus = order.status || 'pending';
  const allowedNextStatuses = [
    currentStatus,
    ...(VALID_TRANSITIONS[currentStatus] || []),
  ];

  const handleSaveFulfillment = async () => {
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
      const updated = await updateOrderStatus(order.id, {
        status: editStatus,
        carrier_name: editStatus === 'shipped' ? carrierName.trim() : undefined,
        tracking_number: editStatus === 'shipped' ? trackingNumber.trim() : undefined,
        notes: adminNotes.trim() || undefined,
      });

      success(`Order ${order.order_number} status updated to ${editStatus.toUpperCase()}`);
      if (onOrderUpdated) {
        onOrderUpdated(updated);
      }
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintPackingSlip = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const itemsRows = (order.items || [])
      .map(
        (it) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E7DFD7;">${it.product_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E7DFD7; text-align: center;">${it.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E7DFD7; text-align: right;">₹${it.unit_price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E7DFD7; text-align: right; font-weight: bold;">₹${it.subtotal}</td>
        </tr>
      `
      )
      .join('');

    const shipping = order.shipping_address || {};

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing Slip - ${order.order_number}</title>
          <style>
            body { font-family: 'Times New Roman', serif; color: #3D2E24; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #5A4335; padding-bottom: 20px; }
            .brand { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .meta { text-align: right; font-size: 14px; }
            .address-box { display: flex; justify-content: space-between; margin: 30px 0; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #F8F5F0; padding: 10px; text-align: left; border-bottom: 2px solid #5A4335; }
            .totals { margin-top: 20px; float: right; width: 280px; font-size: 14px; line-height: 1.8; }
            .footer { margin-top: 80px; font-size: 11px; text-align: center; color: #7B6656; border-top: 1px solid #E7DFD7; padding-top: 20px; clear: both; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">AaaS CROCHET BOUTIQUE</div>
              <div style="font-size: 12px; color: #7B6656; margin-top: 4px;">Handcrafted Slow-Fashion Luxury</div>
            </div>
            <div class="meta">
              <strong>PACKING SLIP</strong><br />
              Order #: ${order.order_number}<br />
              Date: ${formatDate(order.created_at)}
            </div>
          </div>

          <div class="address-box">
            <div>
              <strong>SHIP TO:</strong><br />
              ${order.customer_name || shipping.fullName || 'Valued Patron'}<br />
              ${shipping.address || 'Address on file'}<br />
              ${shipping.city || ''}, ${shipping.state || ''} - ${shipping.pincode || ''}<br />
              Email: ${order.customer_email || shipping.email || 'N/A'}<br />
              Phone: ${order.customer_phone || shipping.phone || 'N/A'}
            </div>
            <div>
              <strong>CARRIER / TRACKING:</strong><br />
              Carrier: ${order.carrier_name || 'Standard Courier'}<br />
              Tracking #: ${order.tracking_number || 'Pending'}<br />
              Payment Status: ${(order.payment_status || 'PAID').toUpperCase()}<br />
              Payment ID: ${order.provider_payment_id || order.payment_id || 'N/A'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span>
              <span>₹${order.subtotal || order.total_amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Shipping Fee:</span>
              <span>₹${order.shipping_fee || 0}</span>
            </div>
            ${
              order.discount_amount
                ? `
            <div style="display: flex; justify-content: space-between; color: #C96A6A;">
              <span>Discount:</span>
              <span>-₹${order.discount_amount}</span>
            </div>`
                : ''
            }
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #5A4335; padding-top: 6px;">
              <span>Grand Total:</span>
              <span>₹${order.total_amount}</span>
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

  const paymentStatus = (order.payment_status || 'pending').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E7DFD7] flex items-center justify-between bg-[#FAF7F2]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#3D2E24]">
                {order.order_number}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  paymentStatus === 'paid' || paymentStatus === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : paymentStatus === 'failed'
                    ? 'bg-rose-100 text-rose-800'
                    : paymentStatus === 'expired'
                    ? 'bg-neutral-200 text-neutral-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Payment: {paymentStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-[#7B6656] mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Placed on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPackingSlip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EADCCF]/50 text-[#5A4335] text-xs font-bold rounded-xl border border-[#E7DFD7] transition-colors cursor-pointer shadow-2xs"
              title="Print Packing Slip"
            >
              <Printer className="w-4 h-4" /> Print
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#7B6656] hover:text-[#3D2E24] hover:bg-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Customer & Shipping Info */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E7DFD7] space-y-2">
            <h3 className="font-bold text-[#5A4335] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C6A15B]" /> Shipping & Customer Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="font-bold text-[#3D2E24]">
                  {order.customer_name || order.shipping_address?.fullName || 'Patron'}
                </p>
                <p className="text-[#7B6656]">
                  {order.shipping_address?.address || 'No street address provided'}
                </p>
                <p className="text-[#7B6656]">
                  {order.shipping_address?.city}, {order.shipping_address?.state} -{' '}
                  {order.shipping_address?.pincode}
                </p>
              </div>

              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-[#7B6656]">
                  <Mail className="w-3.5 h-3.5 text-[#5A4335]" />
                  {order.customer_email || order.shipping_address?.email || 'N/A'}
                </p>
                <p className="flex items-center gap-1.5 text-[#7B6656]">
                  <Phone className="w-3.5 h-3.5 text-[#5A4335]" />
                  {order.customer_phone || order.shipping_address?.phone || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Items Breakdown */}
          <div className="space-y-2">
            <h3 className="font-bold text-[#5A4335] uppercase tracking-wider text-[11px]">
              Item Breakdown ({order.items?.length || 0} items)
            </h3>
            <div className="border border-[#E7DFD7] rounded-xl overflow-hidden divide-y divide-[#E7DFD7]">
              {order.items?.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product_image || '/images/tulip_bouquet.jpg'}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-lg object-cover border border-[#E7DFD7] flex-shrink-0"
                    />
                    <div>
                      <p className="font-bold text-[#3D2E24]">{item.product_name}</p>
                      <p className="text-[11px] text-[#7B6656]">
                        Qty: {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#3D2E24]">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Financial Summary */}
          <div className="p-4 bg-white rounded-xl border border-[#E7DFD7] space-y-1.5 font-sans">
            <div className="flex justify-between text-[#7B6656]">
              <span>Items Subtotal:</span>
              <span>{formatPrice(order.subtotal || order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[#7B6656]">
              <span>Shipping Fee:</span>
              <span>{order.shipping_fee === 0 ? 'FREE' : formatPrice(order.shipping_fee)}</span>
            </div>
            {order.discount_amount ? (
              <div className="flex justify-between text-[#C96A6A]">
                <span>Discount:</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm font-bold text-[#3D2E24] pt-2 border-t border-[#E7DFD7]">
              <span>Grand Total:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* 4. Payment & Gateway Information */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E7DFD7] space-y-2.5">
            <h3 className="font-bold text-[#5A4335] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#C6A15B]" /> Payment & Settlement Inspection
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#7B6656]">Payment Status:</span>
                <p className="font-bold text-[#3D2E24] capitalize">{order.payment_status || 'Pending'}</p>
              </div>
              <div>
                <span className="text-[#7B6656]">Gateway / Method:</span>
                <p className="font-bold text-[#3D2E24] uppercase">{order.payment_method || 'Razorpay'}</p>
              </div>
              <div>
                <span className="text-[#7B6656]">Provider Order ID:</span>
                <p className="font-mono text-[#3D2E24] truncate">{order.provider_order_id || 'None'}</p>
              </div>
              <div>
                <span className="text-[#7B6656]">Provider Payment ID:</span>
                <p className="font-mono text-[#3D2E24] truncate">{order.provider_payment_id || order.payment_id || 'Pending'}</p>
              </div>
              {order.payment_confirmation_sent_at && (
                <div className="col-span-2 text-[10px] text-[#5C734B] flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Confirmation email dispatched on {formatDate(order.payment_confirmation_sent_at)}
                </div>
              )}
            </div>
          </div>

          {/* 5. Fulfillment Controls */}
          <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E7DFD7] space-y-4">
            <h3 className="font-bold text-[#5A4335] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#C6A15B]" /> Fulfillment Controls & Carrier Assignment
            </h3>

            {/* Status Selector */}
            <div>
              <label className="block font-bold text-[#5A4335] uppercase tracking-wider text-[11px] mb-1">
                Fulfillment Status (Enforces Workflow Transitions)
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                className="w-full p-2.5 bg-white border border-[#E7DFD7] rounded-xl text-xs font-semibold text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
              >
                {allowedNextStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st.toUpperCase()} {st === currentStatus ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              {allowedNextStatuses.length === 1 && (
                <p className="text-[10px] text-[#7B6656] mt-1">
                  This order is in terminal state ({currentStatus}) and cannot transition further.
                </p>
              )}
            </div>

            {/* Carrier & Tracking */}
            {(editStatus === 'shipped' || order.status === 'shipped') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-[#5A4335] uppercase tracking-wider text-[11px] mb-1">
                    Logistics Carrier *
                  </label>
                  <select
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
                  >
                    {CARRIER_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5A4335] uppercase tracking-wider text-[11px] mb-1">
                    Tracking Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BD98172901IN"
                    className="w-full p-2 bg-white border border-[#E7DFD7] rounded-xl text-xs font-mono text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
                  />
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <label className="block font-bold text-[#5A4335] uppercase tracking-wider text-[11px] mb-1">
                Internal Fulfillment Notes
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Handcrafted packaging completed, sent with rose potpourri sachet..."
                className="w-full p-2.5 bg-white border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] focus:outline-hidden focus:ring-2 focus:ring-[#C6A15B]"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveFulfillment}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#5A4335] hover:bg-[#3D2E24] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? 'Updating Fulfillment...' : 'Update Fulfillment & Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
