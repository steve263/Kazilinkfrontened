"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, BadgeCheck, Users, ShoppingBag, Activity, CheckSquare,
  BarChart2, ClipboardCheck, Wallet, Shield, Scale, XCircle, Megaphone,
  ShieldAlert, CreditCard, RefreshCw, Search, X, Phone, Calendar,
  CheckCircle, AlertCircle, ZoomIn, Clock, Gavel,
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
];

const STATUS_TABS = [
  { key: "PENDING",  label: "Pending",  color: "bg-amber-100 text-amber-700" },
  { key: "APPROVED", label: "Approved", color: "bg-green-100 text-green-700" },
  { key: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-600" },
  { key: "",         label: "All",      color: "bg-gray-100 text-gray-600" },
];

const DOC_LABELS = [
  "National ID — Front",
  "National ID — Back",
  "Selfie with ID",
  "Certificate / Other",
];

const REJECT_REASONS = [
  "ID photo is blurry or unclear",
  "ID appears to be expired",
  "Name on ID does not match profile",
  "Documents are incomplete",
  "ID appears to be fake or edited",
  "Wrong type of document submitted",
  "Face photo does not match ID",
  "Other reason",
];

interface Provider {
  id: string;
  businessName: string;
  category: string;
  isVerified: boolean;
}

interface VerifUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  profilePhoto: string | null;
  createdAt: string;
  provider: Provider | null;
}

interface VerifRequest {
  id: string;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documents: string[];
  adminNote: string | null;
  createdAt: string;
  user: VerifUser;
}

interface Counts { pending: number; approved: number; rejected: number; }

