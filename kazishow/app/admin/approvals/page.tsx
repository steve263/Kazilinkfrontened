"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, ShoppingBag, Activity,
  CheckSquare, BarChart2, LogOut, RefreshCw, Menu, ClipboardCheck, CheckCircle, X, Check, MessageSquare, FileText,
  Award, Video, ExternalLink, Wallet, Send, Megaphone, ShieldAlert, XCircle, CreditCard, BadgeCheck, Settings,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ApprovalCard from "@/components/admin/ApprovalCard";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const NAV = [
  { label: "Overview",        href: "/admin",                  icon: BarChart2 },
  { label: "Approvals",       href: "/admin/approvals",        icon: ClipboardCheck },
  { label: "Verification",    href: "/admin/verification",     icon: BadgeCheck },
  { label: "Providers",       href: "/admin/providers",        icon: CheckSquare },
  { label: "Users",           href: "/admin/users",            icon: Users },
  { label: "Bookings",        href: "/admin/bookings",         icon: ShoppingBag },
  { label: "Analytics",       href: "/admin/analytics",        icon: Activity },
  { label: "Cancellations",   href: "/admin/cancellations",    icon: XCircle },
  { label: "Subscriptions",   href: "/admin/subscriptions",    icon: CreditCard },
  { label: "Broadcast",       href: "/admin/broadcast",        icon: Megaphone },
  { label: "Auto-Suspension", href: "/admin/auto-suspension",  icon: ShieldAlert },
  { label: "Settings",        href: "/admin/settings",        icon: Settings },

];

const TABS = [
  { id: "providers",    label: "Providers",    icon: CheckSquare  },
  { id: "certificates", label: "Certificates", icon: Award        },
  { id: "videos",       label: "Videos",       icon: Video        },
  { id: "testimonials", label: "Testimonials", icon: MessageSquare},
  { id: "tips",         label: "Tips & Guides",icon: FileText     },
  { id: "withdrawals",  label: "Withdrawals",  icon: Wallet       },
  { id: "kazivideos",   label: "ShowReel",  icon: Video        },
];

