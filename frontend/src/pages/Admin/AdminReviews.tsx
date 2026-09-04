import React, { useEffect, useState } from "react";
import { Star, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Review } from "../../types";
import { getAdminReviews, updateReviewStatus } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import { useToast } from "../../components/admin/Toast";

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminReviews();
      setReviews(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load reviews.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateReviewStatus(id, newStatus);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: newStatus } : r))
      );
      showToast(newStatus ? "Review approved and published!" : "Review hidden from store.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to update review status.", "error");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900">
          Reviews
        </h1>
        <p className="text-sm font-sans text-slate-500 font-light mt-1">
          Moderate customer product feedback and ratings before publishing.
        </p>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col justify-center items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-light text-sm">
            No customer reviews registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Rating</th>
                  <th className="py-4 px-6">Feedback</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {r.customer_name}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{r.comment}</p>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {r.is_approved ? (
                        <span className="inline-block text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200/50">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleApproval(r.id, r.is_approved)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                          r.is_approved
                            ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            : "bg-accent text-white hover:bg-accent/90"
                        }`}
                      >
                        {r.is_approved ? (
                          <>
                            <XCircle size={14} />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReviewsPage;
