"use client";
import { useState } from "react";
import { X, Star, CheckCircle, Loader2, ThumbsUp } from "lucide-react";
import toast from "react-hot-toast";

interface ReviewModalProps {
  providerName: string;
  providerCategory?: string;
  bookingId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const MIN_CHARS = 20;
const MAX_CHARS = 500;

const QUICK_TAGS = [
  "On time", "Professional", "Good value", "Clean work",
  "Great communication", "Would hire again", "Friendly",
];

export default function ReviewModal({
  providerName,
  providerCategory,
  bookingId,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const trimmed = comment.trim();
  const canSubmit = rating > 0 && trimmed.length >= MIN_CHARS;
  const displayRating = hovered || rating;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const fullComment =
        tags.length > 0
          ? `${trimmed} [${tags.join(", ")}]`
          : trimmed;

      const res = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, rating, comment: fullComment }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Failed to submit review");
        return;
      }
      setDone(true);
      onSubmitted?.();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-kazi-dark text-base">Rate Your Experience</h2>
            <p className="text-sm text-gray-500">
              {providerName}
              {providerCategory ? ` · ${providerCategory}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            /* Success state */
            <div className="flex flex-col items-center py-6 animate-slide-up">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-9 h-9 text-kazi-amber" fill="#F59E0B" />
              </div>
              <h3 className="text-lg font-black text-kazi-dark mb-2">Review Submitted!</h3>
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-6 h-6 text-kazi-amber"
                    fill={s <= rating ? "#F59E0B" : "none"}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 text-center mb-1 leading-relaxed">
                Thank you! Your review helps other customers and rewards great providers.
              </p>
              <p className="text-xs text-gray-400 text-center mb-6">
                Marked with a{" "}
                <span className="text-kazi-green font-semibold">✓ Verified</span> badge.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            /* Form */
            <div className="space-y-5">
              {/* Star rating */}
              <div className="text-center">
                <p className="text-sm font-semibold text-kazi-dark mb-3">
                  How would you rate this service?
                </p>
                <div className="flex gap-2 justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-10 h-10 transition-all ${
                          displayRating >= star ? "text-kazi-amber" : "text-gray-300"
                        }`}
                        fill={displayRating >= star ? "#F59E0B" : "none"}
                      />
                    </button>
                  ))}
                </div>
                {displayRating > 0 && (
                  <p
                    className={`text-sm font-bold transition-all ${
                      displayRating >= 4
                        ? "text-kazi-green"
                        : displayRating === 3
                        ? "text-kazi-amber"
                        : "text-red-400"
                    }`}
                  >
                    {RATING_LABELS[displayRating]}
                  </p>
                )}
              </div>

              {/* Quick tags */}
              {rating > 0 && (
                <div>
                  <p className="text-sm font-semibold text-kazi-dark mb-2">
                    What stood out? (optional)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                          tags.includes(tag)
                            ? "border-kazi-orange bg-orange-50 text-kazi-orange"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-kazi-orange/50"
                        }`}
                      >
                        {tags.includes(tag) ? "✓ " : ""}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Written review */}
              <div>
                <label className="block text-sm font-semibold text-kazi-dark mb-2">
                  Tell others about your experience{" "}
                  <span className="text-kazi-orange">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_CHARS))}
                  rows={4}
                  placeholder="Describe your experience — was the work quality good? Did the provider arrive on time? Would you recommend them?"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all"
                />
                <div className="flex justify-between mt-1">
                  <p
                    className={`text-xs ${
                      trimmed.length < MIN_CHARS ? "text-gray-400" : "text-kazi-green"
                    }`}
                  >
                    {trimmed.length < MIN_CHARS
                      ? `${MIN_CHARS - trimmed.length} more characters needed`
                      : "✓ Good length"}
                  </p>
                  <p
                    className={`text-xs ${
                      comment.length >= MAX_CHARS ? "text-red-400" : "text-gray-400"
                    }`}
                  >
                    {comment.length}/{MAX_CHARS}
                  </p>
                </div>
              </div>

              {/* Verified badge note */}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-2xl">
                <ThumbsUp className="w-4 h-4 text-kazi-green flex-shrink-0" />
                <p className="text-xs text-gray-700 leading-relaxed">
                  Your review will be marked as{" "}
                  <span className="font-semibold text-kazi-green">✓ Verified Purchase</span>{" "}
                  since it&apos;s linked to a completed booking.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="w-full py-4 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5" fill="white" /> Submit Review
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
