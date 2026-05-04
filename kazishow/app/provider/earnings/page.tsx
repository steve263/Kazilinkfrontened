"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Wallet, TrendingUp, Calendar, Clock,
  CheckCircle, AlertCircle, Loader2, Send, RefreshCw,
  ChevronRight, DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function fmt(n: number) {
  return `KSh ${Math.round(n).toLocaleString()}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

const WITHDRAWAL_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Pending",    color: "text-amber-600 bg-amber-50" },
  PROCESSING: { label: "Processing", color: "text-blue-600 bg-blue-50" },
  COMPLETED:  { label: "Paid Out",   color: "text-green-600 bg-green-50" },
  FAILED:     { label: "Failed",     color: "text-red-600 bg-red-50" },
};

export default function EarningsPage() {
  const router = useRouter();

  const [earnings, setEarnings]     = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wAmount, setWAmount]       = useState("");
  const [wPhone, setWPhone]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("kazishow_token") : null;
  const user  = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("kazishow_user") || "null") : null;

  const fetchAll = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      // Need provider ID — get it from profile
      const meRes = await fetch(`${API}/api/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      const myProvider = meData.data?.find((p: any) => p.userId === user.id);
      if (!myProvider) { toast.error("Provider profile not found"); return; }

      const [earRes, wdRes] = await Promise.all([
        fetch(`${API}/api/providers/${myProvider.id}/earnings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/providers/withdrawals/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const earData = await earRes.json();
      const wdData  = await wdRes.json();

      if (earData.success) setEarnings(earData.data);
      if (wdData.success)  setWithdrawals(wdData.data.withdrawals || []);
    } catch {
      toast.error("Could not load earnings");
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!token || !user) { router.replace("/auth/login"); return; }
    if (user.role !== "PROVIDER") { router.replace("/"); return; }
    // Pre-fill phone from user profile
    if (user.phone) setWPhone(user.phone);
    fetchAll();
  }, []);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(wAmount);
    if (!amount || amount < 100) { toast.error("Minimum withdrawal is KSh 100"); return; }
    if (!wPhone.trim()) { toast.error("M-Pesa phone number is required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/providers/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, phone: wPhone.trim() }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message); return; }
      toast.success("Withdrawal request submitted! Admin will process it shortly.");
      setShowWithdraw(false);
      setWAmount("");
      fetchAll();
    } catch {
      toast.error("Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-kazi-orange animate-spin" />
      </div>
    );
  }

  const balance = earnings?.walletBalance ?? 0;

  return (
    <div className="min-h-screen bg-kazi-cream pb-10">
      {/* Header */}
      <div className="bg-kazi-dark text-white px-4 pt-6 pb-16">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black">Earnings & Wallet</h1>
            <p className="text-white/60 text-xs">Your KaziShow earnings overview</p>
          </div>
          <button onClick={fetchAll} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-10 space-y-4">

        {/* Wallet card */}
        <div className="bg-gradient-to-br from-kazi-orange to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <span className="font-bold text-sm">Available Balance</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold">
              Total earned: {fmt(earnings?.totalEarned ?? 0)}
            </span>
          </div>
          <p className="text-4xl font-black mb-6">{fmt(balance)}</p>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={balance < 100}
            className="w-full py-3 bg-white text-kazi-orange font-bold text-sm rounded-2xl hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {balance < 100 ? "Min. KSh 100 to withdraw" : "Withdraw to M-Pesa"}
          </button>
        </div>

        {/* Stats grid */}
        {earnings && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Today",     value: earnings.today,   icon: Clock,       color: "text-blue-600 bg-blue-50" },
              { label: "This Week", value: earnings.week,    icon: Calendar,    color: "text-purple-600 bg-purple-50" },
              { label: "This Month",value: earnings.month,   icon: TrendingUp,  color: "text-green-600 bg-green-50" },
              { label: "All Time",  value: earnings.allTime, icon: DollarSign,  color: "text-kazi-orange bg-orange-50" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-xl ${color.split(" ")[1]} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                </div>
                <p className="text-lg font-black text-kazi-dark">{fmt(value.amount)}</p>
                <p className="text-xs text-gray-500">{label} · {value.jobs} job{value.jobs !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent transactions */}
        {earnings?.recentBookings?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="font-bold text-kazi-dark text-sm">Recent Payments</p>
            </div>
            {earnings.recentBookings.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kazi-dark truncate">
                    {b.customer?.name || "Customer"}
                  </p>
                  <p className="text-xs text-gray-400">{b.service?.name || "Service"} · {fmtDate(b.updatedAt)}</p>
                </div>
                <span className="font-black text-green-600 text-sm">{fmt(b.totalAmount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Withdrawal history */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="font-bold text-kazi-dark text-sm">Withdrawal History</p>
            <span className="text-xs text-gray-400">{withdrawals.length} request{withdrawals.length !== 1 ? "s" : ""}</span>
          </div>
          {withdrawals.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No withdrawals yet</div>
          ) : (
            withdrawals.map((w) => {
              const st = WITHDRAWAL_STATUS[w.status] || { label: w.status, color: "text-gray-600 bg-gray-50" };
              return (
                <div key={w.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-kazi-dark">{fmt(w.amount)}</p>
                    <p className="text-xs text-gray-400">{w.phone} · {fmtDate(w.createdAt)}</p>
                    {w.mpesaRef && <p className="text-xs text-gray-400">Ref: {w.mpesaRef}</p>}
                    {w.failReason && <p className="text-xs text-red-400">{w.failReason}</p>}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-kazi-dark text-lg">Withdraw Funds</h2>
              <button onClick={() => setShowWithdraw(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-500">Available</p>
              <p className="text-2xl font-black text-kazi-orange">{fmt(balance)}</p>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Amount (KSh)</label>
                <input
                  type="number"
                  min="100"
                  max={balance}
                  step="1"
                  value={wAmount}
                  onChange={(e) => setWAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-kazi-orange"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={wPhone}
                  onChange={(e) => setWPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange"
                  required
                />
              </div>
              <div className="flex items-start gap-2 bg-blue-50 rounded-2xl p-3 text-xs text-blue-700">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Withdrawals are processed within 24 hours by our admin team.
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting…" : "Request Withdrawal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
