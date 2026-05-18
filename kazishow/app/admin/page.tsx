"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, ShoppingBag, DollarSign, Clock, Activity, Star,
  CheckSquare, BarChart2, LogOut, ChevronRight, RefreshCw, Menu, ClipboardCheck, Wallet, Shield, Scale, XCircle,
} from "lucide-react";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import StatCard from "@/components/admin/StatCard";
import ApprovalCard from "@/components/admin/ApprovalCard";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Stats {
  totalUsers: { value: number; change: number };
  bookingsToday: { value: number; change: number };
  revenueThisMonth: { value: number; change: number };
  pendingProviders: { value: number; change: number };
  activeBookings: { value: number; change: number };
  totalReviews: { value: number; change: number };
}

const NAV = [
  { label: "Overview",   href: "/admin",             icon: BarChart2 },
  { label: "Approvals",  href: "/admin/approvals",   icon: ClipboardCheck },
  { label: "Providers",  href: "/admin/providers",   icon: CheckSquare },
  { label: "Users",      href: "/admin/users",       icon: Users },
  { label: "Bookings",   href: "/admin/bookings",    icon: ShoppingBag },
  { label: "Analytics",  href: "/admin/analytics",   icon: Activity },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
  { label: "Payouts",     href: "/admin/payouts",     icon: DollarSign },
  { label: "Trust & Safety",  href: "/admin/trust",          icon: Shield   },
  { label: "Appeals",         href: "/admin/appeals",        icon: Scale    },
  { label: "Cancellations",   href: "/admin/cancellations",  icon: XCircle  },
];

const BOOKING_STATUS_COLOR: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  ACCEPTED:    "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  DISPUTED:    "bg-red-100 text-red-700",
  CANCELLED:   "bg-gray-100 text-gray-600",
  EN_ROUTE:    "bg-cyan-100 text-cyan-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  PREPARING:   "bg-orange-100 text-orange-700",
  READY:       "bg-teal-100 text-teal-700",
};

