"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart2, ClipboardCheck, BadgeCheck, CheckSquare, Users, ShoppingBag,
  Activity, Wallet, Shield, Scale, Gavel, XCircle, CreditCard, Megaphone,
  ShieldAlert, Settings, RefreshCw, CheckCircle, AlertTriangle, Phone,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const NAV = [
  { label: "Overview",        href: "/admin",                 icon: BarChart2     },
  { label: "Subscriptions",   href: "/admin/subscriptions",   icon: CreditCard    },
  { label: "Commissions",     href: "/admin/commissions",     icon: Wallet        },
  { label: "Approvals",       href: "/admin/approvals",       icon: ClipboardCheck },
  { label: "Verification",    href: "/admin/verification",    icon: BadgeCheck    },
  { label: "Providers",       href: "/admin/providers",       icon: CheckSquare   },
  { label: "Users",           href: "/admin/users",           icon: Users         },
  { label: "Bookings",        href: "/admin/bookings",        icon: ShoppingBag   },
  { label: "Analytics",       href: "/admin/analytics",       icon: Activity      },
  { label: "Trust & Safety",  href: "/admin/trust",           icon: Shield        },
  { label: "Appeals",         href: "/admin/appeals",         icon: Scale         },
  { label: "Disputes",        href: "/admin/disputes",        icon: Gavel         },
  { label: "Cancellations",   href: "/admin/cancellations",   icon: XCircle       },
  { label: "Broadcast",       href: "/admin/broadcast",       icon: Megaphone     },
  { label: "Auto-Suspension", href: "/admin/auto-suspension", icon: ShieldAlert   },
  { label: "Settings",        href: "/admin/settings",        icon: Settings      },
];

const STATUS_FILTERS = [
  { key: "ALL",                  label: "All",              emoji: "📋" },
  { key: "PENDING_VERIFICATION", label: "Needs Verification", emoji: "⏳" },
  { key: "PENDING",              label: "Not Paid",         emoji: "❌" },
  { key: "OVERDUE",              label: "Overdue",          emoji: "🚨" },
  { key: "PAID",                 label: "Paid",             emoji: "✅" },
  { key: "WAIVED",               label: "Waived",           emoji: "🎁" },
];

function getStatusBadge(status: string) {
  const map: Record<string, { style: string; label: string }> = {
    PENDING:              { style: "bg-red-100 text-red-600",    label: "❌ Not Paid"      },
    PENDING_VERIFICATION: { style: "bg-amber-100 text-amber-700", label: "⏳ Needs Check"  },
    PAID:                 { style: "bg-green-100 text-green-600", label: "✅ Paid"          },
    OVERDUE:              { style: "bg-red-200 text-red-700",    label: "🚨 Overdue"       },
    WAIVED:               { style: "bg-purple-100 text-purple-600", label: "🎁 Waived"    },
  };
  return map[status] ?? { style: "bg-gray-100 text-gray-600", label: status };
}

