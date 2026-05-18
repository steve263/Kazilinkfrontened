"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Clock, Heart, Eye, ArrowRight } from "lucide-react";
import { ExpiryBadgeLight } from "@/components/ui/ExpiryBadge";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";
import BroadcastBanner from "@/components/notifications/BroadcastBanner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = [
  "Home Improvement",
  "Tech Tips",
  "Food and Dining",
  "Beauty and Wellness",
  "Legal and Finance",
  "Business Growth",
  "General Tips",
];

export default function TipsPage() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "viewed" | "liked">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("kazishow_user");
    if (user) setLoggedInUser(JSON.parse(user));
    fetchTips();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      params.append("sort", sortBy);

      const res = await fetch(`${API}/api/tips?${params}`);
      const data = await res.json();
      if (data.success) {
        let filtered = data.data;
        if (searchQuery) {
          filtered = filtered.filter(
            (t: any) =>
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setTips(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch tips:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />
      <BroadcastBanner />

      {/* Hero */}
      <section className="relative bg-kazi-dark overflow-hidden py-12 sm:py-16">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, #FF6B2B22 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #F59E0B22 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Tips & Guides</h1>
          <p className="text-white/70 max-w-xl mx-auto">Learn from the KaziShow community. Expert tips from real service providers.</p>

          {/* Search */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          {loggedInUser ? (
            <Link
              href="/tips/create"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm"
            >
              <ArrowRight className="w-4 h-4" /> Write a Guide
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm"
            >
              Login to Write
            </Link>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 py-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-kazi-orange text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-kazi-orange"
            >
              <option value="latest">Most Recent</option>
              <option value="viewed">Most Viewed</option>
              <option value="liked">Most Liked</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tips Grid */}
      {loading ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl animate-pulse overflow-hidden">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : tips.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-gray-600 text-lg">No guides found. Be the first to share!</p>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tips.map((tip) => (
              <Link key={tip.id} href={`/tips/${tip.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all h-full flex flex-col group cursor-pointer">
                  {/* Cover */}
                  {tip.coverImage && (
                    <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-50 overflow-hidden">
                      <img
                        src={tip.coverImage}
                        alt={tip.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-kazi-orange bg-orange-50 px-2 py-1 rounded-full">
                        {tip.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {tip.expiresAt && <ExpiryBadgeLight expiresAt={tip.expiresAt} />}
                        <span className="text-xs text-gray-500">{tip.readTime} min</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-black text-kazi-dark mb-2 line-clamp-2 group-hover:text-kazi-orange transition-colors">
                      {tip.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2 mb-4 flex-1">{tip.excerpt}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span>{tip.author?.name?.split(" ")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {tip.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {tip.likes}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
      <WhatsAppBubble />
    </div>
  );
}
