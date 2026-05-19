"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, CreditCard, Users, ShoppingBag, Activity, CheckSquare,
  BarChart2, ClipboardCheck, Wallet, Shield, Scale, XCircle, Megaphone,
  ShieldAlert, RefreshCw, Search, ChevronDown, TrendingUp, Clock,
  CheckCircle, AlertCircle, Gift, Calendar, MoreVertical, X, BadgeCheck, Settings,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const NAV = [
  { label: "Overview",        href: "/admin",                 icon: BarChart2 },
  { label: "Approvals",       href: "/admin/approvals",       icon: ClipboardCheck },
  { label: "Verification",    href: "/admin/verification",    icon: BadgeCheck },
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
  { label: "Settings",        href: "/admin/settings",        icon: Settings },

];

const PLAN_COLORS: Record<string, string> = {
  STARTER: "bg-blue-100 text-blue-700",
  GROWTH:  "bg-purple-100 text-purple-700",
  PREMIUM: "bg-amber-100 text-amber-700",
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  ACTIVE:  { color: "bg-green-100 text-green-700",  icon: CheckCircle, label: "Active" },
  TRIAL:   { color: "bg-blue-100 text-blue-700",    icon: Gift,        label: "Trial" },
  EXPIRED: { color: "bg-red-100 text-red-700",      icon: AlertCircle, label: "Expired" },
};

interface SubPayment {
  id: string;
  amount: number;
  status: string;
  mpesaRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  trialStartDate: string | null;
  trialEndDate: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  amount: number | null;
  mpesaRef: string | null;
  updatedAt: string;
  provider: {
    id: string;
    businessName: string;
    category: string;
    user: { name: string; phone: string; email: string };
  };
  payments: SubPayment[];
}

interface Stats {
  totalTrial: number;
  totalActive: number;
  totalExpired: number;
  starterCount: number;
  growthCount: number;
  premiumCount: number;
  monthlyRevenue: number;
  totalRevenue: number;
  projectedRevenue: number;
}

