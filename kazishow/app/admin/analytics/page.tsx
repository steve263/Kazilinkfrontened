"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Calendar } from "lucide-react";
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
  COMPLETED:  "#00C896",
  ACCEPTED:   "#0EA5E9",
  PENDING:    "#F59E0B",
  CANCELLED:  "#EF4444",
  DECLINED:   "#6B7280",
  EN_ROUTE:   "#06B6D4",
  IN_PROGRESS:"#8B5CF6",
  DISPUTED:   "#F43F5E",
};

function formatKES(amount: number) {
  if (amount >= 1_000_000) return `KSh ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `KSh ${(amount / 1_000).toFixed(1)}K`;
  return `KSh ${Math.round(amount).toLocaleString()}`;
}

export default function AnalyticsDashboard() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sortBy, setSortBy] = useState("bookings");

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.success) setAnalytics(data.data);
      } catch { console.error("Parse error", text.slice(0, 200)); }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const a = analytics || {};

  const STATS = [
    {
      label: "Total Revenue",
      value: formatKES(a.totalRevenue || 0),
      sub: `${formatKES(a.revenueThisMonth || 0)} this month`,
      emoji: "💰",
      bg: "bg-green-50 border-green-200",
      color: "text-green-600",
    },
    {
      label: "Total Bookings",
      value: (a.totalBookings || 0).toLocaleString(),
      sub: `${a.bookingsThisMonth || 0} this month`,
      emoji: "📅",
      bg: "bg-blue-50 border-blue-200",
      color: "text-blue-600",
    },
    {
      label: "Total Customers",
      value: (a.totalCustomers || 0).toLocaleString(),
      sub: `${a.newCustomersThisMonth || 0} new this month`,
      emoji: "👥",
      bg: "bg-purple-50 border-purple-200",
      color: "text-purple-600",
    },
    {
      label: "Verified Providers",
      value: (a.verifiedProviders || 0).toLocaleString(),
      sub: `${a.totalProviders || 0} total providers`,
      emoji: "🔧",
      bg: "bg-orange-50 border-orange-200",
      color: "text-kazi-orange",
    },
    {
      label: "Completion Rate",
      value: `${a.completionRate || 0}%`,
      sub: `${a.completedBookings || 0} completed`,
      emoji: "✅",
      bg: "bg-emerald-50 border-emerald-200",
      color: "text-emerald-600",
    },
    {
      label: "Average Rating",
      value: `${a.averageRating || 0} ⭐`,
      sub: `${a.totalReviews || 0} total reviews`,
      emoji: "⭐",
      bg: "bg-yellow-50 border-yellow-200",
      color: "text-yellow-600",
    },
    {
      label: "Active Now",
      value: (a.activeToday || 0).toLocaleString(),
      sub: "bookings in progress",
      emoji: "🔥",
      bg: "bg-red-50 border-red-200",
      color: "text-red-500",
    },
    {
      label: "Commission Collected",
      value: formatKES(a.commissionRevenue || 0),
      sub: `${formatKES(a.subscriptionRevenue || 0)} subscriptions`,
      emoji: "💳",
      bg: "bg-indigo-50 border-indigo-200",
      color: "text-indigo-600",
    },
  ];

  const sortedProviders = [...(a.topProviders || [])].sort((x: any, y: any) => {
    if (sortBy === "revenue") return y.totalRevenue - x.totalRevenue;
    if (sortBy === "rating")  return y.averageRating - x.averageRating;
    return y.totalBookings - x.totalBookings;
  });

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
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
            />
          </div>
          <span className="text-xs text-gray-400 font-bold">to</span>
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
            />
          </div>
          <button onClick={fetchAnalytics} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
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

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map((card) => (
              <div key={card.label} className={`bg-white rounded-2xl p-4 border ${card.bg}`}>
                <span className="text-2xl block mb-2">{card.emoji}</span>
                <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                <p className="text-xs font-semibold text-gray-600 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Job Value", value: formatKES(a.totalRevenue || 0), desc: "All completed bookings", color: "text-green-600" },
              { label: "Commission Earned", value: formatKES(a.commissionRevenue || 0), desc: "From paid commissions", color: "text-kazi-orange" },
              { label: "Subscription Revenue", value: formatKES(a.subscriptionRevenue || 0), desc: "From provider subscriptions", color: "text-purple-600" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{item.label}</p>
                <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Daily bookings + revenue chart */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-black text-kazi-dark text-base mb-5">📈 Daily Bookings &amp; Revenue ({startDate} → {endDate})</h2>
            {(a.dailyBookings || []).length === 0 ? (
              <p className="text-center text-gray-400 py-16 text-sm">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={a.dailyBookings || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B2B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B2B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any, name: any) => [name === "revenue" ? `KSh ${Number(v).toLocaleString()}` : v, name === "revenue" ? "Revenue" : "Bookings"]} />
                  <Legend />
                  <Area type="monotone" dataKey="bookings" stroke="#FF6B2B" fill="url(#gradB)" strokeWidth={2} name="Bookings" />
                  <Area type="monotone" dataKey="revenue"  stroke="#00C896" fill="url(#gradR)"  strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown + Status breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl p-6">
              <h2 className="font-black text-kazi-dark text-base mb-4">🍕 Bookings by Category</h2>
              {(a.categoryBreakdown || []).filter((c: any) => c.bookings > 0).length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No category data yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={(a.categoryBreakdown || []).filter((c: any) => c.bookings > 0)}
                        dataKey="bookings" nameKey="category"
                        cx="50%" cy="50%" outerRadius={80}
                        label={({ category, percent }: any) => `${category} ${Math.round(percent * 100)}%`}
                        labelLine={false}>
                        {(a.categoryBreakdown || []).map((entry: any) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#999"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, name: any) => [v, "Bookings"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-3">
                    {(a.categoryBreakdown || []).filter((c: any) => c.bookings > 0).map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || "#999" }} />
                          <span className="text-sm font-bold text-kazi-dark">{cat.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-kazi-dark text-sm">{cat.bookings} bookings</p>
                          <p className="text-xs text-kazi-orange">KSh {parseFloat(cat.revenue || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6">
              <h2 className="font-black text-kazi-dark text-base mb-4">📊 Booking Status Breakdown</h2>
              {(a.statusBreakdown || []).length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No booking data yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={a.statusBreakdown || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="status" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Count">
                        {(a.statusBreakdown || []).map((entry: any) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#999"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {(a.statusBreakdown || []).map((s: any) => (
                      <div key={s.status} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || "#999" }} />
                          <span className="text-xs text-gray-600">{s.status}</span>
                        </div>
                        <span className="text-xs font-black text-kazi-dark">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Growth chart */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-black text-kazi-dark text-base mb-5">📈 Growth — Last 6 Months</h2>
            {(a.growthData || []).length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No growth data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={a.growthData || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            )}
          </div>

          {/* Top providers table */}
          <div className="bg-white rounded-2xl p-6">
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
                  {sortedProviders.slice(0, 10).map((p: any, i: number) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pl-2 text-sm font-black">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-300">#{i + 1}</span>}
                      </td>
                      <td className="py-3">
                        <p className="text-sm font-bold text-kazi-dark">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.location}</p>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[p.category] || "#666", color: "#fff" }}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm font-bold text-kazi-dark">{p.totalBookings}</td>
                      <td className="py-3 text-right text-sm font-bold text-green-600">{formatKES(p.totalRevenue)}</td>
                      <td className="py-3 text-right text-sm font-bold text-amber-500">
                        {p.averageRating > 0 ? `${p.averageRating} ⭐` : (p.totalReviews > 0 ? "—" : "New")}
                      </td>
                    </tr>
                  ))}
                  {sortedProviders.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">No provider data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white rounded-2xl p-5">
              <h3 className="font-black text-kazi-dark mb-4">📅 Recent Bookings</h3>
              <div className="space-y-3">
                {(a.recentBookings || []).slice(0, 5).map((b: any) => (
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
                {!(a.recentBookings?.length) && <p className="text-xs text-gray-400 text-center py-4">No bookings yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h3 className="font-black text-kazi-dark mb-4">👥 New Users</h3>
              <div className="space-y-3">
                {(a.newUsers || []).slice(0, 5).map((user: any, i: number) => (
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
                {!(a.newUsers?.length) && <p className="text-xs text-gray-400 text-center py-4">No users yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h3 className="font-black text-kazi-dark mb-4">💚 Recent Payments</h3>
              <div className="space-y-3">
                {(a.recentPayments || []).slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs flex-shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-kazi-dark truncate">{payment.customer?.name}</p>
                      <p className="text-xs text-gray-400 truncate">→ {payment.provider?.businessName}</p>
                    </div>
                    <span className="text-xs font-black text-green-600 flex-shrink-0">
                      KSh {(payment.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
                {!(a.recentPayments?.length) && <p className="text-xs text-gray-400 text-center py-4">No payments yet</p>}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
