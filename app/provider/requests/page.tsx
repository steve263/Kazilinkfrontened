"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  ChevronRight,
  RefreshCw,
  Package,
  Zap,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { toast, Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

// ─── Constants ────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const FUNDI_CATEGORIES = [
  "PLUMBER", "ELECTRICIAN", "CARPENTER", "PAINTER", "MECHANIC",
  "WELDER", "MASON", "CLEANER", "GARDENER", "FUNDI", "HANDYMAN",
];

const COUNTDOWN_SECONDS = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string; location?: string };
  service?: { id: string; name: string; price: number; duration?: number };
  provider: { id: string; businessName: string; category: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

function formatDate(date: string, time: string) {
  const d = new Date(date);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const label = isToday
    ? "Today"
    : d.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" });
  return `${label} at ${time}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:     { label: "Pending",     bg: "bg-yellow-100",  text: "text-yellow-800" },
  ACCEPTED:    { label: "Accepted",    bg: "bg-blue-100",    text: "text-blue-800"   },
  EN_ROUTE:    { label: "En Route",    bg: "bg-cyan-100",    text: "text-cyan-800"   },
  ARRIVED:     { label: "Arrived",     bg: "bg-purple-100",  text: "text-purple-800" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-orange-100",  text: "text-orange-800" },
  COMPLETED:   { label: "Completed",   bg: "bg-green-100",   text: "text-green-800"  },
  DECLINED:    { label: "Declined",    bg: "bg-red-100",     text: "text-red-800"    },
  CANCELLED:   { label: "Cancelled",   bg: "bg-gray-100",    text: "text-gray-600"   },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm animate-pulse h-32" />
  );
}

// ─── Countdown ring ───────────────────────────────────────────────────────────

function CountdownRing({ seconds }: { seconds: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, seconds / COUNTDOWN_SECONDS);
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = seconds <= 10;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke={isUrgent ? "#ef4444" : "#FF6B2B"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className={`text-xs font-black ${isUrgent ? "text-red-500" : "text-[#FF6B2B]"}`}>
        {seconds}s
      </span>
    </div>
  );
}

// ─── Incoming Request Card ────────────────────────────────────────────────────

function RequestCard({
  booking,
  timer,
  acting,
  onAccept,
  onDecline,
}: {
  booking: Booking;
  timer: number;
  acting: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const isActing = acting === booking.id;
  const expired = timer <= 0;

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 ${
      expired ? "border-amber-200" : "border-[#FF6B2B]/30"
    }`}>
      {/* Top accent bar */}
      <div className={`h-1 ${expired ? "bg-amber-400" : "bg-[#FF6B2B]"}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF6B2B]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#FF6B2B]" />
            </div>
            <div>
              <p className="text-xs font-black text-[#FF6B2B] uppercase tracking-wide">New Request</p>
              <p className="text-[10px] text-gray-400">
                {new Date(booking.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {expired ? (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              Expired
            </span>
          ) : (
            <CountdownRing seconds={timer} />
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-3">
          {/* Customer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-bold text-gray-800">{booking.customer.name}</span>
            </div>
            <a
              href={`tel:${booking.customer.phone}`}
              className="flex items-center gap-1 text-xs text-[#00C896] font-semibold hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          </div>

          {/* Service */}
          {booking.service && (
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium">{booking.service.name}</span>
            </div>
          )}

          {/* Address */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{booking.address}</span>
          </div>

          {/* Date / time */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500">
              {formatDate(booking.scheduledDate, booking.scheduledTime)}
            </span>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-800">
              💰 {formatCurrency(booking.totalAmount)}
            </span>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="mt-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 italic">📝 {booking.notes}</p>
            </div>
          )}
        </div>

        {/* Expired state */}
        {expired ? (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              ⏰ Expired — customer may have moved on
            </p>
          </div>
        ) : (
          /* Accept / Decline buttons */
          <div className="flex gap-2">
            <button
              onClick={() => onDecline(booking.id)}
              disabled={isActing}
              className="flex-1 py-2.5 rounded-xl border-2 border-red-400 text-red-500 text-sm font-bold hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
            <button
              onClick={() => onAccept(booking.id)}
              disabled={isActing}
              className="flex-[2] py-2.5 rounded-xl bg-[#00C896] text-white text-sm font-bold hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isActing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Accept Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Active Job Card ──────────────────────────────────────────────────────────

const ACTIVE_NEXT: Record<string, { label: string; next: string; color: string; icon: string }> = {
  ACCEPTED:    { label: "I'm En Route",  next: "EN_ROUTE",    color: "bg-cyan-500 hover:bg-cyan-600",        icon: "🚗" },
  EN_ROUTE:    { label: "I've Arrived",  next: "ARRIVED",     color: "bg-purple-500 hover:bg-purple-600",    icon: "📍" },
  ARRIVED:     { label: "Start Job",     next: "IN_PROGRESS", color: "bg-[#FF6B2B] hover:bg-orange-600",     icon: "▶" },
  IN_PROGRESS: { label: "Complete Job",  next: "COMPLETED",   color: "bg-[#00C896] hover:bg-green-600",      icon: "✅" },
};

function ActiveJobCard({
  booking,
  acting,
  onUpdateStatus,
}: {
  booking: Booking;
  acting: string | null;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [confirmComplete, setConfirmComplete] = useState(false);
  const isActing = acting === booking.id;
  const nextAction = ACTIVE_NEXT[booking.status];

  const handleAction = () => {
    if (!nextAction) return;
    if (nextAction.next === "COMPLETED" && !confirmComplete) {
      setConfirmComplete(true);
      return;
    }
    setConfirmComplete(false);
    onUpdateStatus(booking.id, nextAction.next);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Status color bar */}
      <div className={`h-1 ${
        booking.status === "ACCEPTED"    ? "bg-blue-500" :
        booking.status === "EN_ROUTE"   ? "bg-cyan-500" :
        booking.status === "ARRIVED"    ? "bg-purple-500" :
        booking.status === "IN_PROGRESS"? "bg-[#FF6B2B]" : "bg-gray-300"
      }`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-black text-gray-800">
              {booking.service?.name || "Service"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(booking.scheduledDate, booking.scheduledTime)}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700">{booking.customer.name}</span>
            </div>
            <a
              href={`tel:${booking.customer.phone}`}
              className="flex items-center gap-1 text-xs text-[#00C896] font-semibold hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              {booking.customer.phone}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{booking.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">
              💰 {formatCurrency(booking.totalAmount)}
            </span>
            {booking.service?.duration && (
              <span className="text-xs text-gray-400">· ~{booking.service.duration} min</span>
            )}
          </div>

          {booking.notes && (
            <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 italic">📝 {booking.notes}</p>
            </div>
          )}
        </div>

        {/* Confirm complete inline */}
        {confirmComplete && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-xs font-bold text-green-800 mb-2">
              Confirm job is fully completed?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmComplete(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                No, cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isActing}
                className="flex-1 py-2 bg-[#00C896] text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
              >
                Yes, complete
              </button>
            </div>
          </div>
        )}

        {/* Next action button */}
        {nextAction && !confirmComplete && (
          <button
            onClick={handleAction}
            disabled={isActing}
            className={`w-full py-3 text-white text-sm font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${nextAction.color}`}
          >
            {isActing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>{nextAction.icon}</span>
            )}
            {nextAction.label}
            {!isActing && <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── History Card ─────────────────────────────────────────────────────────────

function HistoryCard({ booking }: { booking: Booking }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-gray-800 truncate">
              {booking.service?.name || "Service"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{booking.customer.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{formatDate(booking.scheduledDate, booking.scheduledTime)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={booking.status} />
          <span className="text-sm font-black text-gray-700">
            {formatCurrency(booking.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: "requests" | "active" | "history" }) {
  const config = {
    requests: {
      icon: "📋",
      title: "No pending requests",
      sub: "When customers book you, they'll appear here",
    },
    active: {
      icon: "🎯",
      title: "No active jobs",
      sub: "Accept a request to start working",
    },
    history: {
      icon: "📜",
      title: "No job history yet",
      sub: "Completed, declined, and cancelled jobs appear here",
    },
  };
  const { icon, title, sub } = config[tab];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-base font-black text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs">{sub}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderRequestsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [tab, setTab] = useState<"requests" | "active" | "history">("requests");
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const watchIdRef = useRef<number | null>(null);
  const gpsBookingIdRef = useRef<string | null>(null);

  // ── Boot: load user from localStorage ─────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("kazishow_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  // ── Fetch bookings ─────────────────────────────────────────────────────────
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
      if (data.success) setBookings(data.data.bookings || []);
    } catch {
      toast.error("Failed to load bookings");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Countdown timers ───────────────────────────────────────────────────────
  useEffect(() => {
    const pending = bookings.filter((b) => b.status === "PENDING");

    pending.forEach((b) => {
      if (intervalRefs.current[b.id]) return; // already ticking

      // Initialise timer if not set
      setTimers((prev) => {
        if (prev[b.id] !== undefined) return prev;
        return { ...prev, [b.id]: COUNTDOWN_SECONDS };
      });

      const interval = setInterval(() => {
        setTimers((prev) => {
          const current = prev[b.id] ?? COUNTDOWN_SECONDS;
          if (current <= 0) {
            clearInterval(intervalRefs.current[b.id]);
            delete intervalRefs.current[b.id];
            return prev;
          }
          return { ...prev, [b.id]: current - 1 };
        });
      }, 1000);

      intervalRefs.current[b.id] = interval;
    });

    // Clean up intervals for bookings no longer pending
    Object.keys(intervalRefs.current).forEach((id) => {
      const booking = bookings.find((b) => b.id === id);
      if (!booking || booking.status !== "PENDING") {
        clearInterval(intervalRefs.current[id]);
        delete intervalRefs.current[id];
      }
    });
  }, [bookings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // ── Socket real-time ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socket = io(API, { transports: ["websocket"] });

    socket.on("connect", () => socket.emit("join", user.id));

    socket.on("new_booking", (data: any) => {
      toast("📋 New booking request!", { icon: "🔔" });
      setBookings((prev) => [data.booking || data, ...prev]);
    });

    socket.on("booking_cancelled", (data: any) => {
      toast("Booking was cancelled by customer", { icon: "❌" });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === (data.bookingId || data.booking?.id)
            ? { ...b, status: "CANCELLED" }
            : b
        )
      );
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Accept ─────────────────────────────────────────────────────────────────
  const acceptBooking = async (bookingId: string) => {
    const token = localStorage.getItem("kazishow_token");
    setActing(bookingId);
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Booking accepted! 🎉");
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "ACCEPTED" } : b))
        );
        setTimers((prev) => {
          const next = { ...prev };
          delete next[bookingId];
          return next;
        });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to accept");
    }
    setActing(null);
  };

  // ── Decline ────────────────────────────────────────────────────────────────
  const declineBooking = async (bookingId: string) => {
    const token = localStorage.getItem("kazishow_token");
    setActing(bookingId);
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/decline`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast("Booking declined");
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "DECLINED" } : b))
        );
        setTimers((prev) => {
          const next = { ...prev };
          delete next[bookingId];
          return next;
        });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to decline");
    }
    setActing(null);
  };

  // ── GPS tracking helpers ───────────────────────────────────────────────────
  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    gpsBookingIdRef.current = null;
  };

  const startGpsTracking = (bookingId: string) => {
    if (!navigator.geolocation) return;
    stopGpsTracking();
    gpsBookingIdRef.current = bookingId;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        socketRef.current?.emit("provider_location", { bookingId, lat, lng });
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  // ── Update status ──────────────────────────────────────────────────────────
  const updateStatus = async (bookingId: string, status: string) => {
    const token = localStorage.getItem("kazishow_token");
    setActing(bookingId);
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        const labels: Record<string, string> = {
          EN_ROUTE:    "You're marked as En Route",
          ARRIVED:     "Marked as Arrived",
          IN_PROGRESS: "Job marked as In Progress",
          COMPLETED:   "Job completed! 🎉",
        };
        toast.success(labels[status] || "Status updated");
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
        if (status === "EN_ROUTE") {
          startGpsTracking(bookingId);
        } else if (["ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(status)) {
          stopGpsTracking();
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update status");
    }
    setActing(null);
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const requests = bookings.filter((b) => b.status === "PENDING");
  const active   = bookings.filter((b) =>
    ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status)
  );
  const history  = bookings.filter((b) =>
    ["COMPLETED", "DECLINED", "CANCELLED"].includes(b.status)
  );

  // ── Role guards ────────────────────────────────────────────────────────────
  if (!loading && user && user.role !== "PROVIDER") {
    return (
      <div className="min-h-screen bg-kazi-cream">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <AlertCircle className="w-14 h-14 text-gray-400 mb-4" />
          <h2 className="text-xl font-black text-kazi-dark mb-2">
            This page is for service providers only
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            You need a provider account to view job requests.
          </p>
          <Link
            href="/discover"
            className="px-6 py-3 bg-[#FF6B2B] text-white font-bold rounded-2xl hover:bg-orange-600 transition-all"
          >
            Browse Services
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const providerCategory = user?.provider?.category || user?.category || "";
  const isFundi = FUNDI_CATEGORIES.includes(providerCategory.toUpperCase());

  if (!loading && user && user.role === "PROVIDER" && providerCategory && !isFundi) {
    return (
      <div className="min-h-screen bg-kazi-cream">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <span className="text-5xl mb-4">🏪</span>
          <h2 className="text-xl font-black text-kazi-dark mb-2">
            This page is for Fundi providers
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Business providers should use the Orders dashboard.
          </p>
          <Link
            href="/provider/orders"
            className="px-6 py-3 bg-[#FF6B2B] text-white font-bold rounded-2xl hover:bg-orange-600 transition-all"
          >
            Go to Orders →
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Current tab list ───────────────────────────────────────────────────────
  const currentList =
    tab === "requests" ? requests : tab === "active" ? active : history;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-28">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-5 bg-kazi-dark rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B2B]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#FF6B2B]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">Job Requests</h1>
              <p className="text-xs text-gray-400">
                {user?.provider?.businessName || user?.name || "My Profile"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Online toggle (visual only) */}
            <button
              onClick={() => setIsOnline((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isOnline
                  ? "bg-[#00C896]/20 text-[#00C896]"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[#00C896]" : "bg-gray-500"}`} />
              {isOnline ? "Online" : "Offline"}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-300 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Tab pills ───────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 mb-4 shadow-sm">
          {(
            [
              { key: "requests", label: "Requests", count: requests.length },
              { key: "active",   label: "Active",   count: active.length   },
              { key: "history",  label: "History",  count: null             },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === key
                  ? "bg-[#FF6B2B] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {count !== null && count > 0 && (
                <span className={`ml-1 ${tab === key ? "opacity-80" : "text-[#FF6B2B]"}`}>
                  ({count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Loading skeletons ────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {!loading && currentList.length === 0 && (
          <EmptyState tab={tab} />
        )}

        {!loading && currentList.length > 0 && (
          <div className="space-y-3">
            {tab === "requests" &&
              (currentList as Booking[]).map((booking) => (
                <RequestCard
                  key={booking.id}
                  booking={booking}
                  timer={timers[booking.id] ?? COUNTDOWN_SECONDS}
                  acting={acting}
                  onAccept={acceptBooking}
                  onDecline={declineBooking}
                />
              ))}

            {tab === "active" &&
              (currentList as Booking[]).map((booking) => (
                <ActiveJobCard
                  key={booking.id}
                  booking={booking}
                  acting={acting}
                  onUpdateStatus={updateStatus}
                />
              ))}

            {tab === "history" &&
              (currentList as Booking[]).map((booking) => (
                <HistoryCard key={booking.id} booking={booking} />
              ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