export default function AdminCommissionsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [waiveReason, setWaiveReason] = useState("");

  const WAIVE_REASONS = [
    { icon: "⚖️", label: "Job had a dispute or complaint", desc: "The job was disputed — commission not applicable." },
    { icon: "🌱", label: "New Fundi — grace period", desc: "First-time Fundi, giving them a grace period to settle in." },
    { icon: "⚙️", label: "System error on commission", desc: "Commission was wrongly created due to a system error." },
    { icon: "🏆", label: "Rewarding top-performing Fundi", desc: "Exceptional service — waiving as a reward." },
  ];

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchCommissions = async (t: string, status: string) => {
    setLoading(true);
    try {
      const url = status === "ALL"
        ? `${API}/api/admin/commissions`
        : `${API}/api/admin/commissions?status=${status}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("Server error loading commissions"); return;
      }
      if (data.success) {
        setCommissions(data.data.commissions || []);
        setStats(data.data.stats || {});
      } else {
        toast.error(data.message || "Failed to load");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchCommissions(token, "ALL"); }, [token]);

  const apiCall = async (url: string, method = "PUT", body?: object) => {
    const res = await fetch(`${API}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, message: "Server error" }; }
  };

  const handleConfirm = async (id: string) => {
    if (!window.confirm("Confirm you received this payment in your Equity Bank account?")) return;
    setProcessing(id);
    const data = await apiCall(`/api/admin/commissions/${id}/confirm`).catch(() => null);
    if (data?.success) {
      toast.success("✅ Commission confirmed! Fundi notified.");
      fetchCommissions(token, statusFilter);
      setSelected(null);
    } else {
      toast.error(data?.message || "Failed to confirm");
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const data = await apiCall(`/api/admin/commissions/${id}/reject`, "PUT", { reason: rejectReason }).catch(() => null);
    if (data?.success) {
      toast.success("❌ Rejected. Fundi told to pay again.");
      setShowRejectModal(false);
      setRejectReason("");
      fetchCommissions(token, statusFilter);
      setSelected(null);
    } else {
      toast.error(data?.message || "Failed to reject");
    }
    setProcessing(null);
  };

  const handleWaive = (id: string) => {
    setWaiveReason("");
    setShowWaiveModal(true);
  };

  const submitWaive = async () => {
    if (!waiveReason || !selected) return;
    setProcessing(selected.id);
    const data = await apiCall(`/api/admin/commissions/${selected.id}/waive`, "PUT", { reason: waiveReason }).catch(() => null);
    if (data?.success) {
      toast.success("🎁 Commission waived! Fundi notified.");
      setShowWaiveModal(false);
      setWaiveReason("");
      fetchCommissions(token, statusFilter);
      setSelected(null);
    } else {
      toast.error(data?.message || "Failed to waive");
    }
    setProcessing(null);
  };

  const handleSuspend = async (id: string) => {
    if (!window.confirm("Suspend this Fundi for not paying commission?")) return;
    setProcessing(id);
    const data = await apiCall(`/api/admin/commissions/${id}/suspend`).catch(() => null);
    if (data?.success) {
      toast.success("🚨 Fundi suspended!");
      fetchCommissions(token, statusFilter);
      setSelected(null);
    } else {
      toast.error(data?.message || "Failed to suspend");
    }
    setProcessing(null);
  };

  const handleUnsuspend = async (userId: string, commissionId: string) => {
    if (!window.confirm("Reinstate this Fundi's account?")) return;
    setProcessing(commissionId);
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const r = await fetch(`${API}/api/trust/admin/users/${userId}/unsuspend`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (data.success) {
        toast.success("✅ Fundi reinstated!");
        fetchCommissions(token, statusFilter);
      } else {
        toast.error(data.message || "Failed to reinstate");
      }
    } catch {
      toast.error("Connection error");
    }
    setProcessing(null);
  };

  const filtered = commissions.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.provider?.businessName?.toLowerCase().includes(q) ||
      c.provider?.user?.phone?.includes(q) ||
      c.provider?.user?.name?.toLowerCase().includes(q)
    );
  });

  if (!ready) return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                href === "/admin/commissions"
                  ? "bg-kazi-orange text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}>
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
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-lg">💰</div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Commission Management</h1>
              <p className="text-xs text-gray-400">Verify payments, waive fees, suspend non-payers</p>
            </div>
          </div>
          <button onClick={() => fetchCommissions(token, statusFilter)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-w-6xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-amber-600">{stats.pendingVerification || 0}</p>
              <p className="text-xs text-amber-500 mt-1">⏳ Needs Verification</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-red-500">{(stats.pending || 0) + (stats.overdue || 0)}</p>
              <p className="text-xs text-red-400 mt-1">❌ Unpaid</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-xl font-black text-green-600">KSh {(stats.totalCollectedAmount || 0).toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-1">✅ Collected</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
              <p className="text-xl font-black text-kazi-orange">KSh {(stats.totalPendingAmount || 0).toLocaleString()}</p>
              <p className="text-xs text-orange-400 mt-1">💰 Pending</p>
            </div>
          </div>

          {/* Alert */}
          {(stats.pendingVerification || 0) > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-amber-700">
                  {stats.pendingVerification} payment{stats.pendingVerification !== 1 ? "s" : ""} waiting for verification!
                </p>
                <p className="text-amber-600 text-sm mt-0.5">
                  Fundis submitted M-Pesa SMS messages. Check your Equity Bank account and confirm.
                </p>
              </div>
            </div>
          )}

          {/* Search + Filter */}
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by provider name or phone..."
              className="w-full px-4 py-3 bg-white rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange border border-gray-100"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((f) => (
                <button key={f.key}
                  onClick={() => { setStatusFilter(f.key); fetchCommissions(token, f.key); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    statusFilter === f.key ? "bg-kazi-orange text-white" : "bg-white text-gray-500 shadow-sm border border-gray-100"
                  }`}>
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Split view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* LEFT — List */}
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <p className="text-4xl mb-3">💰</p>
                  <p className="font-black text-kazi-dark">No commissions found</p>
                  <p className="text-gray-400 text-sm mt-1">Try changing the filter above</p>
                </div>
              ) : (
                filtered.map((c) => {
                  const badge = getStatusBadge(c.status);
                  return (
                    <button key={c.id} onClick={() => setSelected(c)}
                      className={`w-full bg-white rounded-2xl p-4 text-left shadow-sm transition-all hover:shadow-md ${
                        selected?.id === c.id ? "ring-2 ring-kazi-orange" : "border border-gray-100"
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center font-black text-kazi-orange text-sm flex-shrink-0">
                            {c.provider?.businessName?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-kazi-dark text-sm truncate">{c.provider?.businessName}</p>
                            <p className="text-xs text-gray-400">{c.provider?.user?.phone}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400 truncate flex-1">
                          {c.booking?.service?.name || "Service"} · {c.booking?.customer?.name || "Customer"}
                        </p>
                        <p className="font-black text-kazi-orange ml-2">KSh {(c.commissionAmount || c.amount || 0).toLocaleString()}</p>
                      </div>
                      {c.mpesaRef && (
                        <p className="text-xs text-green-600 mt-1 truncate">📱 SMS submitted</p>
                      )}
                      {c.provider?.user?.isSuspended && (
                        <p className="text-xs text-red-600 font-bold mt-1">🚨 Account Suspended</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* RIGHT — Detail */}
            {selected ? (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-24">
                {/* Detail header */}
                <div className={`p-4 ${
                  selected.status === "PENDING_VERIFICATION" ? "bg-amber-500"
                  : selected.status === "PAID"               ? "bg-green-500"
                  : selected.status === "WAIVED"             ? "bg-purple-500"
                  : "bg-kazi-dark"
                }`}>
                  <p className="text-white font-black text-lg leading-tight">{selected.provider?.businessName}</p>
                  <p className="text-white/70 text-sm">{selected.provider?.user?.phone}</p>
                  {selected.provider?.user?.isSuspended && (
                    <p className="text-red-300 text-xs font-bold mt-1">🚨 Account Currently Suspended</p>
                  )}
                </div>

                <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                  {/* Amount */}
                  <div className="bg-kazi-orange/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-400">Commission Due</p>
                    <p className="font-black text-kazi-orange text-3xl">
                      KSh {(selected.commissionAmount || selected.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      10% of KSh {(selected.cashAmount || 0).toLocaleString()} job
                    </p>
                  </div>

                  {/* Job info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Job Details</p>
                    {[
                      ["Service",   selected.booking?.service?.name  || "—"],
                      ["Customer",  selected.booking?.customer?.name || "—"],
                      ["Job Value", `KSh ${(selected.cashAmount || 0).toLocaleString()}`],
                      ["Submitted", new Date(selected.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-400">{k}</span>
                        <span className="font-bold text-right ml-2">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* SMS message */}
                  {selected.mpesaRef ? (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📱 M-Pesa SMS Submitted</p>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-green-700 text-sm leading-relaxed break-words">{selected.mpesaRef}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 mt-2">
                        <p className="text-blue-600 text-xs font-bold">✅ Check your Equity Bank account:</p>
                        <p className="text-blue-500 text-xs mt-0.5">
                          Verify KSh {(selected.commissionAmount || selected.amount || 0).toLocaleString()} was received at Paybill <strong>247247</strong> Account <strong>0795542312</strong>
                        </p>
                      </div>
                    </div>
                  ) : selected.status === "PENDING" || selected.status === "OVERDUE" ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-600 font-bold text-sm">❌ No payment submitted yet</p>
                      <p className="text-red-400 text-xs mt-1">
                        This Fundi has not paid their commission. You can suspend them if overdue.
                      </p>
                    </div>
                  ) : null}

                  {/* Contact */}
                  <div className="flex gap-2">
                    <a href={`tel:${selected.provider?.user?.phone}`}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1">
                      <Phone className="w-3 h-3" /> Call Fundi
                    </a>
                    <a href={`https://wa.me/${(selected.provider?.user?.phone || "").replace(/^0/, "254")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-green-100 text-green-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1">
                      💬 WhatsApp
                    </a>
                  </div>

                  {/* Actions — PENDING_VERIFICATION */}
                  {selected.status === "PENDING_VERIFICATION" && (
                    <div className="space-y-2 pt-2">
                      <p className="font-black text-kazi-dark text-sm text-center">Your Decision:</p>
                      <button onClick={() => setShowRejectModal(true)} disabled={processing === selected.id}
                        className="w-full py-3 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl text-sm disabled:opacity-50">
                        ❌ Reject — Not Received
                      </button>
                      <button onClick={() => handleWaive(selected.id)} disabled={processing === selected.id}
                        className="w-full py-3 bg-purple-50 border-2 border-purple-200 text-purple-600 font-bold rounded-2xl text-sm disabled:opacity-50">
                        🎁 Waive Commission
                      </button>
                      <button onClick={() => handleConfirm(selected.id)} disabled={processing === selected.id}
                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-sm disabled:opacity-50 transition-colors">
                        {processing === selected.id ? "Processing..." : "✅ Confirm — Payment Received"}
                      </button>
                    </div>
                  )}

                  {/* Actions — PENDING / OVERDUE */}
                  {(selected.status === "PENDING" || selected.status === "OVERDUE") && (
                    <div className="space-y-2 pt-2">
                      {selected.provider?.user?.isSuspended && (
                        <button onClick={() => handleUnsuspend(selected.provider.user.id, selected.id)} disabled={processing === selected.id}
                          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-sm disabled:opacity-50 transition-colors">
                          {processing === selected.id ? "Processing..." : "✅ Reinstate Fundi Account"}
                        </button>
                      )}
                      <button onClick={() => handleWaive(selected.id)} disabled={processing === selected.id}
                        className="w-full py-3 bg-purple-50 border border-purple-200 text-purple-600 font-bold rounded-2xl text-sm disabled:opacity-50">
                        🎁 Waive Commission
                      </button>
                      {!selected.provider?.user?.isSuspended && (
                        <button onClick={() => handleSuspend(selected.id)} disabled={processing === selected.id}
                          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl text-sm disabled:opacity-50 transition-colors">
                          {processing === selected.id ? "Processing..." : "🚨 Suspend Fundi"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Paid / Waived state */}
                  {(selected.status === "PAID" || selected.status === "WAIVED") && (
                    <div className="space-y-3">
                      <div className={`rounded-2xl p-4 text-center ${selected.status === "PAID" ? "bg-green-50" : "bg-purple-50"}`}>
                        <p className={`font-black ${selected.status === "PAID" ? "text-green-600" : "text-purple-600"}`}>
                          {selected.status === "PAID" ? "✅ Commission Paid" : "🎁 Commission Waived"}
                        </p>
                        {selected.paidAt && (
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(selected.paidAt).toLocaleDateString("en-KE")}
                          </p>
                        )}
                      </div>

                      {/* Unsuspend button — shown if account is still suspended despite payment */}
                      {selected.provider?.user?.isSuspended && (
                        <button
                          onClick={() => handleUnsuspend(selected.provider.user.id, selected.id)}
                          disabled={processing === selected.id}
                          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-sm disabled:opacity-50 transition-colors">
                          {processing === selected.id ? "Processing..." : "✅ Reinstate Fundi Account"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-64">
                <p className="text-5xl mb-3">💰</p>
                <p className="font-bold text-kazi-dark">Select a commission to review</p>
                <p className="text-gray-400 text-sm mt-1">Click any commission from the list</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Waive Modal */}
      {showWaiveModal && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-kazi-dark text-xl mb-1">🎁 Waive Commission</h3>
            <p className="text-gray-400 text-sm mb-4">
              Select the reason for waiving KSh {(selected.commissionAmount || selected.amount || 0).toLocaleString()} for <strong>{selected.provider?.businessName}</strong>
            </p>

            <div className="space-y-2 mb-4">
              {WAIVE_REASONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setWaiveReason(r.desc)}
                  className={`w-full flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                    waiveReason === r.desc
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{r.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${waiveReason === r.desc ? "text-purple-700" : "text-kazi-dark"}`}>{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowWaiveModal(false); setWaiveReason(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">
                Cancel
              </button>
              <button onClick={submitWaive} disabled={!waiveReason || processing === selected.id}
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-2xl disabled:opacity-40 transition-colors">
                {processing === selected.id ? "Waiving..." : "🎁 Waive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-kazi-dark text-xl mb-2">❌ Reject Payment</h3>
            <p className="text-gray-400 text-sm mb-4">Tell the Fundi why their payment was rejected</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment not found in Equity Bank. Please check and resubmit."
              rows={3}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">
                Cancel
              </button>
              <button onClick={() => handleReject(selected.id)} disabled={processing === selected.id}
                className="flex-1 py-3 bg-red-500 text-white font-black rounded-2xl disabled:opacity-60">
                {processing === selected.id ? "..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
