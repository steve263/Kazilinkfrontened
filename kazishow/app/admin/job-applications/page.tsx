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
    } catch {
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

  async function handleVerify(id: string) {
    setActing(id);
    try {
      const res = await fetch(`${API}/api/admin/job-applications/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Payment verified! Employer notified to review applicant.");
        fetchApps(token);
      } else {
        toast.error(data.message || "Failed");
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
        toast.success("Payment rejected. Worker notified to resubmit.");
        fetchApps(token);
      } else {
        toast.error(data.message || "Failed");
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
    if (filter === "PENDING")  return apps.filter((a) => a.paymentStatus === "PENDING_VERIFICATION");
    if (filter === "VERIFIED") return apps.filter((a) => a.paymentStatus === "PAYMENT_VERIFIED");
    if (filter === "HIRED")    return apps.filter((a) => a.status === "HIRED");
    if (filter === "DECLINED") return apps.filter((a) => a.status === "DECLINED" || a.paymentStatus === "REJECTED");
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
                  ? `${pendingCount} payment${pendingCount !== 1 ? "s" : ""} waiting to be verified`
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

          {/* Admin role — PAYMENT ONLY */}
          <div className="bg-kazi-dark rounded-2xl p-4">
            <p className="text-kazi-orange font-black text-sm mb-3">💰 YOUR JOB: VERIFY PAYMENT ONLY</p>
            <div className="space-y-2">
              {[
                { icon: "1️⃣", text: "Worker applies and pays the application fee via Equity/M-Pesa" },
                { icon: "2️⃣", text: "Worker pastes their Equity payment message as proof" },
                { icon: "3️⃣", text: "YOU check the message → click \"Payment Received\" if correct" },
                { icon: "4️⃣", text: "Worker's application is sent to the employer automatically" },
                { icon: "5️⃣", text: "The EMPLOYER decides to hire or reject — that is NOT your job" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-lg leading-none">{icon}</span>
                  <p className="text-white/80 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-red-600 text-sm font-bold">⚠️ {fetchError}</p>
              <button onClick={() => fetchApps(token)} className="text-red-500 text-xs font-bold underline">Retry</button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm overflow-x-auto">
            {[
              { key: "PENDING",  label: "💰 Verify Payment", count: pendingCount },
              { key: "VERIFIED", label: "✅ Verified",        count: apps.filter((a) => a.paymentStatus === "PAYMENT_VERIFIED" && a.status !== "HIRED" && a.status !== "DECLINED").length },
              { key: "HIRED",    label: "🎉 Hired",           count: apps.filter((a) => a.status === "HIRED").length },
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
              <div className="text-5xl mb-3">{filter === "PENDING" ? "💰" : "📋"}</div>
              <p className="text-gray-600 font-black text-lg">
                {filter === "PENDING" ? "No payments waiting" : "Nothing here"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {filter === "PENDING"
                  ? "When workers apply and pay, their proof will appear here"
                  : "Switch to a different tab"}
              </p>
              <button onClick={() => fetchApps(token)} className="mt-4 px-6 py-2.5 bg-kazi-orange text-white font-black rounded-2xl text-sm">
                🔄 Refresh Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  acting={acting}
                  onVerify={handleVerify}
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

function AppCard({
  app, acting, onVerify, onReject,
}: {
  app: any;
  acting: string | null;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isPending  = app.paymentStatus === "PENDING_VERIFICATION";
  const isVerified = app.paymentStatus === "PAYMENT_VERIFIED";
  const isHired    = app.status === "HIRED";
  const isRejected = app.status === "DECLINED" || app.paymentStatus === "REJECTED";

  const stripBg = isHired    ? "bg-green-600"
    : isRejected             ? "bg-red-500"
    : isVerified             ? "bg-blue-600"
    : "bg-amber-500";

  const stripLabel = isHired    ? "🎉 HIRED BY EMPLOYER"
    : isRejected               ? "❌ PAYMENT REJECTED"
    : isVerified               ? "✅ PAYMENT VERIFIED — Sent to employer"
    : "💰 WAITING — Payment not yet verified";

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

      {/* Status strip */}
      <div className={`${stripBg} px-4 py-3 flex items-center justify-between`}>
        <span className="text-white font-black text-sm">{stripLabel}</span>
        <span className="text-white/70 text-xs">
          {new Date(app.createdAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="p-4 space-y-3">

        {/* Applicant */}
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 bg-kazi-orange/10 rounded-2xl flex items-center justify-center font-black text-kazi-orange text-2xl flex-shrink-0">
            {(app.applicantName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-black text-kazi-dark text-lg leading-tight">{app.applicantName || "—"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5 text-kazi-orange" />
              <a href={`tel:${app.applicantPhone}`} className="text-kazi-orange font-bold text-sm">{app.applicantPhone || "—"}</a>
            </div>
          </div>
          {/* Fee */}
          <div className="bg-green-50 border border-green-200 rounded-2xl px-3 py-2 text-center">
            <p className="text-xs text-gray-400">Fee paid</p>
            <p className="font-black text-green-700 text-xl leading-none">KSh {app.applicationFee || 100}</p>
          </div>
        </div>

        {/* Bio */}
        {app.applicantBio && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-black text-gray-400 uppercase mb-1">About Applicant</p>
            <p className="text-gray-700 text-sm leading-relaxed">{app.applicantBio}</p>
          </div>
        )}

        {/* Job */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="font-black text-kazi-dark text-sm">{app.job?.title || "—"}</p>
            <p className="text-gray-400 text-xs">📍 {app.job?.location}</p>
            {app.job?.employerPhone && (
              <p className="text-xs text-gray-500 mt-0.5">
                Employer: <a href={`tel:${app.job.employerPhone}`} className="text-kazi-orange font-bold">{app.job.employerPhone}</a>
              </p>
            )}
          </div>
          <p className="font-black text-kazi-orange">KSh {app.job?.pay?.toLocaleString()}</p>
        </div>

        {/* ── EQUITY PAYMENT PROOF ── */}
        <div className={`rounded-xl p-4 border-2 ${isPending ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-black uppercase tracking-wider ${isPending ? "text-amber-700" : "text-gray-500"}`}>
              📱 Equity Payment Message
            </p>
            {isPending && (
              <span className="bg-amber-200 text-amber-800 text-xs font-black px-2 py-0.5 rounded-full">
                Check this ↓
              </span>
            )}
          </div>
          {app.mpesaRef ? (
            <p className={`text-sm leading-relaxed break-all ${isPending ? "text-amber-900 font-medium" : "text-gray-600"}`}>
              {app.mpesaRef}
            </p>
          ) : (
            <p className="text-gray-400 text-sm italic">No payment message provided</p>
          )}
        </div>

        {/* ── ACTION BUTTONS (pending only) ── */}
        {isPending && (
          <div className="space-y-2 pt-1">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-blue-700 font-black text-xs text-center">
                Check the Equity message above shows KSh {app.applicationFee || 100} paid to Paybill 247247
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onReject(app.id)}
                disabled={acting === app.id}
                className="flex-1 py-3.5 bg-red-50 text-red-600 font-black rounded-2xl text-sm border-2 border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                ❌ Payment Not Found
              </button>
              <button
                onClick={() => onVerify(app.id)}
                disabled={acting === app.id}
                className="flex-1 py-3.5 bg-green-500 text-white font-black rounded-2xl text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {acting === app.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : "✅ Payment Received"}
              </button>
            </div>
          </div>
        )}

        {/* Verified — waiting for employer */}
        {isVerified && !isHired && !isRejected && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
            <p className="text-blue-700 font-black text-sm">✅ Payment verified</p>
            <p className="text-blue-500 text-xs mt-1">
              Employer has been notified — they will hire or reject this worker
            </p>
          </div>
        )}

        {isHired && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
            <p className="text-green-700 font-black text-sm">🎉 Hired by the employer!</p>
            <p className="text-green-500 text-xs mt-1">The employer selected this worker</p>
          </div>
        )}

        {isRejected && !isHired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
            <p className="text-red-600 font-black text-sm">❌ Payment rejected</p>
            <p className="text-red-400 text-xs mt-1">Worker was notified to resubmit correct proof</p>
          </div>
        )}
      </div>
    </div>
  );
}