export default function ApprovalsPage() {
  const ready = useAdminGuard();
  const [activeTab, setActiveTab] = useState("providers");
  const [providers, setProviders] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [portfolioVideos, setPortfolioVideos] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [kaziVideos, setKaziVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  const [showBulkRejectInput, setShowBulkRejectInput] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchProviders = useCallback(async () => {
    if (!ready || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/providers/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProviders(data.data);
    } catch {
      toast.error("Failed to load pending providers");
    }
  }, [ready, token]);

  const fetchTestimonials = useCallback(async () => {
    if (!ready || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/testimonials/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTestimonials(data.data);
    } catch {
      toast.error("Failed to load pending testimonials");
    }
  }, [ready, token]);

  const fetchTips = useCallback(async () => {
    if (!ready || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/tips/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTips(data.data);
    } catch {
      toast.error("Failed to load pending tips");
    }
  }, [ready, token]);

  const fetchCertificates = useCallback(async () => {
    if (!ready || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/certificates/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCertificates(data.data);
    } catch { toast.error("Failed to load certificates"); }
  }, [ready, token]);

  const fetchPortfolioVideos = useCallback(async () => {
    if (!ready || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/portfolio-videos/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPortfolioVideos(data.data);
    } catch { toast.error("Failed to load portfolio videos"); }
  }, [ready, token]);

  const fetchKaziVideos = useCallback(async () => {
    if (!ready || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setKaziVideos(data.data);
    } catch { toast.error("Failed to load ShowReel"); }
  }, [ready, token]);

  const fetchWithdrawals = useCallback(async () => {
    if (!ready || !token) return;
    try {
      const res = await fetch(`${API}/api/admin/withdrawals?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setWithdrawals(data.data.withdrawals || []);
    } catch { toast.error("Failed to load withdrawals"); }
  }, [ready, token]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProviders(), fetchTestimonials(), fetchTips(), fetchCertificates(), fetchPortfolioVideos(), fetchWithdrawals(), fetchKaziVideos()]);
    setLoading(false);
  }, [fetchProviders, fetchTestimonials, fetchTips, fetchCertificates, fetchPortfolioVideos, fetchWithdrawals, fetchKaziVideos]);

  useEffect(() => { if (ready) fetchAll(); }, [ready, fetchAll]);

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkApprove = async () => {
    if (selectedProviders.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/providers/bulk-approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerIds: Array.from(selectedProviders) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Approved ${data.data.approved} providers!`);
        setProviders((prev) => prev.filter((p) => !selectedProviders.has(p.id)));
        setSelectedProviders(new Set());
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Bulk approval failed");
    }
    setBulkLoading(false);
  };

  const bulkReject = async () => {
    if (selectedProviders.size === 0) return;
    if (!bulkRejectionReason.trim()) { toast.error("Provide a rejection reason"); return; }
    setBulkLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/providers/bulk-reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerIds: Array.from(selectedProviders), reason: bulkRejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Rejected ${data.data.rejected} providers`);
        setProviders((prev) => prev.filter((p) => !selectedProviders.has(p.id)));
        setSelectedProviders(new Set());
        setBulkRejectionReason("");
        setShowBulkRejectInput(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Bulk rejection failed");
    }
    setBulkLoading(false);
  };

  const approveTestimonial = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/admin/testimonials/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Testimonial approved!");
        setTestimonials((prev) => prev.filter((x) => x.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to approve testimonial");
    }
  };

  const rejectTestimonial = async (id: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      const res = await fetch(`${API}/api/admin/testimonials/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Testimonial rejected");
        setTestimonials((prev) => prev.filter((x) => x.id !== id));
        setRejectingId(null);
        setRejectionReason("");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to reject testimonial");
    }
  };

  const approveTip = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/admin/tips/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Guide approved!");
        setTips((prev) => prev.filter((x) => x.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to approve guide");
    }
  };

  const rejectTip = async (id: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      const res = await fetch(`${API}/api/admin/tips/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Guide rejected");
        setTips((prev) => prev.filter((x) => x.id !== id));
        setRejectingId(null);
        setRejectionReason("");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to reject guide");
    }
  };

  const approveCertificate = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/admin/certificates/${id}/approve`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast.success("Certificate approved!"); setCertificates((p) => p.filter((x) => x.id !== id)); }
      else toast.error(data.message);
    } catch { toast.error("Failed to approve certificate"); }
  };

  const rejectCertificate = async (id: string, reason: string) => {
    if (!reason.trim()) { toast.error("Provide a rejection reason"); return; }
    try {
      const res = await fetch(`${API}/api/admin/certificates/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Certificate rejected"); setCertificates((p) => p.filter((x) => x.id !== id)); setRejectingId(null); setRejectionReason(""); }
      else toast.error(data.message);
    } catch { toast.error("Failed to reject certificate"); }
  };

  const approvePortfolioVideo = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/admin/portfolio-videos/${id}/approve`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast.success("Video approved!"); setPortfolioVideos((p) => p.filter((x) => x.id !== id)); }
      else toast.error(data.message);
    } catch { toast.error("Failed to approve video"); }
  };

  const rejectPortfolioVideo = async (id: string, reason: string) => {
    if (!reason.trim()) { toast.error("Provide a rejection reason"); return; }
    try {
      const res = await fetch(`${API}/api/admin/portfolio-videos/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Video rejected"); setPortfolioVideos((p) => p.filter((x) => x.id !== id)); setRejectingId(null); setRejectionReason(""); }
      else toast.error(data.message);
    } catch { toast.error("Failed to reject video"); }
  };

  const processWithdrawal = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`${API}/api/admin/withdrawals/${id}/process`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve" ? "Payout sent!" : "Withdrawal rejected and refunded");
        setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch { toast.error("Failed to process withdrawal"); }
  };

  const deleteKaziVideo = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/admin/videos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Video deleted");
        setKaziVideos((prev) => prev.filter((v) => v.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch { toast.error("Failed to delete video"); }
  };

  function logout() {
    localStorage.removeItem("kazishow_token");
    localStorage.removeItem("kazishow_user");
    localStorage.removeItem("kazishow_remember");
    localStorage.removeItem("kazishow_login_time");
    localStorage.removeItem("kazishow_session_expires");
    sessionStorage.removeItem("kazishow_token");
    sessionStorage.removeItem("kazishow_user");
    window.location.href = "/auth/login";
  }

  const totalPending = providers.length + testimonials.length + tips.length + certificates.length + portfolioVideos.length + withdrawals.length;

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
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-kazi-dark flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/approvals" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />
              {label}
              {label === "Approvals" && totalPending > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                  {totalPending}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4" />Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Approval Center</h1>
              <p className="text-xs text-gray-400">
                {loading ? "Loading…" : `${totalPending} pending items`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-16 z-10 bg-white border-b border-gray-100 px-5 flex gap-4 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const count = id === "providers" ? providers.length : id === "testimonials" ? testimonials.length : id === "tips" ? tips.length : id === "certificates" ? certificates.length : id === "videos" ? portfolioVideos.length : id === "withdrawals" ? withdrawals.length : id === "kazivideos" ? kaziVideos.filter((v) => v.reportCount >= 3).length : 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "border-kazi-orange text-kazi-dark"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-black rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "providers" ? (
            providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h2 className="text-lg font-black text-kazi-dark mb-1">All providers approved!</h2>
                <p className="text-sm text-gray-400">No pending provider applications.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Bulk action toolbar */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 card-shadow">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setSelectedProviders(
                            selectedProviders.size === providers.length
                              ? new Set()
                              : new Set(providers.map((p) => p.id))
                          )
                        }
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                        {selectedProviders.size === providers.length ? "Deselect All" : "Select All"}
                      </button>
                      {selectedProviders.size > 0 && (
                        <span className="text-sm font-semibold text-kazi-orange">
                          {selectedProviders.size} selected
                        </span>
                      )}
                    </div>
                    {selectedProviders.size > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={bulkApprove}
                          disabled={bulkLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Approve {selectedProviders.size}
                        </button>
                        <button
                          onClick={() => setShowBulkRejectInput(!showBulkRejectInput)}
                          disabled={bulkLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Reject {selectedProviders.size}
                        </button>
                      </div>
                    )}
                  </div>
                  {showBulkRejectInput && selectedProviders.size > 0 && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={bulkRejectionReason}
                        onChange={(e) => setBulkRejectionReason(e.target.value)}
                        placeholder="Reason for rejecting selected providers…"
                        className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button onClick={bulkReject} disabled={bulkLoading}
                          className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                          Confirm Bulk Rejection
                        </button>
                        <button onClick={() => { setShowBulkRejectInput(false); setBulkRejectionReason(""); }}
                          className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {providers.map((p) => (
                  <div key={p.id} className="relative">
                    <label className="absolute top-4 left-4 z-10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProviders.has(p.id)}
                        onChange={() => toggleProvider(p.id)}
                        className="w-4 h-4 accent-kazi-orange rounded"
                      />
                    </label>
                    <div className={`ml-8 ${selectedProviders.has(p.id) ? "ring-2 ring-kazi-orange rounded-2xl" : ""}`}>
                      <ApprovalCard
                        provider={p}
                        token={token}
                        onAction={(id) => {
                          setProviders((prev) => prev.filter((x) => x.id !== id));
                          setSelectedProviders((prev) => { const n = new Set(prev); n.delete(id); return n; });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "certificates" ? (
            certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h2 className="text-lg font-black text-kazi-dark mb-1">All certificates reviewed!</h2>
                <p className="text-sm text-gray-400">No pending certificate submissions.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-kazi-dark">{cert.name}</h3>
                        <p className="text-xs text-gray-500">{cert.provider?.businessName} · {cert.provider?.user?.phone}</p>
                        <p className="text-xs text-gray-400 capitalize">{cert.provider?.category?.toLowerCase()}</p>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Pending</span>
                    </div>
                    <div className="mb-4">
                      <a
                        href={cert.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-kazi-dark text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Certificate File
                      </a>
                      <p className="text-xs text-gray-400 mt-1.5">Opens the uploaded certificate document</p>
                    </div>
                    {rejectingId === cert.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Why are you rejecting this certificate?"
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => rejectCertificate(cert.id, rejectionReason)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors">
                            Confirm Rejection
                          </button>
                          <button onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => approveCertificate(cert.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors">
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => setRejectingId(cert.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors">
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "videos" ? (
            portfolioVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h2 className="text-lg font-black text-kazi-dark mb-1">All videos reviewed!</h2>
                <p className="text-sm text-gray-400">No pending portfolio video submissions.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {portfolioVideos.map((vid) => (
                  <div key={vid.id} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-kazi-dark">{vid.provider?.businessName}</h3>
                        <p className="text-xs text-gray-500">{vid.provider?.user?.phone}</p>
                        <p className="text-xs text-gray-400 capitalize">{vid.provider?.category?.toLowerCase()}</p>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Pending</span>
                    </div>
                    <div className="mb-4 rounded-xl overflow-hidden bg-black">
                      <video
                        src={vid.url}
                        controls
                        className="w-full max-h-64 object-contain"
                        preload="metadata"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      Submitted {new Date(vid.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {rejectingId === vid.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Why are you rejecting this video?"
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => rejectPortfolioVideo(vid.id, rejectionReason)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors">
                            Confirm Rejection
                          </button>
                          <button onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => approvePortfolioVideo(vid.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors">
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => setRejectingId(vid.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors">
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "testimonials" ? (
            testimonials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h2 className="text-lg font-black text-kazi-dark mb-1">All testimonials reviewed!</h2>
                <p className="text-sm text-gray-400">No pending testimonials.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {testimonials.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-kazi-dark">{t.customer?.name || "Anonymous"}</h3>
                        <p className="text-xs text-gray-400">{t.category}</p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-lg ${i < t.rating ? "⭐" : "☆"}`}></span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.summary}</p>
                    {t.videoUrl && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Video: <a href={t.videoUrl} target="_blank" className="text-kazi-orange hover:underline">Watch</a></p>
                      </div>
                    )}
                    {rejectingId === t.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Why are you rejecting this testimonial?"
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => rejectTestimonial(t.id, rejectionReason)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason("");
                            }}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveTestimonial(t.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(t.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "tips" ? (
            tips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h2 className="text-lg font-black text-kazi-dark mb-1">All guides reviewed!</h2>
                <p className="text-sm text-gray-400">No pending guides.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {tips.map((tip) => (
                  <div key={tip.id} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-kazi-dark">{tip.title}</h3>
                        <p className="text-xs text-gray-400">by {tip.author?.name || "Anonymous"} • {tip.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tip.excerpt}</p>
                    {rejectingId === tip.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Why are you rejecting this guide?"
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => rejectTip(tip.id, rejectionReason)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason("");
                            }}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveTip(tip.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(tip.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "withdrawals" ? (
            withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h2 className="text-lg font-black text-kazi-dark mb-1">No pending withdrawals!</h2>
                <p className="text-sm text-gray-400">All withdrawal requests have been processed.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {withdrawals.map((w) => (
                  <div key={w.id} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-kazi-dark">{w.provider?.businessName}</h3>
                        <p className="text-xs text-gray-500">{w.provider?.user?.name} · {w.provider?.user?.phone}</p>
                        <p className="text-xs text-gray-400 capitalize">{w.provider?.category?.toLowerCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-kazi-orange">KSh {Math.round(w.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Wallet: KSh {Math.round(w.provider?.walletBalance || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                      <p className="text-gray-600">Send to M-Pesa: <span className="font-bold text-kazi-dark">{w.phone}</span></p>
                      <p className="text-xs text-gray-400 mt-1">Requested {new Date(w.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => processWithdrawal(w.id, "approve")}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Send className="w-4 h-4" /> Send Payout
                      </button>
                      <button
                        onClick={() => processWithdrawal(w.id, "reject")}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject & Refund
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "kazivideos" ? (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-600">
                  <span className="font-black text-kazi-dark">{kaziVideos.length}</span> total ·{" "}
                  <span className="text-red-500 font-bold">{kaziVideos.filter((v) => v.reportCount >= 3).length} flagged</span>
                </p>
              </div>
              {kaziVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Video className="w-8 h-8 text-gray-300 mb-4" />
                  <h2 className="text-lg font-black text-kazi-dark mb-1">No videos posted yet</h2>
                </div>
              ) : (
                kaziVideos.map((v) => (
                  <div key={v.id} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-kazi-dark">{v.user?.name || "Unknown"}</h3>
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${v.user?.role === "PROVIDER" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                            {v.user?.role === "PROVIDER" ? v.user?.provider?.category || "Provider" : "Customer"}
                          </span>
                          {v.reportCount >= 3 && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-red-100 text-red-600 rounded-full">
                              🚨 {v.reportCount} reports
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{v.caption}</p>
                        <p className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · ❤️ {v.likes} · 💬 {v._count?.comments ?? 0}</p>
                      </div>
                    </div>
                    <div className="mb-3 rounded-xl overflow-hidden bg-black">
                      <video src={v.videoUrl} controls className="w-full max-h-52 object-contain" preload="metadata" />
                    </div>
                    <button
                      onClick={() => deleteKaziVideo(v.id)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" /> Delete Video
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
