"use client";
import { Star, MapPin, Search, X, Navigation } from "lucide-react";
import type { MapProvider } from "./MapComponent";

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string }> = {
  FUNDI:        { emoji: "🔧", label: "Fundi" },
  HOTEL:        { emoji: "🏨", label: "Hotel" },
  RESTAURANT:   { emoji: "🍲", label: "Food" },
  SHOP:         { emoji: "🛒", label: "Shop" },
  TECH:         { emoji: "💻", label: "Tech" },
  PROFESSIONAL: { emoji: "⚖️", label: "Pro" },
  BUSINESS:     { emoji: "💼", label: "Business" },
};

interface ProviderSidebarProps {
  providers: MapProvider[];
  selectedId: string | null;
  search: string;
  activeCategory: string | null;
  loading: boolean;
  userLocation: [number, number] | null;
  onSearch: (v: string) => void;
  onCategoryToggle: (cat: string) => void;
  onSelect: (id: string) => void;
  onNearMe: () => void;
}

export default function ProviderSidebar({
  providers,
  selectedId,
  search,
  activeCategory,
  loading,
  userLocation,
  onSearch,
  onCategoryToggle,
  onSelect,
  onNearMe,
}: ProviderSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search bar */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Near Me button */}
        <button
          onClick={onNearMe}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
            userLocation
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
          disabled={!userLocation}
          title={!userLocation ? "Allow location access to use Near Me" : ""}
        >
          <Navigation className="w-4 h-4" />
          Near Me (5 km)
        </button>

        {/* Category chips */}
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(CATEGORY_CONFIG).map(([cat, { emoji, label }]) => (
            <button
              key={cat}
              onClick={() => onCategoryToggle(cat)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-kazi-orange text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-50">
        {loading ? "Loading..." : `${providers.length} provider${providers.length !== 1 ? "s" : ""} found`}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-400">No providers found</p>
            <p className="text-xs text-gray-300 mt-1">Try a different search or category</p>
          </div>
        ) : (
          providers.map((p) => {
            const cfg = CATEGORY_CONFIG[p.category] || { emoji: "📍", label: p.category };
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 flex items-center gap-3 transition-colors ${
                  isSelected ? "bg-orange-50 border-l-4 border-l-kazi-orange" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: isSelected ? "#FF6B2B20" : "#F3F4F6" }}
                >
                  {p.profileImage ? (
                    <img src={p.profileImage} alt={p.businessName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    cfg.emoji
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isSelected ? "text-kazi-orange" : "text-kazi-dark"}`}>
                    {p.businessName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3 h-3 text-kazi-amber" fill="#F59E0B" />
                    <span className="text-xs font-semibold text-gray-600">{p.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({p.reviewCount})</span>
                    {p.distance != null && (
                      <span className="text-xs text-gray-400 ml-1">
                        · {p.distance < 1 ? `${(p.distance * 1000).toFixed(0)}m` : `${p.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
                <MapPin className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-kazi-orange" : "text-gray-300"}`} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
