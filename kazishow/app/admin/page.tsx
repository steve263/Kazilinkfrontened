"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, ShoppingBag, DollarSign, Clock, Activity, Star,
  CheckSquare, BarChart2, LogOut, ChevronRight, RefreshCw, Menu, ClipboardCheck, Wallet, Shield,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import StatCard from "@/components/admin/StatCard";
import ApprovalCard from "@/components/admin/ApprovalCard";
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
  { label: "Trust & Safety", href: "/admin/trust", icon: Shield },
];

const BOOKING_STATUS_COLOR: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  ACCEPTED:    "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
  EN_ROUTE:    "bg-cyan-100 text-cyan-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  PREPARING:   "bg-orange-100 text-orange-700",
  READY:       "bg-teal-100 text-teal-700",
};

export default function AdminDashboard() {
  const ready = useAdminGuard();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchDashboard = useCallback(async () => {
    if (!ready || !token) return;
    setLoadingStats(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [s, p, b] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/admin/providers/pending`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/admin/bookings?limit=5`, { headers }).then((r) => r.json()),
      ]);
      if (s.success) setStats(s.data);
      if (p.success) setPending(p.data);
      if (b.success) setRecentBookings(b.data.bookings);
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
    window.location.href = "/auth/login";
  }

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
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />
              {label}
              {label === "Approvals" && pending.length > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </Link>
          ))}
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
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Dashboard Overview</h1>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <button onClick={fetchDashboard} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
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
