"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, ArrowLeft, Trash2, Pencil, Loader2, X, CheckCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import toast from "react-hot-toast";

interface MyReview {
  id: string;
  rating: number;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    businessName: string;
    category: string;
    profileImage?: string;
  };
  booking?: { service?: { name?: string } };
}

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDI: "🔧", HOTEL: "🏨", RESTAURANT: "🍲",
  SHOP: "🛒", TECH: "💻", PROFESSIONAL: "⚖️", BUSINESS: "💼",
};

const MIN_CHARS = 20;
const MAX_CHARS = 500;

function canEdit(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function MyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHovered, setEditHovered] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { router.replace("/auth/login"); return; }
    fetchMyReviews(token);
  }, []);

  const fetchMyReviews = async (token?: string) => {
    const t = token || localStorage.getItem("kazishow_token");
    if (!t) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/customers/reviews/my", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setReviews(data.data.reviews || []);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (review: MyReview) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditHovered(0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditComment("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (editComment.trim().length < MIN_CHARS) {
      toast.error(`Comment must be at least ${MIN_CHARS} characters`);
      return;
    }
    setEditSaving(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`http://localhost:5000/api/reviews/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: editRating, comment: editComment.trim() }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message || "Failed to update"); return; }
      toast.success("Review updated!");
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, rating: editRating, comment: editComment.trim(), updatedAt: new Date().toISOString() }
            : r
        )
      );
      cancelEdit();
    } catch {
      toast.error("Network error");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteReview = async (id: string) => {
    setDeletingId(id);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`http://localhost:5000/api/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message || "Failed to delete"); return; }
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl card-shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-kazi-dark" />
          </button>
          <div>
            <h1 className="font-black text-kazi-dark text-xl">My Reviews</h1>
            <p className="text-xs text-gray-400">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""} given
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl card-shadow">
            <Star className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-500 text-base mb-1">No reviews yet</p>
            <p className="text-gray-400 text-sm mb-6">
              After completing a booking, leave a review for the provider.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all"
            >
              Find a Provider
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const isEditing = editingId === review.id;
              const editable = canEdit(review.createdAt);
              const displayEdit = isEditing ? editHovered || editRating : 0;

              return (
                <div key={review.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
                  {/* Provider header */}
                  <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                      {review.provider.profileImage ? (
                        <img
                          src={review.provider.profileImage}
                          alt={review.provider.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        CATEGORY_EMOJI[review.provider.category] || "💼"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/business/${review.provider.id}`}
                        className="font-bold text-kazi-dark text-sm hover:text-kazi-orange transition-colors"
                      >
                        {review.provider.businessName}
                      </Link>
                      {review.booking?.service?.name && (
                        <p className="text-xs text-kazi-orange font-medium">
                          {review.booking.service.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        {review.updatedAt !== review.createdAt && (
                          <span className="ml-1 text-gray-300">(edited)</span>
                        )}
                      </p>
                    </div>

                    {/* Action buttons */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5">
                        {editable && (
                          <button
                            onClick={() => startEdit(review)}
                            className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors"
                            title="Edit review"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReview(review.id)}
                          disabled={deletingId === review.id}
                          className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Delete review"
                        >
                          {deletingId === review.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Review body */}
                  <div className="p-4">
                    {isEditing ? (
                      /* Edit form */
                      <div className="space-y-4">
                        {/* Star picker */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Your rating</p>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onMouseEnter={() => setEditHovered(star)}
                                onMouseLeave={() => setEditHovered(0)}
                                onClick={() => setEditRating(star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 transition-all ${
                                    displayEdit >= star ? "text-kazi-amber" : "text-gray-300"
                                  }`}
                                  fill={displayEdit >= star ? "#F59E0B" : "none"}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">Your comment</p>
                          <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value.slice(0, MAX_CHARS))}
                            rows={4}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                          />
                          <div className="flex justify-between mt-1">
                            <p className={`text-xs ${editComment.trim().length < MIN_CHARS ? "text-gray-400" : "text-kazi-green"}`}>
                              {editComment.trim().length < MIN_CHARS
                                ? `${MIN_CHARS - editComment.trim().length} more needed`
                                : "✓ Good"}
                            </p>
                            <p className="text-xs text-gray-400">{editComment.length}/{MAX_CHARS}</p>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={cancelEdit}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-gray-200 text-gray-500 font-semibold text-sm rounded-2xl hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={editSaving || editComment.trim().length < MIN_CHARS || editRating === 0}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all disabled:opacity-40"
                          >
                            {editSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <>
                        <div className="flex items-center gap-1.5 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className="w-4 h-4"
                              fill={s <= review.rating ? "#F59E0B" : "none"}
                              color={s <= review.rating ? "#F59E0B" : "#D1D5DB"}
                            />
                          ))}
                          <span className="text-sm font-bold text-kazi-amber ml-0.5">
                            {review.rating}.0
                          </span>
                          <div className="flex items-center gap-0.5 ml-1 bg-green-50 px-1.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-kazi-green" />
                            <span className="text-xs text-kazi-green font-semibold">Verified</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                        {!editable && (
                          <p className="text-xs text-gray-400 mt-2">
                            Edit window expired (7 days)
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
