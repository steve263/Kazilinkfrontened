"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ShieldAlert, Users, ShoppingBag, Activity, CheckSquare,
  BarChart2, ClipboardCheck, Wallet, Shield, Scale, XCircle, Megaphone, CreditCard,
  RefreshCw, AlertTriangle, Clock, TrendingUp, Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const NAV = [
  { label: "Overview",        href: "/admin",                 icon: BarChart2 },
  { label: "Approvals",       href: "/admin/approvals",       icon: ClipboardCheck },
  { label: "Providers",       href: "/admin/providers",       icon: CheckSquare },
  { label: "Users",           href: "/admin/users",           icon: Users },
  { label: "Bookings",        href: "/admin/bookings",        icon: ShoppingBag },
  { label: "Analytics",       href: "/admin/analytics",       icon: Activity },
  { label: "Withdrawals",     href: "/admin/withdrawals",     icon: Wallet },
  { label: "Trust & Safety",  href: "/admin/trust",           icon: Shield },
  { label: "Appeals",         href: "/admin/appeals",         icon: Scale },
  { label: "Cancellations",   href: "/admin/cancellations",   icon: XCircle },
  { label: "Subscriptions",   href: "/admin/subscriptions",   icon: CreditCard },
  { label: "Broadcast",       href: "/admin/broadcast",       icon: Megaphone },
  { label: "Auto-Suspension", href: "/admin/auto-suspension", icon: ShieldAlert },
];

interface Candidate {
  id: string;
  businessName: string;
  category: string;
  userId: string;
  userName: string;
  phone: string;
  totalBookings: number;
  disputed: number;
  disputeRate: number;
  daysSinceActivity: number;
  reasons: string[];
}

