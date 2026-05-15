"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, MapPin, Star, Trash2, Edit3, Camera, ChevronRight,
  MessageSquare, Calendar, CheckCircle, XCircle, Clock, Heart,
  FileText, CreditCard, Settings, ThumbsUp, ArrowRight,
  Lock, Bell, AlertTriangle, Loader2, LogOut, Navigation, Gift, Music,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { getBookingStatusMessage } from "@/lib/bookingStatus";
import TrustScoreCard from "@/components/trust/TrustScoreCard";
import ReviewModal from "@/components/trust/ReviewModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDI: "🔧", SHOP: "🏪", HOTEL: "🏨", RESTAURANT: "🍽️",
  TECH: "💻", PROFESSIONAL: "💼", BUSINESS: "🏢",
};

type Tab = "bookings" | "reviews" | "saved" | "tips" | "payments" | "settings";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-orange-100 text-orange-700",
    ACCEPTED: "bg-green-100 text-green-700",
    EN_ROUTE: "bg-blue-100 text-blue-700",
    ARRIVED: "bg-cyan-100 text-cyan-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-gray-100 text-gray-600",
    DECLINED: "bg-red-100 text-red-600",
    PREPARING: "bg-amber-100 text-amber-700",
    READY: "bg-teal-100 text-teal-700",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending", ACCEPTED: "Accepted", EN_ROUTE: "En Route",
    ARRIVED: "Arrived", IN_PROGRESS: "In Progress", COMPLETED: "Completed",
    CANCELLED: "Cancelled", DECLINED: "Declined", PREPARING: "Preparing", READY: "Ready",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />;
}

