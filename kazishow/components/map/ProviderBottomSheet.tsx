"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Star, MapPin, X, CheckCircle, Briefcase, ChevronRight, Phone } from "lucide-react";
import type { MapProvider } from "./MapComponent";
import { CATEGORY_CONFIG } from "./MapComponent";

interface Props {
  provider: MapProvider | null;
  onClose: () => void;
  onBook: (provider: MapProvider) => void;
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} className="w-4 h-4" viewBox="0 0 20 20">
            <path
              d="M10 1l2.39 6.26H18l-5.19 3.76 1.98 6.48L10 13.77l-4.79 3.73 1.98-6.48L2 7.26h5.61z"
              fill={i < full ? "#F59E0B" : i === full && half ? "url(#half)" : "#E5E7EB"}
            />
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
          </svg>
        ))}
      </div>
      <span className="text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count} reviews)</span>
    </div>
  );
}

export default function ProviderBottomSheet({ provider, onClose, onBook }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  // Touch drag-to-dismiss
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
      el.style.transition = "none";
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) el.style.transform = `translateY(${dy}px)`;
    };
    const onTouchEnd = (e: TouchEvent) => {
      isDragging.current = false;
      el.style.transition = "";
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dy > 100) {
        onClose();
      } else {
        el.style.transform = "";
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onClose]);

  if (!provider) return null;

  const cfg = CATEGORY_CONFIG[provider.category] ?? { color: "#6B7280", emoji: "📍", label: provider.category };

  const distanceLabel = provider.distance != null
    ? provider.distance < 1
      ? `${(provider.distance * 1000).toFixed(0)} m away`
      : `${provider.distance.toFixed(1)} km away`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[1100]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[1101] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
        style={{ transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="px-5 pb-6 overflow-y-auto max-h-[calc(80vh-32px)]">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden"
              style={{ background: `${cfg.color}18`, border: `2px solid ${cfg.color}30` }}
            >
              {provider.profileImage ? (
                <img src={provider.profileImage} alt={provider.businessName} className="w-full h-full object-cover" />
              ) : (
                <span>{cfg.emoji}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-gray-900 leading-tight truncate">
                  {provider.businessName}
                </h2>
                {provider.isVerified && (
                  <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}
                >
                  {cfg.emoji} {cfg.label}
                </span>
                {distanceLabel && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {distanceLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <StarRow rating={provider.rating} count={provider.reviewCount} />
          </div>

          {/* Description */}
          {provider.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
              {provider.description}
            </p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {provider.minJobValue != null && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">From</p>
                <p className="text-sm font-black text-gray-800">
                  KSh {provider.minJobValue >= 1000
                    ? `${(provider.minJobValue / 1000).toFixed(0)}k`
                    : provider.minJobValue}
                </p>
              </div>
            )}
            {provider.servicesCount != null && provider.servicesCount > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Services</p>
                <p className="text-sm font-black text-gray-800">{provider.servicesCount}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Reviews</p>
              <p className="text-sm font-black text-gray-800">{provider.reviewCount}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/business/${provider.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              <Briefcase className="w-4 h-4" />
              View Profile
            </Link>
            <button
              onClick={() => onBook(provider)}
              className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg"
              style={{ background: `linear-gradient(135deg, #FF6B2B, #FF8C42)`, boxShadow: "0 4px 15px rgba(255,107,43,0.35)" }}
            >
              Book Now
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