export default function AutoSuspensionPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [disputeThreshold, setDisputeThreshold] = useState(30);
  const [inactiveDays, setInactiveDays] = useState(30);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const runAnalysis = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setSelected(new Set());
    setHasRun(true);
    try {
      const params = new URLSearchParams({
        disputeThreshold: String(disputeThreshold / 100),
        inactiveDays: String(inactiveDays),
      });
      const res = await fetch(`${API}/api/admin/auto-suspension/candidates?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.data);
        if (data.data.length === 0) toast.success("No flagged providers found with current thresholds");
        else toast(`Found ${data.data.length} flagged provider${data.data.length === 1 ? "" : "s"}`, { icon: "⚠️" });
      } else {
        toast.error(data.message || "Analysis failed");
      }
    } catch {
      toast.error("Failed to run analysis");
    }
    setLoading(false);
  }, [token, disputeThreshold, inactiveDays]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyAction = async (action: "warn" | "suspend") => {
    if (selected.size === 0) { toast.error("Select at least one provider"); return; }
    const label = action === "suspend" ? "suspend" : "warn";
    const confirmed = window.confirm(
      `${action === "suspend" ? "⚠️ SUSPEND" : "Warn"} ${selected.size} provider${selected.size === 1 ? "" : "s"}?\n\n${action === "suspend" ? "This will disable their accounts immediately. They can appeal via support." : "This sends a warning SMS and in-app notification."}`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/auto-suspension/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerIds: Array.from(selected), action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${action === "suspend" ? "Suspended" : "Warned"} ${data.data.affected} provider${data.data.affected === 1 ? "" : "s"}`);
        if (action === "suspend") {
          setCandidates((prev) => prev.filter((c) => !selected.has(c.id)));
        }
        setSelected(new Set());
      } else {
        toast.error(data.message || `${label} action failed`);
      }
    } catch {
      toast.error("Network error");
    }
    setActionLoading(false);
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
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-kazi-dark flex-col hidden lg:flex">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/auto-suspension" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
          <Link href="/admin" className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Auto-Suspension Rules</h1>
              <p className="text-xs text-gray-400">Flag providers by dispute rate or inactivity</p>
            </div>
          </div>
        </div>

        <div className="p-5 max-w-3xl mx-auto space-y-5">
          {/* Threshold settings */}
          <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
            <h2 className="font-black text-kazi-dark mb-4">Thresholds</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                  Dispute Rate Threshold: <span className="text-red-600 font-black">{disputeThreshold}%</span>
                </label>
                <input
                  type="range"
                  min={5} max={80} step={5}
                  value={disputeThreshold}
                  onChange={(e) => setDisputeThreshold(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
                <p className="text-xs text-gray-400 mt-1">Flag if dispute rate ≥ {disputeThreshold}% (min 3 bookings)</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Inactivity Period: <span className="text-amber-600 font-black">{inactiveDays} days</span>
                </label>
                <input
                  type="range"
                  min={7} max={90} step={7}
                  value={inactiveDays}
                  onChange={(e) => setInactiveDays(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-xs text-gray-400 mt-1">Flag if no activity for {inactiveDays}+ days</p>
              </div>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-kazi-dark text-white font-black rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Scanning…" : "Run Analysis"}
            </button>
          </div>

          {/* Results */}
          {hasRun && (
            <div className="space-y-4">
              {candidates.length === 0 ? (
                <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-100">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h2 className="font-black text-green-800 mb-1">All clear!</h2>
                  <p className="text-sm text-green-700">No providers flagged with current thresholds.</p>
                </div>
              ) : (
                <>
                  {/* Bulk action bar */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 card-shadow flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelected(selected.size === candidates.length ? new Set() : new Set(candidates.map((c) => c.id)))}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                        {selected.size === candidates.length ? "Deselect All" : "Select All"}
                      </button>
                      <span className="text-sm text-gray-500">
                        <span className="font-black text-red-600">{candidates.length}</span> flagged provider{candidates.length === 1 ? "" : "s"}
                        {selected.size > 0 && <span className="text-kazi-orange font-bold"> · {selected.size} selected</span>}
                      </span>
                    </div>
                    {selected.size > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => applyAction("warn")}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Warn {selected.size}
                        </button>
                        <button
                          onClick={() => applyAction("suspend")}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          Suspend {selected.size}
                        </button>
                      </div>
                    )}
                  </div>

                  {candidates.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => toggle(c.id)}
                      className={`bg-white rounded-2xl p-5 card-shadow border-2 cursor-pointer transition-all ${selected.has(c.id) ? "border-kazi-orange bg-orange-50/30" : "border-gray-100 hover:border-gray-200"}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 w-4 h-4 accent-kazi-orange"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-black text-kazi-dark">{c.businessName}</h3>
                              <p className="text-xs text-gray-500">{c.userName} · {c.phone} · {c.category}</p>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="flex flex-wrap gap-3 mb-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                              <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-semibold text-gray-600">{c.totalBookings} bookings</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${c.disputeRate >= disputeThreshold ? "bg-red-100" : "bg-gray-50"}`}>
                              <AlertTriangle className={`w-3.5 h-3.5 ${c.disputeRate >= disputeThreshold ? "text-red-500" : "text-gray-400"}`} />
                              <span className={`text-xs font-semibold ${c.disputeRate >= disputeThreshold ? "text-red-600" : "text-gray-600"}`}>
                                {c.disputeRate}% disputes ({c.disputed})
                              </span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${c.daysSinceActivity >= inactiveDays ? "bg-amber-100" : "bg-gray-50"}`}>
                              <Clock className={`w-3.5 h-3.5 ${c.daysSinceActivity >= inactiveDays ? "text-amber-500" : "text-gray-400"}`} />
                              <span className={`text-xs font-semibold ${c.daysSinceActivity >= inactiveDays ? "text-amber-700" : "text-gray-600"}`}>
                                {c.daysSinceActivity}d inactive
                              </span>
                            </div>
                          </div>

                          {/* Reason tags */}
                          <div className="flex flex-wrap gap-2">
                            {c.reasons.map((r, i) => (
                              <span key={i} className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                                ⚠️ {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {!hasRun && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 card-shadow">
              <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h2 className="font-black text-kazi-dark mb-1">Ready to scan</h2>
              <p className="text-sm text-gray-400">Set your thresholds above and click "Run Analysis" to find providers that may need action.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
