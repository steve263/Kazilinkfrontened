"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import Link from "next/link";
import {
  Star, Trash2, Edit3, Camera, MessageSquare, Calendar, CheckCircle,
  XCircle, Clock, Loader2, Settings, CreditCard, Image,
  FileText, Plus, Bell, AlertTriangle, Lock, MapPin, Phone,
  Zap, ToggleLeft, ToggleRight, Tag, X, Music, CalendarDays, ChevronRight, Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import TrustScoreCard from "@/components/trust/TrustScoreCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Tab = "bookings" | "services" | "earnings" | "reviews" | "analytics" | "portfolio" | "posts" | "promotions" | "settings" | "subscription";

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDI: "🔧", SHOP: "🏪", HOTEL: "🏨", RESTAURANT: "🍽️",
  TECH: "💻", PROFESSIONAL: "💼", BUSINESS: "🏢",
};

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${cls} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
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
    DECLINED: "bg-red-100 text-red-600",
    PREPARING: "bg-amber-100 text-amber-700",
    READY: "bg-teal-100 text-teal-700",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending", ACCEPTED: "Accepted", EN_ROUTE: "En Route",
    ARRIVED: "Arrived", IN_PROGRESS: "In Progress", COMPLETED: "Completed",
    DECLINED: "Declined", PREPARING: "Preparing", READY: "Ready",
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

function CountdownRing({ seconds, max }: { seconds: number; max: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke="#FF6B2B" strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - seconds / max)}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-kazi-orange">{seconds}</span>
      </div>
    </div>
  );
}

