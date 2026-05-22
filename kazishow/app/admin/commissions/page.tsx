"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart2, ClipboardCheck, BadgeCheck, CheckSquare, Users, ShoppingBag,
  Activity, Wallet, Shield, Scale, Gavel, XCircle, CreditCard, Megaphone,
  ShieldAlert, Settings, RefreshCw, Search, ChevronDown, CheckCircle,
  AlertTriangle, Clock,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const NAV = [
  { label: "Overview",        href: "/admin",                 icon: BarChart2 },
  { label: "Subscriptions",   href: "/admin/subscriptions",   icon: CreditCard },
  { label: "Commissions",     href: "/admin/commissions",     icon: Wallet },
  { label: "Approvals",       href: "/admin/approvals",       icon: ClipboardCheck },
  { label: "Verification",    href: "/admin/verification",    icon: BadgeCheck },
  { label: "Providers",       href: "/admin/providers",       icon: CheckSquare },
  { label: "Users",           href: "/admin/users",           icon: Users },
  { label: "Bookings",        href: "/admin/bookings",        icon: ShoppingBag },
  { label: "Analytics",       href: "/admin/analytics",       icon: Activity },
  { label: "Trust & Safety",  href: "/admin/trust",           icon: Shield },
  { label: "Appeals",         href: "/admin/appeals",         icon: Scale },
  { label: "Disputes",        href: "/admin/disputes",        icon: Gavel },
  { label: "Cancellations",   href: "/admin/cancellations",   icon: XCircle },
  { label: "Broadcast",       href: "/admin/broadcast",       icon: Megaphone },
  { label: "Auto-Suspension", href: "/admin/auto-suspension", icon: ShieldAlert },
  { label: "Settings",        href: "/admin/settings",        icon: Settings },
];

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING:              { label: "Pending",      color: "bg-yellow-100 text-yellow-700" },
  OVERDUE:              { label: "Overdue",      color: "bg-red-100 text-red-700" },
  PENDING_VERIFICATION: { label: "Verifying",    color: "bg-amber-100 text-amber-700" },
  PAID:                 { label: "Paid",         color: "bg-green-100 text-green-700" },
  WAIVED:               { label: "Waived",       color: "bg-gray-100 text-gray-500" },
};

