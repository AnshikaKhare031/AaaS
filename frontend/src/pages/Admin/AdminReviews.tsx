import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Review } from '../../types';
import { getAdminReviews, updateReviewStatus } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminReviews();
      setReviews(data || []);
    } catch (err) {
      console.error(err);
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
      success(newStatus ? 'Review approved and published.' : 'Review hidden from store.');
    } catch (err) {
      error('Failed to update review status.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#C6A15B]" />
            <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">Review Moderation</h1>
          </div>
          <p className="text-xs text-[#7B6656] mt-1">
            Review and moderate customer feedback before public display on product pages.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7DFD7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#5A4335]">
            <thead className="bg-[#F8F5F0] border-b border-[#E7DFD7] text-[#7B6656] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Comment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DFD7]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[#7B6656]">
                    No reviews to moderate.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#F8F5F0]/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#3D2E24]">{rev.customer_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex text-[#C6A15B]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <p className="line-clamp-2 italic">"{rev.comment}"</p>
                    </td>
                    <td className="px-6 py-4 text-[#7B6656]">{formatDate(rev.created_at)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          rev.is_approved
                            ? 'bg-[#8FA57D]/15 text-[#8FA57D]'
                            : 'bg-[#C96A6A]/15 text-[#C96A6A]'
                        }`}
                      >
                        {rev.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleApproval(rev.id, rev.is_approved)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 ${
                          rev.is_approved
                            ? 'bg-[#C96A6A]/10 text-[#C96A6A] hover:bg-[#C96A6A]/20'
                            : 'bg-[#8FA57D]/15 text-[#8FA57D] hover:bg-[#8FA57D]/25'
                        }`}
                      >
                        {rev.is_approved ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Unpublish
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