export default function ProviderProfile({ user: initialUser }: { user: any }) {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [provider, setProvider] = useState<any>(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [togglingBusy, setTogglingBusy] = useState(false);
  const loadedTabs = useRef(new Set<Tab>());

  // Per-tab data
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [starBreakdown, setStarBreakdown] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [workPhotoUploading, setWorkPhotoUploading] = useState(false);

  // Service form
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcPriceType, setSvcPriceType] = useState("FIXED");
  const [svcDuration, setSvcDuration] = useState("");
  const [savingService, setSavingService] = useState(false);

  // Promotions
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoType, setPromoType] = useState("PERCENTAGE");
  const [promoValue, setPromoValue] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [promoImage, setPromoImage] = useState("");
  const [promoOriginalPrice, setPromoOriginalPrice] = useState("");
  const [promoImageUploading, setPromoImageUploading] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  // Image crop modal
  const [cropSrc, setCropSrc] = useState("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppingBusy, setCroppingBusy] = useState(false);

  // Countdown timers for pending bookings
  const [pendingTimers, setPendingTimers] = useState<Record<string, number>>({});
  const timerIntervals = useRef<Record<string, any>>({});

  // Settings state
  const [editBizName, setEditBizName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editHoursStart, setEditHoursStart] = useState("");
  const [editHoursEnd, setEditHoursEnd] = useState("");
  const [editRadius, setEditRadius] = useState("");
  const [editMinJob, setEditMinJob] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [curPassword, setCurPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Notification preferences (persisted in localStorage)
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifReview, setNotifReview] = useState(true);

  // Commission
  const [pendingCommissionTotal, setPendingCommissionTotal] = useState(0);

  // Ringtone
  const [ringtoneUrl, setRingtoneUrl] = useState("");
  const [savedRingtone, setSavedRingtone] = useState("");
  const [ringtoneFileName, setRingtoneFileName] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("kazishow_token") : null;
  const providerId = initialUser?.provider?.id;
  const isFundi = initialUser?.provider?.category === "FUNDI";
  const pendingMax = isFundi ? 30 : 20;

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

  // Load provider + earnings on mount
  useEffect(() => {
    if (!providerId) return;
    Promise.all([
      authFetch(`${API}/api/providers/${providerId}`),
      authFetch(`${API}/api/providers/${providerId}/earnings`),
    ]).then(([pd, ed]) => {
      if (pd.success) {
        setProvider(pd.data);
        setIsOnline(pd.data.user?.isOnline || false);
        setIsBusy(pd.data.isBusy || false);
        setPortfolioPhotos(pd.data.portfolioPhotos || []);
        try { setWorkPhotos(JSON.parse(pd.data.providerWorkPhotos || "[]")); } catch { setWorkPhotos([]); }
        setEditBizName(pd.data.businessName || "");
        setEditDesc(pd.data.description || "");
        setEditHoursStart(pd.data.workingHoursStart || "");
        setEditHoursEnd(pd.data.workingHoursEnd || "");
        setEditRadius(String(pd.data.radiusKm || ""));
        setEditMinJob(String(pd.data.minJobValue || ""));
        setEditSkills((pd.data.skills || []).join(", "));
        setEditLocation(pd.data.user?.location || "");
        setEditExperience(pd.data.yearsExperience || "");
        setEditEducation(pd.data.education || "");
      }
      if (ed.success) setEarnings(ed.data);
      setProviderLoading(false);
      setEarningsLoading(false);
    });
    // Load saved ringtone
    const saved = localStorage.getItem("kazishow_ringtone_url") || "";
    setRingtoneUrl(saved);
    setSavedRingtone(saved);
    setRingtoneFileName(localStorage.getItem("kazishow_ringtone_name") || "");

    // Load notification preferences
    const prefs = JSON.parse(localStorage.getItem("kazishow_notif_prefs") || "{}");
    if (prefs.booking !== undefined) setNotifBooking(prefs.booking);
    if (prefs.payment !== undefined) setNotifPayment(prefs.payment);
    if (prefs.review !== undefined) setNotifReview(prefs.review);
  }, [providerId, authFetch]);

  useEffect(() => {
    if (!isFundi || !token) return;
    const loadCommissions = () => {
      fetch(`${API}/api/bookings/commission/outstanding`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.text())
        .then((text) => {
          try {
            const data = JSON.parse(text);
            if (data.success && Array.isArray(data.data)) {
              const total = data.data.reduce((sum: number, c: any) => sum + (c.commissionAmount || c.amount || 0), 0);
              setPendingCommissionTotal(total);
            }
          } catch {}
        })
        .catch(() => {});
    };
    loadCommissions();
    // Re-fetch every 60s and immediately after a job is marked COMPLETED
    const interval = setInterval(loadCommissions, 60_000);
    window.addEventListener("commission:refresh", loadCommissions);
    return () => {
      clearInterval(interval);
      window.removeEventListener("commission:refresh", loadCommissions);
    };
  }, [isFundi, token]);

  const loadTab = useCallback(
    async (tab: Tab) => {
      if (loadedTabs.current.has(tab)) return;
      loadedTabs.current.add(tab);

      if (tab === "bookings") {
        setBookingsLoading(true);
        const d = await authFetch(`${API}/api/bookings?limit=100`);
        if (d.success) setBookings(d.data.bookings);
        setBookingsLoading(false);
      } else if (tab === "services") {
        setServicesLoading(true);
        const d = await authFetch(`${API}/api/providers/${providerId}/services`);
        if (d.success) setServices(d.data);
        setServicesLoading(false);
      } else if (tab === "reviews") {
        setReviewsLoading(true);
        const d = await authFetch(`${API}/api/customers/reviews/provider/${providerId}`);
        if (d.success) {
          setReviews(d.data.reviews);
          setStarBreakdown(d.data.starBreakdown || []);
        }
        setReviewsLoading(false);
      } else if (tab === "posts") {
        setPostsLoading(true);
        const d = await authFetch(`${API}/api/posts/my`);
        if (d.success) setPosts(d.data.posts);
        setPostsLoading(false);
      } else if (tab === "promotions") {
        setPromoLoading(true);
        const d = await authFetch(`${API}/api/promotions/my`);
        if (d.success) setPromotions(d.data);
        setPromoLoading(false);
      }
    },
    [authFetch, providerId]
  );

  useEffect(() => { loadTab("bookings"); }, [loadTab]);
  useEffect(() => { loadTab(activeTab); }, [activeTab, loadTab]);

  // Start countdown timers for pending bookings
  useEffect(() => {
    const pendingList = bookings.filter((b) => b.status === "PENDING");
    pendingList.forEach((b) => {
      if (timerIntervals.current[b.id]) return;
      const elapsed = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 1000);
      const remaining = Math.max(pendingMax - elapsed, 0);
      setPendingTimers((prev) => ({ ...prev, [b.id]: remaining }));
      if (remaining > 0) {
        timerIntervals.current[b.id] = setInterval(() => {
          setPendingTimers((prev) => {
            const next = (prev[b.id] ?? 0) - 1;
            if (next <= 0) {
              clearInterval(timerIntervals.current[b.id]);
              delete timerIntervals.current[b.id];
            }
            return { ...prev, [b.id]: Math.max(next, 0) };
          });
        }, 1000);
      }
    });
    return () => {
      Object.values(timerIntervals.current).forEach(clearInterval);
    };
  }, [bookings]);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    const d = await authFetch(`${API}/api/providers/${providerId}/online`, {
      method: "PUT",
      body: JSON.stringify({ isOnline: !isOnline }),
    });
    if (d.success) {
      setIsOnline(d.data.isOnline);
      toast.success(d.data.isOnline ? "You are now Online!" : "You are now Offline");
    } else {
      toast.error("Failed to update status");
    }
    setTogglingOnline(false);
  };

  const handleMarkAvailable = async () => {
    if (!confirm("Mark yourself as available? Customers on your waitlist will be notified.")) return;
    setTogglingBusy(true);
    const d = await authFetch(`${API}/api/providers/${providerId}/busy`, {
      method: "PUT",
      body: JSON.stringify({ isBusy: false }),
    });
    if (d.success) {
      setIsBusy(false);
      toast.success("You are now available! Waitlist customers notified.");
    } else {
      toast.error(d.message || "Failed to update status");
    }
    setTogglingBusy(false);
  };

  const handlePromoImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Image must be less than 15MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !cropSrc) return;
    setCroppingBusy(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = croppedAreaPixels.width;
          canvas.height = croppedAreaPixels.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
          canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/jpeg", 0.88);
        };
        image.onerror = reject;
        image.src = cropSrc;
      });
      setPromoImageUploading(true);
      const form = new FormData();
      form.append("image", blob, "deal.jpg");
      const res = await fetch(`${API}/api/upload/public?folder=general`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) { setPromoImage(data.data.url); toast.success("Image ready!"); }
      else toast.error(data.message || "Upload failed");
    } catch { toast.error("Crop failed — try again"); }
    finally {
      setCroppingBusy(false);
      setPromoImageUploading(false);
      setShowCropModal(false);
      setCropSrc("");
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    const d = await authFetch(`${API}/api/bookings/${bookingId}/accept`, { method: "PUT" });
    if (d.success) {
      toast.success("Booking accepted!");
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "ACCEPTED" } : b)));
    } else {
      toast.error(d.message || "Could not accept");
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    if (!confirm("Decline this booking?")) return;
    const d = await authFetch(`${API}/api/bookings/${bookingId}/decline`, { method: "PUT" });
    if (d.success) {
      toast.success("Booking declined");
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "DECLINED" } : b)));
    } else {
      toast.error(d.message);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    if (status === "COMPLETED" && !confirm("Mark this job as complete?")) return;
    const d = await authFetch(`${API}/api/bookings/${bookingId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (d.success) {
      toast.success(`Status updated to ${status}`);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: d.data.status } : b)));
    } else {
      toast.error(d.message);
    }
  };

  const handleSaveService = async () => {
    if (!svcName || !svcPrice) { toast.error("Name and price are required"); return; }
    setSavingService(true);
    let d: any;
    if (editingService) {
      d = await authFetch(`${API}/api/providers/services/${editingService.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: svcName, description: svcDesc, price: svcPrice, priceType: svcPriceType, duration: svcDuration }),
      });
      if (d.success) {
        toast.success("Service updated!");
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? d.data : s)));
      }
    } else {
      d = await authFetch(`${API}/api/providers/${providerId}/services`, {
        method: "POST",
        body: JSON.stringify({ name: svcName, description: svcDesc, price: svcPrice, priceType: svcPriceType, duration: svcDuration }),
      });
      if (d.success) {
        toast.success("Service added!");
        setServices((prev) => [...prev, d.data]);
      }
    }
    if (!d.success) toast.error(d.message);
    setSavingService(false);
    setShowAddService(false);
    setEditingService(null);
    setSvcName(""); setSvcDesc(""); setSvcPrice(""); setSvcDuration("");
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Delete this service?")) return;
    const d = await authFetch(`${API}/api/providers/services/${serviceId}`, { method: "DELETE" });
    if (d.success) {
      toast.success("Service deleted");
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } else {
      toast.error(d.message);
    }
  };

  const handleToggleServiceActive = async (service: any) => {
    const d = await authFetch(`${API}/api/providers/services/${service.id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    if (d.success) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s)));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    const d = await authFetch(`${API}/api/posts/${postId}`, { method: "DELETE" });
    if (d.success) {
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } else {
      toast.error(d.message);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const d = await authFetch(`${API}/api/providers/${providerId}`, {
      method: "PUT",
      body: JSON.stringify({
        businessName: editBizName,
        description: editDesc,
        workingHoursStart: editHoursStart,
        workingHoursEnd: editHoursEnd,
        radiusKm: editRadius,
        minJobValue: editMinJob,
        skills: editSkills.split(",").map((s) => s.trim()).filter(Boolean),
        location: editLocation,
        yearsExperience: editExperience,
        education: editEducation,
      }),
    });
    if (d.success) {
      toast.success("Settings saved!");
      setProvider((prev: any) => ({
        ...prev, ...d.data,
        user: { ...prev?.user, location: editLocation },
      }));
    } else {
      toast.error(d.message);
    }
    setSavingSettings(false);
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

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await fetch(`${API}/api/upload/image?folder=covers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        const d = await authFetch(`${API}/api/providers/${providerId}`, {
          method: "PUT",
          body: JSON.stringify({ coverImage: data.data.url }),
        });
        if (d.success) {
          toast.success("Cover photo updated!");
          setProvider((prev: any) => ({ ...prev, coverImage: data.data.url }));
        }
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload error — check your connection");
    }
    setCoverUploading(false);
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await fetch(`${API}/api/upload/image?folder=portfolio`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        const d = await authFetch(`${API}/api/providers/${providerId}`, {
          method: "PUT",
          body: JSON.stringify({ profileImage: data.data.url }),
        });
        if (d.success) {
          toast.success("Photo updated!");
          setProvider((prev: any) => ({ ...prev, profileImage: data.data.url }));
        }
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload error — check your connection");
    }
    setPhotoUploading(false);
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const activeBookings = bookings.filter((b) => ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "PREPARING", "READY"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

  const TABS: { id: Tab; label: string }[] = [
    { id: "bookings", label: "Bookings" },
    { id: "services", label: "Services" },
    { id: "earnings", label: "Earnings" },
    { id: "reviews", label: "Reviews" },
    { id: "analytics", label: "Analytics" },
    { id: "portfolio", label: "Portfolio" },
    { id: "posts", label: "Posts" },
    { id: "promotions", label: "Deals" },
    { id: "settings", label: "Settings" },
    ...(!isFundi ? [{ id: "subscription" as Tab, label: "💳 Plan" }] : []),
  ];

  const STATUS_BUTTONS = isFundi
    ? [
        { status: "EN_ROUTE", label: "En Route", color: "bg-blue-500" },
        { status: "ARRIVED", label: "Arrived", color: "bg-cyan-500" },
        { status: "IN_PROGRESS", label: "In Progress", color: "bg-purple-500" },
        { status: "COMPLETED", label: "Complete", color: "bg-kazi-green" },
      ]
    : [
        { status: "PREPARING", label: "Preparing", color: "bg-amber-500" },
        { status: "READY", label: "Ready", color: "bg-teal-500" },
        { status: "COMPLETED", label: "Complete", color: "bg-kazi-green" },
      ];

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      {/* ── HEADER (LinkedIn style) ─────────────────────────────────── */}
      <div className="bg-white shadow-sm mb-2">
        {/* Cover photo — shorter so avatar feels prominent like LinkedIn */}
        <div className="h-32 bg-gradient-to-br from-kazi-dark via-kazi-dark2 to-gray-800 relative overflow-hidden">
          {provider?.coverImage && (
            <img src={provider.coverImage} alt="cover" className="w-full h-full object-cover" />
          )}
          <label className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-black/70 transition-colors">
            {coverUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            Edit cover
            <input type="file" className="hidden" accept="image/*" onChange={handleCoverPhotoUpload} />
          </label>
        </div>

        <div className="px-4 pb-4">
          {/* Avatar + action buttons row — mirrors LinkedIn */}
          <div className="flex items-start justify-between -mt-16 mb-3">
            {/* Avatar — 128px like LinkedIn mobile */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-orange-50 overflow-hidden shadow-lg">
                {provider?.profileImage ? (
                  <img src={provider.profileImage} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {CATEGORY_EMOJI[provider?.category || initialUser?.provider?.category] || "🔧"}
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-0 w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-white">
                {photoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpload} />
              </label>
            </div>

            {/* Status buttons — top-right like LinkedIn's action buttons */}
            <div className="flex flex-wrap gap-2 mt-16">
              <button
                onClick={handleToggleOnline}
                disabled={togglingOnline}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  isOnline
                    ? "border-kazi-green text-kazi-green hover:bg-green-50"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {togglingOnline ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isOnline ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {isOnline ? "Online" : "Offline"}
              </button>
              {isBusy && (
                <button
                  onClick={handleMarkAvailable}
                  disabled={togglingBusy}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-amber-400 text-amber-600 hover:bg-amber-50 transition-all"
                >
                  {togglingBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🔴</span>}
                  Busy · Mark Free
                </button>
              )}
              <Link
                href="/provider/availability"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Availability
              </Link>
            </div>
          </div>

          {/* Name, headline, location — LinkedIn style */}
          {providerLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-kazi-dark">{provider?.businessName}</h1>
                {provider?.isVerified && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                    ✓ Verified
                  </span>
                )}
                <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-kazi-orange rounded-full">
                  {CATEGORY_EMOJI[provider?.category]} {provider?.category}
                </span>
              </div>

              {/* Headline / description — like LinkedIn's tagline */}
              {provider?.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">
                  {provider.description}
                </p>
              )}

              {/* Location, phone, hours — like LinkedIn's metadata row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {provider?.user?.location || "Location not set"}
                </span>
                {provider?.user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {provider.user.phone}
                  </span>
                )}
                {provider?.workingHoursStart && provider?.workingHoursEnd && (
                  <span>· Open {provider.workingHoursStart}–{provider.workingHoursEnd}</span>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1.5">
                <Stars rating={Math.round(provider?.rating || 0)} />
                <span className="text-xs text-gray-500">({provider?.totalReviews || 0} reviews)</span>
              </div>
            </div>
          )}

          {/* Stats strip — inside the white card like LinkedIn's connection count */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 mt-4 pt-3 border-t border-gray-100">
            {earningsLoading
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-10 mx-2" />)
              : [
                  { label: "This Month", value: formatCurrency(earnings?.month?.amount || 0), color: "text-kazi-orange" },
                  { label: "Total Jobs", value: earnings?.allTime?.jobs || 0, color: "text-kazi-dark" },
                  { label: "Rating", value: (provider?.rating || 0).toFixed(1) + " ★", color: "text-amber-500" },
                ].map((s) => (
                  <div key={s.label} className="text-center px-2">
                    <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ── WALLET / COMMISSION QUICK ACCESS ── */}
      <div className="px-4 pt-3">
        {isFundi ? (
          <Link
            href="/provider/commission"
            className={`flex items-center justify-between rounded-2xl px-4 py-3 active:scale-[0.98] transition-all ${
              pendingCommissionTotal > 0
                ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-md shadow-red-200"
                : "bg-gradient-to-r from-kazi-orange to-orange-500 shadow-md shadow-orange-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <p className="text-white font-black text-sm leading-tight">
                  {pendingCommissionTotal > 0 ? "⚠️ Commission Due!" : "My Commission"}
                </p>
                <p className="text-white/80 text-xs">
                  {pendingCommissionTotal > 0
                    ? `KSh ${pendingCommissionTotal.toLocaleString()} pending · Pay via Paybill 247247`
                    : "No pending commission · Keep up the great work!"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </Link>
        ) : (
          <Link
            href="/provider/earnings"
            className="flex items-center justify-between bg-gradient-to-r from-kazi-orange to-orange-500 rounded-2xl px-4 py-3 shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-tight">My Wallet & Withdraw</p>
                <p className="text-orange-100 text-xs">
                  Earned: {earningsLoading ? "..." : formatCurrency((earnings?.allTime?.amount ?? 0) * 0.9)} · Tap to withdraw
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </Link>
        )}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex gap-1 px-4 overflow-x-auto pb-2 pt-3" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              activeTab === t.id
                ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                : "bg-white text-gray-500 hover:bg-orange-50 hover:text-kazi-orange"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="px-4 pt-2 space-y-3">

        {/* ── BOOKINGS ── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {bookingsLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                {/* Pending */}
                <h3 className="font-bold text-kazi-dark text-sm">
                  Pending Requests ({pendingBookings.length})
                </h3>
                {pendingBookings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-5 text-center">
                    <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No pending requests</p>
                  </div>
                ) : (
                  pendingBookings.map((b) => {
                    const timeLeft = pendingTimers[b.id] ?? 0;
                    const expired = timeLeft <= 0;
                    return (
                      <div key={b.id} className={`bg-white rounded-2xl shadow-sm p-4 space-y-3 border-l-4 ${expired ? "border-gray-200 opacity-60" : "border-kazi-orange"}`}>
                        <div className="flex items-start gap-3">
                          {!expired && <CountdownRing seconds={timeLeft} max={pendingMax} />}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-kazi-dark text-sm">{b.customer?.name}</p>
                            <p className="text-xs text-gray-500">{b.service?.name || "General Service"}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{b.address}</p>
                          </div>
                          <span className="font-black text-kazi-orange text-sm">{formatCurrency(b.totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Phone className="w-3 h-3" />
                          {b.customer?.phone}
                          <span className="mx-1">·</span>
                          <Calendar className="w-3 h-3" />
                          {new Date(b.scheduledDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })} at {b.scheduledTime}
                        </div>
                        {!expired ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeclineBooking(b.id)}
                              className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Decline
                            </button>
                            <button
                              onClick={() => handleAcceptBooking(b.id)}
                              className="flex-[2] py-2.5 rounded-xl bg-kazi-green text-white text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Accept Booking
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center">Request expired</p>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Active */}
                <h3 className="font-bold text-kazi-dark text-sm pt-1">Active Jobs ({activeBookings.length})</h3>
                {activeBookings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-5 text-center">
                    <p className="text-sm text-gray-400">No active jobs</p>
                  </div>
                ) : (
                  activeBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border-l-4 border-kazi-green">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-kazi-dark text-sm">{b.customer?.name}</p>
                          <p className="text-xs text-gray-500">{b.service?.name || "Service"}</p>
                        </div>
                        <StatusChip status={b.status} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_BUTTONS.map((sb) => (
                          <button
                            key={sb.status}
                            onClick={() => handleUpdateStatus(b.id, sb.status)}
                            disabled={b.status === sb.status}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 ${sb.color}`}
                          >
                            {sb.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {b.customer?.id && (
                          <Link
                            href={`/chat/${b.customer.id}`}
                            className="flex-1 py-2 rounded-xl bg-orange-50 text-kazi-orange text-xs font-bold text-center flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" /> Chat Customer
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Completed */}
                <h3 className="font-bold text-kazi-dark text-sm pt-1">Completed ({completedBookings.length})</h3>
                {completedBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-kazi-dark text-sm">{b.customer?.name}</p>
                        <p className="text-xs text-gray-500">{b.service?.name || "Service"}</p>
                      </div>
                      <span className="font-bold text-kazi-orange text-sm">{formatCurrency(b.totalAmount)}</span>
                    </div>
                    {b.review && (
                      <div className="flex items-center gap-2">
                        <Stars rating={b.review.rating} />
                        {b.review.comment && <p className="text-xs text-gray-500 truncate">{b.review.comment}</p>}
                      </div>
                    )}
                    {b.mpesaRef && <p className="text-[10px] text-gray-400 font-mono">Ref: {b.mpesaRef}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── SERVICES ── */}
        {activeTab === "services" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-kazi-dark text-sm">My Services</h3>
              <button
                onClick={() => { setShowAddService(true); setEditingService(null); setSvcName(""); setSvcDesc(""); setSvcPrice(""); setSvcDuration(""); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-kazi-orange text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service
              </button>
            </div>

            {/* Add/Edit form */}
            {(showAddService || editingService) && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border-2 border-kazi-orange">
                <h4 className="font-bold text-kazi-dark text-sm">{editingService ? "Edit Service" : "New Service"}</h4>
                <input value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Service name *" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                <textarea value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                <div className="flex gap-2">
                  <input value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} placeholder="Price (KSh) *" type="number" className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                  <select value={svcPriceType} onChange={(e) => setSvcPriceType(e.target.value)} className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange">
                    <option value="FIXED">Fixed</option>
                    <option value="FROM">From</option>
                    <option value="NEGOTIABLE">Negotiable</option>
                  </select>
                </div>
                <input value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} placeholder="Duration (minutes, optional)" type="number" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                <div className="flex gap-2">
                  <button onClick={() => { setShowAddService(false); setEditingService(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500">Cancel</button>
                  <button onClick={handleSaveService} disabled={savingService} className="flex-[2] py-2.5 bg-kazi-orange text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                    {savingService ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {editingService ? "Save Changes" : "Add Service"}
                  </button>
                </div>
              </div>
            )}

            {servicesLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)
            ) : services.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Zap className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No services added yet</p>
              </div>
            ) : (
              services.map((s) => (
                <div key={s.id} className={`bg-white rounded-2xl shadow-sm p-4 space-y-1.5 ${!s.isActive ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-kazi-dark text-sm">{s.name}</p>
                      {s.description && <p className="text-xs text-gray-500 line-clamp-1">{s.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-kazi-orange">{formatCurrency(s.price)}</span>
                        <span className="text-xs text-gray-400">{s.priceType}</span>
                        {s.duration && <span className="text-xs text-gray-400">· {s.duration}min</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 ml-2">
                      <button
                        onClick={() => handleToggleServiceActive(s)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${s.isActive ? "bg-kazi-green/10 text-kazi-green" : "bg-gray-100 text-gray-400"}`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingService(s); setShowAddService(false);
                          setSvcName(s.name); setSvcDesc(s.description || "");
                          setSvcPrice(String(s.price)); setSvcPriceType(s.priceType);
                          setSvcDuration(String(s.duration || ""));
                        }}
                        className="p-1.5 text-gray-400 hover:text-kazi-orange rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteService(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── EARNINGS ── */}
        {activeTab === "earnings" && (
          <div className="space-y-3">
            {earningsLoading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)
            ) : (
              <>
                {isFundi && pendingCommissionTotal > 0 && (
                  <Link
                    href="/provider/commission"
                    className="flex items-center justify-between bg-red-50 border-2 border-red-300 rounded-2xl px-4 py-3 active:scale-[0.98] transition-all"
                  >
                    <div>
                      <p className="font-black text-red-700 text-sm">💰 Commission Due</p>
                      <p className="text-red-500 text-xs mt-0.5">
                        KSh {pendingCommissionTotal.toLocaleString()} · Pay via Paybill 247247
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400" />
                  </Link>
                )}
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-xs text-gray-500 mb-1">This Month</p>
                  <p className="text-4xl font-black text-kazi-orange">{formatCurrency(earnings?.month?.amount || 0)}</p>
                  <p className="text-sm text-gray-400 mt-1">{earnings?.month?.jobs || 0} jobs</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">This Week</p>
                    <p className="text-xl font-black text-kazi-dark">{formatCurrency(earnings?.week?.amount || 0)}</p>
                    <p className="text-xs text-gray-400">{earnings?.week?.jobs || 0} jobs</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Today</p>
                    <p className="text-xl font-black text-kazi-dark">{formatCurrency(earnings?.today?.amount || 0)}</p>
                    <p className="text-xs text-gray-400">{earnings?.today?.jobs || 0} jobs</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                  <h4 className="font-bold text-kazi-dark text-sm">All Time</h4>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Gross Earnings</span>
                    <span className="font-bold text-kazi-dark">{formatCurrency(earnings?.allTime?.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Commission (10%)</span>
                    <span className="font-bold text-red-500">-{formatCurrency((earnings?.allTime?.amount || 0) * 0.1)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-sm font-bold text-kazi-dark">Net Earnings</span>
                    <span className="font-black text-kazi-green">{formatCurrency((earnings?.allTime?.amount || 0) * 0.9)}</span>
                  </div>
                  <p className="text-xs text-gray-400">Total jobs: {earnings?.allTime?.jobs || 0}</p>
                </div>
                {isFundi ? (
                  <Link href="/provider/commission" className={`w-full py-3 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 ${pendingCommissionTotal > 0 ? "bg-red-500 text-white" : "bg-kazi-orange text-white"}`}>
                    💰 {pendingCommissionTotal > 0 ? `Pay KSh ${pendingCommissionTotal.toLocaleString()} Commission` : "View My Commission"}
                  </Link>
                ) : (
                  <Link href="/provider/earnings" className="w-full py-3 bg-kazi-green text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" /> Withdraw Earnings
                  </Link>
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
            ) : (
              <>
                {/* Overall rating */}
                <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-5xl font-black text-kazi-dark">{(provider?.rating || 0).toFixed(1)}</p>
                    <Stars rating={Math.round(provider?.rating || 0)} size="lg" />
                    <p className="text-xs text-gray-400 mt-1">{provider?.totalReviews || 0} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {starBreakdown.map((sb) => (
                      <div key={sb.star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">{sb.star}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${sb.pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-6">{sb.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No reviews yet</p>
                    <p className="text-xs text-gray-300 mt-1">Complete your first booking to receive reviews</p>
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-kazi-orange">{r.customer?.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-kazi-dark text-sm">{r.customer?.name}</p>
                            <span className="text-[10px] text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <Stars rating={r.rating} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {activeTab === "analytics" && (
          <div className="space-y-3">
            {(() => {
              const total = bookings.length;
              const accepted = bookings.filter((b) => b.status !== "PENDING" && b.status !== "DECLINED").length;
              const completed = completedBookings.length;
              const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
              const completeRate = accepted > 0 ? Math.round((completed / accepted) * 100) : 0;
              const serviceCounts: Record<string, number> = {};
              bookings.forEach((b) => {
                if (b.service?.name) serviceCounts[b.service.name] = (serviceCounts[b.service.name] || 0) + 1;
              });
              const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Acceptance Rate", value: `${acceptRate}%`, color: "text-kazi-green" },
                      { label: "Completion Rate", value: `${completeRate}%`, color: "text-blue-500" },
                      { label: "Total Requests", value: total, color: "text-kazi-orange" },
                      { label: "Completed Jobs", value: completed, color: "text-kazi-dark" },
                    ].map((m) => (
                      <div key={m.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
                        <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {topService && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <p className="text-xs text-gray-500 mb-1">Most Booked Service</p>
                      <p className="font-bold text-kazi-dark">{topService[0]}</p>
                      <p className="text-xs text-kazi-orange font-bold">{topService[1]} bookings</p>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <p className="text-sm font-bold text-kazi-dark mb-3">Booking Status Breakdown</p>
                    {["COMPLETED", "ACCEPTED", "PENDING", "DECLINED", "CANCELLED"].map((st) => {
                      const count = bookings.filter((b) => b.status === st).length;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={st} className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500 w-20">{st}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-kazi-orange rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-6">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── PORTFOLIO ── */}
        {activeTab === "portfolio" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-kazi-dark text-sm">Portfolio ({portfolioPhotos.length}/12)</h3>
              {portfolioPhotos.length < 12 && (
                <label className="flex items-center gap-1 px-3 py-1.5 bg-kazi-orange text-white text-xs font-bold rounded-xl cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add Photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      let uploaded = 0;
                      let current = [...portfolioPhotos];
                      for (const file of files.slice(0, 12 - portfolioPhotos.length)) {
                        const form = new FormData();
                        form.append("image", file);
                        try {
                          const res = await fetch(`${API}/api/upload/image`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: form,
                          });
                          const data = await res.json();
                          if (data.success && data.data?.url) {
                            current = [...current, data.data.url];
                            setPortfolioPhotos(current);
                            uploaded++;
                          } else {
                            toast.error(data.message || "Upload failed");
                          }
                        } catch {
                          toast.error("Upload error — check your connection");
                        }
                      }
                      if (uploaded > 0) {
                        await authFetch(`${API}/api/providers/${providerId}`, {
                          method: "PUT",
                          body: JSON.stringify({ portfolioPhotos: current }),
                        });
                        toast.success(`${uploaded} photo${uploaded > 1 ? "s" : ""} uploaded!`);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            {portfolioPhotos.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Image className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No portfolio photos yet</p>
                <p className="text-xs text-gray-300 mt-1">Add photos of your work to attract more customers</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {portfolioPhotos.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                    <button
                      onClick={async () => {
                        const newPhotos = portfolioPhotos.filter((_, idx) => idx !== i);
                        setPortfolioPhotos(newPhotos);
                        await authFetch(`${API}/api/providers/${providerId}`, {
                          method: "PUT",
                          body: JSON.stringify({ portfolioPhotos: newPhotos }),
                        });
                        toast.success("Photo removed");
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Before & After Work Photos ── */}
            <div className="mt-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-bold text-kazi-dark text-sm">Before & After Work ({workPhotos.length})</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Customers see these on your public profile</p>
                </div>
                <label className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-colors ${workPhotoUploading ? "bg-gray-200 text-gray-400" : "bg-kazi-green text-white hover:bg-green-600"}`}>
                  {workPhotoUploading ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Uploading...</>
                  ) : (
                    <><Camera className="w-3.5 h-3.5" /> Add Photos</>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    disabled={workPhotoUploading}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      setWorkPhotoUploading(true);
                      let current = [...workPhotos];
                      let uploaded = 0;
                      for (const file of files.slice(0, 20 - workPhotos.length)) {
                        const form = new FormData();
                        form.append("image", file);
                        try {
                          const res = await fetch(`${API}/api/upload/image`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: form,
                          });
                          const data = await res.json();
                          if (data.success && data.data?.url) {
                            current = [...current, data.data.url];
                            setWorkPhotos(current);
                            uploaded++;
                          }
                        } catch {}
                      }
                      if (uploaded > 0) {
                        await authFetch(`${API}/api/providers/${providerId}`, {
                          method: "PUT",
                          body: JSON.stringify({ providerWorkPhotos: current }),
                        });
                        toast.success(`${uploaded} work photo${uploaded > 1 ? "s" : ""} uploaded!`);
                      }
                      setWorkPhotoUploading(false);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {workPhotos.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-6 text-center border-2 border-dashed border-gray-200">
                  <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-400">No before & after photos yet</p>
                  <p className="text-xs text-gray-300 mt-1">Upload photos to show customers the quality of your work</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {workPhotos.map((url, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={url} alt={`Work ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                      <span className={`absolute bottom-1.5 left-1.5 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full ${i % 2 === 0 ? "bg-black/60" : "bg-kazi-orange/90"}`}>
                        {i % 2 === 0 ? "BEFORE" : "AFTER"}
                      </span>
                      <button
                        onClick={async () => {
                          const newPhotos = workPhotos.filter((_, idx) => idx !== i);
                          setWorkPhotos(newPhotos);
                          await authFetch(`${API}/api/providers/${providerId}`, {
                            method: "PUT",
                            body: JSON.stringify({ providerWorkPhotos: newPhotos }),
                          });
                          toast.success("Photo removed");
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2 text-center">
                💡 Upload in pairs — first photo = BEFORE, second = AFTER
              </p>
            </div>
          </div>
        )}

        {/* ── POSTS ── */}
        {activeTab === "posts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-kazi-dark text-sm">My Posts ({posts.length})</h3>
              <Link href="/feed?create=1" className="px-3 py-1.5 bg-kazi-orange text-white text-xs font-bold rounded-xl">
                + New Post
              </Link>
            </div>
            {postsLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No posts yet</p>
                <p className="text-xs text-gray-300 mt-1">Share your work to attract customers</p>
              </div>
            ) : (
              posts.map((p: any) => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                  {p.image && <img src={p.image} alt="post" className="w-full h-32 object-cover rounded-xl" />}
                  <p className="text-sm text-kazi-dark line-clamp-2">{p.caption}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>❤️ {p._count?.likes || 0}</span>
                      <span>💬 {p._count?.comments || 0}</span>
                      <span>{new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                    </div>
                    <button onClick={() => handleDeletePost(p.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── PROMOTIONS / DEALS ── */}
        {activeTab === "promotions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-kazi-dark text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-red-500" /> My Deals ({promotions.length})
              </h3>
              <button
                onClick={() => setShowPromoForm(true)}
                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-red-600"
              >
                <Plus className="w-3.5 h-3.5" /> New Deal
              </button>
            </div>

            {/* Create form */}
            {showPromoForm && (
              <div className="bg-white rounded-2xl shadow-sm p-4 border-2 border-red-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-kazi-dark text-sm">Create New Deal</h4>
                  <button onClick={() => setShowPromoForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>

                {/* Deal image */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Deal Image (optional)</label>
                  {promoImage ? (
                    <div className="relative rounded-xl overflow-hidden h-28">
                      <img src={promoImage} alt="Deal" className="w-full h-full object-cover" />
                      <button onClick={() => setPromoImage("")} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white">
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1.5 left-1.5 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✅ Uploaded</div>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${promoImageUploading ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-red-400 hover:bg-red-50"}`}>
                        {promoImageUploading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                            <span className="text-xs text-red-500 font-semibold">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-gray-400">
                            <Image className="w-4 h-4" />
                            <span className="text-xs font-medium">Click to upload image</span>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={handlePromoImageSelect} className="hidden" disabled={promoImageUploading} />
                    </label>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Deal Title *</label>
                  <input value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} placeholder="e.g. Weekend Special" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description (optional)</label>
                  <input value={promoDesc} onChange={(e) => setPromoDesc(e.target.value)} placeholder="e.g. Book any service this weekend and save" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Discount Type</label>
                    <select value={promoType} onChange={(e) => setPromoType(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400">
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed (KSh)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      {promoType === "PERCENTAGE" ? "Discount %" : "Amount (KSh)"} *
                    </label>
                    <input type="number" value={promoValue} onChange={(e) => setPromoValue(e.target.value)} placeholder={promoType === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Original Price (KSh) — optional</label>
                  <input type="number" value={promoOriginalPrice} onChange={(e) => setPromoOriginalPrice(e.target.value)} placeholder="e.g. 2500 (shows strikethrough)" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Expires On *</label>
                  <input type="datetime-local" value={promoEnd} onChange={(e) => setPromoEnd(e.target.value)} min={new Date().toISOString().slice(0, 16)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <button
                  onClick={async () => {
                    if (!promoTitle || !promoValue || !promoEnd) { toast.error("Fill all required fields"); return; }
                    setSavingPromo(true);
                    const token = localStorage.getItem("kazishow_token");
                    try {
                      const res = await fetch(`${API}/api/promotions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          title: promoTitle, description: promoDesc, discountType: promoType,
                          discountValue: parseFloat(promoValue), endDate: promoEnd,
                          imageUrl: promoImage || null,
                          originalPrice: promoOriginalPrice ? parseInt(promoOriginalPrice) : null,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Deal created!");
                        setPromotions((prev) => [data.data, ...prev]);
                        setShowPromoForm(false);
                        setPromoTitle(""); setPromoDesc(""); setPromoValue(""); setPromoEnd("");
                        setPromoImage(""); setPromoOriginalPrice("");
                      } else { toast.error(data.message || "Failed"); }
                    } catch { toast.error("Network error"); }
                    setSavingPromo(false);
                  }}
                  disabled={savingPromo || promoImageUploading}
                  className="w-full py-3 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  Publish Deal
                </button>
              </div>
            )}

            {promoLoading ? (
              [0, 1].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
            ) : promotions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Tag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No deals yet</p>
                <p className="text-xs text-gray-300 mt-1">Create a deal to attract more customers</p>
              </div>
            ) : (
              promotions.map((promo) => {
                const expired = new Date(promo.endDate) < new Date();
                return (
                  <div key={promo.id} className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${expired ? "border-gray-300 opacity-60" : "border-red-500"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-red-500">
                            {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `KSh ${promo.discountValue} OFF`}
                          </span>
                          {expired && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">EXPIRED</span>}
                          {!expired && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                        </div>
                        <p className="font-bold text-kazi-dark text-sm">{promo.title}</p>
                        {promo.description && <p className="text-xs text-gray-500 mt-0.5">{promo.description}</p>}
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(promo.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this deal?")) return;
                          const token = localStorage.getItem("kazishow_token");
                          const res = await fetch(`${API}/api/promotions/${promo.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                          const data = await res.json();
                          if (data.success) { toast.success("Deal deleted"); setPromotions((prev) => prev.filter((p) => p.id !== promo.id)); }
                          else toast.error(data.message || "Failed");
                        }}
                        className="ml-2 p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

            {/* Business Info */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-kazi-dark text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-kazi-orange" /> Business Info
              </h3>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Business Name</label>
                <input value={editBizName} onChange={(e) => setEditBizName(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Opens At</label>
                  <input type="time" value={editHoursStart} onChange={(e) => setEditHoursStart(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Closes At</label>
                  <input type="time" value={editHoursEnd} onChange={(e) => setEditHoursEnd(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Service Radius (km)</label>
                  <input type="number" value={editRadius} onChange={(e) => setEditRadius(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Job Value (KSh)</label>
                  <input type="number" value={editMinJob} onChange={(e) => setEditMinJob(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Location / Area</label>
                <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. Westlands, Nairobi" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input value={editSkills} onChange={(e) => setEditSkills(e.target.value)} placeholder="e.g. Plumbing, Tiling, Electrical" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Years of Experience</label>
                  <input value={editExperience} onChange={(e) => setEditExperience(e.target.value)} placeholder="e.g. 5 years" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Education / Training</label>
                  <input value={editEducation} onChange={(e) => setEditEducation(e.target.value)} placeholder="e.g. NITA Certified" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-3 bg-kazi-orange text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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
              <button onClick={handleChangePassword} disabled={savingPassword} className="w-full py-3 bg-kazi-dark text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-1">
              <h3 className="font-bold text-kazi-dark text-sm flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-kazi-orange" /> Notifications
              </h3>
              {[
                { label: "New booking alerts", value: notifBooking, key: "booking", set: setNotifBooking },
                { label: "Payment received alerts", value: notifPayment, key: "payment", set: setNotifPayment },
                { label: "Review alerts", value: notifReview, key: "review", set: setNotifReview },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-kazi-dark font-medium">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.value ? "On" : "Off"}</p>
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

            {/* Verification Status */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <h3 className="font-bold text-kazi-dark text-sm">Verification Status</h3>
              <div className="flex items-center gap-2">
                {provider?.isVerified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-kazi-green" />
                    <span className="text-sm font-semibold text-kazi-green">Verified Provider</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-500">
                      Verification {provider?.verificationStatus || "Pending"}
                    </span>
                  </>
                )}
              </div>
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

        {/* ── SUBSCRIPTION TAB ── */}
        {activeTab === "subscription" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">💳</div>
                <div>
                  <h3 className="font-black text-kazi-dark text-base">My Subscription Plan</h3>
                  <p className="text-xs text-gray-400">Manage your business plan & billing</p>
                </div>
              </div>
              <Link
                href="/provider/subscription"
                className="w-full flex items-center justify-center gap-2 py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-95 text-sm"
              >
                💳 View & Manage My Plan
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── IMAGE CROP MODAL (Instagram/WhatsApp style) ── */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 bg-black border-b border-white/10 flex-shrink-0">
            <button
              onClick={() => { setShowCropModal(false); setCropSrc(""); }}
              className="text-white/70 text-sm font-medium hover:text-white"
            >
              Cancel
            </button>
            <p className="text-white font-bold text-sm">Crop Image</p>
            <button
              onClick={handleCropConfirm}
              disabled={croppingBusy}
              className="text-kazi-orange font-black text-sm disabled:opacity-50"
            >
              {croppingBusy ? "Uploading…" : "Use Photo"}
            </button>
          </div>
          <div className="flex-1 relative">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              style={{ containerStyle: { background: "#000" } }}
            />
          </div>
          <div className="px-6 py-5 bg-black flex-shrink-0">
            <p className="text-white/40 text-xs text-center mb-3">Drag to reposition · Slider to zoom</p>
            <input
              type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-kazi-orange"
            />
          </div>
        </div>
      )}
    </div>
  );
}
