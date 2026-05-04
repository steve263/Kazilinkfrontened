"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import {
  ShoppingBag, MapPin, Clock, Phone, CheckCircle,
  ChevronRight, Loader2, RefreshCw, BellOff, XCircle, Zap,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { formatCurrency } from "@/lib/utils";
import { toast, Toaster } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "DECLINED";

interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes?: string;
  createdAt: string;
  customer: { id: string; name: string; phone: string };
  service?: { name: string; price: number };
  provider: { businessName: string; category: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const BUSINESS_CATEGORIES = ["SHOP", "HOTEL", "RESTAURANT", "TECH", "PROFESSIONAL", "BUSINESS"];
const PENDING_SECONDS = 20;

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDING:    { label: "New Request", color: "text-kazi-orange",  bg: "bg-orange-500/20", dot: "bg-kazi-orange" },
  ACCEPTED:   { label: "Accepted",    color: "text-blue-400",     bg: "bg-blue-500/20",   dot: "bg-blue-400"   },
  PREPARING:  { label: "Preparing",   color: "text-yellow-400",   bg: "bg-yellow-500/20", dot: "bg-yellow-400" },
  READY:      { label: "Ready",       color: "text-kazi-green",   bg: "bg-green-500/20",  dot: "bg-kazi-green" },
  COMPLETED:  { label: "Completed",   color: "text-gray-400",     bg: "bg-gray-500/20",   dot: "bg-gray-400"   },
  CANCELLED:  { label: "Cancelled",   color: "text-red-400",      bg: "bg-red-500/20",    dot: "bg-red-400"    },
  DECLINED:   { label: "Declined",    color: "text-red-400",      bg: "bg-red-500/20",    dot: "bg-red-400"    },
};

const NEXT_ACTION: Record<string, { label: string; next: string; color: string } | null> = {
  ACCEPTED:  { label: "Start Preparing",  next: "PREPARING", color: "bg-yellow-500 hover:bg-yellow-600"  },
  PREPARING: { label: "Mark Ready",       next: "READY",     color: "bg-kazi-green hover:bg-green-600"   },
  READY:     { label: "Complete Order",   next: "COMPLETED", color: "bg-kazi-orange hover:bg-orange-600" },
  COMPLETED: null,
  CANCELLED: null,
  DECLINED:  null,
  PENDING:   null,
};

const TABS = [
  { key: "pending",   label: "New",       statuses: ["PENDING"] },
  { key: "active",    label: "Active",    statuses: ["ACCEPTED", "PREPARING", "READY"] },
  { key: "completed", label: "Done",      statuses: ["COMPLETED", "DECLINED", "CANCELLED"] },
  { key: "all",       label: "All",       statuses: [] },
];

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Countdown Ring ───────────────────────────────────────────────────────────

