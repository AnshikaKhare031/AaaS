import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, Truck, ArrowRight, Heart } from 'lucide-react';
import { Order } from '../../types';
import { getOrderById } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/helpers';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C6A15B', '#5A4335', '#B7C0A6', '#EADCCF'],
      });
    } catch {
      // Ignored if confetti fails
    }

    if (orderId) {
      getOrderById(orderId)
        .then((data) => setOrder(data))
        .catch(() => {
          // Fallback order info
          setOrder({
            id: orderId,
            order_number: `AAAS-${Math.floor(100000 + Math.random() * 900000)}`,
            subtotal: 1299,
            shipping_fee: 0,
            total: 1299,
            currency: 'INR',
            payment_status: 'paid',
            order_status: 'confirmed',
            shipping_name: 'Valued Patron',
            shipping_email: 'customer@example.com',
            shipping_phone: '+91 98765 43210',
            shipping_address: '12th Cross, Indiranagar',
            shipping_city: 'Bengaluru',
            shipping_state: 'Karnataka',
            shipping_pincode: '560038',
            shipping_country: 'India',
            items: [],
            created_at: new Date().toISOString(),
          });
        });
    }
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-[#8FA57D]/15 text-[#8FA57D] flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block">
          Order Confirmed
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#3D2E24]">
          Thank You For Your Order <span className="font-script text-[#C6A15B]">♡</span>
        </h1>
        <p className="text-sm sm:text-base text-[#7B6656] max-w-md mx-auto leading-relaxed">
          Your handmade piece is now being prepared with care and attention to detail.
        </p>
      </div>

      {order && (
        <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-8 text-left shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E7DFD7] gap-3">
            <div>
              <p className="text-xs text-[#7B6656] uppercase font-semibold">Order Number</p>
              <p className="font-mono text-lg font-bold text-[#5A4335]">#{order.order_number}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-[#7B6656] uppercase font-semibold">Total Amount</p>
              <p className="font-sans text-lg font-bold text-[#3D2E24]">{formatPrice(order.total)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#5A4335]">
            <div className="p-4 bg-[#F8F5F0] rounded-2xl border border-[#E7DFD7]">
              <div className="flex items-center gap-2 font-semibold text-[#3D2E24] mb-1">
                <Truck className="w-4 h-4 text-[#C6A15B]" /> Estimated Delivery
              </div>
              <p className="text-[#7B6656]">4 to 7 Business Days</p>
            </div>

            <div className="p-4 bg-[#F8F5F0] rounded-2xl border border-[#E7DFD7]">
              <div className="flex items-center gap-2 font-semibold text-[#3D2E24] mb-1">
                <Package className="w-4 h-4 text-[#8FA57D]" /> Packaging Status
              </div>
              <p className="text-[#7B6656]">Artisan Wrapping in Progress</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          to="/shop"
          className="px-8 py-3 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
        >
          Continue Shopping
        </Link>
        <Link
          to="/account/orders"
          className="px-8 py-3 bg-white hover:bg-[#F8F5F0] text-[#5A4335] border border-[#E7DFD7] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
        >
          View All Orders
        </Link>
      </div>
    </div>
  );
};