export default function AdminDashboard() {
  const ready = useAdminGuard();
  const [stats, setStats] = useState<Stats | null>(null);
  const [subStats, setSubStats] = useState<any>(null);
  const [cancelStats, setCancelStats] = useState<any>(null);
  const [commissionStats, setCommissionStats] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [waivingId, setWaivingId] = useState<string | null>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState("");
  const [liveVisitors, setLiveVisitors] = useState(0);

  useEffect(() => {
    const socket = io(API, { transports: ["websocket"] });
    socket.on("live_visitors", ({ count }: { count: number }) => setLiveVisitors(count));
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchDashboard = useCallback(async () => {
    if (!ready || !token) return;
    setLoadingStats(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [s, p, b, sub, cancel, comm, disp, bdg] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/admin/providers/pending`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/admin/bookings?limit=5`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/subscriptions/admin/stats`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/bookings/admin/cancellations`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/bookings/admin/commissions?limit=10`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/bookings?status=DISPUTED`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/admin/badges`, { headers }).then((r) => r.json()),
      ]);
      if (s.success) setStats(s.data);
      if (p.success) setPending(p.data);
      if (b.success) setRecentBookings(b.data.bookings);
      if (sub.success) setSubStats(sub.data);
      if (cancel.success) setCancelStats(cancel.data);
      if (comm.success) setCommissionStats(comm.data);
      if (disp.success) setDisputes(disp.data.bookings || []);
      if (bdg.success) setBadges(bdg.data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoadingStats(false);
    }
  }, [ready, token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  function logout() {
    localStorage.removeItem("kazishow_token");
    localStorage.removeItem("kazishow_user");
    localStorage.removeItem("kazishow_remember");
    localStorage.removeItem("kazishow_login_time");
    localStorage.removeItem("kazishow_session_expires");
    sessionStorage.removeItem("kazishow_token");
    sessionStorage.removeItem("kazishow_user");
    window.location.href = "/auth/login";
  }

  const handleReleaseToProvider = async (bookingId: string) => {
    if (!confirm("Release payment to provider? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/confirm-complete`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment released to provider");
        fetchDashboard();
      } else {
        toast.error(data.message || "Failed to release");
      }
    } catch { toast.error("Network error"); }
  };

  const handleRefundCustomer = async (bookingId: string) => {
    if (!confirm("Refund customer? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin refund after dispute resolution" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer refund initiated");
        fetchDashboard();
      } else {
        toast.error(data.message || "Failed to refund");
      }
    } catch { toast.error("Network error"); }
  };

  const handleWaiveCommission = async (commissionId: string) => {
    const reason = prompt("Enter reason for waiving this commission:");
    if (!reason) return;
    setWaivingId(commissionId);
    try {
      const res = await fetch(`${API}/api/bookings/commissions/${commissionId}/waive`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Commission waived");
        fetchDashboard();
      } else {
        toast.error(data.message || "Failed to waive");
      }
    } catch { toast.error("Network error"); }
    finally { setWaivingId(null); }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream flex">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-kazi-dark flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kazi-orange rounded-xl flex items-center justify-center font-black text-white">K</div>
            <div>
              <p className="font-black text-white text-sm">KaziShow</p>
              <p className="text-xs text-white/40">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const badgeCount =
              label === "Approvals"    ? badges.approvals   :
              label === "Bookings"     ? badges.bookings    :
              label === "Withdrawals"  ? badges.withdrawals :
              label === "Appeals"      ? badges.appeals     : 0;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
                <Icon className="w-4 h-4" />
                {label}
                {badgeCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4" />Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block shrink-0">
            <h1 className="text-base font-black text-kazi-dark leading-tight">Dashboard Overview</h1>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-KE", { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
          <div className="flex-1 min-w-0">
            <AdminSearchBar token={token} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <Users className="w-3.5 h-3.5 text-green-600" />
              <span className="text-sm font-bold text-green-700">{liveVisitors} live</span>
            </div>
            <button onClick={fetchDashboard} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard label="Total Users" value={stats?.totalUsers.value ?? 0} change={stats?.totalUsers.change} icon={<Users className="w-4 h-4" />} color="blue" loading={loadingStats} />
            <StatCard label="Bookings Today" value={stats?.bookingsToday.value ?? 0} change={stats?.bookingsToday.change} icon={<ShoppingBag className="w-4 h-4" />} color="orange" loading={loadingStats} />
            <StatCard label="Revenue (Month)" value={stats?.revenueThisMonth.value ?? 0} change={stats?.revenueThisMonth.change} prefix="KSh" icon={<DollarSign className="w-4 h-4" />} color="green" loading={loadingStats} />
            <StatCard label="Pending Approvals" value={stats?.pendingProviders.value ?? 0} icon={<Clock className="w-4 h-4" />} color="red" loading={loadingStats} />
            <StatCard label="Active Bookings" value={stats?.activeBookings.value ?? 0} icon={<Activity className="w-4 h-4" />} color="purple" loading={loadingStats} />
            <StatCard label="Total Reviews" value={stats?.totalReviews.value ?? 0} change={stats?.totalReviews.change} icon={<Star className="w-4 h-4" />} color="orange" loading={loadingStats} />
          </div>

          {/* Subscription stats */}
          {subStats && (
            <div>
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-base">💳</span> Business Subscriptions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-black text-kazi-orange">{subStats.totalActive}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Active Subscriptions</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-black text-green-600">KSh {(subStats.monthlyRevenue || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sub Revenue This Month</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-black text-blue-600">{subStats.totalTrial}</p>
                  <p className="text-xs text-gray-400 mt-0.5">On Free Trial</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-black text-red-500">{subStats.totalExpired}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Expired</p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Stats */}
          {cancelStats && (
            <div>
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-base">❌</span> Cancellations &amp; Refunds
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-black text-red-500">{cancelStats.pendingRefunds}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pending Refunds</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-black text-kazi-orange">KSh {(cancelStats.pendingRefundAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Refund Amount Owed</p>
                </div>
              </div>
              {cancelStats.cancellations?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-black text-sm text-kazi-dark">Recent Cancellations</p>
                  </div>
                  {cancelStats.cancellations.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex items-start justify-between p-4 border-b border-gray-50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-kazi-dark truncate">
                          {c.booking?.customer?.name} → {c.booking?.provider?.businessName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{c.reason}</p>
                        <p className="text-xs text-gray-400">By: {c.user?.name} ({c.user?.role})</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-black text-red-500">KSh {(c.refundAmount || 0).toLocaleString()}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.refundStatus === "PENDING" ? "bg-amber-100 text-amber-600"
                          : c.refundStatus === "NOT_APPLICABLE" ? "bg-gray-100 text-gray-500"
                          : "bg-green-100 text-green-600"
                        }`}>
                          {c.refundStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Disputes */}
          {disputes.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-base">🚨</span> Active Disputes
                <span className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{disputes.length}</span>
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                  <span className="text-lg">🚨</span>
                  <div>
                    <p className="font-black text-red-700 text-sm">Requires Immediate Attention</p>
                    <p className="text-red-500 text-xs">{disputes.length} dispute{disputes.length !== 1 ? "s" : ""} awaiting review</p>
                  </div>
                </div>
                {disputes.map((booking: any) => (
                  <div key={booking.id} className="p-4 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-kazi-dark text-sm">
                          {booking.customer?.name}
                          <span className="text-gray-400 font-normal"> vs </span>
                          {booking.provider?.businessName}
                        </p>
                        <p className="text-xs text-gray-400">{booking.service?.name} • KSh {booking.totalAmount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          📅 {new Date(booking.createdAt).toLocaleDateString("en-KE")}
                        </p>
                      </div>
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">DISPUTED</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleReleaseToProvider(booking.id)}
                        className="flex-1 py-2 bg-green-500 text-white font-bold rounded-xl text-xs"
                      >
                        ✅ Release to Provider
                      </button>
                      <button
                        onClick={() => handleRefundCustomer(booking.id)}
                        className="flex-1 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs"
                      >
                        💰 Refund Customer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commission Stats */}
          {commissionStats && (
            <div>
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-base">💵</span> Cash Commissions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {commissionStats.stats.map((s: any) => (
                  <div key={s.status} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className={`text-2xl font-black ${
                      s.status === "OVERDUE" ? "text-red-500"
                      : s.status === "PAID" ? "text-green-600"
                      : s.status === "WAIVED" ? "text-gray-400"
                      : "text-kazi-orange"
                    }`}>
                      KSh {(s._sum.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.status} ({s._count})</p>
                  </div>
                ))}
              </div>
              {commissionStats.commissions?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-black text-sm text-kazi-dark">Recent Commissions</p>
                  </div>
                  {commissionStats.commissions.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-kazi-dark truncate">
                          {c.provider?.businessName}
                        </p>
                        <p className="text-xs text-gray-400">{c.provider?.user?.phone}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {c.booking?.service?.name || "Service"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-black text-kazi-dark">KSh {c.amount.toLocaleString()}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === "OVERDUE" ? "bg-red-100 text-red-600"
                            : c.status === "PAID" ? "bg-green-100 text-green-600"
                            : c.status === "WAIVED" ? "bg-gray-100 text-gray-500"
                            : "bg-amber-100 text-amber-600"
                          }`}>{c.status}</span>
                        </div>
                        {["PENDING", "OVERDUE"].includes(c.status) && (
                          <button
                            onClick={() => handleWaiveCommission(c.id)}
                            disabled={waivingId === c.id}
                            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition-colors disabled:opacity-50"
                          >
                            {waivingId === c.id ? "..." : "Waive"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending Approvals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-kazi-dark">Pending Approvals</h2>
                  {pending.length > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">{pending.length}</span>
                  )}
                </div>
                <Link href="/admin/providers" className="text-xs text-kazi-orange font-semibold flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {pending.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 card-shadow text-center">
                  <CheckSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-500">All caught up! No pending applications.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.slice(0, 3).map((p) => (
                    <ApprovalCard key={p.id} provider={p} token={token}
                      onAction={(id) => {
                        setPending((prev) => prev.filter((x) => x.id !== id));
                        setStats((s) => s ? { ...s, pendingProviders: { ...s.pendingProviders, value: Math.max(0, s.pendingProviders.value - 1) } } : s);
                      }}
                    />
                  ))}
                  {pending.length > 3 && (
                    <Link href="/admin/providers" className="block text-center text-sm text-kazi-orange font-semibold py-2.5 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                      +{pending.length - 3} more pending →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-kazi-dark">Recent Bookings</h2>
                <Link href="/admin/bookings" className="text-xs text-kazi-orange font-semibold flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white rounded-2xl card-shadow overflow-hidden">
                {recentBookings.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">No bookings yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[400px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Customer", "Provider", "Status", "Amount"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide last:text-right">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((b, i) => (
                          <tr key={b.id} className={`border-b border-gray-50 hover:bg-orange-50/30 ${i % 2 ? "bg-gray-50/40" : ""}`}>
                            <td className="px-4 py-3 font-medium text-kazi-dark truncate max-w-[100px]">{b.customer?.name}</td>
                            <td className="px-4 py-3 text-gray-500 truncate max-w-[100px]">{b.provider?.businessName}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${BOOKING_STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">KSh {b.totalAmount?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick nav cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Manage Providers", href: "/admin/providers", icon: CheckSquare, cls: "text-kazi-orange border-orange-100 hover:bg-orange-50" },
              { label: "Manage Users",     href: "/admin/users",     icon: Users,       cls: "text-blue-600 border-blue-100 hover:bg-blue-50" },
              { label: "All Bookings",     href: "/admin/bookings",  icon: ShoppingBag, cls: "text-purple-600 border-purple-100 hover:bg-purple-50" },
              { label: "Analytics",        href: "/admin/analytics", icon: BarChart2,   cls: "text-green-600 border-green-100 hover:bg-green-50" },
            ].map(({ label, href, icon: Icon, cls }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 p-4 bg-white rounded-2xl card-shadow border transition-colors ${cls}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-bold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
