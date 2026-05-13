"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tag, Clock, ArrowRight, Star, Share2, Heart, Plus, X, Loader2, Zap, TrendingUp, Flame } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDI: "🔧", SHOP: "🛒", HOTEL: "🏨", RESTAURANT: "🍲",
  TECH: "💻", PROFESSIONAL: "⚖️", BUSINESS: "💼",
};

function getTimeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", ms: 0, isFlash: false };
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  const isFlash = diff < 2 * 60 * 60 * 1000;
  if (days > 0) return { text: `${days}d ${hours}h left`, ms: diff, isFlash: false };
  if (totalHours > 0) return { text: `${totalHours}h ${mins}m ${secs}s`, ms: diff, isFlash };
  return { text: `${mins}m ${secs}s`, ms: diff, isFlash };
}

function CountdownBadge({ endDate }: { endDate: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const { text, ms, isFlash } = getTimeLeft(endDate);
  if (ms <= 0) return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-500/80 text-white text-[10px] font-bold rounded-full">
      Expired
    </span>
  );
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 text-white text-[10px] font-bold rounded-full ${isFlash ? "bg-red-600 animate-pulse" : "bg-black/50"}`}>
      <Clock className="w-2.5 h-2.5" /> {text}
    </span>
  );
}

function DealCard({ deal, saved, onToggleSave }: { deal: any; saved: boolean; onToggleSave: (id: string) => void }) {
  const expired = new Date(deal.endDate).getTime() <= Date.now();
  const router = useRouter();
  const { isFlash } = getTimeLeft(deal.endDate);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const discount = deal.discountType === "PERCENTAGE" ? `${deal.discountValue}% OFF` : `KSh ${deal.discountValue} OFF`;
    const msg = `🔥 ${discount} — ${deal.title} by ${deal.provider?.businessName}! Book now on KaziShow: ${window.location.origin}/business/${deal.provider?.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave(deal.id);
  };

  const handleBookDeal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams({
      dealId: deal.id,
      dealTitle: deal.title,
      discount: String(deal.discountValue),
      discountType: deal.discountType,
    });
    if (discountedPrice !== null) params.set("dealPrice", String(discountedPrice));
    if (deal.originalPrice) params.set("originalPrice", String(deal.originalPrice));
    router.push(`/business/${deal.provider?.id}?${params.toString()}`);
  };

  const discountedPrice =
    deal.originalPrice && deal.discountType === "PERCENTAGE"
      ? Math.round(deal.originalPrice * (1 - deal.discountValue / 100))
      : deal.originalPrice
        ? deal.originalPrice - deal.discountValue
        : null;

  return (
    <Link href={`/business/${deal.provider?.id}`}>
      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group cursor-pointer ${expired ? "opacity-60" : ""}`}>
        {/* Expired overlay */}
        {expired && (
          <div className="absolute inset-0 z-10 bg-gray-900/20 flex items-center justify-center rounded-2xl pointer-events-none">
            <span className="bg-gray-800 text-white text-xs font-black px-3 py-1.5 rounded-full">EXPIRED</span>
          </div>
        )}

        {/* Flash badge */}
        {isFlash && !expired && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
            <Zap className="w-2.5 h-2.5" /> FLASH
          </div>
        )}

        {/* Save & Share */}
        <div className="absolute top-2 right-2 z-20 flex gap-1.5">
          <button onClick={handleSave} className={`w-7 h-7 rounded-full flex items-center justify-center shadow transition-all ${saved ? "bg-red-500 text-white" : "bg-white/90 text-gray-500 hover:text-red-500"}`}>
            <Heart className="w-3.5 h-3.5" fill={saved ? "white" : "none"} />
          </button>
          <button onClick={handleShare} className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-green-500 hover:text-white transition-all text-gray-500">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Image or gradient header */}
        <div
          className="relative h-36 overflow-hidden"
          onClick={deal.imageUrl ? (e) => { e.preventDefault(); e.stopPropagation(); setLightboxOpen(true); } : undefined}
        >
          {deal.imageUrl ? (
            <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" }}>
              {CATEGORY_EMOJI[deal.provider?.category] || "🏷️"}
            </div>
          )}
          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Discount badge */}
          <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2.5 py-1 rounded-xl font-black text-sm shadow-lg">
            {deal.discountType === "PERCENTAGE" ? `${deal.discountValue}% OFF` : `KSh ${deal.discountValue} OFF`}
          </div>
          {/* Countdown */}
          <div className="absolute bottom-2 right-2">
            <CountdownBadge endDate={deal.endDate} />
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-black text-kazi-dark text-sm line-clamp-1">{deal.title}</p>
          {deal.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{deal.description}</p>}

          {deal.originalPrice && discountedPrice !== null && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 line-through">KSh {deal.originalPrice.toLocaleString()}</span>
              <span className="text-sm font-black text-red-500">KSh {discountedPrice.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
            <div className="w-6 h-6 rounded-lg bg-orange-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {deal.provider?.profileImage
                ? <img src={deal.provider.profileImage} className="w-full h-full object-cover" alt="" />
                : <span className="text-xs">{CATEGORY_EMOJI[deal.provider?.category] || "🏷️"}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-kazi-dark truncate">{deal.provider?.businessName}</p>
              <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-amber-400" fill="#F59E0B" />
                <span className="text-[10px] text-gray-400">{(deal.provider?.rating || 0).toFixed(1)}</span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400 truncate">{deal.provider?.user?.location || "Nairobi"}</span>
              </div>
            </div>
          </div>

          {!expired && (
            <button
              onClick={handleBookDeal}
              className="mt-2 w-full py-2.5 bg-kazi-orange text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-orange-600 transition-colors"
            >
              🔥 Book This Deal
            </button>
          )}
        </div>
      </div>
    </Link>

    {/* Lightbox */}
    {lightboxOpen && deal.imageUrl && (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
          onClick={() => setLightboxOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={deal.imageUrl}
          alt={deal.title}
          className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white font-bold text-sm">{deal.title}</p>
          <p className="text-white/50 text-xs mt-0.5">Tap anywhere to close</p>
        </div>
      </div>
    )}
  );
}

function CreateDealModal({ onClose, onCreated }: { onClose: () => void; onCreated: (deal: any) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API}/api/upload/public?folder=general`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token || ""}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) { setImageUrl(data.data.url); toast.success("Image uploaded!"); }
      else toast.error(data.message || "Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!title || !discountValue || !endDate) { toast.error("Fill all required fields"); return; }
    const token = localStorage.getItem("kazishow_token");
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description, discountType,
          discountValue: parseFloat(discountValue),
          originalPrice: originalPrice ? parseInt(originalPrice) : null,
          endDate, imageUrl: imageUrl || null,
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Deal published!"); onCreated(data.data); onClose(); }
      else toast.error(data.message || "Failed to create deal");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-kazi-dark flex items-center gap-2">
            <Tag className="w-5 h-5 text-red-500" /> Create New Deal
          </h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-xs font-bold text-gray-700 mb-2 block">Deal Image (optional)</label>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden h-36">
                <img src={imageUrl} alt="Deal" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✅ Uploaded</div>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${uploading ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-red-400 hover:bg-red-50"}`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
                      <p className="text-sm text-red-500 font-semibold">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">🖼️</div>
                      <p className="text-sm font-bold text-gray-600">Click to upload deal image</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WebP up to 5MB</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-2 block">Deal Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend Special — 20% Off" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-2 block">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the deal" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-2 block">Discount Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (KSh)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-2 block">
                {discountType === "PERCENTAGE" ? "Discount %" : "Amount (KSh)"} *
              </label>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-2 block">Original Price (KSh) — optional</label>
            <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="e.g. 2500 (shows strikethrough price)" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-2 block">Expires On *</label>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="w-full py-3.5 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            Publish Deal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [savedDeals, setSavedDeals] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProvider, setIsProvider] = useState(false);

  const categories = ["All", "FUNDI", "SHOP", "HOTEL", "RESTAURANT", "TECH", "PROFESSIONAL", "BUSINESS"];

  useEffect(() => {
    fetch(`${API}/api/promotions/active`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setDeals(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    try {
      const user = JSON.parse(localStorage.getItem("kazishow_user") || "{}");
      setIsProvider(user?.role === "PROVIDER");
    } catch {}

    try {
      const saved = JSON.parse(localStorage.getItem("kazishow_saved_deals") || "[]");
      setSavedDeals(new Set(saved));
    } catch {}
  }, []);

  const toggleSave = (dealId: string) => {
    setSavedDeals((prev) => {
      const next = new Set(prev);
      if (next.has(dealId)) { next.delete(dealId); toast("Removed from saved", { icon: "💔" }); }
      else { next.add(dealId); toast.success("Deal saved!"); }
      localStorage.setItem("kazishow_saved_deals", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const now = Date.now();
  const activeDeals = deals.filter((d) => new Date(d.endDate).getTime() > now);
  const filtered = filter === "All" ? deals : deals.filter((d) => d.provider?.category === filter);
  const flashDeals = activeDeals.filter((d) => new Date(d.endDate).getTime() - now < 2 * 60 * 60 * 1000);
  const popularDeals = [...activeDeals]
    .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
    .slice(0, 4)
    .filter((d) => (d.bookingCount || 0) > 0);

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
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <span className="text-white font-black text-2xl">{activeDeals.length} active deals</span>
            {flashDeals.length > 0 && (
              <span className="flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-sm font-bold rounded-full animate-pulse">
                <Zap className="w-3.5 h-3.5" /> {flashDeals.length} flash deal{flashDeals.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl animate-pulse overflow-hidden">
                <div className="h-36 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-10 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-xl font-black text-kazi-dark mb-2">No deals right now</h2>
            <p className="text-gray-500 text-sm mb-6">Check back soon — providers post new deals regularly</p>
            <Link href="/discover" className="px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm">
              Browse All Providers
            </Link>
          </div>
        ) : (
          <>
            {/* Flash Deals */}
            {filter === "All" && flashDeals.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-xl">
                    <Zap className="w-4 h-4" />
                    <span className="font-black text-sm">FLASH DEALS</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Expiring in under 2 hours!</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {flashDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} saved={savedDeals.has(deal.id)} onToggleSave={toggleSave} />
                  ))}
                </div>
              </section>
            )}

            {/* Most Popular */}
            {filter === "All" && popularDeals.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-kazi-orange" />
                  <h2 className="text-lg font-black text-kazi-dark">Most Popular</h2>
                  <span className="text-xs text-gray-400 font-medium">Most booked deals</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {popularDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} saved={savedDeals.has(deal.id)} onToggleSave={toggleSave} />
                  ))}
                </div>
              </section>
            )}

            {/* All / filtered deals */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-black text-kazi-dark">
                  {filter === "All" ? "All Deals" : `${CATEGORY_EMOJI[filter] || ""} ${filter} Deals`}
                </h2>
                <span className="text-xs text-gray-400 font-medium">
                  ({filtered.filter((d) => new Date(d.endDate).getTime() > now).length} active)
                </span>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl">
                  <p className="text-gray-400 text-sm">No deals for this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((deal) => (
                    <DealCard key={deal.id} deal={deal} saved={savedDeals.has(deal.id)} onToggleSave={toggleSave} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Provider FAB */}
      {isProvider && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-red-500 text-white font-black rounded-2xl shadow-xl hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">New Deal</span>
        </button>
      )}

      {showCreateModal && (
        <CreateDealModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(deal) => setDeals((prev) => [deal, ...prev])}
        />
      )}

      <BottomNav />
      <WhatsAppBubble />
    </div>
  );
}