function CountdownRing({ seconds }: { seconds: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const progress = Math.max(0, seconds / PENDING_SECONDS);
  const urgent = seconds <= 7;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#374151" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke={urgent ? "#ef4444" : "#f97316"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className={`text-xs font-black ${urgent ? "text-red-400" : "text-kazi-orange"}`}>
        {seconds}s
      </span>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  token,
  timer,
  onUpdated,
  onAccept,
  onDecline,
}: {
  order: Order;
  token: string;
  timer?: number;
  onUpdated: (id: string, status: OrderStatus) => void;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"accept" | "decline" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const meta = STATUS_META[order.status] ?? STATUS_META.ACCEPTED;
  const nextAction = NEXT_ACTION[order.status];
  const expired = order.status === "PENDING" && (timer ?? PENDING_SECONDS) <= 0;

  const handleStatusUpdate = async () => {
    if (!nextAction) return;
    if (nextAction.next === "COMPLETED" && !confirmOpen) { setConfirmOpen(true); return; }
    setConfirmOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bookings/${order.id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextAction.next }),
      });
      const data = await res.json();
      if (data.success) onUpdated(order.id, nextAction.next as OrderStatus);
      else toast.error(data.message);
    } catch { toast.error("Failed to update"); }
    finally { setLoading(false); }
  };

  const handleAccept = async () => {
    setActionLoading("accept");
    try {
      const res = await fetch(`${API}/api/bookings/${order.id}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast.success("Order accepted!"); onAccept(order.id); }
      else toast.error(data.message);
    } catch { toast.error("Failed to accept"); }
    finally { setActionLoading(null); }
  };

  const handleDecline = async () => {
    setActionLoading("decline");
    try {
      const res = await fetch(`${API}/api/bookings/${order.id}/decline`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast("Order declined"); onDecline(order.id); }
      else toast.error(data.message);
    } catch { toast.error("Failed to decline"); }
    finally { setActionLoading(null); }
  };

  const categoryEmoji: Record<string, string> = {
    RESTAURANT: "🍽️", SHOP: "🛒", HOTEL: "🏨", TECH: "💻",
    PROFESSIONAL: "⚖️", BUSINESS: "💼",
  };

  return (
    <div className={`bg-kazi-dark rounded-2xl overflow-hidden border transition-all ${
      order.status === "PENDING"   ? "border-kazi-orange/60 shadow-lg shadow-orange-500/10" :
      order.status === "ACCEPTED"  ? "border-blue-400/40" :
      order.status === "PREPARING" ? "border-yellow-400/40" :
      order.status === "READY"     ? "border-kazi-green/50" :
      "border-white/10"
    }`}>
      <div className={`h-1 ${
        order.status === "PENDING"   ? "bg-kazi-orange animate-pulse" :
        order.status === "ACCEPTED"  ? "bg-blue-400" :
        order.status === "PREPARING" ? "bg-yellow-400" :
        order.status === "READY"     ? "bg-kazi-green" :
        order.status === "COMPLETED" ? "bg-gray-500" : "bg-red-500"
      }`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-kazi-orange/20 flex items-center justify-center text-lg font-black text-kazi-orange flex-shrink-0">
              {order.customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight">{order.customer.name}</p>
              <p className="text-[11px] text-gray-500">{timeAgo(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.status === "PENDING" && !expired && timer !== undefined && (
              <CountdownRing seconds={timer} />
            )}
            {order.status === "PENDING" && expired && (
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                Expired
              </span>
            )}
            {order.status !== "PENDING" && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${meta.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* NEW REQUEST banner */}
        {order.status === "PENDING" && !expired && (
          <div className="flex items-center gap-2 px-3 py-2 bg-kazi-orange/10 border border-kazi-orange/30 rounded-xl mb-3">
            <Zap className="w-3.5 h-3.5 text-kazi-orange flex-shrink-0" />
            <p className="text-xs text-kazi-orange font-bold">
              New booking request — accept or decline
            </p>
          </div>
        )}

        {/* Order details */}
        <div className="space-y-1.5 mb-3">
          {order.service && (
            <div className="flex items-center gap-2">
              <span className="text-base">{categoryEmoji[order.provider?.category] ?? "📦"}</span>
              <span className="text-sm text-white font-semibold flex-1">{order.service.name}</span>
              <span className="text-sm font-black text-kazi-orange">{formatCurrency(order.totalAmount)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{order.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400">
              {new Date(order.scheduledDate).toLocaleDateString("en-KE", {
                weekday: "short", month: "short", day: "numeric",
              })} · {order.scheduledTime}
            </span>
          </div>
          {order.notes && (
            <div className="mt-1.5 px-3 py-2 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400 italic">"{order.notes}"</p>
            </div>
          )}
        </div>

        {/* Call customer */}
        <a
          href={`tel:${order.customer.phone}`}
          className="flex items-center gap-1.5 text-xs text-kazi-green mb-3 hover:underline w-fit"
        >
          <Phone className="w-3.5 h-3.5" />
          {order.customer.phone}
        </a>

        {/* PENDING: Accept / Decline */}
        {order.status === "PENDING" && !expired && (
          <div className="flex gap-2">
            <button
              onClick={handleDecline}
              disabled={actionLoading !== null}
              className="flex-1 py-2.5 rounded-xl border-2 border-red-500/60 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {actionLoading === "decline" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={actionLoading !== null}
              className="flex-[2] py-2.5 rounded-xl bg-kazi-green text-white text-sm font-bold hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {actionLoading === "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Accept Order
            </button>
          </div>
        )}

        {/* Confirm completion */}
        {confirmOpen && (
          <div className="mb-3 p-3 bg-kazi-orange/10 border border-kazi-orange/30 rounded-xl">
            <p className="text-xs font-bold text-white mb-2">Confirm order is 100% complete?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all"
              >
                No
              </button>
              <button
                onClick={handleStatusUpdate}
                className="flex-1 py-2 bg-kazi-green text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-all"
              >
                Yes, complete
              </button>
            </div>
          </div>
        )}

        {/* Active status: next action button */}
        {nextAction && !confirmOpen && order.status !== "PENDING" && (
          <button
            onClick={handleStatusUpdate}
            disabled={loading}
            className={`w-full py-3 text-white text-sm font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${nextAction.color}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {nextAction.label}
          </button>
        )}

        {order.status === "COMPLETED" && (
          <div className="flex items-center justify-center gap-2 py-2">
            <CheckCircle className="w-4 h-4 text-kazi-green" />
            <span className="text-xs text-kazi-green font-bold">Order Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-kazi-dark rounded-2xl p-4 border border-white/10 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-white/10 rounded-full w-1/3" />
          <div className="h-2 bg-white/10 rounded-full w-1/4" />
        </div>
        <div className="h-5 w-20 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-white/10 rounded-full w-2/3" />
        <div className="h-3 bg-white/10 rounded-full w-1/2" />
      </div>
      <div className="h-11 bg-white/10 rounded-2xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [timers, setTimers] = useState<Record<string, number>>({});

  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token");
    const u = localStorage.getItem("kazishow_user");
    if (t) setToken(t);
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
  }, []);

  const fetchOrders = useCallback(async (jwt: string) => {
    try {
      const res = await fetch(`${API}/api/bookings`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(Array.isArray(data.data?.bookings) ? data.data.bookings : []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchOrders(token);
  }, [token, fetchOrders]);

  // Countdown timers for PENDING orders
  useEffect(() => {
    const pending = orders.filter((o) => o.status === "PENDING");

    pending.forEach((o) => {
      if (intervalRefs.current[o.id]) return;

      setTimers((prev) => {
        if (prev[o.id] !== undefined) return prev;
        return { ...prev, [o.id]: PENDING_SECONDS };
      });

      const interval = setInterval(() => {
        setTimers((prev) => {
          const current = prev[o.id] ?? PENDING_SECONDS;
          if (current <= 0) {
            clearInterval(intervalRefs.current[o.id]);
            delete intervalRefs.current[o.id];
            return prev;
          }
          return { ...prev, [o.id]: current - 1 };
        });
      }, 1000);

      intervalRefs.current[o.id] = interval;
    });

    // Clean up timers for non-pending orders
    Object.keys(intervalRefs.current).forEach((id) => {
      const order = orders.find((o) => o.id === id);
      if (!order || order.status !== "PENDING") {
        clearInterval(intervalRefs.current[id]);
        delete intervalRefs.current[id];
      }
    });
  }, [orders]);

  useEffect(() => {
    return () => { Object.values(intervalRefs.current).forEach(clearInterval); };
  }, []);

  // Real-time socket
  useEffect(() => {
    if (!token || !user?.id) return;

    const socket: Socket = io(API, { transports: ["websocket"] });
    socket.on("connect", () => socket.emit("join", user.id));

    socket.on("new_order", (payload: { booking: Order }) => {
      toast("📋 New order request!", { icon: "🔔" });
      setOrders((prev) => {
        if (prev.find((o) => o.id === payload.booking.id)) return prev;
        return [payload.booking, ...prev];
      });
      setActiveTab("pending");
    });

    socket.on("booking_cancelled", (data: any) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === (data.bookingId || data.booking?.id) ? { ...o, status: "CANCELLED" as OrderStatus } : o
        )
      );
    });

    return () => { socket.disconnect(); };
  }, [token, user?.id]);

  const handleOrderUpdated = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }, []);

  const handleAccept = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "ACCEPTED" as OrderStatus } : o));
    setTimers((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  const handleDecline = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "DECLINED" as OrderStatus } : o));
    setTimers((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  // Access control
  const isBusinessOwner = user?.provider?.category && BUSINESS_CATEGORIES.includes(user.provider.category);

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

  if (!loading && user && !isBusinessOwner) {
    return (
      <div className="min-h-screen bg-kazi-dark">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <span className="text-6xl mb-4">🏪</span>
          <h2 className="text-xl font-black text-white mb-2">Business owners only</h2>
          <p className="text-sm text-gray-400 mb-6">This dashboard is for shops, hotels, restaurants, and professionals.</p>
          <Link href="/provider/requests" className="text-sm text-kazi-orange hover:underline">
            Fundi? Go to Booking Requests →
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const tabDef = TABS.find((t) => t.key === activeTab)!;
  const filtered = tabDef.statuses.length === 0
    ? orders
    : orders.filter((o) => tabDef.statuses.includes(o.status));

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const activeCount  = orders.filter((o) => ["ACCEPTED", "PREPARING", "READY"].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-kazi-dark">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-4 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-kazi-orange/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-kazi-orange" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white leading-tight">Orders</h1>
            <p className="text-xs text-gray-400">{user?.provider?.businessName || "My Business"}</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="min-w-[26px] h-[26px] px-1.5 bg-kazi-orange text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
            <button
              onClick={() => token && fetchOrders(token)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-2xl p-1 mb-4">
          {TABS.map((tab) => {
            const count = tab.key === "pending" ? pendingCount : tab.key === "active" ? activeCount : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab.key
                    ? "bg-kazi-orange text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
                {count !== null && count > 0 && (
                  <span className="ml-1 text-[10px] opacity-80">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="space-y-4">
            <Skeleton /><Skeleton /><Skeleton />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-lg font-black text-white mb-1">
              {activeTab === "pending" ? "No new requests" :
               activeTab === "active"  ? "No active orders" : "No orders yet"}
            </h2>
            <p className="text-sm text-gray-500">
              {activeTab === "pending"
                ? "New booking requests will appear here in real time."
                : activeTab === "active"
                ? "Accepted orders will appear here."
                : "Completed and declined orders will show up here."}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                token={token!}
                timer={order.status === "PENDING" ? (timers[order.id] ?? PENDING_SECONDS) : undefined}
                onUpdated={handleOrderUpdated}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
