"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart2, ClipboardCheck, CheckSquare, Users, ShoppingBag,
  Activity, DollarSign, Shield, Scale, Gavel, XCircle, Megaphone,
  ShieldAlert, CreditCard, BadgeCheck, Settings, LogOut, Menu, Briefcase, Wallet,
  RefreshCw, Phone,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const NAV = [
  { label: "Overview",         href: "/admin",                   icon: BarChart2      },
  { label: "Job Applications", href: "/admin/job-applications",  icon: Briefcase      },
  { label: "Subscriptions",    href: "/admin/subscriptions",     icon: CreditCard     },
  { label: "Commissions",      href: "/admin/commissions",       icon: Wallet         },
  { label: "Approvals",        href: "/admin/approvals",         icon: ClipboardCheck },
  { label: "Verification",     href: "/admin/verification",      icon: BadgeCheck     },
  { label: "Providers",        href: "/admin/providers",         icon: CheckSquare    },
  { label: "Users",            href: "/admin/users",             icon: Users          },
  { label: "Bookings",         href: "/admin/bookings",          icon: ShoppingBag    },
  { label: "Analytics",        href: "/admin/analytics",         icon: Activity       },
  { label: "Finance",          href: "/admin/finance",           icon: DollarSign     },
  { label: "Trust & Safety",   href: "/admin/trust",             icon: Shield         },
  { label: "Appeals",          href: "/admin/appeals",           icon: Scale          },
  { label: "Disputes",         href: "/admin/disputes",          icon: Gavel          },
  { label: "Cancellations",    href: "/admin/cancellations",     icon: XCircle        },
  { label: "Broadcast",        href: "/admin/broadcast",         icon: Megaphone      },
  { label: "Auto-Suspension",  href: "/admin/auto-suspension",   icon: ShieldAlert    },
  { label: "Settings",         href: "/admin/settings",          icon: Settings       },
];

