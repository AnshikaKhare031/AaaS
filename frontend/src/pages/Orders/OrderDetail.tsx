import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Package, Truck, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';
import { getOrderById } from '../../services/api';
import { formatPrice, formatDate, getOrderStatusBadge } from '../../utils/helpers';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId)
        .then((data) => setOrder(data))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-[#EADCCF]/40 rounded-md" />
        <div className="h-64 bg-white rounded-3xl border border-[#E7DFD7]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-[#E7DFD7] text-center">
        <h2 className="font-serif text-2xl font-bold text-[#3D2E24] mb-2">Order Not Found</h2>
        <Link to="/account/orders" className="text-xs text-[#C6A15B] font-bold uppercase underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7B6656] hover:text-[#3D2E24]"
      >
        <ChevronLeft className="w-4 h-4" /> Back to My Orders
      </Link>

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block mb-1">
            Order Receipt
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            #{order.order_number}
          </h1>
          <p className="text-xs text-[#7B6656] mt-1">Placed on {formatDate(order.created_at)}</p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getOrderStatusBadge(
              order.order_status
            )}`}
          >
            Status: {order.order_status}
          </span>
          <span className="text-[11px] text-[#8FA57D] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Payment {order.payment_status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-sm space-y-6">
        <h3 className="font-serif text-xl font-semibold text-[#3D2E24]">Purchased Items</h3>

        <div className="space-y-4">
          {(order.items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 pb-4 border-b border-[#E7DFD7] last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.product_image || '/images/tulip_bouquet.jpg'}
                  alt={item.product_name}
                  className="w-16 h-16 rounded-xl object-cover bg-[#F8F5F0]"
                />
                <div>
                  <h4 className="font-serif text-base font-semibold text-[#3D2E24]">
                    {item.product_name}
                  </h4>
                  <p className="text-xs text-[#7B6656]">
                    Qty: {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>
              </div>
              <span className="font-sans text-sm font-bold text-[#5A4335]">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="space-y-2 text-xs text-[#5A4335] pt-4 border-t border-[#E7DFD7]">
          <div className="flex justify-between">
            <span className="text-[#7B6656]">Subtotal</span>
            <span className="font-semibold text-[#3D2E24]">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7B6656]">Shipping</span>
            <span className="font-semibold text-[#3D2E24]">
              {order.shipping_fee === 0 ? 'FREE' : formatPrice(order.shipping_fee)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-[#3D2E24] pt-2 border-t border-[#E7DFD7]">
            <span>Total Paid</span>
            <span className="text-xl text-[#5A4335]">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address & Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E7DFD7] shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-serif text-base font-semibold text-[#3D2E24]">
            <MapPin className="w-4 h-4 text-[#C6A15B]" /> Shipping Destination
          </div>
          <div className="text-xs text-[#7B6656] space-y-1">
            <p className="font-semibold text-[#3D2E24]">{order.shipping_name}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
            <p>Phone: {order.shipping_phone}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7DFD7] shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-serif text-base font-semibold text-[#3D2E24]">
            <Truck className="w-4 h-4 text-[#C6A15B]" /> Delivery Info
          </div>
          <div className="text-xs text-[#7B6656] space-y-1">
            <p>Standard Insured Artisan Shipping</p>
            <p>Tracking Number: {order.tracking_number || 'Being assigned by courier'}</p>
            {order.notes && <p className="italic text-[#5A4335]">Notes: "{order.notes}"</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
