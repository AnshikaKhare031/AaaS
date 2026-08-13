import React, { useEffect, useState } from 'react';
import { Sparkles, Search, Eye, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { CustomOrder, CustomOrderStatus } from '../../types';
import { getAdminCustomOrders, updateCustomOrderStatus } from '../../services/api';
import { formatPrice, formatDate, getOrderStatusBadge } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export const AdminCustomOrdersPage: React.FC = () => {
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomOrder, setSelectedCustomOrder] = useState<CustomOrder | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const { success, error } = useToast();

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminCustomOrders();
      setCustomOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = async (id: string, status: CustomOrderStatus) => {
    try {
      const updated = await updateCustomOrderStatus(id, status, adminNote);
      setCustomOrders((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status, admin_notes: adminNote } : c))
      );
      if (selectedCustomOrder?.id === id) {
        setSelectedCustomOrder((prev) => (prev ? { ...prev, status, admin_notes: adminNote } : null));
      }
      success(`Updated custom order status to ${status}`);
    } catch (err) {
      error('Failed to update status.');
    }
  };

  const filtered = customOrders.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.request_id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.product_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#C6A15B]" />
            <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">Custom Order Inquiries</h1>
          </div>
          <p className="text-xs text-[#7B6656] mt-1">
            Review bespoke crochet commissions, palettes, budgets, and customer reference photos.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E7DFD7] shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#7B6656] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request ID, customer or product type..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7DFD7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#5A4335]">
            <thead className="bg-[#F8F5F0] border-b border-[#E7DFD7] text-[#7B6656] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product Type</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DFD7]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    Loading custom requests...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    No custom order requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8F5F0]/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#3D2E24]">{item.request_id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#3D2E24]">{item.name}</p>
                      <p className="text-[10px] text-[#7B6656]">{item.email}</p>
                    </td>
                    <td className="px-6 py-4 font-serif text-sm font-semibold text-[#3D2E24]">
                      {item.product_type}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#5A4335]">
                      {item.budget ? formatPrice(item.budget) : 'Flexible'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as CustomOrderStatus)
                        }
                        className={`text-[10px] font-bold uppercase rounded-lg px-2.5 py-1 border cursor-pointer ${getOrderStatusBadge(
                          item.status
                        )}`}
                      >
                        <option value="new">New</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="accepted">Accepted</option>
                        <option value="in_production">In Production</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-[#7B6656]">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomOrder(item);
                          setAdminNote(item.admin_notes || '');
                        }}
                        className="px-3 py-1 bg-[#F8F5F0] hover:bg-[#EADCCF] text-[#5A4335] font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Proposal
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposal Detail Modal */}
      {selectedCustomOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E7DFD7] pb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#3D2E24]">
                  Proposal #{selectedCustomOrder.request_id}
                </h3>
                <p className="text-xs text-[#7B6656]">{selectedCustomOrder.product_type}</p>
              </div>
              <button
                onClick={() => setSelectedCustomOrder(null)}
                className="p-1 text-[#7B6656] hover:text-[#3D2E24]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#F8F5F0] rounded-2xl space-y-1">
                <p className="font-semibold text-[#3D2E24]">Customer Contact:</p>
                <p>{selectedCustomOrder.name} ({selectedCustomOrder.phone})</p>
                <p>Email: {selectedCustomOrder.email}</p>
              </div>

              <div className="space-y-2">
                <p><strong>Color Palette:</strong> {selectedCustomOrder.color_preference || 'Standard'}</p>
                <p><strong>Size / Dimensions:</strong> {selectedCustomOrder.size_dimensions || 'Default'}</p>
                <p><strong>Budget:</strong> {selectedCustomOrder.budget ? formatPrice(selectedCustomOrder.budget) : 'Open quote'}</p>
                <p className="pt-2"><strong>Custom Description:</strong></p>
                <p className="p-3 bg-[#F8F5F0] rounded-xl text-[#5A4335] italic">
                  "{selectedCustomOrder.description}"
                </p>
              </div>

              {/* Reference Photos */}
              {selectedCustomOrder.images && selectedCustomOrder.images.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-[#3D2E24]">Uploaded Reference Visuals:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomOrder.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Reference"
                        className="w-20 h-20 rounded-xl object-cover border border-[#E7DFD7]"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Note Box */}
              <div>
                <label className="block font-semibold text-[#5A4335] mb-1">Internal Atelier Notes</label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Record yarn lot codes, courier tracking or artisan assignments..."
                  className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7DFD7]">
              <button
                onClick={() => handleStatusChange(selectedCustomOrder.id, selectedCustomOrder.status)}
                className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#3D2E24]"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