export default function AdminJobApplicationsPage() {
  const ready = useAdminGuard();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [token, setToken] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchApps = useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`${API}/api/admin/job-applications`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        setApps(data.data);
      } else {
        setFetchError(data.message || "Failed to load applications");
      }
    } catch (err: any) {
      setFetchError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) fetchApps(token); }, [token, fetchApps]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchApps(token), 30000);
    return () => clearInterval(interval);
  }, [token, fetchApps]);

  async function handleApprove(id: string) {
    setActing(id);
    try {
      const res = await fetch(`${API}/api/admin/job-applications/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Approved! Worker has been notified via SMS.");
        fetchApps(token);
      } else {
        toast.error(data.message || "Failed to approve");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(id: string) {
    setActing(id);
    try {
      const res = await fetch(`${API}/api/admin/job-applications/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "Payment could not be verified" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Application rejected. Worker notified.");
        fetchApps(token);
      } else {
        toast.error(data.message || "Failed to reject");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActing(null);
    }
  }

  function logout() {
    localStorage.removeItem("kazishow_token");
    localStorage.removeItem("kazishow_user");
    window.location.href = "/auth/login";
  }

  const pendingCount = apps.filter((a) => a.paymentStatus === "PENDING_VERIFICATION").length;

  const filtered = (() => {
    if (filter === "ALL")     return apps;
    if (filter === "PENDING") return apps.filter((a) => a.paymentStatus === "PENDING_VERIFICATION");
    if (filter === "HIRED")   return apps.filter((a) => a.status === "HIRED");
    if (filter === "DECLINED")return apps.filter((a) => a.status === "DECLINED");
    return apps;
  })();

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                href === "/admin/job-applications"
                  ? "bg-kazi-orange text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {label === "Job Applications" && pendingCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">

        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-black text-kazi-dark text-lg">💼 Job Applications</h1>
              <p className="text-gray-400 text-xs">
                {pendingCount > 0
                  ? `${pendingCount} pending — verify M-Pesa SMS then approve or reject`
                  : "Auto-refreshes every 30 seconds"}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchApps(token)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="p-5 space-y-5 max-w-3xl mx-auto">

          {/* How it works */}
          <div className="bg-kazi-dark rounded-2xl p-4">
            <p className="text-white font-black text-sm mb-2">📋 How Applications Work</p>
            <div className="space-y-1.5">
              {[
                "Worker applies → fills name, phone, bio → pays M-Pesa application fee",
                "Worker pastes the M-Pesa SMS as proof",
                "You see it here → check the SMS proof below",
                "Click Approve → worker is hired, SMS sent, spot counter decrements",
                "Click Reject → worker is notified to reapply",
              ].map((step, i) => (
                <p key={i} className="text-white/70 text-xs flex items-start gap-2">
                  <span className="w-4 h-4 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </p>
              ))}
            </div>
          </div>

          {/* Error state */}
          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-red-600 text-sm font-bold">⚠️ {fetchError}</p>
              <button onClick={() => fetchApps(token)} className="text-red-500 text-xs font-bold underline">
                Retry
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm overflow-x-auto">
            {[
              { key: "PENDING",  label: "🔍 Pending Review", count: pendingCount },
              { key: "HIRED",    label: "✅ Approved",        count: apps.filter((a) => a.status === "HIRED").length },
              { key: "DECLINED", label: "❌ Rejected",        count: null },
              { key: "ALL",      label: "📋 All",             count: apps.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === tab.key ? "bg-kazi-orange text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                    filter === tab.key ? "bg-white/30 text-white" : "bg-red-500 text-white"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading applications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-600 font-black text-lg">
                {filter === "PENDING" ? "No pending applications" : "No applications here"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {filter === "PENDING"
                  ? "New applications will appear here when workers apply and pay"
                  : "Switch to a different tab to see more"}
              </p>
              <button
                onClick={() => fetchApps(token)}
                className="mt-4 px-6 py-2.5 bg-kazi-orange text-white font-black rounded-2xl text-sm"
              >
                🔄 Check for new applications
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  acting={acting}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ApplicationCard({
  app, acting, onApprove, onReject,
}: {
  app: any;
  acting: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isPending  = app.paymentStatus === "PENDING_VERIFICATION";
  const isApproved = app.status === "HIRED";
  const isRejected = app.status === "DECLINED";

  const headerBg = isApproved ? "bg-green-600" : isRejected ? "bg-red-500" : "bg-kazi-dark";
  const statusText = isApproved ? "✅ APPROVED — Worker hired"
    : isRejected ? "❌ REJECTED"
    : "🔍 PENDING — Waiting for your review";

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

      {/* Header strip */}
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <span className="text-white font-black text-sm">{statusText}</span>
        <span className="text-white/60 text-xs">
          {new Date(app.createdAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="p-4 space-y-3">

        {/* Applicant info */}
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 bg-kazi-orange/10 rounded-2xl flex items-center justify-center font-black text-kazi-orange text-2xl flex-shrink-0">
            {(app.applicantName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-black text-kazi-dark text-lg leading-tight">{app.applicantName || "—"}</p>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="w-3.5 h-3.5 text-kazi-orange" />
              <a href={`tel:${app.applicantPhone}`} className="text-kazi-orange font-bold text-sm">
                {app.applicantPhone || "—"}
              </a>
            </div>
          </div>
          {/* Fee badge */}
          <div className="bg-kazi-orange/10 border border-kazi-orange/20 rounded-2xl px-3 py-2 text-center flex-shrink-0">
            <p className="text-xs text-gray-400">Fee paid</p>
            <p className="font-black text-kazi-orange text-lg leading-none">KSh {app.applicationFee || 100}</p>
          </div>
        </div>

        {/* About applicant */}
        {app.applicantBio && (
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs font-black text-blue-600 uppercase mb-1">About Applicant</p>
            <p className="text-gray-700 text-sm leading-relaxed">{app.applicantBio}</p>
          </div>
        )}

        {/* Job info */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="font-black text-kazi-dark text-sm">{app.job?.title || "—"}</p>
            <p className="text-gray-400 text-xs mt-0.5">📍 {app.job?.location}</p>
            {app.job?.employerPhone && (
              <p className="text-xs text-gray-500 mt-0.5">
                Employer: <a href={`tel:${app.job.employerPhone}`} className="text-kazi-orange font-bold">{app.job.employerPhone}</a>
              </p>
            )}
          </div>
          <p className="font-black text-kazi-orange text-lg">KSh {app.job?.pay?.toLocaleString()}</p>
        </div>

        {/* M-Pesa SMS PROOF — most important section */}
        <div className={`rounded-xl p-3 border-2 ${isPending ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-black uppercase ${isPending ? "text-green-700" : "text-gray-500"}`}>
              📱 M-Pesa Payment SMS
            </p>
            {isPending && (
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                Verify this
              </span>
            )}
          </div>
          {app.mpesaRef ? (
            <p className={`text-sm leading-relaxed break-all font-mono ${isPending ? "text-green-800" : "text-gray-600"}`}>
              {app.mpesaRef}
            </p>
          ) : (
            <p className="text-gray-400 text-sm italic">No SMS provided</p>
          )}
        </div>

        {/* Action buttons — only for pending */}
        {isPending && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-center text-gray-500 font-bold">
              Check the M-Pesa SMS above matches KSh {app.applicationFee || 100} payment to Paybill 247247
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onReject(app.id)}
                disabled={acting === app.id}
                className="flex-1 py-3.5 bg-red-50 text-red-600 font-black rounded-2xl text-sm border-2 border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                ❌ Reject Application
              </button>
              <button
                onClick={() => onApprove(app.id)}
                disabled={acting === app.id}
                className="flex-1 py-3.5 bg-green-500 text-white font-black rounded-2xl text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {acting === app.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : "✅ Approve & Hire"}
              </button>
            </div>
          </div>
        )}

        {/* Status messages for completed */}
        {isApproved && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-green-700 font-black text-sm">Approved and hired!</p>
              <p className="text-green-500 text-xs">Worker was notified via SMS</p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-red-600 font-black text-sm">Application rejected</p>
              <p className="text-red-400 text-xs">Worker was notified via SMS</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
