"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search, X, Navigation,
  Moon, Sun, Loader2, MapPin,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import ProviderBottomSheet from "@/components/map/ProviderBottomSheet";
import BookingModal from "@/components/booking/BookingModal";
import { CATEGORY_CONFIG } from "@/components/map/categoryConfig";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface MapProvider {
  id: string;
  businessName: string;
  category: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  profileImage?: string;
  distance?: number;
  description?: string;
  isVerified?: boolean;
  minJobValue?: number;
  servicesCount?: number;
}

const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#FF6B2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400 font-medium">Loading map…</p>
      </div>
    </div>
  ),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Category chips ───────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { key: "FUNDI",        emoji: "🔧", label: "Fundi"    },
  { key: "RESTAURANT",   emoji: "🍽️", label: "Food"     },
  { key: "SHOP",         emoji: "🛍️", label: "Shop"     },
  { key: "HOTEL",        emoji: "🏨", label: "Hotel"    },
  { key: "TECH",         emoji: "💻", label: "Tech"     },
  { key: "PROFESSIONAL", emoji: "⚖️", label: "Pro"      },
  { key: "BUSINESS",     emoji: "💼", label: "Business" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPageClient() {
  const [allProviders, setAllProviders] = useState<MapProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ coords: [number, number]; zoom?: number; ts: number } | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showRadiusCircle, setShowRadiusCircle] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingProvider, setBookingProvider] = useState<any>(null);
  const locationRequested = useRef(false);

  // ── Fetch providers ────────────────────────────────────────────────────────
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/providers?limit=200`);
      const data = await res.json();
      if (data.success) {
        const mapped: MapProvider[] = (data.data.providers ?? [])
          .filter((p: any) => p.user?.lat && p.user?.lng)
          .map((p: any) => ({
            id: p.id,
            businessName: p.businessName,
            category: p.category,
            rating: p.averageRating ?? p.rating ?? 0,
            reviewCount: p.totalReviews ?? 0,
            lat: p.user.lat,
            lng: p.user.lng,
            profileImage: p.profileImage ?? undefined,
            description: p.description ?? undefined,
            isVerified: p.isVerified ?? false,
            minJobValue: p.minJobValue ?? undefined,
            servicesCount: p.services?.length ?? 0,
          }));
        setAllProviders(mapped);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  // ── GPS ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (locationRequested.current) return;
    locationRequested.current = true;
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const providersWithDist = useMemo<MapProvider[]>(() => {
    if (!userLocation) return allProviders;
    return allProviders.map((p) => ({
      ...p,
      distance: haversine(userLocation[0], userLocation[1], p.lat, p.lng),
    }));
  }, [allProviders, userLocation]);

  const filtered = useMemo(() => {
    let list = providersWithDist;
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.businessName.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) =>
      a.distance != null && b.distance != null ? a.distance - b.distance : 0
    );
  }, [providersWithDist, activeCategory, search]);

  const selectedProvider = useMemo(
    () => filtered.find((p) => p.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const p = allProviders.find((x) => x.id === id);
    if (p) setFlyTarget({ coords: [p.lat, p.lng], zoom: 15, ts: Date.now() });
  }, [allProviders]);

  const handleNearMe = useCallback(() => {
    if (!userLocation) return;
    setFlyTarget({ coords: userLocation, zoom: 14, ts: Date.now() });
    setShowRadiusCircle(true);
    setTimeout(() => setShowRadiusCircle(false), 8000);
  }, [userLocation]);

  const handleBook = useCallback((provider: MapProvider) => {
    setBookingProvider({ ...provider, id: provider.id, businessName: provider.businessName, services: [], category: provider.category });
    setShowBooking(true);
  }, []);

  const handleCategoryToggle = useCallback((cat: string) => {
    setActiveCategory((prev) => prev === cat ? null : cat);
  }, []);

  return (
    <div className={`fixed inset-0 flex flex-col ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>

      {/* ── Floating top overlay ──────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="max-w-2xl mx-auto px-3 pt-3 space-y-2 pointer-events-auto">

          {/* Search bar */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            {/* Logo / back */}
            <Link href="/" className="flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#FF6B2B] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </Link>

            <div className="flex-1 relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services near you…"
                className={`w-full pl-6 pr-6 text-sm font-medium focus:outline-none bg-transparent ${darkMode ? "text-white placeholder:text-gray-500" : "text-gray-800 placeholder:text-gray-400"}`}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-0 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Provider count */}
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${darkMode ? "bg-gray-700 text-gray-300" : "bg-orange-50 text-[#FF6B2B]"}`}>
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${filtered.length}`}
            </span>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_FILTERS.map(({ key, emoji, label }) => {
              const isActive = activeCategory === key;
              const cfg = CATEGORY_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => handleCategoryToggle(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 shadow-sm transition-all active:scale-95"
                  style={{
                    background: isActive ? cfg.color : darkMode ? "#374151" : "white",
                    color: isActive ? "white" : darkMode ? "#D1D5DB" : "#374151",
                    border: isActive ? "none" : `1.5px solid ${darkMode ? "#4B5563" : "#E5E7EB"}`,
                  }}
                >
                  <span>{emoji}</span>
                  {label}
                  {isActive && <X className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <MapComponent
          providers={filtered}
          userLocation={userLocation}
          selectedId={selectedId}
          flyTarget={flyTarget}
          onSelectProvider={handleSelect}
          showRadiusCircle={showRadiusCircle}
          darkMode={darkMode}
        />
      </div>

      {/* ── Floating Action Buttons (bottom right) ────────────────────────── */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2.5 z-[1000]">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode((v) => !v)}
          className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-95 ${darkMode ? "bg-gray-700 text-yellow-400" : "bg-white text-gray-600"}`}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Near Me */}
        <button
          onClick={handleNearMe}
          disabled={!userLocation}
          className="w-12 h-12 bg-[#FF6B2B] rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center text-white hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-40"
          title="Near Me"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* ── Bottom sheet for selected provider ────────────────────────────── */}
      {selectedId && selectedProvider && (
        <ProviderBottomSheet
          provider={selectedProvider}
          onClose={() => setSelectedId(null)}
          onBook={handleBook}
        />
      )}

      {/* ── Booking modal ─────────────────────────────────────────────────── */}
      {showBooking && bookingProvider && (
        <BookingModal
          business={bookingProvider}
          onClose={() => setShowBooking(false)}
        />
      )}

      {/* ── Bottom nav ────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000]">
        <BottomNav />
      </div>
    </div>
  );
}
