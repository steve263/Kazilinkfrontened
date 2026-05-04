"use client";
import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    helpfulCount: number;
    createdAt: string;
    customer?: { name?: string; profilePhoto?: string };
    booking?: { service?: { name?: string } };
  };
  onHelpful?: (id: string) => void;
}

export default function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [voted, setVoted] = useState(false);

  const handleHelpful = () => {
    if (voted) return;
    setVoted(true);
    setHelpfulCount((c) => c + 1);
    onHelpful?.(review.id);
  };

  const initials = review.customer?.name?.charAt(0).toUpperCase() || "U";
  const date = new Date(review.createdAt).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl p-4 card-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-kazi-orange text-base flex-shrink-0 overflow-hidden">
          {review.customer?.profilePhoto ? (
            <img
              src={review.customer.profilePhoto}
              alt={review.customer.name || "Customer"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-kazi-dark">
              {review.customer?.name || "Customer"}
            </p>
            <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3 text-kazi-green" />
              <span className="text-xs text-kazi-green font-semibold">Verified</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3.5 h-3.5"
                  fill={s <= review.rating ? "#F59E0B" : "none"}
                  color={s <= review.rating ? "#F59E0B" : "#D1D5DB"}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">{date}</span>
          </div>

          {review.booking?.service?.name && (
            <span className="text-xs text-kazi-orange font-medium mt-0.5 block">
              {review.booking.service.name}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>

      {/* Helpful */}
      <div className="mt-3 flex items-center justify-end">
        <button
          onClick={handleHelpful}
          disabled={voted}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            voted
              ? "bg-orange-50 text-kazi-orange"
              : "bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-kazi-orange"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful{helpfulCount > 0 ? ` (${helpfulCount})` : ""}
        </button>
      </div>
    </div>
  );
}
