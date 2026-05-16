"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCircle, XCircle, MapPin, Clock,
  Phone, ChevronRight, BellOff, Loader2, RefreshCw, Zap, CreditCard,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { formatCurrency } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  status: string;
  customer: { id: string; name: string; phone: string; location?: string };
  service?: { name: string; price: number };
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getPageTitle(category: string): string {
  if (category === "FUNDI")      return "My Jobs";
  if (category === "HOTEL")      return "My Reservations";
  if (category === "RESTAURANT") return "My Table Bookings";
  if (category === "SHOP")       return "My Orders";
  if (category === "SALON" || category === "BARBERSHOP") return "My Appointments";
  if (category === "GYM")        return "My Sessions";
  if (category === "CLINIC")     return "My Appointments";
  return "My Bookings";
}

function getBookingLabel(category: string): string {
  if (category === "HOTEL" || category === "RESTAURANT") return "Reservation";
  if (category === "SHOP")       return "Order";
  if (category === "SALON" || category === "BARBERSHOP") return "Appointment";
  if (category === "GYM")        return "Session";
  if (category === "CLINIC")     return "Appointment";
  return "Booking";
}

function isMobileProvider(category: string, description = ""): boolean {
  if (category === "FUNDI") return true;
  const d = description.toLowerCase();
  return d.includes("catering") || d.includes("security");
}

function dayStatus(scheduledDate: string): "today" | "future" | "past" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(scheduledDate);
  day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return "today";
  if (day.getTime() > today.getTime()) return "future";
  return "past";
}

function daysUntil(scheduledDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(scheduledDate);
  day.setHours(0, 0, 0, 0);
  return Math.round((day.getTime() - today.getTime()) / 86400000);
}

function fmtDate(dateStr: string, time: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" }) + " · " + time;
}

const ACTIVE_STATUSES = ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"];

// ─── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(seconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return remaining;
}

// ─── Pending card (incoming request — 30-second countdown) ────────────────────

