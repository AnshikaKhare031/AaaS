import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, ChevronRight, Truck } from 'lucide-react';
import { Order } from '../../types';
import { getOrders } from '../../services/api';
import { formatPrice, formatDate, getOrderStatusBadge } from '../../utils/helpers';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="border-b border-[#E7DFD7] pb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block mb-1">
          Purchase History
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
          My Orders ({orders.length})
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-[#E7DFD7] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7DFD7] p-12 sm:p-16 text-center max-w-lg mx-auto shadow-sm">
          <Package className="w-12 h-12 text-[#7B6656] opacity-60 mx-auto mb-4" />
          <h3 className="font-serif text-2xl font-semibold text-[#3D2E24] mb-2">No orders placed yet</h3>
          <p className="text-xs text-[#7B6656] mb-6">
            When you purchase handmade crochet pieces from AaaS, their progress and tracking will appear here.
          </p>
          <Link
            to="/shop"
            className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/account/orders/${order.id}`}
              className="block bg-white p-6 rounded-2xl border border-[#E7DFD7] shadow-xs hover:border-[#C6A15B] transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFD7]">
                <div>
                  <span className="font-mono text-sm font-bold text-[#3D2E24]">
                    #{order.order_number}
                  </span>
                  <p className="text-xs text-[#7B6656] mt-0.5">Placed on {formatDate(order.created_at)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getOrderStatusBadge(
                      order.order_status
                    )}`}
                  >
                    {order.order_status}
                  </span>
                  <span className="font-sans text-base font-bold text-[#5A4335]">
                    {formatPrice(order.total)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#7B6656] group-hover:text-[#C6A15B] transition-colors" />
                </div>
              </div>

              {/* Items Summary Snippet */}
              <div className="pt-4 flex items-center justify-between text-xs text-[#7B6656]">
                <span>
                  {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'items'} in order
                </span>
                <span className="text-[#C6A15B] font-semibold flex items-center gap-1 group-hover:underline">
                  View Full Order & Receipt <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
