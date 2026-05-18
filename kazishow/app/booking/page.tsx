"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Star,
  Phone,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Navigation,
  Loader2,
  Package,
  CreditCard,
  Send,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ReviewModal from "@/components/trust/ReviewModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  businessName?: string;
  category?: string;
  phone?: string;
  isVerified?: boolean;
}

interface Service {
  id: string;
  name?: string;
}

interface Booking {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime?: string;
  totalAmount?: number;
  location?: string;
  duration?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  provider?: Provider;
  service?: Service;
  createdAt?: string;
  review?: { id: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ACCEPTED: "bg-blue-100 text-blue-700 border-blue-200",
  EN_ROUTE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  ARRIVED: "bg-purple-100 text-purple-700 border-purple-200",
  IN_PROGRESS: "bg-orange-100 text-orange-700 border-orange-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  DECLINED: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
  PREPARING: "bg-amber-100 text-amber-700 border-amber-200",
  READY: "bg-teal-100 text-teal-700 border-teal-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending — Waiting for provider",
  ACCEPTED: "Accepted — Provider confirmed",
  EN_ROUTE: "En Route — Provider is on the way",
  ARRIVED: "Arrived — Provider is here",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  PREPARING: "Preparing your order",
  READY: "Ready for collection",
};

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDI: "🔧",
  HOTEL: "🏨",
  RESTAURANT: "🍲",
  SHOP: "🛒",
  TECH: "💻",
};

const ACTIVE_STATUSES = ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "PREPARING", "READY"];
const COMPLETED_STATUSES = ["COMPLETED", "DECLINED", "CANCELLED"];

type TabKey = "all" | "pending" | "active" | "completed";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryEmoji(category?: string): string {
  if (!category) return "💼";
  return CATEGORY_EMOJI[category.toUpperCase()] ?? "💼";
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return <CheckCircle className="w-4 h-4 text-green-500 fill-green-500" />;
  }
  if (status === "DECLINED" || status === "CANCELLED") {
    return <XCircle className="w-4 h-4 text-red-500" />;
  }
  return <Clock className="w-4 h-4 text-orange-500" />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BookingSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 animate-pulse h-40 shadow-sm" />
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: Booking;
  onCancel: (id: string) => void;
  confirmingId: string | null;
  setConfirmingId: (id: string | null) => void;
  onPayNow: (booking: Booking) => void;
  onReview: (booking: Booking) => void;
  onRefund: (booking: Booking) => void;
}

