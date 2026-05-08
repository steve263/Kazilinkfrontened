"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, X, Star, Grid, List,
  Navigation, MapPin, Bookmark, BookmarkCheck, Zap,
  ChevronDown, RefreshCw, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { emoji: string; gradient: string; label: string }> = {
  FUNDI:        { emoji: "🔧", gradient: "from-orange-400 to-orange-600",  label: "Fundi"        },
  HOTEL:        { emoji: "🏨", gradient: "from-amber-400 to-yellow-600",   label: "Hotel"        },
  RESTAURANT:   { emoji: "🍲", gradient: "from-red-400 to-orange-500",     label: "Restaurant"   },
  SHOP:         { emoji: "🛒", gradient: "from-blue-400 to-blue-600",      label: "Shop"         },
  TECH:         { emoji: "💻", gradient: "from-purple-400 to-indigo-600",  label: "Tech"         },
  PROFESSIONAL: { emoji: "⚖️", gradient: "from-green-400 to-teal-600",    label: "Professional" },
  BUSINESS:     { emoji: "💼", gradient: "from-pink-400 to-rose-600",      label: "Business"     },
};

const CATEGORIES = [
  { id: "all",          label: "All",          emoji: "✨" },
  { id: "FUNDI",        label: "Fundis",       emoji: "🔧" },
  { id: "SHOP",         label: "Shops",        emoji: "🛒" },
  { id: "HOTEL",        label: "Hotels",       emoji: "🏨" },
  { id: "RESTAURANT",   label: "Restaurants",  emoji: "🍲" },
  { id: "TECH",         label: "Tech",         emoji: "💻" },
  { id: "PROFESSIONAL", label: "Professional", emoji: "⚖️" },
  { id: "BUSINESS",     label: "Business",     emoji: "💼" },
];

