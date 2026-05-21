"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet,
  ArrowDownCircle, CheckCircle, ArrowLeft, RefreshCw, CreditCard,
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function fmt(n: number) {
  return `KSh ${Math.round(n).toLocaleString()}`;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",    cls: "bg-yellow-100 text-yellow-700" },
  APPROVED:   { label: "Approved",   cls: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Processing", cls: "bg-purple-100 text-purple-700" },
  COMPLETED:  { label: "Completed",  cls: "bg-green-100 text-green-700" },
  REJECTED:   { label: "Rejected",   cls: "bg-red-100 text-red-700" },
};

export default function EarningsPage() {
  const router = useRouter();
  const [summary, setSummary]           = useState<any>(null);
  const [history, setHistory]           = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts]           = useState<any[]>([]);
  const [tab, setTab]                   = useState<"transactions" | "payouts">("transactions");
  const [loading, setLoading]           = useState(true);
  const [showPayout, setShowPayout]     = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutPhone, setPayoutPhone]   = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [chartDays, setChartDays]       = useState(30);
  const [subscription, setSubscription]           = useState<any>(null);
  const [isFundi, setIsFundi]                     = useState(false);
  const [pendingCommissionTotal, setPendingCommissionTotal] = useState(0);

  const getToken = () => localStorage.getItem("kazishow_token") || "";

  useEffect(() => {
    const raw = localStorage.getItem("kazishow_user");
    if (!raw) return router.push("/auth/login");
    const user = JSON.parse(raw);
    if (user.role !== "PROVIDER") return router.push("/");
    if (user.phone) setPayoutPhone(user.phone);
    const category = user.provider?.category;
    setIsFundi(category === "FUNDI");
    loadAll(chartDays);
    // Fetch subscription for non-FUNDI providers
    if (category && category !== "FUNDI") {
      const token = localStorage.getItem("kazishow_token") || "";
      fetch(`${API}/api/subscriptions/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.success) setSubscription(d.data); })
        .catch(() => {});
    }
    // Fetch pending commission for Fundi providers
    if (category === "FUNDI") {
      const token = localStorage.getItem("kazishow_token") || "";
      fetch(`${API}/api/bookings/commission/outstanding`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.data)) {
            const total = d.data.reduce((sum: number, c: any) => sum + (c.commissionAmount || 0), 0);
            setPendingCommissionTotal(total);
          }
        })
        .catch(() => {});
    }
  }, []);

  async function loadAll(days = chartDays) {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${getToken()}` };
      const [sumRes, histRes, payRes] = await Promise.all([
        fetch(`${API}/api/earnings/summary`, { headers: h }),
        fetch(`${API}/api/earnings/history?days=${days}`, { headers: h }),
        fetch(`${API}/api/earnings/payouts`, { headers: h }),
      ]);
      const [s, hi, p] = await Promise.all([sumRes.json(), histRes.json(), payRes.json()]);
      if (s.success)  setSummary(s.data);
      if (hi.success) { setHistory(hi.data.history); setTransactions(hi.data.transactions); }
      if (p.success)  setPayouts(p.data);
    } catch { toast.error("Failed to load earnings"); }
    finally { setLoading(false); }
  }

  async function changeChartDays(d: number) {
    setChartDays(d);
    try {
      const r = await fetch(`${API}/api/earnings/history?days=${d}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await r.json();
      if (data.success) { setHistory(data.data.history); setTransactions(data.data.transactions); }
    } catch { /* silent */ }
  }

  async function requestPayout() {
    const amt = parseFloat(payoutAmount);
    if (!amt || amt < 100) { toast.error("Minimum payout is KSh 100"); return; }
    if (!payoutPhone.trim()) { toast.error("Enter your M-Pesa phone number"); return; }
    if (summary && amt > summary.availableBalance) { toast.error("Insufficient balance"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/earnings/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amount: amt, phone: payoutPhone.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success("Payout requested! We'll send it within 24hrs 💰");
        setShowPayout(false);
        setPayoutAmount("");
        loadAll();
      } else {
        toast.error(d.message);
      }
    } catch { toast.error("Failed to request payout"); }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const growth = summary?.growth ?? 0;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-center" />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white card-shadow">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-kazi-dark">💰 My Earnings</h1>
              <p className="text-gray-500 text-sm">Track income and request payouts</p>
            </div>
          </div>
          <button onClick={() => loadAll()} className="p-2 rounded-xl bg-white card-shadow">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Subscription card for non-FUNDI providers */}
        {!isFundi && subscription && (
          <Link
            href="/provider/subscription"
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              !subscription.isActive
                ? "bg-red-50 border-red-200"
                : subscription.daysRemaining <= 3
                ? "bg-amber-50 border-amber-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                !subscription.isActive ? "bg-red-100" : subscription.daysRemaining <= 3 ? "bg-amber-100" : "bg-green-100"
              }`}>
                <CreditCard className={`w-5 h-5 ${
                  !subscription.isActive ? "text-red-500" : subscription.daysRemaining <= 3 ? "text-amber-600" : "text-green-600"
                }`} />
              </div>
              <div>
                <p className={`text-sm font-black ${
                  !subscription.isActive ? "text-red-700" : subscription.daysRemaining <= 3 ? "text-amber-700" : "text-green-700"
                }`}>
                  {!subscription.isActive
                    ? "Subscription Expired — Renew Now"
                    : subscription.subscription?.status === "TRIAL"
                    ? `Free Trial — ${subscription.daysRemaining} day${subscription.daysRemaining !== 1 ? "s" : ""} left`
                    : `${subscription.subscription?.plan} Plan — ${subscription.daysRemaining} days left`}
                </p>
                <p className="text-xs text-gray-500">
                  {!subscription.isActive ? "Customers cannot book you" : "Tap to manage your plan"}
                </p>
              </div>
            </div>
            <span className={`text-xs font-black px-3 py-1.5 rounded-xl text-white ${
              !subscription.isActive ? "bg-red-500" : subscription.daysRemaining <= 3 ? "bg-amber-500" : "bg-green-500"
            }`}>
              {!subscription.isActive ? "Renew" : "Manage"}
            </span>
          </Link>
        )}

        {/* Commission payment card — Fundi only */}
        {isFundi && pendingCommissionTotal > 0 && (
          <Link
            href="/provider/commission"
            className="flex items-center justify-between p-4 rounded-2xl border bg-red-50 border-red-200 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
                💰
              </div>
              <div>
                <p className="text-sm font-black text-red-700">Commission Due — KSh {pendingCommissionTotal.toLocaleString()}</p>
                <p className="text-xs text-red-500">Pay via Paybill 247247 · Tap for instructions</p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1.5 rounded-xl text-white bg-red-500 flex-shrink-0">Pay Now</span>
          </Link>
        )}

        {/* Balance hero */}
        <div className="bg-gradient-to-br from-kazi-orange to-orange-600 rounded-2xl p-6 text-white">
          <p className="text-sm font-medium text-orange-100 mb-1">Available Balance</p>
          <p className="text-4xl font-black mb-4">{fmt(summary?.availableBalance ?? 0)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPayout(true)}
              className="flex-1 py-3 bg-white text-kazi-orange font-black rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
            >
              <ArrowDownCircle className="w-4 h-4" /> Withdraw
            </button>
            <div className="flex-1 py-3 bg-white/20 rounded-xl text-center">
              <p className="text-xs text-orange-100">Pending</p>
              <p className="font-bold text-sm">{fmt(summary?.pendingPayout ?? 0)}</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Today",      value: summary?.today ?? 0,       sub: `${summary?.todayBookings ?? 0} jobs`,    icon: DollarSign, color: "text-green-600",      bg: "bg-green-50" },
            { label: "This Week",  value: summary?.thisWeek ?? 0,    sub: "last 7 days",                             icon: TrendingUp, color: "text-blue-600",       bg: "bg-blue-50" },
            { label: "This Month", value: summary?.thisMonth ?? 0,   sub: `${summary?.thisMonthBookings ?? 0} jobs`, icon: Wallet,     color: "text-purple-600",     bg: "bg-purple-50" },
            { label: "All Time",   value: summary?.totalEarned ?? 0, sub: `${summary?.totalBookings ?? 0} jobs`,     icon: CheckCircle,color: "text-kazi-orange",    bg: "bg-orange-50" },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 card-shadow">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xl font-black text-kazi-dark">{fmt(value)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              <p className="text-xs text-gray-300">{sub}</p>
            </div>
          ))}
        </div>

        {/* Growth badge */}
        {summary && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${growth >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(growth)}% {growth >= 0 ? "more" : "less"} than last month
            <span className="ml-auto font-normal text-xs text-gray-400">vs {fmt(summary.lastMonth)}</span>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-kazi-dark">Earnings History</h2>
            <div className="flex gap-1">
              {[7, 14, 30].map(d => (
                <button key={d}
                  onClick={() => changeChartDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartDays === d ? "bg-kazi-orange text-white" : "bg-gray-100 text-gray-500"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  formatter={(v: any) => [`KSh ${Number(v).toLocaleString()}`, "Earnings"]}
                />
                <Area type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={2.5} fill="url(#eg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">No earnings data yet</div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(["transactions", "payouts"] as const).map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-bold transition-all ${tab === t ? "text-kazi-orange border-b-2 border-kazi-orange" : "text-gray-400"}`}>
                {t === "transactions" ? "Transactions" : "Payouts"}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {tab === "transactions" ? (
              transactions.length === 0 ? (
                <p className="text-center text-gray-300 text-sm py-8">No transactions yet</p>
              ) : transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-kazi-dark truncate">
                      {tx.booking?.customer?.name ?? "Customer"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.booking?.service?.name ?? "Service"} · {new Date(tx.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-black text-green-600">+{fmt(tx.providerAmount ?? 0)}</p>
                    <p className="text-xs text-gray-300">of {fmt(tx.amount ?? 0)}</p>
                  </div>
                </div>
              ))
            ) : (
              payouts.length === 0 ? (
                <p className="text-center text-gray-300 text-sm py-8">No payouts yet</p>
              ) : payouts.map((p: any) => {
                const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.PENDING;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-kazi-dark">{fmt(p.amount)}</p>
                      <p className="text-xs text-gray-400">{p.phone} · {new Date(p.requestedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
                      {p.mpesaRef && <p className="text-xs text-green-600 mt-0.5">Ref: {p.mpesaRef}</p>}
                      {p.adminNote && p.status === "REJECTED" && <p className="text-xs text-red-400 mt-0.5">{p.adminNote}</p>}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pb-24" />
      </div>

      {/* Payout modal */}
      {showPayout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowPayout(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-kazi-dark">Request Payout</h3>
            <p className="text-sm text-gray-500">Available: <span className="font-bold text-kazi-orange">{fmt(summary?.availableBalance ?? 0)}</span></p>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Select</p>
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2000, 5000].map(a => (
                  <button key={a}
                    onClick={() => setPayoutAmount(String(a))}
                    disabled={a > (summary?.availableBalance ?? 0)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 ${payoutAmount === String(a) ? "bg-kazi-orange text-white" : "bg-gray-100 text-gray-600"}`}>
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Amount (KSh)</label>
              <input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">M-Pesa Number</label>
              <input type="tel" value={payoutPhone} onChange={e => setPayoutPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange" />
            </div>

            <p className="text-xs text-gray-400 text-center">Minimum KSh 100 · Processed within 24 hours</p>

            <div className="flex gap-3">
              <button onClick={() => setShowPayout(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">
                Cancel
              </button>
              <button onClick={requestPayout} disabled={submitting}
                className="flex-1 py-3 bg-kazi-orange text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