function BookingCard({ booking, onCancel, confirmingId, setConfirmingId, onPayNow, onReview, onRefund }: BookingCardProps) {
  const statusColor = STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;
  const emoji = getCategoryEmoji(booking.provider?.category);
  const serviceName = booking.service?.name || "General Service";
  const isConfirming = confirmingId === booking.id;
  const isFundi = booking.provider?.category === "FUNDI";
  const canCancel = booking.status === "PENDING";
  const canPay = isFundi && ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(booking.status) && booking.paymentStatus !== "PAID";
  const canReview = booking.status === "COMPLETED" && !booking.review;
  const canRefund = ["DECLINED", "CANCELLED"].includes(booking.status) && booking.paymentStatus === "PAID";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      {/* Top row: status badge + date */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}
        >
          <StatusIcon status={booking.status} />
          {statusLabel}
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(booking.scheduledDate)}
        </span>
      </div>

      {/* Service & provider */}
      <div>
        <p className="font-semibold text-gray-900 text-base flex items-center gap-2">
          <span>{emoji}</span>
          {serviceName}
        </p>
        {booking.provider?.businessName && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            {booking.provider.businessName}
            {booking.provider.isVerified && (
              <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
            )}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1">
        {booking.location && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{booking.location}</span>
          </p>
        )}
        {(booking.scheduledTime || booking.duration) && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            {booking.scheduledTime && <span>{booking.scheduledTime}</span>}
            {booking.scheduledTime && booking.duration && <span>·</span>}
            {booking.duration && <span>{booking.duration}</span>}
          </p>
        )}
        {booking.totalAmount !== undefined && booking.totalAmount !== null && (
          <p className="text-sm font-semibold text-gray-700">
            KSh {booking.totalAmount.toLocaleString()}
          </p>
        )}
      </div>

      {/* Payment badge */}
      {booking.paymentStatus === "PAID" && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full w-fit">
          <CheckCircle className="w-3.5 h-3.5" /> Paid via M-Pesa
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {canCancel && !isConfirming && (
          <button
            onClick={() => setConfirmingId(booking.id)}
            className="text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-lg font-medium"
          >
            Cancel
          </button>
        )}
        {canCancel && isConfirming && (
          <>
            <button
              onClick={() => {
                onCancel(booking.id);
                setConfirmingId(null);
              }}
              className="text-sm text-white bg-red-600 hover:bg-red-700 transition-colors px-3 py-1.5 rounded-lg font-medium"
            >
              Confirm Cancel
            </button>
            <button
              onClick={() => setConfirmingId(null)}
              className="text-sm text-gray-600 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-lg font-medium"
            >
              No
            </button>
          </>
        )}

        {canPay && (
          <button
            onClick={() => onPayNow(booking)}
            className="flex items-center gap-1.5 text-sm text-white bg-kazi-orange hover:bg-orange-600 transition-colors px-3 py-1.5 rounded-lg font-semibold"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Pay KSh {booking.totalAmount?.toLocaleString()}
          </button>
        )}

        {canRefund && (
          <button
            onClick={() => onRefund(booking)}
            className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors px-3 py-1.5 rounded-lg font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Request Refund
          </button>
        )}

        {booking.paymentStatus === "REFUND_REQUESTED" && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full w-fit">
            <CheckCircle className="w-3.5 h-3.5" /> Refund Requested
          </div>
        )}

        {booking.paymentStatus === "REFUNDED" && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full w-fit">
            <CheckCircle className="w-3.5 h-3.5" /> Refunded
          </div>
        )}

        {ACTIVE_STATUSES.includes(booking.status) && (
          <Link
            href={`/tracking/${booking.id}`}
            className="flex items-center gap-1.5 text-sm text-white bg-cyan-500 hover:bg-cyan-600 transition-colors px-3 py-1.5 rounded-lg font-semibold"
          >
            <Navigation className="w-3.5 h-3.5" />
            Track Provider
          </Link>
        )}

        {canReview && (
          <button
            onClick={() => onReview(booking)}
            className="flex items-center gap-1.5 text-sm text-white bg-kazi-amber hover:bg-amber-500 transition-colors px-3 py-1.5 rounded-lg font-semibold"
          >
            <Star className="w-3.5 h-3.5" fill="white" />
            Leave a Review
          </button>
        )}

        {booking.review && (
          <div className="flex items-center gap-1.5 text-xs text-kazi-green font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Review submitted
          </div>
        )}

        {booking.status === "COMPLETED" && booking.provider?.id && (
          <Link
            href={`/business/${booking.provider.id}`}
            className="flex items-center gap-1.5 text-sm text-kazi-dark border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-lg font-semibold"
          >
            Book Again
          </Link>
        )}

        {booking.provider?.id && booking.status !== "COMPLETED" && (
          <Link
            href={`/business/${booking.provider.id}`}
            className="ml-auto text-sm text-kazi-dark font-medium flex items-center gap-1 hover:underline"
          >
            View Provider
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabKey }) {
  const map: Record<TabKey, { emoji: string; title: string; sub?: string; href?: string; cta?: string }> = {
    all: {
      emoji: "📦",
      title: "No bookings yet",
      sub: "Start by discovering services",
      href: "/discover",
      cta: "Discover Services",
    },
    pending: {
      emoji: "📋",
      title: "No pending requests",
      sub: "Discover services to book",
      href: "/discover",
      cta: "Discover Services",
    },
    active: {
      emoji: "🎯",
      title: "No active bookings",
    },
    completed: {
      emoji: "📜",
      title: "No booking history yet",
    },
  };

  const info = map[tab];

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <span className="text-5xl">{info.emoji}</span>
      <p className="text-gray-700 font-semibold text-lg">{info.title}</p>
      {info.sub && <p className="text-gray-400 text-sm">{info.sub}</p>}
      {info.href && info.cta && (
        <Link
          href={info.href}
          className="mt-2 inline-flex items-center gap-2 bg-kazi-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          {info.cta}
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [user, setUser] = useState<{ id: string; name?: string; phone?: string } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  // Payment modal state
  const [payBooking, setPayBooking] = useState<Booking | null>(null);
  const [payPhone, setPayPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Refund modal state
  const [refundBooking, setRefundBooking] = useState<Booking | null>(null);
  const [refundPhone, setRefundPhone] = useState("");
  const [refunding, setRefunding] = useState(false);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("kazishow_user");
    const token = localStorage.getItem("kazishow_token");
    if (!raw || !token) {
      router.push("/auth/login");
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  // ── Fetch bookings ──────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data.bookings || []).sort(
          (a: Booking, b: Booking) =>
            new Date(b.createdAt ?? b.scheduledDate).getTime() -
            new Date(a.createdAt ?? a.scheduledDate).getTime()
        );
        setBookings(sorted);
      }
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  // ── Cancel booking ──────────────────────────────────────────────────────────
  const cancelBooking = async (bookingId: string) => {
    const token = localStorage.getItem("kazishow_token");
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Booking cancelled");
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "CANCELLED" } : b
          )
        );
      } else {
        toast.error(data.message || "Could not cancel booking");
      }
    } catch {
      toast.error("Failed to cancel");
    }
  };

  // ── Payment ─────────────────────────────────────────────────────────────────
  const openPayModal = (booking: Booking) => {
    setPayBooking(booking);
    setPayPhone(user?.phone || "");
  };

  const closePayModal = () => {
    setPayBooking(null);
    setPayPhone("");
    if (pollInterval) { clearInterval(pollInterval); setPollInterval(null); }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBooking) return;
    const token = localStorage.getItem("kazishow_token");
    setPaying(true);
    try {
      const res = await fetch(`${API}/api/payments/stk-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: payBooking.id, phone: payPhone.trim() }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message); return; }

      toast.success("M-Pesa prompt sent! Enter your PIN on your phone.");

      // Poll payment status every 5 s for up to 90 s
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const sRes = await fetch(`${API}/api/payments/${payBooking.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const sData = await sRes.json();
          if (sData.data?.paymentStatus === "PAID") {
            clearInterval(interval);
            setPollInterval(null);
            setBookings((prev) =>
              prev.map((b) => b.id === payBooking.id ? { ...b, paymentStatus: "PAID" } : b)
            );
            toast.success("Payment confirmed! Thank you.");
            closePayModal();
          } else if (sData.data?.payment?.status === "FAILED" || attempts >= 18) {
            clearInterval(interval);
            setPollInterval(null);
            if (attempts >= 18) toast.error("Payment timed out. Try again.");
          }
        } catch { /* ignore poll errors */ }
      }, 5000);
      setPollInterval(interval);
    } catch {
      toast.error("Failed to initiate payment");
    } finally {
      setPaying(false);
    }
  };

  // ── Refund ─────────────────────────────────────────────────────────────────
  const openRefundModal = (booking: Booking) => {
    setRefundBooking(booking);
    setRefundPhone(user?.phone || "");
  };

  const closeRefundModal = () => {
    setRefundBooking(null);
    setRefundPhone("");
  };

  const submitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundBooking) return;
    const token = localStorage.getItem("kazishow_token");
    setRefunding(true);
    try {
      const res = await fetch(`${API}/api/bookings/${refundBooking.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: refundPhone.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to submit refund request");
        return;
      }
      toast.success("Refund request submitted! Expect your M-Pesa payment within 24 hours.");
      setBookings((prev) =>
        prev.map((b) => b.id === refundBooking.id ? { ...b, paymentStatus: "REFUND_REQUESTED" } : b)
      );
      closeRefundModal();
    } catch {
      toast.error("Failed to submit refund request");
    } finally {
      setRefunding(false);
    }
  };

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socket = io(API, { transports: ["websocket"] });

    socket.on("connect", () => socket.emit("join", user.id));

    const updateStatus = (bookingId: string, status: string) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    };

    socket.on("booking_accepted", (d: any) => {
      updateStatus(d.booking?.id || d.bookingId, "ACCEPTED");
      toast.success("🎉 Provider accepted your booking!");
    });
    socket.on("booking_declined", (d: any) => {
      updateStatus(d.booking?.id || d.bookingId, "DECLINED");
      toast.error("Booking was declined");
    });
    socket.on("provider_en_route", (d: any) => {
      updateStatus(d.booking?.id, "EN_ROUTE");
      toast("🚗 Provider is on the way!");
    });
    socket.on("provider_arrived", (d: any) => {
      updateStatus(d.booking?.id, "ARRIVED");
      toast("📍 Provider has arrived!");
    });
    socket.on("booking_completed", (d: any) => {
      updateStatus(d.booking?.id, "COMPLETED");
      toast.success("✅ Service completed!");
      // Auto-prompt review after a short delay
      setTimeout(() => {
        setBookings((prev) => {
          const b = prev.find((x) => x.id === (d.booking?.id));
          if (b && !b.review) setReviewBooking(b);
          return prev;
        });
      }, 1500);
    });
    socket.on("booking_cancelled", () => fetchBookings());
    socket.on("order_status_update", (d: any) => {
      if (d.booking?.id) updateStatus(d.booking.id, d.status);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived tab lists ───────────────────────────────────────────────────────
  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const activeBookings = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const completedBookings = bookings.filter((b) => COMPLETED_STATUSES.includes(b.status));

  const tabBookings: Record<TabKey, Booking[]> = {
    all: bookings,
    pending: pendingBookings,
    active: activeBookings,
    completed: completedBookings,
  };

  const visibleBookings = tabBookings[activeTab];

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending", count: pendingBookings.length },
    { key: "active", label: "Active", count: activeBookings.length },
    { key: "completed", label: "Completed" },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-kazi-dark text-white px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-white/70 text-sm mt-0.5">
              {loading
                ? "Loading..."
                : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            aria-label="Refresh bookings"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Tab bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 flex gap-1 mb-5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-kazi-dark text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            <BookingSkeleton />
            <BookingSkeleton />
            <BookingSkeleton />
          </div>
        ) : visibleBookings.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="flex flex-col gap-4">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={cancelBooking}
                confirmingId={confirmingId}
                setConfirmingId={setConfirmingId}
                onPayNow={openPayModal}
                onReview={setReviewBooking}
                onRefund={openRefundModal}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* ── Review modal ── */}
      {reviewBooking && (
        <ReviewModal
          providerName={reviewBooking.provider?.businessName ?? "Provider"}
          providerCategory={reviewBooking.provider?.category}
          bookingId={reviewBooking.id}
          onClose={() => setReviewBooking(null)}
          onSubmitted={() => {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === reviewBooking.id ? { ...b, review: { id: "submitted" } } : b
              )
            );
            setReviewBooking(null);
          }}
        />
      )}

      {/* ── Refund modal ── */}
      {refundBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-kazi-dark text-lg">Request Refund</h2>
              <button onClick={closeRefundModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{refundBooking.service?.name || "Service"}</p>
              <p className="text-3xl font-black text-blue-600">KSh {refundBooking.totalAmount?.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{refundBooking.provider?.businessName}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              Enter the M-Pesa number where you want to receive your refund. Processing takes up to 24 hours.
            </div>
            <form onSubmit={submitRefund} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={refundPhone}
                  onChange={(e) => setRefundPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={refunding}
                className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {refunding ? "Submitting…" : "Submit Refund Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {payBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-kazi-dark text-lg">Pay via M-Pesa</h2>
              <button onClick={closePayModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{payBooking.service?.name || "Service"}</p>
              <p className="text-3xl font-black text-kazi-orange">KSh {payBooking.totalAmount?.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{payBooking.provider?.businessName}</p>
            </div>
            <form onSubmit={submitPayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                You will receive an M-Pesa prompt on this number. Enter your PIN to complete payment.
              </p>
              <button
                type="submit"
                disabled={paying}
                className="w-full py-3 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {paying ? "Sending prompt…" : "Send M-Pesa Prompt"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