export default function CustomerProfile({ user: initialUser }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const loadedTabs = useRef(new Set<Tab>());

  // Per-tab data
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [tips, setTips] = useState<any[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({ monthTotal: 0, allTotal: 0 });

  // Settings form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [curPassword, setCurPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Notification preferences
  const [notifSms, setNotifSms] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);

  // Inline review modal
  const [reviewModal, setReviewModal] = useState<{ bookingId: string; providerName: string } | null>(null);

  // Ringtone
  const [ringtoneUrl, setRingtoneUrl] = useState("");
  const [savedRingtone, setSavedRingtone] = useState("");
  const [ringtoneFileName, setRingtoneFileName] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("kazishow_token") : null;

  const authFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const res = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options?.headers || {}) },
      });
      return res.json();
    },
    [token]
  );

  // Load profile on mount
  useEffect(() => {
    authFetch(`${API}/api/customers/profile`).then((d) => {
      if (d.success) {
        setProfile(d.data);
        setEditName(d.data.name || "");
        setEditEmail(d.data.email || "");
        setEditLocation(d.data.location || "");
      }
      setProfileLoading(false);
    });
    // Load saved ringtone from localStorage
    const saved = localStorage.getItem("kazishow_ringtone_url") || "";
    setRingtoneUrl(saved);
    setSavedRingtone(saved);
    setRingtoneFileName(localStorage.getItem("kazishow_ringtone_name") || "");

    // Load notification preferences
    const prefs = JSON.parse(localStorage.getItem("kazishow_notif_prefs") || "{}");
    if (prefs.sms !== undefined) setNotifSms(prefs.sms);
    if (prefs.reminder !== undefined) setNotifReminder(prefs.reminder);
  }, []);

  const loadTab = useCallback(
    async (tab: Tab) => {
      if (loadedTabs.current.has(tab)) return;
      loadedTabs.current.add(tab);

      if (tab === "bookings") {
        setBookingsLoading(true);
        const d = await authFetch(`${API}/api/bookings?limit=100`);
        if (d.success) setBookings(d.data.bookings);
        setBookingsLoading(false);
      } else if (tab === "reviews") {
        setReviewsLoading(true);
        const d = await authFetch(`${API}/api/customers/reviews/my`);
        if (d.success) setReviews(d.data.reviews);
        setReviewsLoading(false);
      } else if (tab === "saved") {
        setSavedLoading(true);
        const d = await authFetch(`${API}/api/customers/saved`);
        if (d.success) setSaved(d.data);
        setSavedLoading(false);
      } else if (tab === "tips") {
        setTipsLoading(true);
        const d = await authFetch(`${API}/api/tips/my`);
        if (d.success) setTips(d.data.tips || d.data);
        setTipsLoading(false);
      } else if (tab === "payments") {
        setPaymentsLoading(true);
        const d = await authFetch(`${API}/api/payments/my`);
        if (d.success) {
          setPayments(d.data.payments);
          setPaymentStats({ monthTotal: d.data.monthTotal, allTotal: d.data.allTotal });
        }
        setPaymentsLoading(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, loadTab]);

  // Load bookings on mount too
  useEffect(() => {
    loadTab("bookings");
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this booking?")) return;
    const d = await authFetch(`${API}/api/bookings/${bookingId}/cancel`, { method: "PUT" });
    if (d.success) {
      toast.success("Booking cancelled");
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b)));
    } else {
      toast.error(d.message || "Could not cancel");
    }
  };

  const handleRemoveSaved = async (providerId: string) => {
    if (!confirm("Remove this provider from saved?")) return;
    const d = await authFetch(`${API}/api/customers/saved/${providerId}`, { method: "DELETE" });
    if (d.success) {
      toast.success("Removed from saved");
      setSaved((prev) => prev.filter((p) => p.id !== providerId));
    } else {
      toast.error(d.message);
    }
  };

  const handleDeleteReview = async (reviewId: string, providerId: string) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    const d = await authFetch(`${API}/api/customers/reviews/${reviewId}`, { method: "DELETE" });
    if (d.success) {
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } else {
      toast.error(d.message);
    }
  };

  const handleDeleteTip = async (tipId: string) => {
    if (!confirm("Delete this tip?")) return;
    const d = await authFetch(`${API}/api/tips/${tipId}`, { method: "DELETE" });
    if (d.success) {
      toast.success("Tip deleted");
      setTips((prev) => prev.filter((t) => t.id !== tipId));
    } else {
      toast.error(d.message);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const d = await authFetch(`${API}/api/customers/profile`, {
      method: "PUT",
      body: JSON.stringify({ name: editName, email: editEmail, location: editLocation }),
    });
    if (d.success) {
      toast.success("Profile updated!");
      setProfile((prev: any) => ({ ...prev, ...d.data }));
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem("kazishow_user") || "{}");
      localStorage.setItem("kazishow_user", JSON.stringify({ ...stored, name: d.data.name }));
    } else {
      toast.error(d.message || "Update failed");
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (!curPassword) { toast.error("Please enter your current password"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPassword(true);
    try {
      const d = await authFetch(`${API}/api/auth/change-password`, {
        method: "PUT",
        body: JSON.stringify({ currentPassword: curPassword, newPassword }),
      });
      if (d.success) {
        toast.success("Password updated!");
        setCurPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        toast.error(d.message || "Failed to update password");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await fetch(`${API}/api/upload/image?folder=customers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        const d = await authFetch(`${API}/api/customers/profile`, {
          method: "PUT",
          body: JSON.stringify({ profilePhoto: data.data.url }),
        });
        if (d.success) {
          toast.success("Photo updated!");
          setProfile((prev: any) => ({ ...prev, profilePhoto: data.data.url }));
        }
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload error — check your connection");
    }
    setPhotoUploading(false);
  };

  const upcomingBookings = bookings.filter((b) =>
    ["PENDING", "ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "PREPARING", "READY"].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const cancelledBookings = bookings.filter((b) => ["CANCELLED", "DECLINED"].includes(b.status));

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "bookings", label: "Bookings", icon: <Calendar className="w-4 h-4" /> },
    { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
    { id: "saved", label: "Saved", icon: <Heart className="w-4 h-4" /> },
    { id: "tips", label: "Tips", icon: <FileText className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      {/* ── HEADER (centered card, no cover) ───────────────────────── */}
      <div className="bg-white shadow-sm mb-2 px-4 pt-8 pb-5">
        {/* Avatar — centered, large */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-28 h-28 rounded-full border-4 border-orange-100 bg-orange-50 overflow-hidden shadow-lg">
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-kazi-orange to-amber-400">
                  <span className="text-5xl font-black text-white">
                    {(profile?.name || initialUser?.name || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-0 w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-white hover:bg-orange-600 transition-colors">
              {photoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>

          {/* Name, location, member since — centered */}
          {profileLoading ? (
            <div className="space-y-2 flex flex-col items-center">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              <h1 className="text-xl font-black text-kazi-dark text-center">{profile?.name}</h1>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-3.5 h-3.5 text-kazi-orange" />
                <span>{profile?.location || "Location not set"}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Member since {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-KE", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </>
          )}

          {/* Edit profile button */}
          <button
            onClick={() => setActiveTab("settings")}
            className="mt-4 flex items-center gap-1.5 px-5 py-2 border-2 border-gray-200 rounded-full text-sm font-semibold text-kazi-dark hover:border-kazi-orange hover:text-kazi-orange transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {/* Stats strip — dividers like LinkedIn connection count */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 mt-5 pt-4 border-t border-gray-100">
          {profileLoading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 mx-2" />)
            : [
                { label: "Bookings", value: profile?._count?.bookingsAsCustomer ?? 0, color: "text-kazi-orange" },
                { label: "Reviews", value: profile?.reviewCount ?? 0, color: "text-amber-500" },
                { label: "Saved", value: profile?.savedCount ?? 0, color: "text-rose-500" },
                { label: "Tips", value: profile?.tipCount ?? 0, color: "text-kazi-green" },
              ].map((s) => (
                <div key={s.label} className="text-center px-1">
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                </div>
              ))}
        </div>
      </div>

      {/* Refer & Earn Banner */}
      <div className="px-4 pb-4">
        <button
          onClick={() => router.push("/profile/referrals")}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #FF6B2B 0%, #F59E0B 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-sm">🎁 Refer &amp; Earn</p>
              <p className="text-xs text-white/80">Earn KSh 200 for every friend you refer!</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-white font-black text-lg leading-none">200</span>
            <span className="text-white/80 text-[10px] font-bold">KSh →</span>
          </div>
        </button>
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────── */}
      <div className="flex gap-1 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              activeTab === t.id
                ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                : "bg-white text-gray-500 hover:bg-orange-50 hover:text-kazi-orange"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────── */}
      <div className="px-4 pt-2 space-y-3">

        {/* ── BOOKINGS ── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {bookingsLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                {/* Upcoming */}
                <h3 className="font-bold text-kazi-dark text-sm">Upcoming ({upcomingBookings.length})</h3>
                {upcomingBookings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No upcoming bookings</p>
                    <Link href="/discover" className="mt-2 inline-block text-xs font-bold text-kazi-orange">
                      Find a provider →
                    </Link>
                  </div>
                ) : (
                  upcomingBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{CATEGORY_EMOJI[b.provider?.category] || "🔧"}</span>
                          <div>
                            <p className="font-bold text-kazi-dark text-sm">{b.provider?.businessName}</p>
                            <p className="text-xs text-gray-500">{b.service?.name || "General Service"}</p>
                          </div>
                        </div>
                        <StatusChip status={b.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(b.scheduledDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {b.scheduledTime}
                        </span>
                        <span className="font-bold text-kazi-orange">{formatCurrency(b.totalAmount)}</span>
                      </div>
                      {(() => {
                        const sm = getBookingStatusMessage(
                          b.status, b.scheduledDate, b.scheduledTime,
                          b.provider?.businessName, b.provider?.category
                        );
                        const cls: Record<string, string> = {
                          amber:  "bg-amber-50 text-amber-700 border-amber-200",
                          green:  "bg-green-50 text-green-700 border-green-200",
                          blue:   "bg-blue-50 text-blue-700 border-blue-200",
                          orange: "bg-orange-50 text-orange-700 border-orange-200",
                          red:    "bg-red-50 text-red-600 border-red-200",
                          gray:   "bg-gray-50 text-gray-500 border-gray-200",
                        };
                        return (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium ${cls[sm.color] ?? cls.gray}`}>
                            <span>{sm.emoji}</span>
                            <span>{sm.message}</span>
                          </div>
                        );
                      })()}
                      <div className="flex gap-2">
                        {["PENDING", "ACCEPTED"].includes(b.status) && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {["EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status) && (
                          <Link
                            href={`/tracking/${b.id}`}
                            className="flex-1 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold text-center hover:bg-cyan-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <Navigation className="w-3 h-3" /> Track Provider
                          </Link>
                        )}
                        {b.provider?.user?.id && (
                          <Link
                            href={`/chat/${b.provider.user.id}`}
                            className="flex-1 py-2 rounded-xl bg-kazi-orange text-white text-xs font-bold text-center hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" /> Chat
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Completed */}
                <h3 className="font-bold text-kazi-dark text-sm pt-2">Completed ({completedBookings.length})</h3>
                {completedBookings.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No completed bookings yet</p>
                ) : (
                  completedBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-kazi-dark text-sm">{b.provider?.businessName}</p>
                          <p className="text-xs text-gray-500">{b.service?.name || "General Service"}</p>
                        </div>
                        <span className="font-bold text-kazi-orange text-sm">{formatCurrency(b.totalAmount)}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(b.updatedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {b.review ? (
                        <Stars rating={b.review.rating} />
                      ) : (
                        <button
                          onClick={() => setReviewModal({ bookingId: b.id, providerName: b.provider?.businessName || "Provider" })}
                          className="inline-flex items-center gap-1 text-xs text-kazi-orange font-bold"
                        >
                          <Star className="w-3 h-3" /> Write Review
                        </button>
                      )}
                      <div className="flex gap-2">
                        <Link
                          href={`/business/${b.provider?.id}`}
                          className="flex-1 py-2 rounded-xl bg-orange-50 text-kazi-orange text-xs font-bold text-center hover:bg-orange-100 transition-colors"
                        >
                          Rebook
                        </Link>
                      </div>
                    </div>
                  ))
                )}

                {/* Cancelled */}
                {cancelledBookings.length > 0 && (
                  <>
                    <h3 className="font-bold text-kazi-dark text-sm pt-2">Cancelled ({cancelledBookings.length})</h3>
                    {cancelledBookings.map((b) => (
                      <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-1 opacity-70">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-kazi-dark text-sm">{b.provider?.businessName}</p>
                            <p className="text-xs text-gray-500">{b.service?.name || "Service"}</p>
                          </div>
                          <StatusChip status={b.status} />
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(b.updatedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === "reviews" && (
          <div className="space-y-3">
            {reviewsLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
            ) : reviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">You haven&apos;t reviewed any providers yet</p>
                <p className="text-xs text-gray-300 mt-1">Complete a booking and share your experience</p>
              </div>
            ) : (
              reviews.map((r) => {
                const editable = Date.now() - new Date(r.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
                return (
                  <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{CATEGORY_EMOJI[r.provider?.category] || "🔧"}</span>
                          <p className="font-bold text-kazi-dark text-sm">{r.provider?.businessName}</p>
                        </div>
                        <p className="text-xs text-gray-500">{r.booking?.service?.name || "Service"}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {editable && (
                          <Link
                            href={`/profile/reviews?edit=${r.id}`}
                            className="p-1.5 text-gray-400 hover:text-kazi-orange rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteReview(r.id, r.provider?.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <Stars rating={r.rating} />
                    <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── SAVED PROVIDERS ── */}
        {activeTab === "saved" && (
          <div className="space-y-3">
            {savedLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)
            ) : saved.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Heart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No saved providers yet</p>
                <p className="text-xs text-gray-300 mt-1">Bookmark providers you like to find them easily</p>
                <Link href="/discover" className="mt-3 inline-block px-4 py-2 bg-kazi-orange text-white text-xs font-bold rounded-xl">
                  Explore Providers
                </Link>
              </div>
            ) : (
              saved.map((p: any) => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">
                    {CATEGORY_EMOJI[p.category] || "🔧"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-kazi-dark text-sm truncate">{p.businessName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Stars rating={Math.round(p.rating || 0)} />
                      <span className="text-xs text-gray-400">{p.user?.location || "—"}</span>
                    </div>
                    {p.user?.isOnline && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-kazi-green font-bold mt-0.5">
                        <span className="w-1.5 h-1.5 bg-kazi-green rounded-full" /> Online
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Link href={`/business/${p.id}`} className="px-3 py-1.5 bg-kazi-orange text-white text-xs font-bold rounded-xl">
                      Book
                    </Link>
                    <button
                      onClick={() => handleRemoveSaved(p.id)}
                      className="px-3 py-1.5 border border-red-200 text-red-400 text-xs font-bold rounded-xl hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}


        {/* ── TIPS ── */}
        {activeTab === "tips" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-kazi-dark text-sm">My Tips & Guides</h3>
              <Link href="/tips/write" className="px-3 py-1.5 bg-kazi-orange text-white text-xs font-bold rounded-xl">
                + Write Guide
              </Link>
            </div>
            {tipsLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)
            ) : tips.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No tips or guides written yet</p>
              </div>
            ) : (
              tips.map((t: any) => {
                const statusColor: Record<string, string> = {
                  DRAFT: "bg-gray-100 text-gray-600",
                  PENDING: "bg-amber-100 text-amber-700",
                  APPROVED: "bg-green-100 text-green-700",
                  REJECTED: "bg-red-100 text-red-700",
                };
                return (
                  <div key={t.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-kazi-dark text-sm truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[t.status] || "bg-gray-100 text-gray-600"}`}>{t.status}</span>
                          <span className="text-[10px] text-gray-400">{t.views || 0} views · {t.likes || 0} likes</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 ml-2">
                        {["DRAFT", "REJECTED"].includes(t.status) && (
                          <Link href={`/tips/${t.id}/edit`} className="p-1.5 text-gray-400 hover:text-kazi-orange rounded-lg">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button onClick={() => handleDeleteTip(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {t.status === "REJECTED" && t.rejectReason && (
                      <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2">Reason: {t.rejectReason}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === "payments" && (
          <div className="space-y-3">
            {/* Totals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">This Month</p>
                <p className="text-xl font-black text-kazi-orange">{formatCurrency(paymentStats.monthTotal)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">All Time</p>
                <p className="text-xl font-black text-kazi-dark">{formatCurrency(paymentStats.allTotal)}</p>
              </div>
            </div>
            {paymentsLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)
            ) : payments.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No payment history yet</p>
              </div>
            ) : (
              payments.map((p: any) => {
                const statusColor = p.status === "SUCCESS" ? "bg-green-100 text-green-700" : p.status === "FAILED" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600";
                return (
                  <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-kazi-dark text-sm">{p.booking?.provider?.businessName || "Provider"}</p>
                        <p className="text-xs text-gray-500">{p.booking?.service?.name || "Service"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-kazi-orange">{formatCurrency(p.amount)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>{p.status}</span>
                      </div>
                    </div>
                    {p.mpesaRef && <p className="text-[10px] text-gray-400 font-mono">Ref: {p.mpesaRef}</p>}
                    <p className="text-[10px] text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* Trust Score */}
            <TrustScoreCard />

            {/* Edit Profile */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-kazi-dark text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-kazi-orange" /> Edit Profile
              </h3>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Email Address</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Location</label>
                <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full py-3 bg-kazi-orange text-white font-bold text-sm rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-kazi-dark text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-kazi-orange" /> Change Password
              </h3>
              <input type="password" placeholder="Current password" value={curPassword} onChange={(e) => setCurPassword(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="w-full py-3 bg-kazi-dark text-white font-bold text-sm rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-1">
              <h3 className="font-bold text-kazi-dark text-sm flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-kazi-orange" /> Notification Preferences
              </h3>
              {[
                { label: "SMS notifications", desc: "Booking updates via SMS", value: notifSms, key: "sms", set: setNotifSms },
                { label: "Booking reminders", desc: "Reminder before scheduled bookings", value: notifReminder, key: "reminder", set: setNotifReminder },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-kazi-dark">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !item.value;
                      item.set(next);
                      const prefs = JSON.parse(localStorage.getItem("kazishow_notif_prefs") || "{}");
                      prefs[item.key] = next;
                      localStorage.setItem("kazishow_notif_prefs", JSON.stringify(prefs));
                      toast.success(`${item.label} ${next ? "enabled" : "disabled"}`);
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                      item.value ? "bg-kazi-green" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                        item.value ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Call Ringtone */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-kazi-dark text-sm flex items-center gap-2">
                <Music className="w-4 h-4 text-kazi-orange" /> Call Ringtone
              </h3>
              <p className="text-xs text-gray-400">Select an audio file from your device to use as your incoming call ringtone (max 3 MB)</p>

              {/* File picker */}
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-kazi-orange/40 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors">
                <Music className="w-5 h-5 text-kazi-orange flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {ringtoneFileName ? (
                    <p className="text-sm font-semibold text-kazi-dark truncate">{ringtoneFileName}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Tap to choose an audio file…</p>
                  )}
                  <p className="text-[11px] text-gray-300">.mp3, .ogg, .wav, .aac</p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 3 * 1024 * 1024) {
                      toast.error("File too large — please use a file under 3 MB");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      setRingtoneUrl(dataUrl);
                      setRingtoneFileName(file.name);
                      localStorage.setItem("kazishow_ringtone_url", dataUrl);
                      localStorage.setItem("kazishow_ringtone_name", file.name);
                      setSavedRingtone(dataUrl);
                      toast.success(`Ringtone set: ${file.name}`);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>

              {savedRingtone && (
                <p className="text-[11px] text-kazi-green font-semibold">✔ Custom ringtone active</p>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!savedRingtone}
                  onClick={() => {
                    const audio = new Audio(savedRingtone);
                    audio.play()
                      .then(() => setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 5000))
                      .catch(() => toast.error("Could not preview ringtone"));
                  }}
                  className="flex-1 py-2 border border-kazi-orange text-kazi-orange font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ▶ Preview
                </button>
                {savedRingtone && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("kazishow_ringtone_url");
                      localStorage.removeItem("kazishow_ringtone_name");
                      setRingtoneUrl("");
                      setSavedRingtone("");
                      setRingtoneFileName("");
                      toast.success("Ringtone reset to default");
                    }}
                    className="px-4 py-2 border border-gray-200 text-gray-400 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Refer & Earn */}
            <button
              onClick={() => router.push("/profile/referrals")}
              className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #FF6B2B 0%, #F59E0B 100%)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-black text-white text-sm">🎁 Refer &amp; Earn</p>
                  <p className="text-xs text-white/80">Invite friends, earn KSh 200 per referral</p>
                </div>
              </div>
              <span className="text-white font-black">→</span>
            </button>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-red-100">
              <h3 className="font-bold text-red-500 text-sm flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              <button
                onClick={async () => {
                  if (!confirm("Deactivate your account? You can contact support to reactivate it later.")) return;
                  try {
                    const d = await authFetch(`${API}/api/auth/deactivate`, { method: "PUT" });
                    if (d.success) {
                      toast.success("Account deactivated");
                      localStorage.removeItem("kazishow_token");
                      localStorage.removeItem("kazishow_user");
                      setTimeout(() => { window.location.href = "/auth/login"; }, 1500);
                    } else {
                      toast.error(d.message || "Failed to deactivate");
                    }
                  } catch {
                    toast.error("Network error — please try again");
                  }
                }}
                className="w-full py-3 border-2 border-red-200 text-red-500 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        )}
      </div>

      {reviewModal && (
        <ReviewModal
          bookingId={reviewModal.bookingId}
          providerName={reviewModal.providerName}
          onClose={() => setReviewModal(null)}
          onSubmitted={() => {
            setReviewModal(null);
            // Refresh bookings so the star shows instead of "Write Review"
            loadedTabs.current.delete("bookings");
            loadTab("bookings");
          }}
        />
      )}
    </div>
  );
}
