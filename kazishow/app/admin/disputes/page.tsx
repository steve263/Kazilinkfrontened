"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Gavel, Users, ShoppingBag, Activity, CheckSquare,
  BarChart2, ClipboardCheck, Wallet, Shield, Scale, XCircle,
  Megaphone, ShieldAlert, CreditCard, BadgeCheck, Settings,
  AlertTriangle, CheckCircle, Phone, X, Clock, RefreshCw,
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
  { label: "Disputes",        href: "/admin/disputes",        icon: Gavel },
  { label: "Cancellations",   href: "/admin/cancellations",   icon: XCircle },
  { label: "Subscriptions",   href: "/admin/subscriptions",   icon: CreditCard },
  { label: "Broadcast",       href: "/admin/broadcast",       icon: Megaphone },
  { label: "Auto-Suspension", href: "/admin/auto-suspension", icon: ShieldAlert },
  { label: "Settings",        href: "/admin/settings",        icon: Settings },
];

function getTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  return "Just now";
}

export default function AdminDisputesPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalDisputed: number; totalResolved: number }>({ totalDisputed: 0, totalResolved: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState<"release" | "refund" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [search, setSearch] = useState("");
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchDisputes = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const [dRes, bRes] = await Promise.all([
        fetch(`${API}/api/admin/disputes`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/admin/badges`,   { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      const d = await dRes.json();
      const b = await bRes.json();
      if (d.success) { setDisputes(d.data.disputes); setStats(d.data.stats); }
      if (b.success) setBadges(b.data);
    } catch { toast.error("Failed to load disputes"); }
    setLoading(false);
  }, []);

  useEffect(() => { if (token) fetchDisputes(token); }, [token, fetchDisputes]);

  const handleAction = async (action: "release" | "refund") => {
    if (!selected) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API}/api/admin/disputes/${selected.id}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "release" ? "Payment released to provider!" : "Refund approved for customer!");
        setShowModal(null);
        setAdminNote("");
        setSelected(null);
        fetchDisputes(token);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Network error");
    }
    setProcessing(false);
  };

  const filtered = disputes.filter((d) =>
    [d.customer?.name, d.provider?.businessName, d.service?.name]
      .some((s) => s?.toLowerCase().includes(search.toLowerCase()))
  );

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
          {NAV.map(({ label, href, icon: Icon }) => {
            const badgeCount = label === "Disputes" ? badges.disputes : 0;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/disputes" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
                <Icon className="w-4 h-4" />
                {label}
                {badgeCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
          <Link href="/admin" className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <Gavel className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Dispute Resolution</h1>
              <p className="text-xs text-gray-400">Review disputes and decide — release or refund</p>
            </div>
          </div>
          <button onClick={() => fetchDisputes(token)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="p-5 space-y-5 max-w-6xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-red-500">{stats.totalDisputed}</p>
              <p className="text-sm text-red-400 font-semibold mt-1">Active Disputes</p>
              <p className="text-xs text-red-300 mt-0.5">Needs attention</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-green-600">{stats.totalResolved}</p>
              <p className="text-sm text-green-500 font-semibold mt-1">Resolved</p>
              <p className="text-xs text-green-400 mt-0.5">All time</p>
            </div>
          </div>

          {/* Alert banner */}
          {stats.totalDisputed > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-red-600">
                  {stats.totalDisputed} dispute{stats.totalDisputed !== 1 ? "s" : ""} need your attention!
                </p>
                <p className="text-red-500 text-sm mt-0.5">
                  Customer money is held in escrow. Review and resolve each dispute — the faster you resolve, the more customers trust KaziShow.
                </p>
              </div>
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, provider or service…"
            className="w-full px-4 py-3 bg-white rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange border border-gray-100"
          />

          {/* Split view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* LEFT — list */}
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white rounded-2xl p-8 flex justify-center">
                  <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center card-shadow">
                  <p className="text-4xl mb-3">⚖️</p>
                  <p className="font-bold text-kazi-dark text-lg">No Active Disputes</p>
                  <p className="text-gray-400 text-sm mt-1">All disputes have been resolved!</p>
                </div>
              ) : (
                filtered.map((dispute) => (
                  <button key={dispute.id} onClick={() => setSelected(dispute)}
                    className={`w-full bg-white rounded-2xl p-4 card-shadow text-left transition-all hover:shadow-md ${selected?.id === dispute.id ? "ring-2 ring-red-400" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-red-100 text-red-600 text-xs font-black px-2 py-1 rounded-full">🚨 DISPUTED</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getTimeAgo(dispute.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                          {dispute.customer?.name?.charAt(0)}
                        </div>
                        <p className="font-bold text-kazi-dark text-sm">{dispute.customer?.name}</p>
                      </div>
                      <span className="text-gray-300 text-xs">vs</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-kazi-orange">
                          {dispute.provider?.businessName?.charAt(0)}
                        </div>
                        <p className="font-bold text-kazi-dark text-sm">{dispute.provider?.businessName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{dispute.service?.name}</p>
                      <p className="font-black text-kazi-orange text-sm">KSh {dispute.totalAmount?.toLocaleString()}</p>
                    </div>
                    {dispute.disputeReport?.reason && (
                      <div className="mt-2 bg-red-50 rounded-lg p-2">
                        <p className="text-xs text-red-600 line-clamp-2">💬 "{dispute.disputeReport.reason}"</p>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* RIGHT — detail */}
            {selected ? (
              <div className="bg-white rounded-2xl card-shadow overflow-hidden sticky top-24 self-start">
                <div className="bg-red-500 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-white text-lg">Dispute Details</h3>
                    <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-white/70 text-xs">ID: {selected.id?.slice(0, 16)}…</p>
                  <p className="text-white/70 text-xs mt-0.5">Disputed {getTimeAgo(selected.updatedAt)}</p>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto max-h-[640px]">

                  {/* Amount held */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-amber-600 text-xs font-bold mb-1">💰 HELD IN ESCROW</p>
                    <p className="text-3xl font-black text-amber-600">KSh {selected.totalAmount?.toLocaleString()}</p>
                    <p className="text-amber-500 text-xs mt-1">Waiting for your decision</p>
                  </div>

                  {/* Customer */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">👤 Customer (filed dispute)</p>
                    <div className="bg-blue-50 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-black text-blue-700">
                          {selected.customer?.name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-kazi-dark">{selected.customer?.name}</p>
                          <p className="text-xs text-gray-400">{selected.customer?.phone}</p>
                        </div>
                        <a href={`tel:${selected.customer?.phone}`}
                          className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Phone className="w-4 h-4 text-white" />
                        </a>
                      </div>
                      {selected.disputeReport?.reason && (
                        <div className="bg-white rounded-xl p-3">
                          <p className="text-xs font-bold text-gray-400 mb-1">Reason for dispute:</p>
                          <p className="text-sm text-gray-700">"{selected.disputeReport.reason}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Provider */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">🔧 Provider (accused)</p>
                    <div className="bg-orange-50 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center font-black text-kazi-orange">
                          {selected.provider?.businessName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-kazi-dark">{selected.provider?.businessName}</p>
                          <p className="text-xs text-gray-400">{selected.provider?.category} · {selected.provider?.user?.phone}</p>
                        </div>
                        <a href={`tel:${selected.provider?.user?.phone}`}
                          className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center">
                          <Phone className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Booking info */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">📅 Booking Details</p>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      {[
                        ["Service",  selected.service?.name],
                        ["Date",     selected.scheduledDate ? new Date(selected.scheduledDate).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" }) + (selected.scheduledTime ? ` at ${selected.scheduledTime}` : "") : "—"],
                        ["Address",  selected.address || "Not specified"],
                        ["Amount",   `KSh ${selected.totalAmount?.toLocaleString()}`],
                        ["Payment",  selected.paymentMethod || "M-Pesa"],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="text-xs text-gray-400 shrink-0">{label}</span>
                          <span className={`text-xs font-bold text-right truncate ${label === "Amount" ? "text-kazi-orange" : "text-kazi-dark"}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact reminder */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <p className="text-xs font-black text-blue-700 mb-2">ℹ️ Contact both parties before deciding</p>
                    <p className="text-xs text-blue-600">📞 Customer: {selected.customer?.phone}</p>
                    <p className="text-xs text-blue-600 mt-1">📞 Provider: {selected.provider?.user?.phone}</p>
                    <p className="text-xs text-blue-400 mt-2">Hear both sides before making your decision.</p>
                  </div>

                  {/* Decision buttons */}
                  <div className="space-y-3 pt-1">
                    <p className="font-black text-kazi-dark text-sm text-center">Your Decision:</p>
                    <button onClick={() => setShowModal("refund")}
                      className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                      <XCircle className="w-5 h-5" />
                      Refund Customer
                      <span className="text-sm font-normal opacity-80">(KSh {selected.totalAmount?.toLocaleString()})</span>
                    </button>
                    <button onClick={() => setShowModal("release")}
                      className="w-full py-4 bg-green-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                      <CheckCircle className="w-5 h-5" />
                      Release to Provider
                      <span className="text-sm font-normal opacity-80">(KSh {Math.round((selected.totalAmount || 0) * 0.9).toLocaleString()})</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center card-shadow flex flex-col items-center justify-center min-h-64">
                <p className="text-5xl mb-3">👈</p>
                <p className="font-bold text-kazi-dark">Select a dispute to review</p>
                <p className="text-gray-400 text-sm mt-1">Click any dispute from the list</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Decision Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">{showModal === "release" ? "✅" : "💰"}</div>
              <h3 className="font-black text-kazi-dark text-xl">
                {showModal === "release" ? "Release Payment to Provider" : "Refund Customer"}
              </h3>
              <p className="text-gray-500 text-sm mt-2">
                {showModal === "release"
                  ? `KSh ${Math.round((selected.totalAmount || 0) * 0.9).toLocaleString()} will be added to ${selected.provider?.businessName}'s earnings`
                  : `KSh ${selected.totalAmount?.toLocaleString()} will be refunded to ${selected.customer?.name} via M-Pesa`}
              </p>
            </div>

            <div className={`rounded-2xl p-3 mb-4 ${showModal === "release" ? "bg-green-50" : "bg-blue-50"}`}>
              <p className={`text-xs font-bold mb-2 ${showModal === "release" ? "text-green-700" : "text-blue-700"}`}>
                What happens:
              </p>
              {showModal === "release" ? (
                <div className="space-y-1">
                  <p className="text-xs text-green-600">✅ Provider receives KSh {Math.round((selected.totalAmount || 0) * 0.9).toLocaleString()}</p>
                  <p className="text-xs text-green-600">✅ KaziShow keeps KSh {Math.round((selected.totalAmount || 0) * 0.1).toLocaleString()} commission</p>
                  <p className="text-xs text-green-600">✅ Both parties get SMS + notification</p>
                  <p className="text-xs text-green-600">✅ Booking marked as completed</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-blue-600">💰 Customer gets full refund of KSh {selected.totalAmount?.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">📱 Refund processed via M-Pesa within 24hrs</p>
                  <p className="text-xs text-blue-600">✅ Both parties get SMS + notification</p>
                  <p className="text-xs text-blue-600">✅ Booking marked as cancelled</p>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Admin Note (optional — sent to both parties)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Explain your decision to both parties…"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm h-20 resize-none focus:outline-none focus:border-kazi-orange"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowModal(null); setAdminNote(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleAction(showModal)} disabled={processing}
                className={`flex-1 py-3 text-white font-black rounded-2xl disabled:opacity-60 transition-colors ${showModal === "release" ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"}`}>
                {processing ? "Processing…" : showModal === "release" ? "✅ Confirm Release" : "💰 Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
