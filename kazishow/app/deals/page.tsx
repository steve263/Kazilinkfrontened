"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Clock, ArrowRight, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDI: "🔧", SHOP: "🛒", HOTEL: "🏨", RESTAURANT: "🍲",
  TECH: "💻", PROFESSIONAL: "⚖️", BUSINESS: "💼",
};

function timeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h left`;
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const categories = ["All", "FUNDI", "SHOP", "HOTEL", "RESTAURANT", "TECH", "PROFESSIONAL", "BUSINESS"];

  useEffect(() => {
    fetch(`${API}/api/promotions/active`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setDeals(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? deals : deals.filter((d) => d.provider?.category === filter);

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-12 sm:py-16" style={{ background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-4">
            <Tag className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">Limited Time Offers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">🔥 Hot Deals</h1>
          <p className="text-white/80 max-w-xl mx-auto">Exclusive discounts from verified providers. Book before they expire!</p>
          <p className="text-white font-black text-2xl mt-4">{deals.length} active deals</p>
        </div>
      </section>

      {/* Category filter */}
      <section className="bg-white border-b border-gray-100 py-3 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === cat ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat === "All" ? "✨ All" : `${CATEGORY_EMOJI[cat] || ""} ${cat}`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Deals grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl animate-pulse overflow-hidden">
                <div className="h-32 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-10 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-xl font-black text-kazi-dark mb-2">No deals right now</h2>
            <p className="text-gray-500 text-sm mb-6">Check back soon — providers post new deals regularly</p>
            <Link href="/discover" className="px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm">
              Browse All Providers
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((deal) => (
              <Link key={deal.id} href={`/business/${deal.provider?.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group cursor-pointer">
                  {/* Discount banner */}
                  <div className="relative p-5 text-white" style={{ background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-3xl font-black">
                          {deal.discountType === "PERCENTAGE" ? `${deal.discountValue}%` : `KSh ${deal.discountValue}`}
                        </span>
                        <span className="text-white/80 text-sm ml-1">OFF</span>
                        <p className="font-black text-sm mt-1">{deal.title}</p>
                        {deal.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{deal.description}</p>}
                      </div>
                      <span className="text-4xl">{CATEGORY_EMOJI[deal.provider?.category] || "🏷️"}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 bg-black/20 rounded-full px-3 py-1 w-fit">
                      <Clock className="w-3 h-3 text-white" />
                      <span className="text-white text-xs font-bold">{timeLeft(deal.endDate)}</span>
                    </div>
                  </div>

                  {/* Provider info */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                        {deal.provider?.profileImage
                          ? <img src={deal.provider.profileImage} className="w-full h-full object-cover rounded-xl" alt="" />
                          : CATEGORY_EMOJI[deal.provider?.category] || "🏷️"
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-kazi-dark text-sm truncate">{deal.provider?.businessName}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400" fill="#F59E0B" />
                          <span className="text-xs text-gray-500">{(deal.provider?.rating || 0).toFixed(1)}</span>
                          <span className="text-xs text-gray-400 ml-1">{deal.provider?.user?.location || "Nairobi"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                      <span className="px-2 py-0.5 bg-orange-50 text-kazi-orange font-semibold rounded-full">{deal.provider?.category}</span>
                      <span className="flex items-center gap-1 text-kazi-orange font-bold">
                        Book Now <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
      <WhatsAppBubble />
    </div>
  );
}