export default function AdminCommissionsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const load = useCallback(async (pg = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API}/api/bookings/admin/commissions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCommissions(data.data.commissions ?? []);
        setStats(data.data.stats ?? []);
        setTotal(data.data.total ?? 0);
        setPage(pg);
      }
    } catch {
      toast.error("Failed to load commissions");
    }
    setLoading(false);
  }, [token, statusFilter]);

  useEffect(() => { if (token) load(1); }, [token, load]);

  const action = async (url: string, method = "PUT", body?: object) => {
    const res = await fetch(`${API}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const handleConfirm = async (id: string) => {
    if (!confirm("Confirm this commission payment? Provider will be notified.")) return;
    setActionId(id);
    const data = await action(`/api/bookings/commissions/${id}/confirm-payment`).catch(() => null);
    if (data?.success) { toast.success("✅ Commission confirmed"); load(page); }
    else toast.error(data?.message || "Failed");
    setActionId(null);
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason (sent to provider):");
    if (reason === null) return;
    setActionId(id);
    const data = await action(`/api/bookings/commissions/${id}/reject-payment`, "PUT", { reason }).catch(() => null);
    if (data?.success) { toast.success("Payment rejected — provider notified"); load(page); }
    else toast.error(data?.message || "Failed");
    setActionId(null);
  };

  const handleWaive = async (id: string) => {
    const reason = prompt("Reason for waiving:");
    if (!reason) return;
    setActionId(id);
    const data = await action(`/api/bookings/commissions/${id}/waive`, "PUT", { reason }).catch(() => null);
    if (data?.success) { toast.success("Commission waived"); load(page); }
    else toast.error(data?.message || "Failed");
    setActionId(null);
  };

  const handleSuspend = async (id: string, providerName: string) => {
    if (!confirm(`Suspend ${providerName} for unpaid commission? They will be notified.`)) return;
    setActionId(id);
    const data = await action(`/api/admin/commissions/${id}/suspend-provider`).catch(() => null);
    if (data?.success) { toast.success("Provider suspended"); load(page); }
    else toast.error(data?.message || "Failed");
    setActionId(null);
  };

  if (!ready) return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalPages = Math.ceil(total / 20);
  const pendingVerif = commissions.filter(c => c.status === "PENDING_VERIFICATION");

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/commissions" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Commission Management</h1>
              <p className="text-xs text-gray-400">Verify payments, waive fees, suspend non-payers</p>
            </div>
          </div>
          <button onClick={() => load(page)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-w-5xl mx-auto">

          {/* Stats */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s: any) => {
                const cfg = STATUS_CFG[s.status] || { label: s.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <div key={s.status} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className={`text-2xl font-black ${s.status === "OVERDUE" ? "text-red-500" : s.status === "PAID" ? "text-green-600" : s.status === "PENDING_VERIFICATION" ? "text-amber-600" : "text-kazi-orange"}`}>
                      KSh {(s._sum?.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{cfg.label} ({s._count})</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pending verification — top priority */}
          {pendingVerif.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>📩</span> Awaiting Verification
                <span className="bg-amber-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{pendingVerif.length}</span>
              </h2>
              <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                  <p className="font-black text-amber-700 text-sm">Fundi providers submitted Equity Bank messages — verify below</p>
                </div>
                {pendingVerif.map((c: any) => (
                  <div key={c.id} className="p-4 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-kazi-dark text-sm">{c.provider?.businessName}</p>
                        <p className="text-xs text-gray-400">{c.provider?.user?.phone}</p>
                        <p className="text-xs text-gray-400">{c.booking?.service?.name} · KSh {c.amount?.toLocaleString()} commission</p>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">PENDING VERIFICATION</span>
                    </div>
                    {c.mpesaRef && (
                      <div className="mt-2 mb-3 space-y-2">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-bold text-gray-400 mb-1">M-Pesa SMS Message:</p>
                          <p className="text-sm text-gray-700 leading-relaxed break-words">{c.mpesaRef}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3">
                          <p className="text-blue-600 text-xs font-bold">📱 Check Equity Bank:</p>
                          <p className="text-blue-500 text-xs mt-1">
                            Verify this payment arrived in your Equity Bank account <strong>0795542312</strong> from Paybill <strong>247247</strong>
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirm(c.id)} disabled={actionId === c.id}
                        className="flex-1 py-2 bg-green-500 text-white font-bold rounded-xl text-xs disabled:opacity-50">
                        {actionId === c.id ? "..." : "✅ Confirm Payment"}
                      </button>
                      <button onClick={() => handleReject(c.id)} disabled={actionId === c.id}
                        className="flex-1 py-2 bg-red-100 text-red-600 font-bold rounded-xl text-xs disabled:opacity-50">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-44 bg-gray-50 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(1)}
                placeholder="Search provider..."
                className="bg-transparent text-sm flex-1 outline-none" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setTimeout(() => load(1), 0); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm font-semibold text-kazi-dark outline-none">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PENDING_VERIFICATION">Verifying</option>
                <option value="PAID">Paid</option>
                <option value="WAIVED">Waived</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Commission list */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                  <div className="h-5 w-48 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                </div>
              ))
            ) : commissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
                <p className="font-black text-gray-500">No commissions found</p>
              </div>
            ) : (
              commissions.map((c: any) => {
                const cfg = STATUS_CFG[c.status] || STATUS_CFG.PENDING;
                const hours = (Date.now() - new Date(c.createdAt).getTime()) / 3600000;
                const isOverdue = ["PENDING", "OVERDUE"].includes(c.status) && hours >= 8;
                return (
                  <div key={c.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isOverdue ? "border-red-200" : "border-gray-100"}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-black text-kazi-dark text-sm">{c.provider?.businessName}</p>
                          <p className="text-xs text-gray-400">{c.provider?.user?.phone}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.booking?.service?.name || "Service"}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-kazi-dark">KSh {c.amount?.toLocaleString()}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">
                              <Clock className="w-3 h-3" /> {Math.floor(hours)}h overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {c.mpesaRef && (
                        <div className="mt-3 space-y-2">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-bold text-gray-400 mb-1">M-Pesa SMS Message:</p>
                            <p className="text-sm text-gray-700 leading-relaxed break-words">{c.mpesaRef}</p>
                          </div>
                          {c.status === "PENDING_VERIFICATION" && (
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-blue-600 text-xs font-bold">📱 Check Equity Bank:</p>
                              <p className="text-blue-500 text-xs mt-1">
                                Verify this payment arrived in your Equity Bank account <strong>0795542312</strong> from Paybill <strong>247247</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3 flex-wrap">
                        {c.status === "PENDING_VERIFICATION" && (
                          <>
                            <button onClick={() => handleConfirm(c.id)} disabled={actionId === c.id}
                              className="px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg text-xs disabled:opacity-50">
                              ✅ Confirm
                            </button>
                            <button onClick={() => handleReject(c.id)} disabled={actionId === c.id}
                              className="px-3 py-1.5 bg-red-100 text-red-600 font-bold rounded-lg text-xs disabled:opacity-50">
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {["PENDING", "OVERDUE"].includes(c.status) && (
                          <>
                            <button onClick={() => handleWaive(c.id)} disabled={actionId === c.id}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs disabled:opacity-50">
                              Waive
                            </button>
                            {isOverdue && (
                              <button onClick={() => handleSuspend(c.id, c.provider?.businessName)} disabled={actionId === c.id}
                                className="px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg text-xs disabled:opacity-50 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Suspend
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => load(page - 1)} disabled={page === 1 || loading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-40">
                Previous
              </button>
              <span className="text-sm text-gray-500 font-semibold">Page {page} of {totalPages} · {total} total</span>
              <button onClick={() => load(page + 1)} disabled={page === totalPages || loading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
