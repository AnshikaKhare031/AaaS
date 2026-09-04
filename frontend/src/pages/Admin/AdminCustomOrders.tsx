import React, { useEffect, useState } from "react";
import { Search, Eye, X, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomOrder, CustomOrderStatus } from "../../types";
import { getAdminCustomOrders, updateCustomOrderStatus } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import { useToast } from "../../components/admin/Toast";

export function AdminCustomOrdersPage() {
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomOrder, setSelectedCustomOrder] = useState<CustomOrder | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { showToast } = useToast();

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminCustomOrders();
      setCustomOrders(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load custom orders.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = async (id: string, status: CustomOrderStatus) => {
    setIsUpdating(true);
    try {
      const updated = await updateCustomOrderStatus(id, status, adminNote);
      setCustomOrders((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status, admin_notes: adminNote } : c))
      );
      if (selectedCustomOrder?.id === id) {
        setSelectedCustomOrder((prev) => (prev ? { ...prev, status, admin_notes: adminNote } : null));
      }
      showToast(`Custom order status updated to ${status}!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to update custom order status.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = customOrders.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.request_id || "").toLowerCase().includes(q) ||
      (c.name || "").toLowerCase().includes(q) ||
      (c.product_type || "").toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "in_progress":
      case "quoted":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200/50";
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900">
          Custom Orders
        </h1>
        <p className="text-sm font-sans text-slate-500 font-light mt-1">
          Review bespoke inquiries, customize materials and designs, and send quotes to clients.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by request ID, customer name, design type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col justify-center items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Loading custom requests...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-light text-sm">
            No custom order inquiries registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-4 px-6">Request ID</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Type & Colors</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-xs text-slate-800">
                      {item.request_id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400 font-light">{item.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">{item.product_type}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{item.color_preference || "—"}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomOrder(item);
                          setAdminNote(item.admin_notes || "");
                        }}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-lg transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Status Modal */}
      <AnimatePresence>
        {selectedCustomOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setSelectedCustomOrder(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 z-10 relative overflow-hidden"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-slate-800">Custom Inquiry</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCustomOrder.request_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomOrder(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Customer</span>
                    <span className="font-semibold text-slate-800 text-sm">{selectedCustomOrder.name}</span>
                    <p className="text-slate-500 mt-0.5">{selectedCustomOrder.email}</p>
                    <p className="text-slate-500">{selectedCustomOrder.phone}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Budget & Date</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {selectedCustomOrder.budget ? `₹${selectedCustomOrder.budget}` : "Flexible"}
                    </span>
                    <p className="text-slate-500 mt-0.5">Submitted: {formatDate(selectedCustomOrder.created_at)}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">Description</span>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed font-sans">
                    {selectedCustomOrder.description}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label htmlFor="custom-admin-note" className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">
                    Admin Notes / Quote Details
                  </label>
                  <textarea
                    id="custom-admin-note"
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add private notes or pricing quote details..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-sans text-slate-800 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">
                    Update Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(["pending", "reviewing", "quoted", "approved", "in_progress", "completed", "rejected"] as CustomOrderStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(selectedCustomOrder.id, st)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                            selectedCustomOrder.status === st
                              ? "bg-accent text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          }`}
                        >
                          {st.replace("_", " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminCustomOrdersPage;