function PendingCard({
  booking,
  token,
  bookingLabel,
  onAction,
}: {
  booking: Booking;
  token: string;
  bookingLabel: string;
  onAction: (id: string, result: "accepted" | "declined" | "expired") => void;
}) {
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | "expired" | null>(null);

  const remaining = useCountdown(30, () => {
    if (!done) { setDone("expired"); onAction(booking.id, "expired"); }
  });

  const handleAction = async (action: "accept" | "decline") => {
    setLoading(action);
    try {
      const res = await fetch(`${API}/api/bookings/${booking.id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const result = action === "accept" ? "accepted" : "declined";
        setDone(result);
        onAction(booking.id, result);
        toast.success(action === "accept" ? `${bookingLabel} accepted!` : "Declined");
      } else {
        toast.error(data.message || "Failed");
      }
    } catch { toast.error("Network error"); }
    finally { setLoading(null); }
  };

  const isUrgent = remaining <= 10;
  const circumference = 2 * Math.PI * 26;

  if (done === "accepted") {
    return (
      <div className="bg-kazi-dark rounded-2xl p-5 border border-kazi-green/40 flex items-center gap-4">
        <CheckCircle className="w-8 h-8 text-kazi-green flex-shrink-0" />
        <div>
          <p className="font-black text-white">Accepted!</p>
          <p className="text-xs text-gray-400">{booking.customer.name}'s {bookingLabel.toLowerCase()} confirmed</p>
        </div>
      </div>
    );
  }

  if (done === "declined" || done === "expired") {
    return (
      <div className="bg-kazi-dark rounded-2xl p-5 border border-red-500/30 flex items-center gap-4">
        <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
        <div>
          <p className="font-bold text-white">{done === "expired" ? "Request Expired" : "Declined"}</p>
          <p className="text-xs text-gray-400">
            {done === "expired" ? "No response in 30s" : `Declined ${booking.customer.name}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-kazi-dark rounded-2xl overflow-hidden border transition-all ${
      isUrgent ? "border-red-500/60" : "border-kazi-orange/40"
    }`}>
      <div
        className={`h-1 transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-kazi-orange"}`}
        style={{ width: `${(remaining / 30) * 100}%` }}
      />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-kazi-orange/20 flex items-center justify-center text-xl font-black text-kazi-orange flex-shrink-0">
              {booking.customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">{booking.customer.name}</p>
              <p className="text-xs text-kazi-orange font-bold uppercase tracking-wide">New {bookingLabel}</p>
            </div>
          </div>
          {/* Circular countdown */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="26" fill="none"
                  stroke={isUrgent ? "#ef4444" : "#FF6B2B"} strokeOpacity="0.2" strokeWidth="4" />
                <circle cx="30" cy="30" r="26" fill="none"
                  stroke={isUrgent ? "#ef4444" : "#FF6B2B"} strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (remaining / 30) * circumference}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${
                isUrgent ? "text-red-400" : "text-kazi-orange"
              }`}>{remaining}</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5">seconds</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {booking.service && (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-kazi-orange flex-shrink-0" />
              <span className="text-sm text-white font-semibold flex-1">{booking.service.name}</span>
              <span className="text-sm font-black text-kazi-orange">{formatCurrency(booking.totalAmount)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-300 truncate">{booking.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-300">{fmtDate(booking.scheduledDate, booking.scheduledTime)}</span>
          </div>
          {booking.notes && (
            <div className="px-3 py-2 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400 italic">"{booking.notes}"</p>
            </div>
          )}
        </div>

        <a href={`tel:${booking.customer.phone}`}
          className="flex items-center gap-2 text-xs text-kazi-green mb-4 hover:underline w-fit">
          <Phone className="w-3.5 h-3.5" />
          Call {booking.customer.name}: {booking.customer.phone}
        </a>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleAction("decline")} disabled={!!loading}
            className="py-3.5 bg-white/10 text-white font-bold rounded-2xl hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {loading === "decline" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Decline
          </button>
          <button onClick={() => handleAction("accept")} disabled={!!loading}
            className="py-3.5 bg-kazi-green text-white font-bold rounded-2xl hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-900/40">
            {loading === "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active booking card (ACCEPTED → status progression) ─────────────────────

function ActiveCard({
  booking,
  token,
  category,
  description,
  bookingLabel,
  onUpdated,
}: {
  booking: Booking;
  token: string;
  category: string;
  description?: string;
  bookingLabel: string;
  onUpdated: (id: string, status: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const canMove = isMobileProvider(category, description);
  const when = dayStatus(booking.scheduledDate);
  const days = daysUntil(booking.scheduledDate);

  const formattedDate = new Date(booking.scheduledDate).toLocaleDateString("en-KE", {
    weekday: "long", month: "long", day: "numeric",
  });

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bookings/${booking.id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdated(booking.id, status);
        toast.success(status === "COMPLETED" ? `${bookingLabel} completed!` : "Status updated");
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  const STATUS_LABEL: Record<string, string> = {
    ACCEPTED:    "Accepted",
    EN_ROUTE:    "On My Way",
    ARRIVED:     "Arrived",
    IN_PROGRESS: "In Progress",
    COMPLETED:   "Completed",
  };

  const STATUS_COLOR: Record<string, string> = {
    ACCEPTED:    "bg-blue-500/20 text-blue-400",
    EN_ROUTE:    "bg-cyan-500/20 text-cyan-400",
    ARRIVED:     "bg-purple-500/20 text-purple-400",
    IN_PROGRESS: "bg-amber-500/20 text-amber-400",
    COMPLETED:   "bg-green-500/20 text-green-400",
  };

  return (
    <div className="bg-kazi-dark rounded-2xl overflow-hidden border border-white/10">
      <div className="h-1 bg-blue-500" />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-kazi-orange/20 flex items-center justify-center text-lg font-black text-kazi-orange flex-shrink-0">
              {booking.customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-black text-white text-sm">{booking.customer.name}</p>
              <p className="text-xs text-gray-400">
                <span className="text-xs bg-orange-100 text-kazi-orange font-bold px-2 py-0.5 rounded-full">
                  {bookingLabel} #{booking.id.slice(0, 6).toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[booking.status] || "bg-white/10 text-gray-400"}`}>
            {STATUS_LABEL[booking.status] || booking.status}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-3">
          {booking.service && (
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-kazi-orange flex-shrink-0" />
              <span className="text-sm text-white font-semibold flex-1">{booking.service.name}</span>
              <span className="text-sm font-black text-kazi-orange">{formatCurrency(booking.totalAmount)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{booking.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400">{fmtDate(booking.scheduledDate, booking.scheduledTime)}</span>
          </div>
        </div>

        <a href={`tel:${booking.customer.phone}`}
          className="flex items-center gap-1.5 text-xs text-kazi-green mb-3 hover:underline w-fit">
          <Phone className="w-3.5 h-3.5" />
          {booking.customer.phone}
        </a>

        {/* Future booking — locked */}
        {when === "future" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-amber-700 font-bold text-sm">
              📅 {days === 1 ? `${bookingLabel} is Tomorrow` : `${bookingLabel} is in ${days} days`}
            </p>
            <p className="text-amber-600 text-xs mt-1">
              {days === 1
                ? `Action buttons unlock tomorrow at ${booking.scheduledTime}`
                : `Action buttons unlock on ${formattedDate}`}
            </p>
          </div>
        )}

        {/* Today — show action buttons */}
        {when === "today" && booking.status !== "COMPLETED" && (
          <div className="space-y-2">
            {/* Mobile providers: EN_ROUTE and ARRIVED */}
            {canMove && booking.status === "ACCEPTED" && (
              <button onClick={() => updateStatus("EN_ROUTE")} disabled={loading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🚗"}
                I am On My Way
              </button>
            )}
            {canMove && booking.status === "EN_ROUTE" && (
              <button onClick={() => updateStatus("ARRIVED")} disabled={loading}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "📍"}
                I Have Arrived
              </button>
            )}

            {/* All providers: IN_PROGRESS */}
            {(booking.status === "ACCEPTED" || booking.status === "ARRIVED") && (
              <button onClick={() => updateStatus("IN_PROGRESS")} disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "⚡"}
                {canMove ? "Started Working" : "Service Started"}
              </button>
            )}

            {/* All providers: COMPLETED */}
            {(booking.status === "ACCEPTED" || booking.status === "EN_ROUTE" || booking.status === "ARRIVED" || booking.status === "IN_PROGRESS") && (
              <button onClick={() => updateStatus("COMPLETED")} disabled={loading}
                className="w-full py-3 bg-kazi-green hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✅"}
                {canMove ? "Job Complete" : "Service Complete"}
              </button>
            )}
          </div>
        )}

        {booking.status === "COMPLETED" && (
          <div className="flex items-center justify-center gap-2 py-2">
            <CheckCircle className="w-4 h-4 text-kazi-green" />
            <span className="text-xs text-kazi-green font-bold">{bookingLabel} Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-kazi-dark rounded-2xl p-5 border border-white/10 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded-full w-1/3" />
          <div className="h-2 bg-white/10 rounded-full w-1/4" />
        </div>
        <div className="w-14 h-14 rounded-full bg-white/10" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-white/10 rounded-full w-2/3" />
        <div className="h-3 bg-white/10 rounded-full w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-white/10 rounded-2xl" />
        <div className="h-12 bg-white/10 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ProviderNotificationsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token");
    const u = localStorage.getItem("kazishow_user");
    if (t) setToken(t);
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
  }, []);

  const fetchBookings = useCallback(async (jwt: string) => {
    try {
      const res = await fetch(`${API}/api/bookings`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(Array.isArray(data.data?.bookings) ? data.data.bookings : []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchBookings(token);
    // Fetch subscription status for non-FUNDI providers
    const u = localStorage.getItem("kazishow_user");
    if (u) {
      try {
        const parsed = JSON.parse(u);
        if (parsed.provider?.category && parsed.provider.category !== "FUNDI") {
          fetch(`${API}/api/subscriptions/my`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setSubscription(d.data); })
            .catch(() => {});
        }
      } catch {}
    }
  }, [token, fetchBookings]);

  // Real-time socket
  useEffect(() => {
    if (!token || !user?.id) return;
    const socket = io(API, { auth: { token }, transports: ["websocket"] });
    socket.on("connect", () => socket.emit("join", user.id));
    socket.on("new_booking", (payload: { booking: Booking }) => {
      setBookings((prev) => {
        if (prev.find((b) => b.id === payload.booking.id)) return prev;
        return [payload.booking, ...prev];
      });
      toast("🔔 New booking request!", { icon: "📋" });
    });
    socket.on("booking_cancelled", (data: any) => {
      const id = data.bookingId || data.booking?.id;
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
    });
    return () => { socket.disconnect(); };
  }, [token, user?.id]);

  const handlePendingAction = useCallback((id: string, result: "accepted" | "declined" | "expired") => {
    setTimeout(() => {
      if (result === "accepted") {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "ACCEPTED" } : b));
      } else {
        setBookings((prev) => prev.filter((b) => b.id !== id));
      }
    }, 2500);
  }, []);

  const handleStatusUpdated = useCallback((id: string, status: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
  }, []);

  // ─── Not logged in ─────────────────────────────────────────────────────────

  if (!loading && !token) {
    return (
      <div className="min-h-screen bg-kazi-dark">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <BellOff className="w-16 h-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Sign in required</h2>
          <Link href="/auth/login"
            className="mt-4 px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all">
            Log In
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Not a provider ────────────────────────────────────────────────────────

  if (!loading && user && user.role !== "PROVIDER") {
    return (
      <div className="min-h-screen bg-kazi-dark">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <span className="text-6xl mb-4">🔒</span>
          <h2 className="text-xl font-black text-white mb-2">Providers only</h2>
          <p className="text-sm text-gray-400">Register as a provider to manage bookings.</p>
          <Link href="/"
            className="mt-6 px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all">
            Go Home
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Derived values ────────────────────────────────────────────────────────

  const category = user?.provider?.category || "";
  const description = user?.provider?.description || "";
  const pageTitle = getPageTitle(category);
  const bookingLabel = getBookingLabel(category);

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const activeBookings  = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const pendingCount    = pendingBookings.length;

  return (
    <div className="min-h-screen bg-kazi-dark">
      <Navbar />
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1a1714", color: "#f8f7f4", borderRadius: "12px" },
      }} />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-kazi-orange/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-kazi-orange" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white leading-tight">{pageTitle}</h1>
            <p className="text-xs text-gray-400">
              {user?.provider?.businessName || "Manage your incoming bookings"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="min-w-[26px] h-[26px] px-1.5 bg-kazi-orange text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
            <button
              onClick={() => token && fetchBookings(token)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Subscription status banner (non-FUNDI only) */}
        {!loading && subscription && category !== "FUNDI" && (
          <div className={`mb-4 p-3 rounded-2xl flex items-center justify-between border ${
            subscription.isActive
              ? "bg-green-900/30 border-green-500/30"
              : "bg-red-900/30 border-red-500/30"
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{subscription.isActive ? "✅" : "❌"}</span>
              <div>
                <p className={`text-xs font-bold ${subscription.isActive ? "text-green-400" : "text-red-400"}`}>
                  {subscription.subscription?.status === "TRIAL"
                    ? `Free Trial — ${subscription.daysRemaining} day${subscription.daysRemaining !== 1 ? "s" : ""} left`
                    : subscription.isActive
                    ? `${subscription.subscription?.plan} Plan — ${subscription.daysRemaining} days left`
                    : "Subscription Expired"}
                </p>
                {!subscription.isActive && (
                  <p className="text-xs text-red-400">Renew to receive bookings</p>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push("/provider/subscription")}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                subscription.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {subscription.isActive ? "Manage" : "Renew Now"}
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-4"><Skeleton /><Skeleton /></div>
        )}

        {!loading && (
          <>
            {/* ── Pending requests ── */}
            {pendingBookings.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-kazi-orange animate-pulse" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wide">
                    New Requests
                  </h2>
                  <span className="text-xs text-gray-500">— respond within 30 seconds</span>
                </div>
                <div className="space-y-4">
                  {pendingBookings.map((b) => (
                    <PendingCard
                      key={b.id}
                      booking={b}
                      token={token!}
                      bookingLabel={bookingLabel}
                      onAction={handlePendingAction}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Active bookings ── */}
            {activeBookings.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wide">
                    Active {bookingLabel}s
                  </h2>
                </div>
                <div className="space-y-4">
                  {activeBookings.map((b) => (
                    <ActiveCard
                      key={b.id}
                      booking={b}
                      token={token!}
                      category={category}
                      description={description}
                      bookingLabel={bookingLabel}
                      onUpdated={handleStatusUpdated}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Empty state ── */}
            {pendingBookings.length === 0 && activeBookings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Bell className="w-10 h-10 text-gray-600" />
                </div>
                <h2 className="text-lg font-black text-white mb-1">No active bookings</h2>
                <p className="text-sm text-gray-500 mb-4">
                  New {bookingLabel.toLowerCase()} requests will appear here instantly.
                </p>
                <Link href="/provider/earnings"
                  className="flex items-center gap-1.5 text-kazi-orange text-sm font-bold hover:underline">
                  View Earnings <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