export default function AdminVerificationPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [requests, setRequests] = useState<VerifRequest[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("PENDING");
  const [selected, setSelected] = useState<VerifRequest | null>(null);
  const [search, setSearch] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchRequests = useCallback(async (t: string, status: string) => {
    setLoading(true);
    try {
      const url = status
        ? `${API}/api/admin/verification?status=${status}`
        : `${API}/api/admin/verification`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data.requests);
        setCounts(data.data.counts);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (token) fetchRequests(token, statusTab); }, [token, fetchRequests, statusTab]);

  const handleTabChange = (tab: string) => {
    setStatusTab(tab);
    setSelected(null);
    fetchRequests(token, tab);
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this provider? They will receive a Verified badge and SMS notification.")) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API}/api/admin/verification/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Provider verified! SMS sent.");
        setSelected(null);
        fetchRequests(token, statusTab);
      } else {
        toast.error(data.message || "Failed to approve");
      }
    } catch {
      toast.error("Network error");
    }
    setProcessing(false);
  };

  const handleReject = async (id: string) => {
    const finalReason = rejectReason === "Other reason" ? customReason.trim() : rejectReason;
    if (!finalReason) { toast.error("Please select or enter a reason"); return; }
    setProcessing(true);
    try {
      const res = await fetch(`${API}/api/admin/verification/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: finalReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Verification rejected. Provider notified.");
        setShowRejectModal(false);
        setRejectReason("");
        setCustomReason("");
        setSelected(null);
        fetchRequests(token, statusTab);
      } else {
        toast.error(data.message || "Failed to reject");
      }
    } catch {
      toast.error("Network error");
    }
    setProcessing(false);
  };

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.user?.provider?.businessName?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.phone?.includes(q)
    );
  });

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/verification" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />
              {label}
              {href === "/admin/verification" && counts.pending > 0 && (
                <span className="ml-auto bg-white/20 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{counts.pending}</span>
              )}
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
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Verification Requests</h1>
              <p className="text-xs text-gray-400">Review provider documents and grant verification badges</p>
            </div>
          </div>
          <button onClick={() => fetchRequests(token, statusTab)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-w-7xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-amber-600">{counts.pending}</p>
              <p className="text-xs text-amber-500 font-semibold mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Pending</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-green-600">{counts.approved}</p>
              <p className="text-xs text-green-500 font-semibold mt-1 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-red-500">{counts.rejected}</p>
              <p className="text-xs text-red-400 font-semibold mt-1 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> Rejected</p>
            </div>
          </div>

          {/* Tabs + Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm">
              {STATUS_TABS.map((tab) => {
                const cnt = tab.key === "PENDING" ? counts.pending : tab.key === "APPROVED" ? counts.approved : tab.key === "REJECTED" ? counts.rejected : counts.pending + counts.approved + counts.rejected;
                return (
                  <button key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${statusTab === tab.key ? "bg-kazi-orange text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                    {tab.label}
                    {tab.key !== "" && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${statusTab === tab.key ? "bg-white/20 text-white" : tab.color}`}>{cnt}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm min-w-48">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…"
                className="bg-transparent text-sm flex-1 outline-none text-kazi-dark placeholder-gray-400" />
            </div>
          </div>

          {/* Split view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* LEFT — List */}
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-gray-100 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center card-shadow">
                  <BadgeCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="font-black text-gray-500">No {statusTab.toLowerCase() || ""} requests</p>
                  <p className="text-sm text-gray-400 mt-1">{statusTab === "PENDING" ? "All caught up!" : "Nothing here yet"}</p>
                </div>
              ) : (
                filtered.map((req) => {
                  const provider = req.user?.provider;
                  const photo = req.user?.profilePhoto;
                  const isSelected = selected?.id === req.id;
                  return (
                    <button key={req.id} onClick={() => setSelected(req)}
                      className={`w-full bg-white rounded-2xl p-4 text-left transition-all hover:shadow-md card-shadow border-2 ${isSelected ? "border-kazi-orange" : "border-transparent"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                          {photo
                            ? <img src={photo} className="w-full h-full object-cover object-top" alt="" />
                            : <span className="text-xl">{provider?.category === "FUNDI" ? "🔧" : "🏢"}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-kazi-dark truncate">{provider?.businessName || req.user?.name}</p>
                          <p className="text-xs text-gray-500">{provider?.category || "—"} · {req.user?.phone}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(req.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${req.status === "PENDING" ? "bg-amber-100 text-amber-700" : req.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {req.status === "PENDING" ? "⏳" : req.status === "APPROVED" ? "✅" : "❌"} {req.status}
                          </span>
                          {req.documents.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1 text-right">{req.documents.length} doc{req.documents.length !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* RIGHT — Detail */}
            {selected ? (
              <div className="bg-white rounded-2xl card-shadow overflow-hidden sticky top-24">

                {/* Detail header */}
                <div className="bg-kazi-dark p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-black text-white">Provider Details</h3>
                    <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                      {selected.user?.profilePhoto
                        ? <img src={selected.user.profilePhoto} className="w-full h-full object-cover object-top" alt="" />
                        : <span className="text-2xl">{selected.user?.provider?.category === "FUNDI" ? "🔧" : "🏢"}</span>
                      }
                    </div>
                    <div>
                      <p className="font-black text-white text-lg leading-tight">{selected.user?.provider?.businessName || selected.user?.name}</p>
                      <p className="text-white/60 text-sm">{selected.user?.provider?.category || "—"} · {selected.type}</p>
                      {selected.user?.provider?.isVerified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full mt-1">
                          <BadgeCheck className="w-3 h-3" /> Already Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">

                  {/* Contact row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="font-bold text-kazi-dark text-sm truncate">{selected.user?.phone}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">Registered</p>
                        <p className="font-bold text-kazi-dark text-sm">{new Date(selected.user?.createdAt || selected.createdAt).toLocaleDateString("en-KE")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Submitted Documents ({selected.documents.length})</p>

                    {selected.documents.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                        <p className="text-amber-600 font-bold text-sm">⚠️ No documents uploaded</p>
                        <p className="text-amber-500 text-xs mt-1">Provider has not uploaded verification documents yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selected.documents.map((docUrl, idx) => (
                          <div key={idx}>
                            <p className="text-xs text-gray-500 font-semibold mb-1">
                              {DOC_LABELS[idx] || `Document ${idx + 1}`}
                            </p>
                            <div className="relative rounded-xl overflow-hidden group cursor-pointer"
                              onClick={() => setZoomedImage(docUrl)}>
                              <img src={docUrl} className="w-full h-40 object-cover rounded-xl" alt={DOC_LABELS[idx] || `Document ${idx + 1}`} />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-xl">
                                <div className="bg-white/90 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                  <ZoomIn className="w-4 h-4 text-kazi-dark" />
                                  <span className="text-kazi-dark text-xs font-bold">Zoom In</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rejection note */}
                  {selected.status === "REJECTED" && selected.adminNote && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="font-bold text-red-600 text-sm mb-1">❌ Rejection Reason</p>
                      <p className="text-red-500 text-sm">{selected.adminNote}</p>
                    </div>
                  )}

                  {/* Approved badge */}
                  {selected.status === "APPROVED" && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                      <p className="text-green-600 font-black text-lg">✅ Already Verified</p>
                      <p className="text-green-500 text-sm mt-1">This provider has a verified badge on their profile</p>
                    </div>
                  )}

                  {/* Action buttons — only for PENDING */}
                  {selected.status === "PENDING" && (
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => { setRejectReason(""); setCustomReason(""); setShowRejectModal(true); }}
                        disabled={processing}
                        className="flex-1 py-3.5 bg-red-50 border-2 border-red-200 text-red-500 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(selected.id)}
                        disabled={processing}
                        className="flex-1 py-3.5 bg-green-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {processing ? "Processing…" : "Approve ✅"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center card-shadow flex flex-col items-center justify-center min-h-64">
                <BadgeCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-black text-kazi-dark">Select a request to review</p>
                <p className="text-gray-400 text-sm mt-1">Click any provider from the list on the left</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-kazi-dark text-xl">❌ Reject Verification</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Select a reason for rejecting <strong>{selected.user?.provider?.businessName || selected.user?.name}</strong>
            </p>
            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map((reason) => (
                <button key={reason} onClick={() => setRejectReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${rejectReason === reason ? "bg-red-50 border-red-300 text-red-600" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-red-200"}`}>
                  {rejectReason === reason ? "✓ " : ""}{reason}
                </button>
              ))}
            </div>
            {rejectReason === "Other reason" && (
              <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Type your reason here…"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm h-24 resize-none focus:outline-none focus:border-red-400 mb-4" />
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleReject(selected.id)} disabled={processing || !rejectReason}
                className="flex-1 py-3 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 disabled:opacity-50 transition-colors">
                {processing ? "Rejecting…" : "Reject ❌"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 z-10">
            <X className="w-5 h-5" />
          </button>
          <img src={zoomedImage} className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            alt="Document" onClick={(e) => e.stopPropagation()} />
          <p className="absolute bottom-4 text-white/50 text-sm">Click anywhere outside to close</p>
        </div>
      )}
    </div>
  );
}
