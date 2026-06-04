"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  "https://kazishow-backend-production.up.railway.app";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "⏳ Pending",
  PENDING_VERIFICATION: "🔍 Verifying Payment",
  PAYMENT_VERIFIED: "✅ Payment Verified",
  HIRED: "🎉 Hired by Employer",
  DECLINED: "❌ Rejected by Employer",
  REJECTED: "❌ Rejected",
};

export default function AdminJobApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_VERIFICATION");
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    setToken(t);
    fetchApps(t);
  }, []);

  const fetchApps = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/job-applications`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setApps(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (id: string) => {
    setVerifying(id);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/job-applications/${id}/verify-payment`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Payment verified! Employer notified ✅");
        fetchApps(token);
      }
    } catch {
      toast.error("Failed to verify");
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectPayment = async (id: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/job-applications/${id}/reject-payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: "M-Pesa payment not found" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Payment rejected");
        fetchApps(token);
      }
    } catch {
      toast.error("Failed to reject");
    }
  };

  const filtered = apps.filter((a) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING_VERIFICATION") return a.paymentStatus === "PENDING_VERIFICATION";
    if (filter === "VERIFIED") return a.paymentStatus === "PAYMENT_VERIFIED";
    if (filter === "HIRED") return a.status === "HIRED";
    if (filter === "DECLINED") return a.status === "DECLINED";
    return true;
  });

  const pendingCount = apps.filter((a) => a.paymentStatus === "PENDING_VERIFICATION").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-kazi-dark">💼 Job Applications</h1>
          <p className="text-gray-400 text-sm mt-1">
            Verify M-Pesa payments only. Employer approves or rejects workers.
          </p>
        </div>
        <button
          onClick={() => fetchApps(token)}
          className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Admin role notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-blue-700 font-black text-sm mb-1">📋 Your Role as Admin</p>
        <p className="text-blue-600 text-xs leading-relaxed">
          You only verify M-Pesa payments. Once you verify payment the employer who posted
          the job will see the applicant and decide to hire or reject them. You cannot hire
          or reject workers.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm overflow-x-auto">
        {[
          { key: "PENDING_VERIFICATION", label: "🔍 Verify Payment", count: pendingCount },
          { key: "VERIFIED",             label: "✅ Verified",        count: null },
          { key: "HIRED",                label: "🎉 Hired",           count: null },
          { key: "DECLINED",             label: "❌ Declined",        count: null },
          { key: "ALL",                  label: "All",                count: apps.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab.key ? "bg-kazi-orange text-white" : "text-gray-500"
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

      {/* Applications list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-400 font-bold">No applications here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

              {/* Status header */}
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
                  {STATUS_LABELS[app.status] || STATUS_LABELS[app.paymentStatus] || "Pending"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(app.createdAt).toLocaleDateString("en-KE")}
                </span>
              </div>

              <div className="p-4 space-y-3">

                {/* Applicant info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-kazi-orange/10 rounded-2xl flex items-center justify-center font-black text-kazi-orange text-xl">
                    {(app.applicantName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-kazi-dark text-lg">
                      {app.applicantName || "—"}
                    </p>
                    <p className="text-gray-500 text-sm">📞 {app.applicantPhone || "—"}</p>
                  </div>
                </div>

                {/* About applicant */}
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
                  <p className="font-black text-kazi-orange">
                    KSh {app.job?.pay?.toLocaleString()}
                  </p>
                </div>

                {/* M-Pesa SMS */}
                {app.mpesaRef && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-xs font-black text-green-600 mb-1 uppercase">M-Pesa SMS Proof</p>
                    <p className="text-green-700 text-xs leading-relaxed break-all">{app.mpesaRef}</p>
                  </div>
                )}

                {/* Application fee */}
                {app.applicationFee && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <span className="text-gray-500 text-sm">Application fee paid</span>
                    <span className="font-black text-kazi-orange">KSh {app.applicationFee}</span>
                  </div>
                )}

                {/* Admin action — only verify payment */}
                {app.paymentStatus === "PENDING_VERIFICATION" && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase text-center">
                      Verify M-Pesa payment in your Equity Bank account then confirm below
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRejectPayment(app.id)}
                        className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-sm"
                      >
                        ❌ Payment Not Found
                      </button>
                      <button
                        onClick={() => handleVerifyPayment(app.id)}
                        disabled={verifying === app.id}
                        className="flex-1 py-3 bg-green-500 text-white font-black rounded-2xl text-sm disabled:opacity-60"
                      >
                        {verifying === app.id ? "Verifying..." : "✅ Payment Received"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment verified — waiting for employer */}
                {app.paymentStatus === "PAYMENT_VERIFIED" &&
                  app.status !== "HIRED" &&
                  app.status !== "DECLINED" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                    <p className="text-blue-700 font-bold text-sm">✅ Payment verified</p>
                    <p className="text-blue-500 text-xs mt-1">Waiting for employer to hire or reject</p>
                  </div>
                )}

                {/* Final status */}
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
  );
}