const SORT_OPTIONS = ["Top Rated", "Most Reviewed", "Nearest", "Newest", "Price: Low to High", "Price: High to Low"];
const DISTANCE_OPTIONS = ["1km", "5km", "10km", "Anywhere"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function meta(cat: string) {
  return CATEGORY_META[cat] || { emoji: "🏪", gradient: "from-gray-400 to-gray-600", label: cat };
}

function mapProvider(p: any) {
  return {
    id: p.id,
    name: p.businessName,
    category: p.category,
    rating: p.rating || 0,
    reviewCount: p.totalReviews || 0,
    location: p.user?.location || "Nairobi",
    lat: p.user?.lat ?? null,
    lng: p.user?.lng ?? null,
    isVerified: p.isVerified,
    isFeatured: p.isFeatured,
    badge: p.badge,
    price: p.minJobValue || 500,
    coverImage: p.coverImage || null,
    profileImage: p.profileImage || null,
    createdAt: p.createdAt,
    services: (p.services || []).slice(0, 3) as { name: string; price: number; priceType: string }[],
    workingHoursStart: p.workingHoursStart || "08:00",
    workingHoursEnd: p.workingHoursEnd || "18:00",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-10 bg-gray-200 rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ─── Provider Card (Grid) ──────────────────────────────────────────────────────

function ProviderCard({
  provider,
  distKm,
  saved,
  onToggleSave,
}: {
  provider: ReturnType<typeof mapProvider>;
  distKm?: number;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const m = meta(provider.category);
  const distLabel = distKm !== undefined
    ? distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)} km away`
    : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col">
      {/* Cover */}
      <div className={`relative h-48 bg-gradient-to-br ${m.gradient} flex-shrink-0`}>
        {provider.coverImage ? (
          <img src={provider.coverImage} alt={provider.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl select-none">
            {m.emoji}
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {provider.isFeatured && (
            <span className="px-2 py-0.5 bg-kazi-orange text-white text-[10px] font-black rounded-full shadow">
              ⚡ Featured
            </span>
          )}
          {provider.isVerified && (
            <span className="px-2 py-0.5 bg-kazi-green text-white text-[10px] font-black rounded-full shadow">
              ✓ {provider.badge || "Verified"}
            </span>
          )}
        </div>

        {/* Bookmark */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleSave(provider.id); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          {saved
            ? <BookmarkCheck className="w-4 h-4 text-kazi-orange" fill="#FF6B2B" />
            : <Bookmark className="w-4 h-4 text-gray-500" />
          }
        </button>

        {/* Rating overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-kazi-amber" fill="#F59E0B" />
          <span className="text-white text-xs font-bold">{provider.rating.toFixed(1)}</span>
          <span className="text-white/70 text-[10px]">({provider.reviewCount})</span>
        </div>

        {/* Distance badge */}
        {distLabel && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-kazi-green/90 backdrop-blur-sm rounded-full px-2 py-1">
            <Navigation className="w-3 h-3 text-white" />
            <span className="text-white text-[10px] font-bold">{distLabel}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name row */}
        <div className="flex items-start gap-2 mb-1">
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.gradient} flex-shrink-0 flex items-center justify-center text-sm`}
          >
            {provider.profileImage
              ? <img src={provider.profileImage} className="w-full h-full rounded-full object-cover" alt="" />
              : <span>{m.emoji}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-sm text-kazi-dark leading-tight truncate">{provider.name}</h3>
            <p className="text-[11px] text-gray-400 capitalize">{m.label}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mt-1.5 mb-1">
          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{provider.location}</span>
        </div>

        {/* Price + hours */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-kazi-orange font-bold">
            From KSh {provider.price.toLocaleString()}
          </p>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            {provider.workingHoursStart}–{provider.workingHoursEnd}
          </span>
        </div>

        {/* Services chips */}
        {provider.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {provider.services.map((s) => (
              <span key={s.name} className="px-2 py-0.5 bg-orange-50 text-kazi-orange text-[10px] font-semibold rounded-full border border-orange-100">
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Book / Order Now */}
        <Link
          href={`/business/${provider.id}`}
          className="mt-auto block w-full py-2.5 bg-kazi-orange text-white text-sm font-black text-center rounded-xl hover:bg-orange-600 transition-colors active:scale-95"
        >
          {provider.category === "FUNDI" ? "Book Now" : "Order Now"}
        </Link>
      </div>
    </div>
  );
}

// ─── Provider Card (List / Horizontal) ────────────────────────────────────────

function ProviderCardHorizontal({
  provider,
  distKm,
  saved,
  onToggleSave,
}: {
  provider: ReturnType<typeof mapProvider>;
  distKm?: number;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const m = meta(provider.category);
  const distLabel = distKm !== undefined
    ? distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`
    : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex gap-0 group">
      {/* Cover */}
      <div className={`relative w-28 sm:w-36 flex-shrink-0 bg-gradient-to-br ${m.gradient} flex items-center justify-center`}>
        {provider.coverImage
          ? <img src={provider.coverImage} alt={provider.name} className="w-full h-full object-cover absolute inset-0" />
          : <span className="text-5xl">{m.emoji}</span>
        }
        {distLabel && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-kazi-green/90 rounded-full px-2 py-0.5">
            <Navigation className="w-2.5 h-2.5 text-white" />
            <span className="text-white text-[10px] font-bold whitespace-nowrap">{distLabel}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-black text-sm text-kazi-dark truncate">{provider.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {provider.isVerified && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-kazi-green text-[10px] font-bold rounded-full">
                    ✓ {provider.badge || "Verified"}
                  </span>
                )}
                {provider.isFeatured && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-kazi-orange text-[10px] font-bold rounded-full">
                    ⚡ Featured
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => onToggleSave(provider.id)} className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              {saved
                ? <BookmarkCheck className="w-4 h-4 text-kazi-orange" fill="#FF6B2B" />
                : <Bookmark className="w-4 h-4 text-gray-400" />
              }
            </button>
          </div>

          <div className="flex items-center gap-0.5 mt-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3" fill={i < Math.round(provider.rating) ? "#F59E0B" : "none"} color={i < Math.round(provider.rating) ? "#F59E0B" : "#D1D5DB"} />
            ))}
            <span className="text-xs font-bold text-kazi-dark ml-1">{provider.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({provider.reviewCount})</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.location}</span>
            <span className="text-kazi-orange font-bold">From KSh {provider.price.toLocaleString()}</span>
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              {provider.workingHoursStart}–{provider.workingHoursEnd}
            </span>
          </div>
          {provider.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {provider.services.map((s) => (
                <span key={s.name} className="px-1.5 py-0.5 bg-orange-50 text-kazi-orange text-[10px] font-semibold rounded-full border border-orange-100">
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/business/${provider.id}`}
          className="mt-2 inline-flex items-center gap-1 px-4 py-2 bg-kazi-orange text-white text-xs font-black rounded-xl hover:bg-orange-600 transition-colors self-start"
        >
          {provider.category === "FUNDI" ? "Book Now" : "Order Now"}
        </Link>
      </div>
    </div>
  );
}

// ─── Featured Card ────────────────────────────────────────────────────────────

function FeaturedCard({ provider }: { provider: ReturnType<typeof mapProvider> }) {
  const m = meta(provider.category);
  return (
    <Link href={`/business/${provider.id}`} className="flex-shrink-0 w-56 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className={`relative h-32 bg-gradient-to-br ${m.gradient} flex items-center justify-center`}>
        {provider.coverImage
          ? <img src={provider.coverImage} alt={provider.name} className="w-full h-full object-cover" />
          : <span className="text-5xl">{m.emoji}</span>
        }
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className="px-1.5 py-0.5 bg-kazi-orange text-white text-[10px] font-black rounded-full">⚡ Featured</span>
          {provider.isVerified && <span className="px-1.5 py-0.5 bg-kazi-green text-white text-[10px] font-black rounded-full">✓</span>}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/60 rounded-full px-1.5 py-0.5">
          <Star className="w-2.5 h-2.5 text-kazi-amber" fill="#F59E0B" />
          <span className="text-white text-[10px] font-bold">{provider.rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-black text-xs text-kazi-dark truncate">{provider.name}</p>
        <p className="text-[10px] text-gray-400 mb-1">{m.label}</p>
        {provider.location && (
          <p className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{provider.location}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [providers, setProviders] = useState<ReturnType<typeof mapProvider>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("Top Rated");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [openNow, setOpenNow] = useState(false);

  // Location / nearby
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState("Anywhere");

  // Saved/bookmarked
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // ── Load saved providers ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    fetch(`${API}/api/customers/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSaved(new Set((data.data || []).map((p: any) => p.id)));
      })
      .catch(() => {});
  }, []);

  // ── Fetch providers ──────────────────────────────────────────────────────────
  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/providers`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.success) setProviders(data.data.map(mapProvider));
      else setError(data.message || "Failed to load providers");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  // ── Location ─────────────────────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationGranted(true);
        setNearbyLoading(false);
        toast.success("Showing providers near you");
      },
      () => { toast.error("Could not get your location"); setNearbyLoading(false); }
    );
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const featuredProviders = useMemo(
    () => providers.filter((p) => p.isFeatured).slice(0, 8),
    [providers]
  );

  const distKmLimit = useMemo(() => {
    if (distanceFilter === "1km") return 1;
    if (distanceFilter === "5km") return 5;
    if (distanceFilter === "10km") return 10;
    return Infinity;
  }, [distanceFilter]);

  const nearbyProviders = useMemo(() => {
    if (!userLocation || !locationGranted) return [];
    return providers
      .map((p) => ({
        ...p,
        _dist: p.lat && p.lng ? haversineKm(userLocation.lat, userLocation.lng, p.lat, p.lng) : 9999,
      }))
      .filter((p) => p._dist <= distKmLimit)
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 8);
  }, [providers, userLocation, locationGranted, distKmLimit]);

  function isOpenNow(start: string, end: string) {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = (start || "00:00").split(":").map(Number);
    const [eh, em] = (end || "23:59").split(":").map(Number);
    return cur >= sh * 60 + sm && cur <= eh * 60 + em;
  }

  const filtered = useMemo(() => {
    let result = [...providers];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.services?.some((s: any) => s.name?.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== "all") result = result.filter((p) => p.category === selectedCategory);
    if (minRating > 0) result = result.filter((p) => p.rating >= minRating);
    if (verifiedOnly) result = result.filter((p) => p.isVerified);
    if (minPrice > 0) result = result.filter((p) => p.price >= minPrice);
    if (maxPrice > 0) result = result.filter((p) => p.price <= maxPrice);
    if (openNow) result = result.filter((p) => isOpenNow(p.workingHoursStart, p.workingHoursEnd));

    if (sortBy === "Top Rated") result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "Most Reviewed") result.sort((a, b) => b.reviewCount - a.reviewCount);
    else if (sortBy === "Newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "Price: Low to High") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "Price: High to Low") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "Nearest" && userLocation) {
      result = result.map((p) => ({
        ...p,
        _dist: p.lat && p.lng ? haversineKm(userLocation.lat, userLocation.lng, p.lat, p.lng) : 9999,
      })).sort((a: any, b: any) => a._dist - b._dist);
    }

    return result;
  }, [providers, query, selectedCategory, minRating, verifiedOnly, minPrice, maxPrice, openNow, sortBy, userLocation]);

  const getDistKm = useCallback((p: ReturnType<typeof mapProvider>) => {
    if (!userLocation || !p.lat || !p.lng) return undefined;
    return haversineKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
  }, [userLocation]);

  const toggleSave = async (id: string) => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("Login to save providers"); return; }
    const isSaved = saved.has(id);
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(id); else next.add(id);
      return next;
    });
    try {
      const res = await fetch(`${API}/api/customers/saved/${id}`, {
        method: isSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      if (isSaved) toast("Removed from saved"); else toast.success("Provider saved!");
    } catch (err: any) {
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(id); else next.delete(id);
        return next;
      });
      toast.error(err.message || "Failed to update saved");
    }
  };

  const hasActiveFilters = minRating > 0 || verifiedOnly || sortBy !== "Top Rated" || minPrice > 0 || maxPrice > 0 || openNow;

  const clearFilters = () => {
    setMinRating(0);
    setVerifiedOnly(false);
    setSortBy("Top Rated");
    setMinPrice(0);
    setMaxPrice(0);
    setOpenNow(false);
    setQuery("");
    setSelectedCategory("all");
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      {/* ── 1. Dark Header ─────────────────────────────────────────────────── */}
      <div className="bg-kazi-dark pb-6 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">Discover Services</h1>
          <p className="text-white/60 text-sm mb-5">
            Find verified Fundis, shops, hotels, restaurants and more in Nairobi
          </p>

          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search by name, service or location..."
                className="w-full pl-11 pr-10 py-3.5 bg-white rounded-2xl text-sm text-kazi-dark focus:outline-none focus:ring-2 focus:ring-kazi-orange placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${showFilters ? "bg-kazi-orange text-white" : "bg-white text-kazi-dark hover:bg-orange-50"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:block">Filters</span>
              {hasActiveFilters && <span className="w-2 h-2 bg-red-400 rounded-full" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Category Chips ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                    : "bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-kazi-orange border border-gray-200"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ── Filter Panel ─────────────────────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Min Rating */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Min Rating</p>
                <div className="flex gap-2 flex-wrap">
                  {[{ label: "Any", val: 0 }, { label: "3+", val: 3 }, { label: "4+", val: 4 }, { label: "4.5+", val: 4.5 }].map(({ label, val }) => (
                    <button key={val} onClick={() => setMinRating(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${minRating === val ? "bg-kazi-orange text-white" : "bg-gray-100 text-gray-600 hover:bg-orange-50"}`}>
                      {val > 0 && <Star className="w-3 h-3" fill="currentColor" />}{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Sort By</p>
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-kazi-dark focus:outline-none focus:ring-2 focus:ring-kazi-orange appearance-none">
                    {SORT_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Verified Only */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Show Only</p>
                <button onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full justify-center border ${verifiedOnly ? "bg-green-50 border-kazi-green text-kazi-green" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-green-50"}`}>
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${verifiedOnly ? "border-kazi-green bg-kazi-green" : "border-gray-300"}`}>
                    {verifiedOnly && <span className="text-white text-[8px]">✓</span>}
                  </span>
                  Verified Only
                </button>
              </div>

              {/* Open Now */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Availability</p>
                <button onClick={() => setOpenNow(!openNow)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full justify-center border ${openNow ? "bg-green-50 border-kazi-green text-kazi-green" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-green-50"}`}>
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${openNow ? "border-kazi-green bg-kazi-green" : "border-gray-300"}`}>
                    {openNow && <span className="text-white text-[8px]">✓</span>}
                  </span>
                  Open Now
                </button>
              </div>
            </div>

            {/* Price range row */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Price Range (KSh)</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min price"
                    value={minPrice || ""}
                    onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-kazi-dark focus:outline-none focus:ring-2 focus:ring-kazi-orange"
                  />
                </div>
                <span className="text-gray-400 font-bold">–</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Max price"
                    value={maxPrice || ""}
                    onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-kazi-dark focus:outline-none focus:ring-2 focus:ring-kazi-orange"
                  />
                </div>
                {(minPrice > 0 || maxPrice > 0) && (
                  <button onClick={() => { setMinPrice(0); setMaxPrice(0); }} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Active filter chips + Clear */}
            {hasActiveFilters && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                {minRating > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-kazi-orange text-xs font-bold rounded-full">
                    ⭐ {minRating}+
                    <button onClick={() => setMinRating(0)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {verifiedOnly && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-kazi-green text-xs font-bold rounded-full">
                    ✓ Verified
                    <button onClick={() => setVerifiedOnly(false)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {sortBy !== "Top Rated" && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                    {sortBy}
                    <button onClick={() => setSortBy("Top Rated")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {openNow && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-kazi-green text-xs font-bold rounded-full">
                    🕐 Open Now
                    <button onClick={() => setOpenNow(false)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(minPrice > 0 || maxPrice > 0) && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-kazi-orange text-xs font-bold rounded-full">
                    KSh {minPrice > 0 ? minPrice.toLocaleString() : "0"} – {maxPrice > 0 ? maxPrice.toLocaleString() : "any"}
                    <button onClick={() => { setMinPrice(0); setMaxPrice(0); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={clearFilters}
                  className="ml-auto px-3 py-1 bg-red-50 text-red-500 font-bold rounded-full text-xs hover:bg-red-100 transition-all border border-red-100">
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 3. Featured Providers ─────────────────────────────────────────── */}
        {!loading && featuredProviders.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-kazi-orange" fill="#FF6B2B" />
              <h2 className="text-lg font-black text-kazi-dark">Featured Providers</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {featuredProviders.map((p) => <FeaturedCard key={p.id} provider={p} />)}
            </div>
          </section>
        )}

        {/* ── 4. Nearby Providers ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-black text-kazi-dark flex items-center gap-2">
              <MapPin className="w-5 h-5 text-kazi-orange" />
              Providers Near You
            </h2>
            {!locationGranted && (
              <button
                onClick={requestLocation}
                disabled={nearbyLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-kazi-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-60"
              >
                <Navigation className="w-3.5 h-3.5" />
                {nearbyLoading ? "Getting location…" : "Allow Location"}
              </button>
            )}
          </div>

          {!locationGranted && !nearbyLoading && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="text-5xl mb-3">📍</div>
              <p className="font-black text-kazi-dark mb-1">See providers near you</p>
              <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
                Allow location access to find verified providers within your area
              </p>
              <button
                onClick={requestLocation}
                disabled={nearbyLoading}
                className="px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all"
              >
                {nearbyLoading ? "Getting location…" : "Enable Location"}
              </button>
            </div>
          )}

          {locationGranted && (
            <>
              <div className="flex gap-2 mb-4 flex-wrap">
                {DISTANCE_OPTIONS.map((opt) => (
                  <button key={opt} onClick={() => setDistanceFilter(opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${distanceFilter === opt ? "bg-kazi-orange text-white" : "bg-white text-gray-600 shadow-sm hover:bg-orange-50 border border-gray-200"}`}>
                    {opt}
                  </button>
                ))}
                <button onClick={() => { setLocationGranted(false); setUserLocation(null); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 transition-all">
                  <X className="w-3 h-3 inline mr-1" />Clear
                </button>
              </div>

              {nearbyProviders.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="font-bold text-kazi-dark text-sm">No providers within {distanceFilter}</p>
                  <button onClick={() => setDistanceFilter("Anywhere")} className="mt-3 text-kazi-orange text-xs font-semibold underline">
                    Show all distances
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {nearbyProviders.map((p) => (
                    <ProviderCardHorizontal
                      key={p.id}
                      provider={p}
                      distKm={(p as any)._dist}
                      saved={saved.has(p.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── 5. All Providers ─────────────────────────────────────────────── */}
        <section>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm font-semibold text-gray-600">
              {loading ? (
                <span className="text-gray-400">Loading providers…</span>
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <>
                  <span className="text-kazi-dark font-black">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "provider" : "providers"} found
                  {filtered.filter((p) => p.isVerified).length > 0 && (
                    <span className="text-kazi-green font-bold"> · {filtered.filter((p) => p.isVerified).length} verified</span>
                  )}
                  {query && <span className="text-kazi-orange"> for &quot;{query}&quot;</span>}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl transition-colors ${viewMode === "grid" ? "bg-kazi-orange text-white" : "bg-white text-gray-500 shadow-sm border border-gray-200"}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl transition-colors ${viewMode === "list" ? "bg-kazi-orange text-white" : "bg-white text-gray-500 shadow-sm border border-gray-200"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="font-black text-kazi-dark text-lg mb-2">Cannot load providers</h3>
              <p className="text-gray-400 text-sm mb-5">Make sure your backend is running on port 5000</p>
              <button onClick={fetchProviders}
                className="flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all mx-auto">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-black text-kazi-dark text-xl mb-2">No providers found</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                {query
                  ? `No results for "${query}". Try different keywords or clear your filters.`
                  : "No providers match your current filters."}
              </p>
              <button onClick={clearFilters}
                className="px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all">
                Clear All Filters
              </button>
            </div>
          )}

          {/* Provider grid / list */}
          {!loading && !error && filtered.length > 0 && (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    distKm={getDistKm(p)}
                    saved={saved.has(p.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => (
                  <ProviderCardHorizontal
                    key={p.id}
                    provider={p}
                    distKm={getDistKm(p)}
                    saved={saved.has(p.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            )
          )}
        </section>
      </div>

      <div className="pb-20 md:pb-0" />
      <BottomNav />
    </div>
  );
}
