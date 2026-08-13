import React, { useEffect, useState } from 'react';
import { ClipboardList, Search, Eye, Truck, CheckCircle2, X } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { getAdminOrders, updateOrderStatus } from '../../services/api';
import { formatPrice, formatDate, getOrderStatusBadge } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  const { success, error } = useToast();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, status, trackingNumber);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, order_status: status } : null));
      }
      success(`Updated order status to ${status}`);
    } catch (err) {
      error('Failed to update status.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.shipping_name.toLowerCase().includes(q) ||
      o.shipping_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#C6A15B]" />
            <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">Customer Orders</h1>
          </div>
          <p className="text-xs text-[#7B6656] mt-1">
            Track customer payments, packaging, dispatch, and delivery timelines.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7DFD7] shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order number or customer name..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#E7DFD7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#5A4335]">
            <thead className="bg-[#F8F5F0] border-b border-[#E7DFD7] text-[#7B6656] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DFD7]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F8F5F0]/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#3D2E24]">
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#3D2E24]">{order.shipping_name}</p>
                      <p className="text-[10px] text-[#7B6656]">{order.shipping_email}</p>
                    </td>
                    <td className="px-6 py-4 text-[#7B6656]">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 font-bold text-[#3D2E24]">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-[#8FA57D] uppercase">
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.order_status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={`text-[10px] font-bold uppercase rounded-lg px-2.5 py-1 border cursor-pointer ${getOrderStatusBadge(
                          order.order_status
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1 bg-[#F8F5F0] hover:bg-[#EADCCF] text-[#5A4335] font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7DFD7] pb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#3D2E24]">
                  Order #{selectedOrder.order_number}
                </h3>
                <p className="text-xs text-[#7B6656]">Placed {formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-[#7B6656] hover:text-[#3D2E24]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#F8F5F0] rounded-2xl space-y-1">
                <p className="font-semibold text-[#3D2E24]">Customer & Shipping Address:</p>
                <p>{selectedOrder.shipping_name} ({selectedOrder.shipping_phone})</p>
                <p>{selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_state} - {selectedOrder.shipping_pincode}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-[#3D2E24]">Items:</p>
                {(selectedOrder.items || []).map((item) => (
                  <div key={item.id} className="flex justify-between py-1 border-b border-[#E7DFD7]">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span className="font-bold">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2 text-sm font-bold text-[#3D2E24]">
                <span>Total Amount</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E7DFD7]">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#3D2E24]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
