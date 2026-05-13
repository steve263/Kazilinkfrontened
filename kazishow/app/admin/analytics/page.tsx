"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORY_COLORS: Record<string, string> = {
  FUNDI:        "#FF6B2B",
  SHOP:         "#0EA5E9",
  HOTEL:        "#F59E0B",
  RESTAURANT:   "#EF4444",
  TECH:         "#8B5CF6",
  PROFESSIONAL: "#00C896",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#00C896",
  ACCEPTED:  "#0EA5E9",
  PENDING:   "#F59E0B",
  CANCELLED: "#EF4444",
  DECLINED:  "#6B7280",
};

function formatKES(amount: number) {
  if (amount >= 1_000_000) return `KSh ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `KSh ${(amount / 1_000).toFixed(1)}K`;
  return `KSh ${amount}`;
}

export default function AnalyticsDashboard() {
  const ready = useAdminGuard();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview]               = useState<any>(null);
  const [dailyBookings, setDailyBookings]     = useState<any[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
  const [topProviders, setTopProviders]       = useState<any[]>([]);
  const [customerGrowth, setCustomerGrowth]   = useState<any[]>([]);
  const [bookingStatus, setBookingStatus]     = useState<any[]>([]);
  const [paymentStats, setPaymentStats]       = useState<any>(null);
  const [recentActivity, setRecentActivity]   = useState<any>(null);
  const [daysRange, setDaysRange]             = useState(30);
  const [sortBy, setSortBy]                   = useState("bookings");

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [ov, db, rc, tp, cg, bs, ps, ra] = await Promise.all([
        fetch(`${API}/api/analytics/overview`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/analytics/daily-bookings?days=30`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/analytics/revenue-by-category`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/analytics/top-providers?limit=10`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/analytics/customer-growth?months=6`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/analytics/booking-status`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/analytics/payment-stats`, { headers: h }).then(r => r.json()),
        fetch(`${API}/api/analytics/recent-activity`, { headers: h }).then(r => r.json()),
      ]);
      if (ov.success) setOverview(ov.data);
      if (db.success) setDailyBookings(db.data);
      if (rc.success) setRevenueByCategory(rc.data);
      if (tp.success) setTopProviders(tp.data);
      if (cg.success) setCustomerGrowth(cg.data);
      if (bs.success) setBookingStatus(bs.data);
      if (ps.success) setPaymentStats(ps.data);
      if (ra.success) setRecentActivity(ra.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sortedProviders = [...topProviders].sort((a, b) => {
    if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
    if (sortBy === "rating")  return b.rating - a.rating;
    return b.completedBookings - a.completedBookings;
  });

  const OVERVIEW_CARDS = [
    { label: "Total Revenue",       value: formatKES(overview?.totalRevenue || 0),       sub: `${formatKES(overview?.thisMonthRevenue || 0)} this month`, emoji: "💰", change: overview?.revenueGrowth, bg: "bg-green-50 border-green-200" },
    { label: "Total Bookings",      value: overview?.totalBookings ?? "—",               sub: `${overview?.thisMonthBookings || 0} this month`,          emoji: "📅", change: overview?.bookingGrowth, bg: "bg-blue-50 border-blue-200" },
    { label: "Total Customers",     value: overview?.totalCustomers ?? "—",              sub: `${overview?.thisMonthUsers || 0} new this month`,          emoji: "👥", change: null, bg: "bg-orange-50 border-orange-200" },
    { label: "Verified Providers",  value: overview?.totalProviders ?? "—",              sub: `${overview?.pendingProviders || 0} pending approval`,       emoji: "🔧", change: null, bg: "bg-purple-50 border-purple-200" },
    { label: "Completion Rate",     value: `${overview?.completionRate || 0}%`,          sub: `${overview?.completedBookings || 0} completed`,             emoji: "✅", change: null, bg: "bg-emerald-50 border-emerald-200" },
    { label: "Average Rating",      value: overview?.avgRating ?? "—",                  sub: `${overview?.totalReviews || 0} total reviews`,              emoji: "⭐", change: null, bg: "bg-yellow-50 border-yellow-200" },
    { label: "Active Today",        value: overview?.activeBookingsToday ?? "—",         sub: "bookings in progress",                                      emoji: "🔥", change: null, bg: "bg-red-50 border-red-200" },
    { label: "Revenue Processed",   value: formatKES(paymentStats?.totalProcessed || 0), sub: `${formatKES(paymentStats?.totalProviderPayout || 0)} to providers`, emoji: "💳", change: null, bg: "bg-indigo-50 border-indigo-200" },
  ];

  return (
    <div className="min-h-screen bg-kazi-cream">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-1.5 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-kazi-dark">📊 Analytics Dashboard</h1>
          <p className="text-xs text-gray-400">Real-time insights for KaziShow</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-kazi-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading analytics…</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

          {/* Overview stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {OVERVIEW_CARDS.map((card) => (
              <div key={card.label} className={`bg-white rounded-2xl p-4 border ${card.bg} card-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{card.emoji}</span>
                  {card.change != null && card.change !== 0 && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${card.change > 0 ? "text-green-500" : "text-red-500"}`}>
                      {card.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(card.change)}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-kazi-dark">{card.value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Daily bookings area chart */}
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-kazi-dark text-base">📈 Daily Bookings &amp; Revenue</h2>
              <div className="flex gap-2">
                {[7, 14, 30].map((d) => (
                  <button key={d} onClick={() => setDaysRange(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${daysRange === d ? "bg-kazi-orange text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyBookings.slice(-daysRange)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B2B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B2B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any, name: any) => [name === "revenue" ? `KSh ${v}` : v, name === "revenue" ? "Commission" : "Bookings"]} />
                <Legend />
                <Area type="monotone" dataKey="bookings" stroke="#FF6B2B" fill="url(#gradBookings)" strokeWidth={2} name="Bookings" />
                <Area type="monotone" dataKey="revenue"  stroke="#00C896" fill="url(#gradRevenue)"  strokeWidth={2} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category pie + booking status bar side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h2 className="font-black text-kazi-dark text-base mb-5">🍕 Revenue by Category</h2>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={revenueByCategory.filter(c => c.revenue > 0)} dataKey="revenue" nameKey="category"
                    cx="50%" cy="50%" outerRadius={85} label={({ category, percent }: any) => `${category} ${Math.round(percent * 100)}%`}
                    labelLine={false}>
                    {revenueByCategory.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#999"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`KSh ${v}`, "Commission"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {revenueByCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || "#999" }} />
                    <div>
                      <p className="text-xs font-semibold text-kazi-dark">{cat.category}</p>
                      <p className="text-xs text-gray-400">{cat.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h2 className="font-black text-kazi-dark text-base mb-5">📊 Booking Status Breakdown</h2>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={bookingStatus} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Count">
                    {bookingStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#999"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {bookingStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || "#999" }} />
                      <span className="text-xs text-gray-600">{s.status}</span>
                    </div>
                    <span className="text-xs font-black text-kazi-dark">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer & provider growth line chart */}
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="font-black text-kazi-dark text-base mb-5">📈 Customer &amp; Provider Growth (6 months)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={customerGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="customers" stroke="#FF6B2B" strokeWidth={3} dot={{ fill: "#FF6B2B", r: 4 }} name="New Customers" />
                <Line type="monotone" dataKey="providers" stroke="#00C896" strokeWidth={3} dot={{ fill: "#00C896", r: 4 }} name="New Providers" />
                <Line type="monotone" dataKey="bookings"  stroke="#0EA5E9" strokeWidth={3} dot={{ fill: "#0EA5E9", r: 4 }} name="Bookings" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top providers table */}
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-kazi-dark text-base">🏆 Top Providers</h2>
              <div className="flex gap-2">
                {[
                  { key: "bookings", label: "By Bookings" },
                  { key: "revenue",  label: "By Revenue" },
                  { key: "rating",   label: "By Rating" },
                ].map((opt) => (
                  <button key={opt.key} onClick={() => setSortBy(opt.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${sortBy === opt.key ? "bg-kazi-orange text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-bold pb-3 pl-2">#</th>
                    <th className="text-left text-xs text-gray-400 font-bold pb-3">Provider</th>
                    <th className="text-left text-xs text-gray-400 font-bold pb-3">Category</th>
                    <th className="text-right text-xs text-gray-400 font-bold pb-3">Bookings</th>
                    <th className="text-right text-xs text-gray-400 font-bold pb-3">Revenue</th>
                    <th className="text-right text-xs text-gray-400 font-bold pb-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProviders.slice(0, 10).map((provider, index) => (
                    <tr key={provider.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pl-2 text-sm font-black">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : <span className="text-gray-300">#{index + 1}</span>}
                      </td>
                      <td className="py-3">
                        <p className="text-sm font-bold text-kazi-dark">{provider.businessName}</p>
                        <p className="text-xs text-gray-400">{provider.location}</p>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: CATEGORY_COLORS[provider.category] || "#666" }}>
                          {provider.category}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm font-bold text-kazi-dark">{provider.completedBookings}</td>
                      <td className="py-3 text-right text-sm font-bold text-green-600">{formatKES(provider.totalRevenue)}</td>
                      <td className="py-3 text-right text-sm font-bold text-amber-500">⭐ {provider.rating}</td>
                    </tr>
                  ))}
                  {sortedProviders.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">No provider data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment stats */}
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="font-black text-kazi-dark text-base mb-5">💳 Payment Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Processed",       value: formatKES(paymentStats?.totalProcessed || 0),   emoji: "💳", color: "text-blue-600" },
                { label: "KaziShow Commission",    value: formatKES(paymentStats?.totalCommission || 0),  emoji: "💰", color: "text-kazi-orange" },
                { label: "Provider Payouts",       value: formatKES(paymentStats?.totalProviderPayout || 0), emoji: "🔧", color: "text-green-600" },
                { label: "Refunds Given",          value: paymentStats?.refunded ?? 0,                   emoji: "↩️", color: "text-red-500" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-2xl p-4 text-center">
                  <span className="text-3xl block mb-2">{stat.emoji}</span>
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity 3-column */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white rounded-2xl p-5 card-shadow">
              <h3 className="font-black text-kazi-dark mb-4">📅 Recent Bookings</h3>
              <div className="space-y-3">
                {(recentActivity?.recentBookings || []).slice(0, 5).map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[b.provider?.category] || "#666" }}>
                      {b.customer?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-kazi-dark truncate">{b.customer?.name}</p>
                      <p className="text-xs text-gray-400 truncate">→ {b.provider?.businessName}</p>
                    </div>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[b.status] || "#666" }}>
                      {b.status}
                    </span>
                  </div>
                ))}
                {!recentActivity?.recentBookings?.length && <p className="text-xs text-gray-400 text-center py-4">No bookings yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 card-shadow">
              <h3 className="font-black text-kazi-dark mb-4">👥 New Users</h3>
              <div className="space-y-3">
                {(recentActivity?.recentUsers || []).slice(0, 5).map((user: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-kazi-orange font-bold text-sm flex-shrink-0">
                      {user.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-kazi-dark truncate">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.location || "Kenya"}</p>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${user.role === "PROVIDER" ? "bg-orange-100 text-kazi-orange" : "bg-blue-100 text-blue-600"}`}>
                      {user.role}
                    </span>
                  </div>
                ))}
                {!recentActivity?.recentUsers?.length && <p className="text-xs text-gray-400 text-center py-4">No users yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 card-shadow">
              <h3 className="font-black text-kazi-dark mb-4">💚 Recent Payments</h3>
              <div className="space-y-3">
                {(recentActivity?.recentPayments || []).slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs flex-shrink-0">
                      M
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-kazi-dark truncate">{payment.booking?.customer?.name}</p>
                      <p className="text-xs text-gray-400 truncate">→ {payment.booking?.provider?.businessName}</p>
                    </div>
                    <span className="text-xs font-black text-green-600 flex-shrink-0">KSh {payment.amount}</span>
                  </div>
                ))}
                {!recentActivity?.recentPayments?.length && <p className="text-xs text-gray-400 text-center py-4">No payments yet</p>}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
