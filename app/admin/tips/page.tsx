"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, BookOpen, Eye, ChevronRight, RefreshCw, Menu, Users, ShoppingBag, BarChart2, Activity, ClipboardCheck, LogOut, CheckSquare } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const NAV = [
  { label: "Overview",   href: "/admin",           icon: BarChart2 },
  { label: "Approvals",  href: "/admin/approvals", icon: ClipboardCheck },
  { label: "Providers",  href: "/admin/providers", icon: CheckSquare },
  { label: "Users",      href: "/admin/users",     icon: Users },
  { label: "Bookings",   href: "/admin/bookings",  icon: ShoppingBag },
  { label: "Analytics",  href: "/admin/analytics", icon: Activity },
  { label: "Tips",       href: "/admin/tips",      icon: BookOpen },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT:    "bg-gray-100 text-gray-600",
};

export default function AdminTipsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchTips = useCallback(async () => {
    if (!ready || !token) return;
    setLoading(true);
    try {
      const endpoint = tab === "pending" ? "pending" : "approved";
      const res = await fetch(`${API}/api/admin/tips/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const list = data.data as any[];
        setTips(tab === "rejected" ? list.filter((t) => t.status === "REJECTED") : list);
      }
    } catch {
      toast.error("Failed to load tips");
    } finally {
      setLoading(false);
    }
  }, [ready, token, tab]);

  useEffect(() => { fetchTips(); }, [fetchTips]);

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`${API}/api/admin/tips/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Guide approved and author notified");
        setTips((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalId) return;
    if (!rejectReason.trim()) { toast.error("Please enter a rejection reason"); return; }
    setActing(rejectModalId);
    try {
      const res = await fetch(`${API}/api/admin/tips/${rejectModalId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Guide rejected and author notified");
        setTips((prev) => prev.filter((t) => t.id !== rejectModalId));
        setRejectModalId(null);
        setRejectReason("");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActing(null);
    }
  };

  function logout() {
    localStorage.removeItem("kazishow_token");
    localStorage.removeItem("kazishow_user");
    window.location.href = "/auth/login";
  }

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

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-black text-kazi-dark mb-4">Reject Guide</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this guide is being rejected..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 min-h-[100px] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModalId(null); setRejectReason(""); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!acting}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                {acting ? "Rejecting..." : "Reject Guide"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/tips" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Tips & Guides</h1>
              <p className="text-xs text-gray-400">Review and moderate submitted guides</p>
            </div>
          </div>
          <button onClick={fetchTips} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="p-5">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["pending", "approved", "rejected"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? "bg-kazi-orange text-white" : "bg-white text-gray-600 hover:bg-orange-50 border border-gray-200"}`}
              >
                {t === "pending" && <Clock className="w-3.5 h-3.5 inline mr-1.5" />}
                {t === "approved" && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                {t === "rejected" && <XCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : tips.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No {tab} guides</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tips.map((tip) => (
                <div key={tip.id} className="bg-white rounded-2xl p-5 card-shadow">
                  <div className="flex items-start gap-4">
                    {tip.coverImage && (
                      <img
                        src={tip.coverImage}
                        alt={tip.title}
                        className="w-20 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-black text-kazi-dark text-sm truncate">{tip.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[tip.status] || "bg-gray-100 text-gray-600"}`}>
                          {tip.status}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                          {tip.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        By <span className="font-semibold text-kazi-dark">{tip.author?.name}</span> · {new Date(tip.createdAt).toLocaleDateString("en-KE")}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">{tip.excerpt}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {tip.views} views</span>
                        <Link
                          href={`/tips/${tip.id}`}
                          target="_blank"
                          className="flex items-center gap-1 text-kazi-orange hover:underline"
                        >
                          Preview <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {tab === "pending" && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(tip.id)}
                          disabled={acting === tip.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModalId(tip.id)}
                          disabled={acting === tip.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {tip.rejectReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-xs text-red-600"><span className="font-bold">Rejection reason:</span> {tip.rejectReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
