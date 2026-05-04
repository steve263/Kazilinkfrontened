"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import {
  Bell, CheckCheck, BellOff, ArrowRight, Calendar,
  MapPin, Clock, Loader2, RefreshCw, Navigation,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const COUNTDOWN_TOTAL = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

type NType =
  | "NEW_BOOKING"
  | "BOOKING_ACCEPTED"
  | "BOOKING_DECLINED"
  | "BOOKING_COMPLETED"
  | "PAYMENT_RECEIVED"
  | "BOOKING_REMINDER"
  | "SYSTEM";

interface Notif {
  id: string;
  type: NType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  bookingId?: string;
  booking?: { id: string; status: string; totalAmount: number };
  isNew?: boolean;
  // UI-only: accepted/declined after inline action
  _actionDone?: "ACCEPTED" | "DECLINED";
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CFG: Record<NType, { emoji: string; accent: string; bg: string }> = {
  NEW_BOOKING:       { emoji: "📋", accent: "border-l-kazi-orange", bg: "bg-orange-50" },
  BOOKING_ACCEPTED:  { emoji: "✅", accent: "border-l-kazi-green",  bg: "bg-green-50"  },
  BOOKING_DECLINED:  { emoji: "❌", accent: "border-l-red-400",     bg: "bg-red-50"    },
  BOOKING_COMPLETED: { emoji: "🎉", accent: "border-l-blue-400",    bg: "bg-blue-50"   },
  PAYMENT_RECEIVED:  { emoji: "💚", accent: "border-l-kazi-green",  bg: "bg-green-50"  },
  BOOKING_REMINDER:  { emoji: "⏰", accent: "border-l-amber-400",   bg: "bg-amber-50"  },
  SYSTEM:            { emoji: "📣", accent: "border-l-gray-300",    bg: "bg-gray-50"   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function dateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return "This week";
  return "Earlier";
}

function navLink(type: NType, isProvider: boolean, bookingId?: string): string | null {
  if (type === "NEW_BOOKING" && isProvider) return "/provider/requests";
  if (type === "BOOKING_ACCEPTED" && !isProvider) return "/booking";
  if (type === "BOOKING_DECLINED" && !isProvider) return "/discover";
  if (type === "BOOKING_COMPLETED") return "/booking";
  if (type === "PAYMENT_RECEIVED") return "/booking";
  if (type === "SYSTEM") return isProvider ? "/provider/requests" : "/booking";
  return null;
}

function secondsRemaining(createdAt: string): number {
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  return Math.max(0, COUNTDOWN_TOTAL - elapsed);
}

// ─── Countdown ring ───────────────────────────────────────────────────────────

function CountdownRing({ seconds }: { seconds: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - seconds / COUNTDOWN_TOTAL);
  const urgent = seconds <= 10;
  return (
    <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
        <circle
          cx="19" cy="19" r={r} fill="none"
          stroke={urgent ? "#ef4444" : "#FF6B2B"}
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className={`text-[10px] font-black ${urgent ? "text-red-500" : "text-kazi-orange"}`}>
        {seconds}s
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse border-l-4 border-l-gray-200 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="h-2.5 bg-gray-100 rounded-full w-3/4" />
        <div className="h-2 bg-gray-100 rounded-full w-1/4" />
      </div>
    </div>
  );
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({
  n,
  isProvider,
  token,
  onRead,
  onAction,
}: {
  n: Notif;
  isProvider: boolean;
  token: string;
  onRead: (id: string) => void;
  onAction: (id: string, done: "ACCEPTED" | "DECLINED") => void;
}) {
  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
  const link = navLink(n.type, isProvider, n.bookingId);
  const [secs, setSecs] = useState(() => secondsRemaining(n.createdAt));
  const [acting, setActing] = useState<"accept" | "decline" | null>(null);

  const isNewBooking = n.type === "NEW_BOOKING" && isProvider && n.bookingId;
  const actionDone = n._actionDone;
  const expired = secs <= 0;
  const showCountdown = isNewBooking && !actionDone && !expired;
  const showActions = isNewBooking && !actionDone && !expired;

  // Live countdown ticker
  useEffect(() => {
    if (!isNewBooking || actionDone) return;
    if (secs <= 0) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [isNewBooking, actionDone, secs]);

  const handleAction = async (action: "accept" | "decline", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActing(action);
    try {
      const endpoint = action === "accept" ? "accept" : "decline";
      const res = await fetch(`${API}/api/bookings/${n.bookingId}/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const done = action === "accept" ? "ACCEPTED" : "DECLINED";
        onAction(n.id, done);
        onRead(n.id);
      }
    } finally {
      setActing(null);
    }
  };

  const cardContent = (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className={`
        relative bg-white rounded-2xl shadow-sm p-4 flex gap-3
        border-l-4 ${cfg.accent}
        ${!n.isRead ? cfg.bg : ""}
        ${n.isNew ? "animate-slide-in" : ""}
        transition-all hover:brightness-[0.985] cursor-pointer
      `}
    >
      {/* Unread dot */}
      {!n.isRead && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-kazi-orange" />
      )}

      {/* Icon / countdown */}
      {showCountdown ? (
        <CountdownRing seconds={secs} />
      ) : (
        <div className="w-10 h-10 rounded-full bg-orange-50 flex-shrink-0 flex items-center justify-center text-xl select-none">
          {cfg.emoji}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug text-kazi-dark ${!n.isRead ? "font-black" : "font-semibold"}`}>
            {n.title}
          </p>
          {link && !showActions && (
            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
          {n.body}
        </p>
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>

        {/* Booking amount pill */}
        {n.booking?.totalAmount != null && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-kazi-orange bg-orange-50 px-2 py-0.5 rounded-full">
            💰 KSh {n.booking.totalAmount.toLocaleString()}
          </span>
        )}

        {/* Track Provider shortcut for active bookings */}
        {!isProvider && n.bookingId && ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(n.booking?.status ?? "") && (
          <Link
            href={`/tracking/${n.bookingId}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500 text-white text-[11px] font-bold rounded-full hover:bg-cyan-600 transition-colors"
          >
            <Navigation className="w-3 h-3" /> Track Provider
          </Link>
        )}

        {/* Expired badge */}
        {isNewBooking && expired && !actionDone && (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            ⏰ Expired — customer moved on
          </span>
        )}

        {/* Accept / Decline buttons */}
        {showActions && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => handleAction("decline", e)}
              disabled={!!acting}
              className="flex-1 py-2 rounded-xl border-2 border-red-400 text-red-500 text-xs font-bold hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {acting === "decline" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "❌"} Decline
            </button>
            <button
              onClick={(e) => handleAction("accept", e)}
              disabled={!!acting}
              className="flex-[2] py-2 rounded-xl bg-kazi-green text-white text-xs font-bold hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {acting === "accept" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "✅"} Accept Job
            </button>
          </div>
        )}

        {/* Done badge */}
        {actionDone && isProvider && n.type === "NEW_BOOKING" && (
          <div className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            actionDone === "ACCEPTED" ? "bg-green-50 text-kazi-green" : "bg-red-50 text-red-500"
          }`}>
            {actionDone === "ACCEPTED" ? "✅ Accepted" : "❌ Declined"}
          </div>
        )}
      </div>
    </div>
  );

  if (link && !showActions) {
    return <Link href={link} className="block">{cardContent}</Link>;
  }
  return cardContent;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  const isProvider = user?.role === "PROVIDER";

  const fetchNotifs = useCallback(async (jwt: string, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifs(data.data?.notifications ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const jwt = localStorage.getItem("kazishow_token") ?? "";
    const raw = localStorage.getItem("kazishow_user");
    if (!jwt) { setLoading(false); return; }
    setToken(jwt);
    if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
    fetchNotifs(jwt);
  }, [fetchNotifs]);

  // Socket.io — real-time push
  useEffect(() => {
    if (!token || !user?.id) return;

    const socket = io(API, { transports: ["websocket"] });
    socket.on("connect", () => socket.emit("join", user.id));
    socketRef.current = socket;

    const push = (type: NType, title: string, body: string, bookingId?: string, amount?: number) => {
      const n: Notif = {
        id: `local-${Date.now()}`,
        type,
        title,
        body,
        isRead: false,
        createdAt: new Date().toISOString(),
        bookingId,
        booking: amount != null ? { id: bookingId ?? "", status: "", totalAmount: amount } : undefined,
        isNew: true,
      };
      setNotifs((prev) => [n, ...prev]);
      setTimeout(() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, isNew: false } : x)), 600);
    };

    socket.on("new_booking", (p: any) =>
      push("NEW_BOOKING", "New Booking Request 📋",
        p.customer?.name ? `${p.customer.name} wants to book you` : "A customer sent you a request",
        p.booking?.id, p.booking?.totalAmount)
    );
    socket.on("booking_accepted", (p: any) =>
      push("BOOKING_ACCEPTED", "Booking Accepted! ✅",
        p.providerName ? `${p.providerName} accepted and is on the way` : "Your booking was accepted",
        p.booking?.id)
    );
    socket.on("booking_declined", (p: any) =>
      push("BOOKING_DECLINED", "Booking Declined ❌",
        "Your request was declined. Try another provider.",
        p.booking?.id)
    );
    socket.on("provider_en_route", (p: any) =>
      push("SYSTEM", `${p.providerName ?? "Provider"} is on the way 🚗`,
        "Get ready — your provider is heading to you!", p.booking?.id)
    );
    socket.on("provider_arrived", (p: any) =>
      push("SYSTEM", `${p.providerName ?? "Provider"} has arrived 📍`,
        "Your provider is at your location.", p.booking?.id)
    );
    socket.on("booking_in_progress", (p: any) =>
      push("SYSTEM", "Job in Progress ▶",
        `${p.providerName ?? "Provider"} has started your job.`, p.booking?.id)
    );
    socket.on("booking_completed", (p: any) =>
      push("BOOKING_COMPLETED", "Job Complete! 🎉",
        `Please rate ${p.providerName ?? "your provider"}.`, p.booking?.id)
    );
    socket.on("order_status_update", (p: any) => {
      const msgs: Record<string, [string, string]> = {
        PREPARING: ["Order Being Prepared 👨‍🍳", `${p.providerName} is preparing your order`],
        READY:     ["Order Ready! 🎉",            `Your order at ${p.providerName} is ready`],
        COMPLETED: ["Order Complete ✅",           `Your order at ${p.providerName} is done`],
      };
      const [title, body] = msgs[p.status] ?? ["Order Updated", `Status: ${p.status}`];
      push("SYSTEM", title, body, p.booking?.id);
    });
    socket.on("payment_received", (p: any) =>
      push("PAYMENT_RECEIVED", "Payment Confirmed 💚",
        p.amount ? `KSh ${p.amount} received. Ref: ${p.mpesaRef}` : "Payment confirmed", p.bookingId, p.amount)
    );
    socket.on("booking_cancelled", (p: any) =>
      push("SYSTEM", "Booking Cancelled",
        "A booking was cancelled.", p.bookingId)
    );

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, user?.id]);

  const markRead = useCallback(async (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    if (id.startsWith("local-")) return;
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }, [token]);

  const markAllRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }, [token]);

  const onAction = useCallback((id: string, done: "ACCEPTED" | "DECLINED") => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, _actionDone: done } : n));
  }, []);

  const unread = notifs.filter((n) => !n.isRead).length;

  // Group by date
  const groups: Record<string, Notif[]> = {};
  const ORDER = ["Today", "Yesterday", "This week", "Earlier"];
  for (const n of notifs) {
    const g = dateGroup(n.createdAt);
    (groups[g] ??= []).push(n);
  }

  // Not logged in
  if (!loading && !token) {
    return (
      <div className="min-h-screen bg-kazi-cream">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <BellOff className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-black text-kazi-dark mb-2">Sign in to see notifications</h2>
          <p className="text-sm text-gray-500 mb-6">Log in to track your bookings in real time.</p>
          <Link href="/auth/login" className="px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all">
            Log In
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-kazi-orange" />
            <h1 className="text-xl font-black text-kazi-dark">Notifications</h1>
            {unread > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 bg-kazi-orange text-white text-xs font-black rounded-full flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifs(token, true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white hover:bg-gray-100 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-semibold text-kazi-orange hover:text-orange-600 transition-colors px-3 py-2 bg-white rounded-xl shadow-sm"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Provider quick-link banner */}
        {isProvider && (
          <Link
            href="/provider/requests"
            className="flex items-center justify-between gap-3 bg-kazi-dark text-white rounded-2xl px-4 py-3 mb-4 hover:bg-gray-900 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <span className="text-sm font-bold">View all incoming requests</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && notifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4">🎉</span>
            <h2 className="text-lg font-black text-kazi-dark mb-1">All caught up!</h2>
            <p className="text-sm text-gray-400">No notifications right now.</p>
          </div>
        )}

        {/* Grouped list */}
        {!loading && notifs.length > 0 && (
          <div className="space-y-6">
            {ORDER.filter((g) => groups[g]?.length).map((group) => (
              <div key={group}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">
                  {group}
                </p>
                <div className="space-y-2.5">
                  {groups[group].map((n) => (
                    <NotifCard
                      key={n.id}
                      n={n}
                      isProvider={isProvider}
                      token={token}
                      onRead={markRead}
                      onAction={onAction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
