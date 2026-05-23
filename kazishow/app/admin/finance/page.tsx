"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Download, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function formatKSh(amount: number) {
  if (amount >= 1_000_000) return `KSh ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KSh ${(amount / 1_000).toFixed(1)}K`;
  return `KSh ${Math.round(amount).toLocaleString()}`;
}

export default function AdminFinancePage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "commissions" | "subscriptions">("overview");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (ready) {
      const t = getAdminToken();
      setToken(t);
      fetchFinance(t);
    }
  }, [ready]);

  const fetchFinance = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/finance`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) return;
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (period: string) => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/api/admin/finance/export?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kazishow-finance-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Finance data exported!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-1.5 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-kazi-dark">💰 Revenue &amp; Finance</h1>
          <p className="text-xs text-gray-400">All KaziShow earnings and transactions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleExport("month")}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white font-bold rounded-xl text-xs disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" /> This Month
          </button>
          <button
            onClick={() => handleExport("all")}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-kazi-orange text-white font-bold rounded-xl text-xs disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" /> All Time
          </button>
          <button
            onClick={() => fetchFinance(token)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-kazi-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

          {/* Top banner + This Month + Today */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 bg-kazi-orange rounded-2xl p-5">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                💰 Total Revenue All Time
              </p>
              <p className="text-white font-black text-4xl mt-1">
                {formatKSh(s?.totalRevenue || 0)}
              </p>
              <div className="flex gap-5 mt-3">
                <div>
                  <p className="text-white/60 text-xs">Commission</p>
                  <p className="text-white font-bold">{formatKSh(s?.totalCommission || 0)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Subscriptions</p>
                  <p className="text-white font-bold">{formatKSh(s?.totalSubscription || 0)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Job Value Processed</p>
                  <p className="text-white font-bold">{formatKSh(s?.totalBookingValue || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400 text-xs font-bold uppercase">This Month</p>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${
                  (s?.monthlyGrowth || 0) >= 0 ? "text-green-600" : "text-red-500"
                }`}>
                  {(s?.monthlyGrowth || 0) >= 0
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(s?.monthlyGrowth || 0)}%
                </span>
              </div>
              <p className="font-black text-kazi-dark text-2xl">{formatKSh(s?.thisMonthTotal || 0)}</p>
              <p className="text-gray-400 text-xs mt-1">vs {formatKSh(s?.lastMonthTotal || 0)} last month</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>C: {formatKSh(s?.thisMonthCommission || 0)}</span>
                <span>S: {formatKSh(s?.thisMonthSubscription || 0)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">Today</p>
              <p className="font-black text-kazi-dark text-2xl">{formatKSh(s?.todayTotal || 0)}</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>C: {formatKSh(s?.todayCommission || 0)}</span>
                <span>S: {formatKSh(s?.todaySubscription || 0)}</span>
              </div>
            </div>
          </div>

          {/* Pending + Growth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-amber-600 text-xs font-bold uppercase mb-1">⏳ Pending Collection</p>
              <p className="font-black text-amber-700 text-2xl">{formatKSh(s?.pendingTotal || 0)}</p>
              <p className="text-amber-500 text-xs mt-1">
                Commission: {formatKSh(s?.pendingCommission || 0)} &nbsp;|&nbsp; Subscription: {formatKSh(s?.pendingSubscription || 0)}
              </p>
            </div>
            <div className={`rounded-2xl p-4 border ${
              (s?.monthlyGrowth || 0) >= 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <p className="text-xs font-bold uppercase mb-1 text-gray-500">📈 Monthly Growth</p>
              <p className={`font-black text-2xl ${(s?.monthlyGrowth || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                {(s?.monthlyGrowth || 0) >= 0 ? "+" : ""}{s?.monthlyGrowth || 0}%
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {formatKSh(s?.thisMonthTotal || 0)} this month vs {formatKSh(s?.lastMonthTotal || 0)} last month
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm">
            {([
              { key: "overview", label: "📊 Overview" },
              { key: "commissions", label: "💰 Commissions" },
              { key: "subscriptions", label: "💳 Subscriptions" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? "bg-kazi-orange text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-5">

              {/* Monthly breakdown */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-kazi-dark">📅 Monthly Breakdown (Last 12 Months)</h3>
                  <button
                    onClick={() => handleExport("all")}
                    className="flex items-center gap-1 text-xs text-kazi-orange font-bold"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Month</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Commission</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Subscription</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Total</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Txns</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.monthlyData?.length === 0) && (
                        <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No data yet</td></tr>
                      )}
                      {data?.monthlyData?.map((row: any, i: number) => {
                        const subRow = data?.monthlySubData?.find((s: any) => s.month === row.month);
                        const sub = parseFloat(subRow?.subscription || 0);
                        const comm = parseFloat(row.commission || 0);
                        return (
                          <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3 font-bold text-kazi-dark text-sm">{row.month}</td>
                            <td className="px-5 py-3 text-right text-sm text-kazi-orange font-semibold">
                              KSh {comm.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-blue-600 font-semibold">
                              KSh {sub.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right font-black text-kazi-dark">
                              KSh {(comm + sub).toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-gray-400">
                              {parseInt(row.transactions)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily breakdown */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-black text-kazi-dark">📆 Daily Breakdown (Last 30 Days)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Date</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Commission</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Subscription</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.dailyData?.length === 0) && (
                        <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">No data yet</td></tr>
                      )}
                      {data?.dailyData?.map((row: any, i: number) => {
                        const subRow = data?.dailySubData?.find(
                          (s: any) => new Date(s.date).toDateString() === new Date(row.date).toDateString()
                        );
                        const sub = parseFloat(subRow?.subscription || 0);
                        const comm = parseFloat(row.commission || 0);
                        return (
                          <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-5 py-3 font-bold text-kazi-dark text-sm">
                              {new Date(row.date).toLocaleDateString("en-KE", {
                                weekday: "short", day: "numeric", month: "short", year: "numeric",
                              })}
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-kazi-orange font-semibold">
                              KSh {comm.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-blue-600 font-semibold">
                              KSh {sub.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right font-black text-kazi-dark">
                              KSh {(comm + sub).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top earners */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-black text-kazi-dark mb-4">🏆 Top Commission Contributors</h3>
                <div className="space-y-3">
                  {data?.topEarners?.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
                  )}
                  {data?.topEarners?.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                          i === 0 ? "bg-yellow-100 text-yellow-600"
                          : i === 1 ? "bg-gray-200 text-gray-600"
                          : i === 2 ? "bg-orange-100 text-orange-600"
                          : "bg-gray-50 text-gray-400"
                        }`}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </div>
                        <div>
                          <p className="font-bold text-kazi-dark text-sm">{e.provider?.businessName}</p>
                          <p className="text-xs text-gray-400">{e.provider?.user?.phone} · {e._count} jobs</p>
                        </div>
                      </div>
                      <p className="font-black text-kazi-orange">
                        KSh {(e._sum?.commissionAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COMMISSIONS TAB ───────────────────────────────────────────────── */}
          {activeTab === "commissions" && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-kazi-dark">💰 Commission Transactions (Latest 20)</h3>
                <button
                  onClick={() => handleExport("all")}
                  className="flex items-center gap-1 text-xs text-kazi-orange font-bold"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Provider</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Service</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Customer</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Job Value</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentCommissions?.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No commission payments yet</td></tr>
                    )}
                    {data?.recentCommissions?.map((c: any, i: number) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {c.paidAt ? new Date(c.paidAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-kazi-dark text-sm">{c.provider?.businessName}</p>
                          <p className="text-xs text-gray-400">{c.provider?.user?.phone}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{c.booking?.service?.name || "—"}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{c.booking?.customer?.name || "—"}</td>
                        <td className="px-5 py-3 text-right text-sm text-gray-600">
                          KSh {(c.cashAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right font-black text-kazi-orange">
                          KSh {(c.commissionAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTIONS TAB ─────────────────────────────────────────────── */}
          {activeTab === "subscriptions" && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-kazi-dark">💳 Subscription Payments (Latest 20)</h3>
                <button
                  onClick={() => handleExport("all")}
                  className="flex items-center gap-1 text-xs text-kazi-orange font-bold"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Business</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase">Plan</th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentSubscriptions?.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">No subscription payments yet</td></tr>
                    )}
                    {data?.recentSubscriptions?.map((sub: any, i: number) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {sub.paidAt ? new Date(sub.paidAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-kazi-dark text-sm">{sub.subscription?.provider?.businessName}</p>
                          <p className="text-xs text-gray-400">{sub.subscription?.provider?.user?.phone}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            sub.subscription?.plan === "PREMIUM"
                              ? "bg-purple-100 text-purple-600"
                              : sub.subscription?.plan === "GROWTH"
                              ? "bg-orange-100 text-kazi-orange"
                              : "bg-green-100 text-green-600"
                          }`}>
                            {sub.subscription?.plan === "STARTER" ? "🌱 Starter"
                             : sub.subscription?.plan === "GROWTH" ? "🚀 Growth"
                             : "👑 Premium"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-black text-blue-600">
                          KSh {(sub.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