interface ActionModal {
  sub: Subscription;
  type: "waive" | "extend";
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function progressPct(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const total = new Date(end).getTime() - new Date(start).getTime();
  const elapsed = Date.now() - new Date(start).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export default function AdminSubscriptionsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal | null>(null);
  const [actionDays, setActionDays] = useState(30);
  const [actionPlan, setActionPlan] = useState("STARTER");
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/subscriptions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* silent */ }
    setStatsLoading(false);
  }, [token]);

  const loadSubs = useCallback(async (pg = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("plan", planFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API}/api/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubs(data.data);
        setTotal(data.total);
        setPage(pg);
      }
    } catch {
      toast.error("Failed to load subscriptions");
    }
    setLoading(false);
  }, [token, statusFilter, planFilter, search]);

  useEffect(() => { if (token) { loadStats(); loadSubs(1); } }, [token, loadStats, loadSubs]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const url = `${API}/api/admin/subscriptions/${actionModal.sub.id}/${actionModal.type}`;
      const body = actionModal.type === "waive"
        ? { plan: actionPlan, reason: actionReason || "Admin waiver" }
        : { days: actionDays };
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(actionModal.type === "waive" ? "Subscription waived successfully" : `Extended by ${actionDays} days`);
        setActionModal(null);
        loadSubs(page);
        loadStats();
      } else {
        toast.error(data.message || "Action failed");
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

  const totalPages = Math.ceil(total / 15);

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/subscriptions" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
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
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Subscription Management</h1>
              <p className="text-xs text-gray-400">Monitor plans, waive fees, and extend subscriptions</p>
            </div>
          </div>
          <button onClick={() => { loadStats(); loadSubs(page); }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-w-6xl mx-auto">

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Trial",     value: stats?.totalTrial,     color: "bg-blue-50 text-blue-700",   icon: Gift },
              { label: "Active",    value: stats?.totalActive,    color: "bg-green-50 text-green-700", icon: CheckCircle },
              { label: "Expired",   value: stats?.totalExpired,   color: "bg-red-50 text-red-700",     icon: AlertCircle },
              { label: "This Month", value: stats ? `KSh ${(stats.monthlyRevenue).toLocaleString()}` : null, color: "bg-purple-50 text-purple-700", icon: TrendingUp },
              { label: "Projected", value: stats ? `KSh ${(stats.projectedRevenue).toLocaleString()}` : null, color: "bg-amber-50 text-amber-700", icon: Calendar },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl p-4 card-shadow border border-gray-100">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-500 font-semibold">{label}</p>
                {statsLoading
                  ? <div className="h-6 w-16 bg-gray-100 rounded animate-pulse mt-1" />
                  : <p className="text-xl font-black text-kazi-dark">{value ?? "—"}</p>
                }
              </div>
            ))}
          </div>

          {/* Plan breakdown */}
          {stats && (
            <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
              <h2 className="font-black text-kazi-dark mb-4 text-sm">Active Plan Breakdown</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Starter", count: stats.starterCount, price: 800,  color: "bg-blue-500" },
                  { label: "Growth",  count: stats.growthCount,  price: 1200, color: "bg-purple-500" },
                  { label: "Premium", count: stats.premiumCount, price: 1500, color: "bg-amber-500" },
                ].map(({ label, count, price, color }) => {
                  const pct = stats.totalActive > 0 ? Math.round((count / stats.totalActive) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-600">{label}</span>
                        <span className="text-xs text-gray-400">{count} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">KSh {price}/mo</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadSubs(1)}
                placeholder="Search by name or phone…"
                className="bg-transparent text-sm flex-1 outline-none text-kazi-dark placeholder-gray-400"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setTimeout(() => loadSubs(1), 0); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm font-semibold text-kazi-dark outline-none"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setTimeout(() => loadSubs(1), 0); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm font-semibold text-kazi-dark outline-none"
              >
                <option value="">All Plans</option>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="PREMIUM">Premium</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => loadSubs(1)}
              className="px-4 py-2 bg-kazi-dark text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Subscription list */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                  <div className="h-5 w-48 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                </div>
              ))
            ) : subs.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 card-shadow">
                <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="font-black text-gray-500">No subscriptions found</p>
                <p className="text-sm text-gray-400 mt-1">Try changing your filters</p>
              </div>
            ) : (
              subs.map((sub) => {
                const statusCfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.EXPIRED;
                const StatusIcon = statusCfg.icon;
                const isExpanded = expanded === sub.id;
                const endDate = sub.status === "TRIAL" ? sub.trialEndDate : sub.currentPeriodEnd;
                const startDate = sub.status === "TRIAL" ? sub.trialStartDate : sub.currentPeriodStart;
                const days = daysUntil(endDate);
                const pct = progressPct(startDate, endDate);

                return (
                  <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 font-black text-kazi-dark text-sm">
                          {sub.provider.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="font-black text-kazi-dark truncate">{sub.provider.businessName}</h3>
                              <p className="text-xs text-gray-500">{sub.provider.user.name} · {sub.provider.user.phone}</p>
                              <p className="text-xs text-gray-400">{sub.provider.category}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_COLORS[sub.plan] || "bg-gray-100 text-gray-600"}`}>
                                {sub.plan}
                              </span>
                              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusCfg.label}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          {(sub.status === "ACTIVE" || sub.status === "TRIAL") && endDate && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {days > 0 ? `${days} days remaining` : "Expires today"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {endDate ? new Date(endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${days <= 3 ? "bg-red-400" : days <= 7 ? "bg-amber-400" : "bg-green-400"}`}
                                  style={{ width: `${100 - pct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {sub.status === "EXPIRED" && endDate && (
                            <p className="text-xs text-red-500 mt-2 font-semibold">
                              Expired {new Date(endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>

                        {/* Actions menu */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { setActionModal({ sub, type: "waive" }); setActionPlan(sub.plan); setActionReason(""); }}
                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg transition-colors"
                            title="Waive (grant free access)"
                          >
                            Waive
                          </button>
                          <button
                            onClick={() => { setActionModal({ sub, type: "extend" }); setActionDays(30); }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
                            title="Extend subscription period"
                          >
                            Extend
                          </button>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : sub.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Payment history (expanded) */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                        <h4 className="text-xs font-black text-gray-500 mb-3">Recent Payments</h4>
                        {sub.payments.length === 0 ? (
                          <p className="text-xs text-gray-400">No payment records</p>
                        ) : (
                          <div className="space-y-2">
                            {sub.payments.map((p) => (
                              <div key={p.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${p.status === "PAID" ? "bg-green-400" : "bg-gray-300"}`} />
                                  <span className="font-semibold text-gray-700">KSh {p.amount?.toLocaleString()}</span>
                                  {p.mpesaRef && <span className="text-gray-400 font-mono">{p.mpesaRef.slice(0, 10)}…</span>}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <span className={`px-2 py-0.5 rounded-full font-bold ${p.status === "PAID" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    {p.status}
                                  </span>
                                  <span>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-KE") : new Date(p.createdAt).toLocaleDateString("en-KE")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {sub.mpesaRef && (
                          <p className="text-xs text-gray-400 mt-3">Last M-Pesa ref: <span className="font-mono">{sub.mpesaRef}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => loadSubs(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 font-semibold">Page {page} of {totalPages} · {total} total</span>
              <button
                onClick={() => loadSubs(page + 1)}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-kazi-dark">
                {actionModal.type === "waive" ? "Waive Subscription" : "Extend Subscription"}
              </h2>
              <button onClick={() => setActionModal(null)} className="p-1.5 rounded-xl hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              <span className="font-bold">{actionModal.sub.provider.businessName}</span>
              {actionModal.type === "waive"
                ? " will be granted free access for 30 days."
                : ` — extend by ${actionDays} days.`}
            </p>

            {actionModal.type === "waive" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Plan to grant</label>
                  <select
                    value={actionPlan}
                    onChange={(e) => setActionPlan(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                  >
                    <option value="STARTER">Starter (KSh 800/mo)</option>
                    <option value="GROWTH">Growth (KSh 1200/mo)</option>
                    <option value="PREMIUM">Premium (KSh 1500/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Reason (optional)</label>
                  <input
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Onboarding support, payment issue…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Extend by: <span className="text-kazi-orange font-black">{actionDays} days</span>
                </label>
                <input
                  type="range"
                  min={7} max={90} step={7}
                  value={actionDays}
                  onChange={(e) => setActionDays(Number(e.target.value))}
                  className="w-full accent-kazi-orange"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>7 days</span><span>90 days</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-kazi-orange text-white font-black rounded-xl text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Saving…" : actionModal.type === "waive" ? "Grant Access" : `Extend ${actionDays}d`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
