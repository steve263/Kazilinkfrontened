"use client";
import Link from "next/link";
import { Star, MapPin, CheckCircle, BadgeCheck, Bookmark, Zap } from "lucide-react";

const CATEGORY_GRADIENTS: Record<string, string> = {
  FUNDI:        "from-orange-500 to-orange-700",
  HOTEL:        "from-amber-500 to-yellow-700",
  RESTAURANT:   "from-red-500 to-orange-600",
  SHOP:         "from-blue-500 to-blue-700",
  TECH:         "from-purple-500 to-indigo-700",
  PROFESSIONAL: "from-green-500 to-teal-700",
  BUSINESS:     "from-gray-500 to-gray-700",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  FUNDI:        "🔧",
  HOTEL:        "🏨",
  RESTAURANT:   "🍲",
  SHOP:         "🛒",
  TECH:         "💻",
  PROFESSIONAL: "⚖️",
  BUSINESS:     "💼",
};

const CATEGORY_LABELS: Record<string, string> = {
  FUNDI:        "Fundi",
  HOTEL:        "Hotel",
  RESTAURANT:   "Restaurant",
  SHOP:         "Shop",
  TECH:         "Tech",
  PROFESSIONAL: "Professional",
  BUSINESS:     "Business",
};

interface ProviderData {
  id: string;
  name: string;
  description?: string;
  category: string;
  providerType: "fundi" | "business";
  rating: number;
  reviewCount: number;
  verificationStatus: string;
  featured?: boolean;
  distance?: string;
  showDistanceBadge?: boolean;
  coverImage?: string | null;
  profileImage?: string | null;
  tags?: string[];
  location?: { address?: string };
}

interface BusinessCardProps {
  provider: ProviderData;
  variant?: "grid" | "horizontal";
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          fill={i < filled ? "#F59E0B" : "none"}
          stroke={i < filled ? "#F59E0B" : "#D1D5DB"}
        />
      ))}
    </div>
  );
}

export default function BusinessCard({ provider, variant = "grid" }: BusinessCardProps) {
  const cat = provider.category?.toUpperCase() || "BUSINESS";
  const gradient = CATEGORY_GRADIENTS[cat] ?? CATEGORY_GRADIENTS.BUSINESS;
  const emoji = CATEGORY_EMOJIS[cat] ?? CATEGORY_EMOJIS.BUSINESS;
  const catLabel = CATEGORY_LABELS[cat] ?? cat;
  const isFundi = cat === "FUNDI";
  const badgeColor = isFundi ? "bg-kazi-orange" : "bg-kazi-blue";
  const isVerified = provider.verificationStatus === "verified";
  const initial = provider.name?.charAt(0)?.toUpperCase() ?? "?";
  const address = provider.location?.address || "Nairobi, Kenya";

  if (variant === "horizontal") {
    return (
      <Link href={`/business/${provider.id}`}>
        <div className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          <div className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            {provider.coverImage ? (
              <img src={provider.coverImage} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{emoji}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-kazi-dark text-sm truncate">{provider.name}</h3>
                  {isVerified && (
                    <CheckCircle
                      className={`w-3.5 h-3.5 flex-shrink-0 ${isFundi ? "text-kazi-orange" : "text-kazi-blue"}`}
                      fill={isFundi ? "#FF6B2B" : "#0EA5E9"}
                    />
                  )}
                </div>
                <span className={`inline-block mt-0.5 px-1.5 py-0.5 ${badgeColor} text-white text-xs font-bold rounded-full`}>
                  {catLabel}
                </span>
              </div>
              <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-lg flex-shrink-0">
                <Star className="w-3 h-3 text-amber-500" fill="#F59E0B" />
                <span className="text-xs font-bold text-amber-600">
                  {provider.rating > 0 ? provider.rating.toFixed(1) : "New"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 truncate">{address}</span>
            </div>
            {provider.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{provider.description}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/business/${provider.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group">

        {/* Cover */}
        <div className="relative h-48 overflow-hidden">
          {provider.coverImage ? (
            <img
              src={provider.coverImage}
              alt={provider.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-7xl opacity-70 group-hover:scale-110 transition-transform duration-500">{emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 ${badgeColor} text-white text-xs font-bold rounded-full shadow-md`}>
              {catLabel}
            </span>
          </div>

          {/* Verified badge */}
          {isVerified && (
            <div className="absolute top-3" style={{ left: "calc(0.75rem + 60px + 0.5rem)" }}>
              <span className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold rounded-full shadow-md">
                <BadgeCheck className="w-3 h-3 text-kazi-green" />
                <span className="text-kazi-dark">Verified</span>
              </span>
            </div>
          )}

          {/* Distance badge */}
          {provider.showDistanceBadge && provider.distance && (
            <div className="absolute top-3 right-12">
              <span className="flex items-center gap-1 px-2 py-1 bg-kazi-green/90 backdrop-blur-sm text-xs font-bold rounded-full shadow-md text-white">
                <MapPin className="w-3 h-3" />
                <span>{provider.distance}</span>
              </span>
            </div>
          )}

          <button
            onClick={(e) => e.preventDefault()}
            className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-md"
          >
            <Bookmark className="w-4 h-4 text-gray-600" />
          </button>

          {/* Rating pill */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-amber-400" fill="#FBBF24" />
            <span className="text-xs font-bold text-white">
              {provider.rating > 0 ? provider.rating.toFixed(1) : "New"}
            </span>
            {provider.reviewCount > 0 && (
              <span className="text-xs text-white/70">({provider.reviewCount})</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3 mb-2">
            {provider.profileImage ? (
              <img
                src={provider.profileImage}
                alt={provider.name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-orange-100 flex-shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center border-2 border-white shadow`}>
                <span className="text-white font-black text-sm">{initial}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-kazi-dark text-sm truncate">{provider.name}</h3>
                {isVerified && (
                  <CheckCircle
                    className={`w-3.5 h-3.5 flex-shrink-0 ${isFundi ? "text-kazi-orange" : "text-kazi-blue"}`}
                    fill={isFundi ? "#FF6B2B" : "#0EA5E9"}
                  />
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">{address}</span>
              </div>
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={provider.rating} />
            <span className="text-xs text-gray-400">
              {provider.reviewCount > 0 ? `${provider.reviewCount} reviews` : "No reviews yet"}
            </span>
          </div>

          {/* Description */}
          {provider.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{provider.description}</p>
          )}

          {/* Tags */}
          {provider.tags && provider.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {provider.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                    isFundi ? "bg-orange-50 text-kazi-orange" : "bg-blue-50 text-kazi-blue"
                  }`}
                >
                  {tag.toLowerCase()}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-kazi-orange" />
              <span className="text-xs text-gray-500 truncate max-w-[100px]">
                {provider.distance || "Nearby"}
              </span>
            </div>
            <span className="flex items-center gap-1 px-3 py-1.5 bg-kazi-orange text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200">
              <Zap className="w-3 h-3" fill="white" />
              {provider.category === "FUNDI" ? "Book Now" : "Order Now"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BusinessCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => <div key={i} className="w-3 h-3 bg-gray-200 rounded-sm" />)}
        </div>
        <div className="h-2.5 bg-gray-200 rounded" />
        <div className="h-2.5 bg-gray-200 rounded w-4/5" />
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="h-2.5 bg-gray-200 rounded w-16" />
          <div className="h-7 bg-gray-200 rounded-xl w-20" />
        </div>
      </div>
    </div>
  );
}
