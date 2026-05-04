"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import {
  Bell, CheckCircle, XCircle, MapPin, Clock,
  Phone, ChevronRight, BellOff, Loader2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRequest {
  id: string;
  customer: { id: string; name: string; phone: string; location?: string };
  service?: { name: string; price: number };
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  status: string;
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

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
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
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

// ─── Booking request card ─────────────────────────────────────────────────────

function BookingCard({
  booking,
  token,
  onAction,
}: {
  booking: BookingRequest;
  token: string;
  onAction: (id: string, action: "accepted" | "declined" | "expired") => void;
}) {
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | "expired" | null>(null);

  const remaining = useCountdown(30, () => {
    if (!done) {
      setDone("expired");
      onAction(booking.id, "expired");
    }
  });

  const handleAction = async (action: "accept" | "decline") => {
    setLoading(action);
    try {
      const endpoint = action === "accept" ? "accept" : "decline";
      const res = await fetch(`http://localhost:5000/api/bookings/${booking.id}/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const result = action === "accept" ? "accepted" : "declined";
        setDone(result);
        onAction(booking.id, result);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(null);
    }
  };

  const circumference = 2 * Math.PI * 26;
  const progress = (remaining / 30) * circumference;
  const isUrgent = remaining <= 10;

  if (done === "accepted") {
    return (
      <div className="bg-kazi-dark rounded-2xl p-5 border border-kazi-green/40 flex items-center gap-4 animate-slide-in">
        <div className="w-12 h-12 rounded-full bg-kazi-green/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-kazi-green" />
        </div>
        <div>
          <p className="font-black text-white">Accepted!</p>
          <p className="text-xs text-gray-400">You accepted {booking.customer.name}'s request</p>
        </div>
      </div>
    );
  }

  if (done === "declined" || done === "expired") {
    return (
      <div className="bg-kazi-dark rounded-2xl p-5 border border-red-500/30 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="font-bold text-white">{done === "expired" ? "Request Expired" : "Declined"}</p>
          <p className="text-xs text-gray-400">
            {done === "expired" ? "No response in 30 seconds" : `Declined ${booking.customer.name}'s request`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-kazi-dark rounded-2xl overflow-hidden border transition-all ${
      isUrgent ? "border-red-500/60" : "border-kazi-orange/40"
    } animate-slide-in`}>
      {/* Urgency bar */}
      <div className={`h-1 transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-kazi-orange"}`}
        style={{ width: `${(remaining / 30) * 100}%` }} />

      <div className="p-5">
        {/* Header: customer + timer */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-kazi-orange/20 flex items-center justify-center text-xl font-black text-kazi-orange flex-shrink-0">
              {booking.customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">{booking.customer.name}</p>
              <p className="text-xs text-gray-400">New booking request</p>
            </div>
          </div>

          {/* Circular countdown */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="26" fill="none"
                  stroke={isUrgent ? "#ef4444" : "#FF6B2B"}
                  strokeOpacity="0.2" strokeWidth="4" />
                <circle cx="30" cy="30" r="26" fill="none"
                  stroke={isUrgent ? "#ef4444" : "#FF6B2B"}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  strokeLinecap="round"
                  className="transition-all duration-1000" />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${
                isUrgent ? "text-red-400" : "text-kazi-orange"
              }`}>
                {remaining}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5">seconds</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {booking.service && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-kazi-orange/10 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-kazi-orange" />
              </div>
              <span className="text-sm text-white font-semibold">{booking.service.name}</span>
              <span className="ml-auto text-sm font-black text-kazi-orange">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-kazi-orange/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-kazi-orange" />
            </div>
            <span className="text-sm text-gray-300 truncate">{booking.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-kazi-orange/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-kazi-orange" />
            </div>
            <span className="text-sm text-gray-300">
              {new Date(booking.scheduledDate).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })} · {booking.scheduledTime}
            </span>
          </div>
          {booking.notes && (
            <div className="mt-2 px-3 py-2 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400 italic">"{booking.notes}"</p>
            </div>
          )}
        </div>

        {/* Call customer */}
        <a
          href={`tel:${booking.customer.phone}`}
          className="flex items-center gap-2 text-xs text-kazi-green mb-4 hover:underline"
        >
          <Phone className="w-3.5 h-3.5" />
          Call {booking.customer.name}: {booking.customer.phone}
        </a>

        {/* Accept / Decline */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction("decline")}
            disabled={!!loading}
            className="py-3.5 bg-white/10 text-white font-bold rounded-2xl hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading === "decline"
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <XCircle className="w-4 h-4" />}
            Decline
          </button>
          <button
            onClick={() => handleAction("accept")}
            disabled={!!loading}
            className="py-3.5 bg-kazi-green text-white font-bold rounded-2xl hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-900/40"
          >
            {loading === "accept"
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle className="w-4 h-4" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderNotificationsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("kazishow_token");
    const savedUser = localStorage.getItem("kazishow_user");
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
  }, []);

  // Fetch pending bookings for this provider
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    const fetchPending = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/bookings?status=PENDING", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setBookings(Array.isArray(data.data?.bookings) ? data.data.bookings : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [token]);

  // Socket.io — listen for new incoming bookings in real time
  useEffect(() => {
    if (!token || !user?.id) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("join", user.id);
    });

    socket.on("new_booking", (payload: { booking: BookingRequest }) => {
      setBookings((prev) => {
        // avoid duplicates
        if (prev.find((b) => b.id === payload.booking.id)) return prev;
        return [payload.booking, ...prev];
      });
    });

    return () => { socket.disconnect(); };
  }, [token, user?.id]);

  const handleAction = useCallback((id: string, action: "accepted" | "declined" | "expired") => {
    // After a short delay, remove completed cards to keep the list clean
    setTimeout(() => {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }, 3000);
  }, []);

  if (!loading && !token) {
    return (
      <div className="min-h-screen bg-kazi-dark">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <BellOff className="w-16 h-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Sign in required</h2>
          <Link href="/auth/login" className="mt-4 px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all">
            Log In
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!loading && user && user.role !== "PROVIDER") {
    return (
      <div className="min-h-screen bg-kazi-dark">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <span className="text-6xl mb-4">🔧</span>
          <h2 className="text-xl font-black text-white mb-2">This page is for Fundi providers only</h2>
          <p className="text-sm text-gray-400">Only verified Fundi providers can receive and manage booking requests.</p>
          <Link href="/" className="mt-6 px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all">
            Go Home
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!loading && user?.provider?.category && user.provider.category !== "FUNDI") {
    return (
      <div className="min-h-screen bg-kazi-dark">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <span className="text-6xl mb-4">🏪</span>
          <h2 className="text-xl font-black text-white mb-2">This page is for Fundi providers only</h2>
          <p className="text-sm text-gray-400">Business owners (shops, hotels, restaurants) do not use this booking flow.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.status === "PENDING");

  return (
    <div className="min-h-screen bg-kazi-dark">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-kazi-orange/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-kazi-orange" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Booking Requests</h1>
            <p className="text-xs text-gray-400">Accept or decline in 30 seconds</p>
          </div>
          {activeBookings.length > 0 && (
            <span className="ml-auto min-w-[26px] h-[26px] px-1.5 bg-kazi-orange text-white text-xs font-black rounded-full flex items-center justify-center">
              {activeBookings.length}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <Skeleton />
            <Skeleton />
          </div>
        )}

        {/* Empty state */}
        {!loading && bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-lg font-black text-white mb-1">No pending requests</h2>
            <p className="text-sm text-gray-500">New booking requests will appear here instantly.</p>
          </div>
        )}

        {/* Booking cards */}
        {!loading && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                token={token!}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
