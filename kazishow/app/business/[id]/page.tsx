"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Star, MapPin, Phone, CheckCircle, Clock, Share2,
  Bookmark, BookmarkCheck, ArrowLeft, Calendar, ExternalLink, HardHat,
  Store, ShieldCheck, MessageCircle, Flag, MessageSquare, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import BookingModal from "@/components/booking/BookingModal";
import ReviewCard from "@/components/shared/ReviewCard";
import ReviewModal from "@/components/trust/ReviewModal";
import ReportModal from "@/components/trust/ReportModal";
import TrustBadge from "@/components/trust/TrustBadge";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import ResponseTimeBadge from "@/components/provider/ResponseTimeBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProviderProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");
  const dealPrice = searchParams.get("dealPrice") ? Number(searchParams.get("dealPrice")) : undefined;
  const dealTitle = searchParams.get("dealTitle") || undefined;
  const discount = searchParams.get("discount") ? Number(searchParams.get("discount")) : undefined;
  const discountType = searchParams.get("discountType") || "PERCENTAGE";
  const originalPrice = searchParams.get("originalPrice") ? Number(searchParams.get("originalPrice")) : undefined;
  const hasDeal = !!dealId;
  const reviewBookingParam = searchParams.get("reviewBooking");
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [starBreakdown, setStarBreakdown] = useState<{ star: number; count: number; pct: number }[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewSort, setReviewSort] = useState("recent");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewableBookingId, setReviewableBookingId] = useState<string | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("kazishow_user");
    if (stored) { try { setCurrentUser(JSON.parse(stored)); } catch {} }
  }, []);

  // Auto-open review modal when coming from profile "Write Review" link
  useEffect(() => {
    if (reviewBookingParam && !loading) {
      setReviewableBookingId(reviewBookingParam);
      setActiveTab("Reviews");
      setShowReviewModal(true);
    }
  }, [reviewBookingParam, loading]);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token || !params.id) return;
    fetch(`${API_URL}/api/customers/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setIsSaved((data.data || []).some((p: any) => p.id === params.id));
      })
      .catch(() => {});
  }, [params.id]);

  const toggleSave = async () => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("Login to save providers"); return; }
    setIsSaved((v) => !v);
    try {
      const res = await fetch(`${API_URL}/api/customers/saved/${params.id}`, {
        method: isSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      if (isSaved) toast("Removed from saved"); else toast.success("Provider saved!");
    } catch (err: any) {
      setIsSaved((v) => !v);
      toast.error(err.message || "Failed to update saved");
    }
  };

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const response = await fetch(`${API_URL}/api/providers/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setProvider(data.data);
          const userId = data.data.userId;
          if (userId) {
            fetch(`${API_URL}/api/trust/trust-score/${userId}`)
              .then((r) => r.json())
              .then((ts) => { if (ts.success) setTrustScore(ts.data); })
              .catch(() => {});
          }
          // Record this view for "Recently Viewed" recommendations
          const token = localStorage.getItem("kazishow_token");
          if (token && params.id) {
            fetch(`${API_URL}/api/recommendations/interaction`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ providerId: params.id, type: "view" }),
            }).catch(() => {});
          }
        }
      } catch {
        console.error("Failed to fetch provider");
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();

    // Record view interaction for recommendations
    const token = localStorage.getItem("kazishow_token");
    if (token && params.id) {
      fetch(`${API_URL}/api/recommendations/interaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerId: params.id, type: "view" }),
      }).catch(() => {});
    }
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    fetch(`${API_URL}/api/providers/${params.id}/availability`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setIsBusy(data.data.isBusy);
          setWaitlistCount(data.data.waitlistCount || 0);
        }
      })
      .catch(() => {});
  }, [params.id]);

  const fetchReviews = useCallback(async (sort = "recent") => {
    if (!params.id) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/reviews/provider/${params.id}?sort=${sort}&limit=50`
      );
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews || []);
        setStarBreakdown(data.data.starBreakdown || []);
        setReviewsTotal(data.data.pagination?.total || 0);
      }
    } catch {}
    finally { setReviewsLoading(false); }
  }, [params.id]);

  const checkReviewable = useCallback(async () => {
    const stored = localStorage.getItem("kazishow_user");
    const user = stored ? JSON.parse(stored) : null;
    if (!user || user.role !== "CUSTOMER") return;
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/customers/reviews/reviewable/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && data.data?.bookingId) {
        setReviewableBookingId(data.data.bookingId);
        setShowReviewPrompt(true);
      }
    } catch {}
  }, [params.id]);

  useEffect(() => {
    if (activeTab === "Reviews") {
      fetchReviews(reviewSort);
      checkReviewable();
    }
  }, [activeTab, reviewSort, fetchReviews, checkReviewable]);

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-kazi-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading provider...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="font-bold text-kazi-dark text-xl mb-2">Provider not found</h2>
          <Link href="/discover" className="text-kazi-orange hover:underline text-sm">
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  const isFundi = provider.category === "FUNDI";
  const badgeBg = isFundi ? "bg-kazi-orange" : "bg-kazi-blue";
  const BadgeIcon = isFundi ? HardHat : Store;
  const TABS = ["Overview", "Services", "Reviews"];
  const services = provider.services || [];

  const categoryEmoji = () => {
    switch (provider.category) {
      case "FUNDI": return "🔧";
      case "HOTEL": return "🏨";
      case "RESTAURANT": return "🍲";
      case "SHOP": return "🛒";
      case "TECH": return "💻";
      case "PROFESSIONAL": return "⚖️";
      default: return "💼";
    }
  };

  const handleWriteReview = () => {
    if (!currentUser) {
      toast.error("Please login to leave a review");
      return;
    }
    if (!reviewableBookingId) {
      toast.error("You need a completed booking with this provider to leave a review");
      return;
    }
    setShowReviewModal(true);
  };

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      {/* Cover */}
      <div className="relative h-56 sm:h-72 overflow-hidden bg-gradient-to-br from-kazi-dark to-gray-800">
        {provider.coverImage ? (
          <img src={provider.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "top center" }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-9xl opacity-10">{categoryEmoji()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20" />

        <Link
          href="/discover"
          className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>

        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-black/60 transition-colors">
            <Share2 className="w-5 h-5 text-white" />
          </button>
          <button onClick={toggleSave} className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-black/60 transition-colors">
            {isSaved
              ? <BookmarkCheck className="w-5 h-5 text-kazi-orange" fill="#FF6B2B" />
              : <Bookmark className="w-5 h-5 text-white" />
            }
          </button>
        </div>

        {provider.badge && (
          <div className="absolute bottom-4 left-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${badgeBg} rounded-full shadow-lg`}>
              <BadgeIcon className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-black text-white">{provider.badge}</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Info card */}
        <div className="bg-white rounded-2xl card-shadow p-5 -mt-10 relative z-10 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg flex-shrink-0 -mt-6 bg-orange-100 flex items-center justify-center text-3xl overflow-hidden">
              {provider.profileImage || provider.user?.profilePhoto ? (
                <img
                  src={provider.profileImage || provider.user?.profilePhoto}
                  alt={provider.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                categoryEmoji()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-kazi-dark text-xl leading-tight">
                  {provider.businessName}
                </h1>
                {provider.isVerified && (
                  <CheckCircle className="w-5 h-5 text-kazi-orange" fill="#FF6B2B" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-kazi-orange">
                  {provider.category}
                </span>
                {trustScore && (
                  <TrustBadge level={trustScore.level} score={trustScore.score} showScore size="sm" />
                )}
              </div>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-kazi-amber" fill="#F59E0B" />
                  <span className="text-sm font-black text-kazi-amber">{provider.rating || 0}</span>
                  <span className="text-xs text-gray-400">({provider.totalReviews || 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-kazi-orange" />
                  <span className="text-xs text-gray-600">
                    {provider.user?.location || "Nairobi"}
                  </span>
                </div>
              </div>
              <ResponseTimeBadge minutes={provider.avgResponseMinutes} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="font-black text-kazi-dark">{services.length}</p>
              <p className="text-xs text-gray-500">Services</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="font-black text-kazi-dark">{provider.totalReviews || 0}</p>
              <p className="text-xs text-gray-500">Reviews</p>
            </div>
            <div className="text-center">
              <p className="font-black text-kazi-orange">{provider.isVerified ? "✓" : "⏳"}</p>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
          </div>

          {/* Availability badge + report button */}
          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
            <div>
              {isBusy ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-red-600">Currently Busy</span>
                  {waitlistCount > 0 && (
                    <span className="text-xs text-red-400">· {waitlistCount} waiting</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs font-bold text-green-600">Available Now</span>
                </div>
              )}
            </div>
            {currentUser && currentUser.role === "CUSTOMER" && (
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
            )}
          </div>

          {/* Deal banner (from deals page) */}
          {hasDeal && (
            <div className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="font-black text-sm">
                      {discountType === "PERCENTAGE" ? `${discount}% OFF Applied!` : `KSh ${discount} OFF Applied!`}
                    </p>
                    {dealTitle && <p className="text-white/80 text-xs">{dealTitle}</p>}
                  </div>
                </div>
                {dealPrice !== undefined && originalPrice !== undefined && (
                  <div className="text-right">
                    <p className="text-white/70 text-xs line-through">KSh {originalPrice.toLocaleString()}</p>
                    <p className="font-black text-lg leading-none">KSh {dealPrice.toLocaleString()}</p>
                  </div>
                )}
              </div>
              {dealPrice !== undefined && originalPrice !== undefined && (
                <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-xs font-bold">💰 You save KSh {(originalPrice - dealPrice).toLocaleString()} on this booking!</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {(!currentUser || currentUser.role === "CUSTOMER") && (
              <button
                onClick={() => { setSelectedService(undefined); setShowBooking(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all active:scale-95 text-sm"
              >
                <Calendar className="w-4 h-4" />
                {hasDeal && dealPrice !== undefined
                  ? `🔥 Book Deal — KSh ${dealPrice.toLocaleString()}`
                  : "Book Now"
                }
              </button>
            )}
            {currentUser && provider.user?.id && (
              <Link
                href={`/chat/${provider.user.id}`}
                className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-2xl hover:bg-orange-100 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-kazi-orange" />
              </Link>
            )}
            <a
              href={`tel:${provider.user?.phone}`}
              className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </a>
            <a
              href={`https://wa.me/${(provider.user?.phone || "").replace(/[\s+]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-12 h-12 bg-kazi-green/10 rounded-2xl hover:bg-kazi-green/20 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-kazi-green" />
            </a>
          </div>
        </div>

        {/* Active Promotion Banner */}
        {(provider.promotions || []).filter((p: any) => new Date(p.endDate) > new Date()).slice(0, 1).map((promo: any) => (
          <Link key={promo.id} href="/deals" className="flex items-center gap-3 p-4 rounded-2xl mb-4 hover:opacity-90 active:scale-[0.99] transition-all" style={{ background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" }}>
            <span className="text-2xl">🔥</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm">{promo.title}</p>
              {promo.description && <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{promo.description}</p>}
              <p className="text-white/60 text-[10px] mt-0.5">Tap to see all deals</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white font-black text-lg leading-none">
                {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}%` : `KSh ${promo.discountValue}`}
              </p>
              <p className="text-white/70 text-[10px]">OFF · ends {new Date(promo.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
            </div>
          </Link>
        ))}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 mb-4 card-shadow overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                activeTab === tab
                  ? "bg-kazi-orange text-white shadow-md"
                  : "text-gray-500 hover:text-kazi-orange"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="pb-24 space-y-4">

          {/* ── Overview Tab ── */}
          {activeTab === "Overview" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 card-shadow">
                <h3 className="font-bold text-kazi-dark mb-3">About</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {provider.description || "No description available."}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="px-2.5 py-1 bg-orange-50 text-kazi-orange text-xs font-semibold rounded-full">
                    {provider.category}
                  </span>
                  {provider.isVerified && (
                    <span className="px-2.5 py-1 bg-green-50 text-kazi-green text-xs font-semibold rounded-full">
                      ✓ Verified by KaziShow
                    </span>
                  )}
                </div>
              </div>

              {provider.portfolioPhotos?.length > 0 && (
                <div className="bg-white rounded-2xl p-5 card-shadow">
                  <h3 className="font-bold text-kazi-dark mb-3">
                    {provider.category === "FUNDI" ? "Work Portfolio" : "Business Photos"}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {provider.portfolioPhotos.map((url: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setLightboxIndex(i)}
                        className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group"
                      >
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">View</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-kazi-dark">Location</h3>
                  <Link href="/map" className="flex items-center gap-1 text-xs text-kazi-orange font-semibold">
                    Open map <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div
                  className="h-36 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "#e8f0e8",
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                    backgroundSize: "25px 25px",
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center shadow-lg">
                      <MapPin className="w-5 h-5 text-white" fill="white" />
                    </div>
                    <div className="mt-1 px-2 py-0.5 bg-white rounded-lg shadow text-xs font-semibold text-kazi-dark">
                      {provider.user?.location || "Nairobi"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 card-shadow">
                <h3 className="font-bold text-kazi-dark mb-4">Verification Status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Profile Verified", done: provider.isVerified, icon: ShieldCheck },
                    { label: "Phone Verified", done: true, icon: Phone },
                    { label: "Location Set", done: !!provider.user?.location, icon: MapPin },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.done ? "bg-green-50" : "bg-gray-50"}`}>
                          <item.icon className={`w-4 h-4 ${item.done ? "text-kazi-green" : "text-gray-300"}`} />
                        </div>
                        <span className={`text-sm font-medium ${item.done ? "text-kazi-dark" : "text-gray-400"}`}>
                          {item.label}
                        </span>
                      </div>
                      {item.done
                        ? <CheckCircle className="w-5 h-5 text-kazi-green" fill="#00C896" />
                        : <span className="text-xs text-gray-400 font-medium">Pending</span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 card-shadow">
                <h3 className="font-bold text-kazi-dark mb-2">See a problem?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Help keep the community safe by reporting suspicious profiles.
                </p>
                <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-500 font-semibold text-sm rounded-2xl hover:bg-red-50 transition-all">
                  <Flag className="w-4 h-4" />
                  Report this Provider
                </button>
              </div>
            </div>
          )}

          {/* ── Services Tab ── */}
          {activeTab === "Services" && (
            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl card-shadow">
                  <p className="text-gray-400 text-sm">No services listed yet.</p>
                </div>
              ) : (
                services.map((service: any) => (
                  <div key={service.id} className="bg-white rounded-2xl p-4 card-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-kazi-dark">{service.name}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-kazi-orange font-black">
                            {formatCurrency(service.price)}
                          </span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {service.duration || "1 hr"}
                          </span>
                        </div>
                      </div>
                      {(!currentUser || currentUser.role === "CUSTOMER") && (
                        <button
                          onClick={() => { setSelectedService(service); setShowBooking(true); }}
                          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-kazi-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95"
                        >
                          <Calendar className="w-4 h-4" />
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Reviews Tab ── */}
          {activeTab === "Reviews" && (
            <div className="space-y-4">

              {/* Review prompt banner */}
              {showReviewPrompt && reviewableBookingId && (
                <div className="bg-amber-50 border-2 border-kazi-amber rounded-2xl p-4 animate-slide-up">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-kazi-amber" fill="#F59E0B" />
                      </div>
                      <div>
                        <p className="font-bold text-kazi-dark text-sm">
                          How was your experience with {provider.businessName}?
                        </p>
                        <p className="text-xs text-gray-500">
                          You have a completed booking — share your feedback
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setShowReviewModal(true); setShowReviewPrompt(false); }}
                        className="px-3 py-1.5 bg-kazi-orange text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all"
                      >
                        Rate Now
                      </button>
                      <button
                        onClick={() => setShowReviewPrompt(false)}
                        className="p-1 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating summary */}
              <div className="bg-white rounded-2xl p-5 card-shadow">
                <div className="flex items-center gap-6">
                  <div className="text-center flex-shrink-0">
                    <p className="text-5xl font-black text-kazi-dark">
                      {provider.rating || 0}
                    </p>
                    <div className="flex items-center gap-0.5 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 text-kazi-amber"
                          fill={s <= Math.floor(provider.rating || 0) ? "#F59E0B" : "none"}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {reviewsTotal || provider.totalReviews || 0} reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {(starBreakdown.length > 0
                      ? starBreakdown
                      : [5, 4, 3, 2, 1].map((s) => ({ star: s, count: 0, pct: 0 }))
                    ).map(({ star, pct }) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-2">{star}</span>
                        <Star className="w-3 h-3 text-kazi-amber" fill="#F59E0B" />
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-kazi-amber rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-6">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sort bar + Write review button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 bg-white rounded-xl p-1 card-shadow">
                  {[["recent", "Recent"], ["highest", "Top"], ["lowest", "Lowest"]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setReviewSort(val)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        reviewSort === val
                          ? "bg-kazi-orange text-white"
                          : "text-gray-500 hover:text-kazi-orange"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {currentUser?.role === "CUSTOMER" ? (
                  <button
                    onClick={handleWriteReview}
                    className="flex items-center gap-1.5 px-4 py-2 bg-kazi-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95"
                  >
                    <Star className="w-4 h-4" fill="white" />
                    Write Review
                  </button>
                ) : !currentUser ? (
                  <Link
                    href="/auth/login"
                    className="text-xs text-kazi-orange font-semibold px-3 py-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    Login to review
                  </Link>
                ) : null}
              </div>

              {/* Review list */}
              {reviewsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-kazi-orange border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl card-shadow">
                  <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold text-sm">No reviews yet.</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Be the first to review after booking!
                  </p>
                  {currentUser?.role === "CUSTOMER" && reviewableBookingId && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="mt-4 px-6 py-2.5 bg-kazi-orange text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-all"
                    >
                      Write a Review
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onHelpful={async (id) => {
                        const token = localStorage.getItem("kazishow_token");
                        await fetch(`${API_URL}/api/reviews/${id}/helpful`, {
                          method: "PUT",
                          headers: { Authorization: `Bearer ${token || ""}` },
                        });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReport && provider && (
        <ReportModal
          reportedId={provider.userId}
          reportedName={provider.businessName}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Review modal */}
      {showReviewModal && reviewableBookingId && (
        <ReviewModal
          providerName={provider.businessName}
          providerCategory={provider.category}
          bookingId={reviewableBookingId}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={() => {
            setShowReviewModal(false);
            setReviewableBookingId(null);
            fetchReviews(reviewSort);
          }}
        />
      )}

      {showBooking && (
        <BookingModal
          business={provider}
          service={selectedService}
          onClose={() => { setShowBooking(false); setSelectedService(undefined); }}
          dealId={dealId || undefined}
          dealPrice={dealPrice}
          dealTitle={dealTitle}
          discount={discount}
          discountType={discountType}
          originalPrice={originalPrice}
        />
      )}

      <BottomNav />

      {/* Photo lightbox */}
      {lightboxIndex !== null && provider?.portfolioPhotos && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Prev */}
          {provider.portfolioPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + provider.portfolioPhotos.length) % provider.portfolioPhotos.length); }}
              className="absolute left-3 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Image */}
          <img
            src={provider.portfolioPhotos[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            className="max-w-full max-h-full object-contain px-16"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {provider.portfolioPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % provider.portfolioPhotos.length); }}
              className="absolute right-3 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/10 rounded-full text-white text-xs font-semibold">
            {lightboxIndex + 1} / {provider.portfolioPhotos.length}
          </div>
        </div>
      )}
    </div>
  );
}
