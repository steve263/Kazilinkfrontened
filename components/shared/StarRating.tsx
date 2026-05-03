"use client";
import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showNumber?: boolean;
}

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const SIZE_MAP = { sm: "w-3.5 h-3.5", md: "w-7 h-7", lg: "w-10 h-10" };

export default function StarRating({
  rating,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = false,
  showNumber = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || rating;
  const starSize = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={`transition-transform ${
              !readOnly
                ? "hover:scale-110 active:scale-95 cursor-pointer"
                : "cursor-default"
            }`}
          >
            <Star
              className={`${starSize} transition-all duration-150 ${
                display >= star ? "text-kazi-amber" : "text-gray-300"
              }`}
              fill={display >= star ? "#F59E0B" : "none"}
            />
          </button>
        ))}
      </div>
      {showLabel && display > 0 && (
        <span
          className={`text-sm font-bold ml-1 ${
            display >= 4
              ? "text-kazi-green"
              : display === 3
              ? "text-kazi-amber"
              : "text-red-400"
          }`}
        >
          {LABELS[display]}
        </span>
      )}
      {showNumber && rating > 0 && (
        <span className="text-sm font-bold text-gray-700 ml-0.5">
          {Number.isInteger(rating) ? rating : rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
