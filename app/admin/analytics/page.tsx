"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TrendingUp, Award } from "lucide-react";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORY_COLORS: Record<string, string> = {
  FUNDI:        "#FF6B2B",
  SHOP:         "#3B82F6",
  HOTEL:        "#8B5CF6",
  RESTAURANT:   "#EF4444",
  TECH:         "#06B6D4",
  PROFESSIONAL: "#10B981",
  BUSINESS:     "#6B7280",
};

export default function AnalyticsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/api/admin/revenue`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, [token]);

  if (!ready) return <div className="min-h-screen bg-kazi-dark flex items-center justify-center"><div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" /></div>;

  const maxDaily = data ? Math.max(...data.dailyBookings.map((d: any) => d.count), 1) : 1;
  const maxRevCat = data ? Math.max(...data.revenueByCategory.map((c: any) => Number(c.revenue)), 1) : 1;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-1.5 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-kazi-dark">Analytics & Revenue</h1>
          <p className="text-xs text-gray-400">Platform performance overview</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 rounded-xl hover:bg-gray-100"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
      </div>

      <div className="p-5 max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-gray-400">Failed to load analytics</div>
        ) : (
          <>
            {/* Completion rate */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Completed Bookings", value: data.completionRate.completed, color: "text-green-600", bg: "bg-green-50" },
                { label: "Cancelled Bookings", value: data.completionRate.cancelled, color: "text-red-500", bg: "bg-red-50" },
                { label: "Completion Rate",    value: `${data.completionRate.rate}%`, color: "text-kazi-orange", bg: "bg-orange-50" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-5`}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                  <p className={`text-3xl font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Daily bookings bar chart */}
            <div className="bg-white rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-kazi-orange" />
                <h2 className="font-black text-kazi-dark">Daily Bookings — Last 30 Days</h2>
              </div>
              {data.dailyBookings.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No booking data yet</p>
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                  {data.dailyBookings.map((d: any) => {
                    const pct = Math.max(4, Math.round((d.count / maxDaily) * 100));
                    return (
                      <div key={d.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 20 }}>
                        <span className="text-xs font-bold text-kazi-dark">{d.count}</span>
                        <div
                          className="w-full rounded-t-lg bg-kazi-orange hover:bg-orange-600 transition-colors cursor-default"
                          style={{ height: `${pct}%`, minHeight: 4 }}
                          title={`${d.date}: ${d.count} bookings`}
                        />
                        <span className="text-[9px] text-gray-400 rotate-45 origin-left" style={{ fontSize: 8 }}>
                          {new Date(d.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue by category */}
              <div className="bg-white rounded-2xl p-5 card-shadow">
                <h2 className="font-black text-kazi-dark mb-4">Revenue by Category</h2>
                <div className="space-y-3">
                  {data.revenueByCategory.map((c: any) => {
                    const rev = Number(c.revenue);
                    const pct = Math.round((rev / maxRevCat) * 100);
                    const color = CATEGORY_COLORS[c.category] || "#6B7280";
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-kazi-dark">{c.category}</span>
                          <span className="font-bold" style={{ color }}>KSh {rev.toLocaleString()}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{c.bookings} bookings</p>
                      </div>
                    );
                  })}
                  {data.revenueByCategory.length === 0 && <p className="text-gray-400 text-sm">No revenue data yet</p>}
                </div>
              </div>

              {/* Top providers by bookings */}
              <div className="bg-white rounded-2xl p-5 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-kazi-amber" />
                  <h2 className="font-black text-kazi-dark">Top Providers by Bookings</h2>
                </div>
                <div className="space-y-2.5">
                  {data.topByBookings.map((p: any, i: number) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${i === 0 ? "bg-kazi-amber" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-700" : "bg-gray-300"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-kazi-dark truncate">{p.businessName}</p>
                        <p className="text-xs text-gray-400">{p.category}</p>
                      </div>
                      <span className="font-black text-kazi-orange text-sm">{p._count?.bookings} bookings</span>
                    </div>
                  ))}
                  {data.topByBookings.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
                </div>
              </div>
            </div>

            {/* Top providers by revenue */}
            <div className="bg-white rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-green-500" />
                <h2 className="font-black text-kazi-dark">Top Providers by Revenue</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-2 text-xs font-bold text-gray-400 uppercase">#</th>
                      <th className="text-left pb-2 text-xs font-bold text-gray-400 uppercase">Provider</th>
                      <th className="text-left pb-2 text-xs font-bold text-gray-400 uppercase">Category</th>
                      <th className="text-right pb-2 text-xs font-bold text-gray-400 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topByRevenue.map((p: any, i: number) => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="py-2.5 font-black text-gray-400">{i + 1}</td>
                        <td className="py-2.5 font-bold text-kazi-dark">{p.businessName}</td>
                        <td className="py-2.5"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{p.category}</span></td>
                        <td className="py-2.5 text-right font-black text-green-600">KSh {Number(p.revenue).toLocaleString()}</td>
                      </tr>
                    ))}
                    {data.topByRevenue.length === 0 && (
                      <tr><td colSpan={4} className="py-6 text-center text-gray-400">No revenue data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
