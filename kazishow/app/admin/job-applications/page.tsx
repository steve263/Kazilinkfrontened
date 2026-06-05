"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart2, ClipboardCheck, CheckSquare, Users, ShoppingBag,
  Activity, DollarSign, Shield, Scale, Gavel, XCircle, Megaphone,
  ShieldAlert, CreditCard, BadgeCheck, Settings, LogOut, Menu, Briefcase, Wallet,
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

const STATUS_LABELS: Record<string, string> = {
  PENDING:              "⏳ Pending",
  PENDING_VERIFICATION: "🔍 Verifying Payment",
  PAYMENT_VERIFIED:     "✅ Payment Verified",
  HIRED:                "🎉 Hired by Employer",
  DECLINED:             "❌ Rejected by Employer",
  REJECTED:             "❌ Rejected",
};

export default function AdminJobApplicationsPage() {
  const ready = useAdminGuard();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_VERIFICATION");
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchApps = useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/job-applications`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setApps(data.data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) fetchApps(token); }, [token, fetchApps]);

  const handleVerifyPayment = async (id: string) => {
    setVerifying(id);
    try {
      const res = await fetch(
        `${API}/api/admin/job-applications/${id}/approve`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Application approved! Worker notified ✅");
        fetchApps(token);
      }
    } catch {
      toast.error("Failed to approve");
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectPayment = async (id: string) => {
    try {
      const res = await fetch(
        `${API}/api/admin/job-applications/${id}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason: "Payment not verified" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Application rejected");
        fetchApps(token);
      }
    } catch {
      toast.error("Failed to reject");
    }
  };

  function logout() {
    localStorage.removeItem("kazishow_token");
    localStorage.removeItem("kazishow_user");
    window.location.href = "/auth/login";
  }

  const filtered = apps.filter((a) => {
    if (filter === "ALL")                  return true;
    if (filter === "PENDING_VERIFICATION") return a.paymentStatus === "PENDING_VERIFICATION";
    if (filter === "VERIFIED")             return a.paymentStatus === "PAYMENT_VERIFIED";
    if (filter === "HIRED")                return a.status === "HIRED";
    if (filter === "DECLINED")             return a.status === "DECLINED";
    return true;
  });

  const pendingCount = apps.filter((a) => a.paymentStatus === "PENDING_VERIFICATION").length;

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
                  {pendingCount}
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
              <p className="text-gray-400 text-xs">Verify M-Pesa SMS and approve or reject applications</p>
            </div>
          </div>
          <button
            onClick={() => fetchApps(token)}
            className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="p-5 space-y-5 max-w-3xl mx-auto">

          {/* Role notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-blue-700 font-black text-sm mb-1">📋 Your Role as Admin</p>
            <p className="text-blue-600 text-xs leading-relaxed">
              Verify the M-Pesa payment SMS, then Approve or Reject the application.
              Approved workers are hired and the employer is notified.
              Workers receive an SMS with the result.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm overflow-x-auto">
            {[
              { key: "PENDING_VERIFICATION", label: "🔍 Verify Payment", count: pendingCount },
              { key: "VERIFIED",             label: "✅ Verified",        count: null         },
              { key: "HIRED",                label: "🎉 Hired",           count: null         },
              { key: "DECLINED",             label: "❌ Declined",        count: null         },
              { key: "ALL",                  label: "All",                count: apps.length  },
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
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
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
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-400 font-bold text-lg">No applications here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

                  {/* Status strip */}
                  <div className={`px-4 py-2 flex items-center justify-between ${
                    app.status === "HIRED"
                      ? "bg-green-500"
                      : app.status === "DECLINED"
                      ? "bg-red-50"
                      : app.paymentStatus === "PAYMENT_VERIFIED"
                      ? "bg-green-50"
                      : "bg-amber-50"
                  }`}>
                    <span className={`text-xs font-black ${
                      app.status === "HIRED"
                        ? "text-white"
                        : app.status === "DECLINED"
                        ? "text-red-600"
                        : app.paymentStatus === "PAYMENT_VERIFIED"
                        ? "text-green-700"
                        : "text-amber-700"
                    }`}>
                      {STATUS_LABELS[app.status] || STATUS_LABELS[app.paymentStatus] || "⏳ Pending"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(app.createdAt).toLocaleDateString("en-KE")}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">

                    {/* Applicant */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-kazi-orange/10 rounded-2xl flex items-center justify-center font-black text-kazi-orange text-xl">
                        {(app.applicantName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-kazi-dark text-lg">{app.applicantName || "—"}</p>
                        <p className="text-gray-500 text-sm">📞 {app.applicantPhone || "—"}</p>
                      </div>
                    </div>

                    {/* Bio */}
                    {app.applicantBio && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1 font-bold uppercase">About Applicant</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{app.applicantBio}</p>
                      </div>
                    )}

                    {/* Job info */}
                    <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-kazi-dark text-sm">{app.job?.title}</p>
                        <p className="text-gray-400 text-xs">📍 {app.job?.location}</p>
                      </div>
                      <p className="font-black text-kazi-orange">KSh {app.job?.pay?.toLocaleString()}</p>
                    </div>

                    {/* M-Pesa proof */}
                    {app.mpesaRef && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                        <p className="text-xs font-black text-green-600 mb-1 uppercase">M-Pesa SMS Proof</p>
                        <p className="text-green-700 text-xs leading-relaxed break-all">{app.mpesaRef}</p>
                      </div>
                    )}

                    {/* Fee */}
                    {app.applicationFee && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <span className="text-gray-500 text-sm">Application fee paid</span>
                        <span className="font-black text-kazi-orange">KSh {app.applicationFee}</span>
                      </div>
                    )}

                    {/* Admin action */}
                    {app.paymentStatus === "PENDING_VERIFICATION" && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 font-bold uppercase text-center">
                          Check M-Pesa SMS above, then approve or reject
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleRejectPayment(app.id)}
                            className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-sm hover:bg-red-100 transition-colors"
                          >
                            ❌ Reject
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(app.id)}
                            disabled={verifying === app.id}
                            className="flex-1 py-3 bg-green-500 text-white font-black rounded-2xl text-sm disabled:opacity-60 hover:bg-green-600 transition-colors"
                          >
                            {verifying === app.id ? "Approving..." : "✅ Approve"}
                          </button>
                        </div>
                      </div>
                    )}

                    {app.status === "HIRED" && (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
                        <p className="text-green-700 font-black text-sm">🎉 Hired by employer!</p>
                        <p className="text-green-500 text-xs mt-1">Employer selected this worker</p>
                      </div>
                    )}

                    {app.status === "DECLINED" && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                        <p className="text-red-600 font-black text-sm">❌ Rejected by employer</p>
                        <p className="text-red-400 text-xs mt-1">Employer did not select this worker</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
