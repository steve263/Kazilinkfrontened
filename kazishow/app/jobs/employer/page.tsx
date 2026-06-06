"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, CheckCircle, Clock, MapPin, Phone,
  AlertCircle, Eye, EyeOff, ArrowLeft, Briefcase,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    if (!t) { router.push("/auth/login"); return; }
    setToken(t);
    checkAccessAndLoad(t);
  }, []);

  async function checkAccessAndLoad(t: string) {
    setLoading(true);
    try {
      // Check if this user has an employer profile
      const profileRes = await fetch(`${API}/api/jobs/employer/profile`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const profileData = await profileRes.json();
      if (!profileData.success || !profileData.data) {
        // Not an employer — redirect to jobs page
        router.replace("/jobs");
        return;
      }
      fetchDashboard(t);
    } catch {
      router.replace("/jobs");
    }
  }

  async function fetchDashboard(t: string) {
    try {
      const res = await fetch(`${API}/api/jobs/employer/dashboard`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = await res.json();
      if (d.success) setData(d.data);
      else toast.error(d.message || "Failed to load dashboard");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-kazi-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-kazi-orange/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
        <div className="relative px-4 pt-12 pb-6">
          <button onClick={() => router.back()} className="text-white/60 text-sm mb-3 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-white font-black text-2xl">📋 My Dashboard</h1>
              <p className="text-white/50 text-sm mt-0.5">Manage your job postings</p>
            </div>
            <button
              onClick={() => router.push("/jobs/post")}
              className="bg-kazi-orange text-white font-black px-4 py-2.5 rounded-2xl text-sm flex items-center gap-1.5 shadow-lg shadow-orange-900/30"
            >
              <Briefcase className="w-4 h-4" /> Post Job
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Jobs",    value: stats.totalJobs,         icon: "💼", color: "text-white"       },
                { label: "Applied", value: stats.totalApplications, icon: "📥", color: "text-white"       },
                { label: "Review",  value: stats.pendingReview,     icon: "⏳", color: "text-kazi-orange" },
                { label: "Hired",   value: stats.totalHired,        icon: "✅", color: "text-green-400"   },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                  <p className="text-lg mb-0.5">{s.icon}</p>
                  <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
                  <p className="text-white/40 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Pending review alert */}
        {stats?.pendingReview > 0 && (
          <div className="bg-kazi-orange rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">
                {stats.pendingReview} applicant{stats.pendingReview > 1 ? "s" : ""} waiting for your decision!
              </p>
              <p className="text-white/70 text-xs mt-0.5">Payment verified — tap a job to hire or decline</p>
            </div>
          </div>
        )}

        {/* No jobs */}
        {!data?.jobs?.length ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-black text-kazi-dark text-xl mb-2">No jobs posted yet</p>
            <p className="text-gray-400 text-sm mb-6">Post your first job and find workers fast!</p>
            <button
              onClick={() => router.push("/jobs/post")}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg"
            >
              📢 Post First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.jobs.map((job: any) => {
              const spotsLeft  = job.workersNeeded - job.workersHired;
              const toReview   = job.applications.filter((a: any) => a.paymentStatus === "PAYMENT_VERIFIED" && a.status === "PENDING").length;
              const hired      = job.applications.filter((a: any) => a.status === "HIRED").length;
              const isExpanded = expandedJobId === job.id;

              return (
                <div key={job.id} className="bg-white rounded-3xl overflow-hidden shadow-sm">
                  {/* Job header */}
                  <div className="bg-gradient-to-r from-kazi-dark to-gray-800 p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {job.isUrgent && (
                          <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">URGENT</span>
                        )}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          job.status === "FILLED" ? "bg-gray-500 text-white" :
                          job.status === "OPEN"   ? "bg-green-500 text-white" :
                                                   "bg-amber-500 text-white"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">Spots</p>
                        <p className={`font-black text-base ${spotsLeft <= 0 ? "text-red-400" : "text-green-400"}`}>
                          {spotsLeft <= 0 ? "Full" : `${spotsLeft} left`}
                        </p>
                      </div>
                    </div>

                    <p className="text-white font-black text-lg leading-tight">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/60 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </span>
                      <span className="text-kazi-orange font-black text-sm">KSh {job.pay?.toLocaleString()}</span>
                    </div>

                    {/* Mini stats */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <div className="bg-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-white/60" />
                        <span className="text-white text-xs font-bold">{job._count.applications} applied</span>
                      </div>
                      {toReview > 0 && (
                        <div className="bg-kazi-orange/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-kazi-orange" />
                          <span className="text-kazi-orange text-xs font-black">{toReview} to review</span>
                        </div>
                      )}
                      {hired > 0 && (
                        <div className="bg-green-500/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-xs font-bold">{hired} hired</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle button */}
                  <div className="p-4 pb-3">
                    <button
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                        toReview > 0
                          ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                          : "bg-gray-50 text-kazi-dark"
                      }`}
                    >
                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {isExpanded
                        ? "Hide Applicants ↑"
                        : toReview > 0
                        ? `Review ${toReview} Applicant${toReview > 1 ? "s" : ""} →`
                        : `View Applicants (${job._count.applications})`}
                    </button>
                  </div>

                  {/* Expanded applicants list */}
                  {isExpanded && (
                    <ApplicantsList
                      jobId={job.id}
                      job={job}
                      token={token}
                      onRefresh={() => fetchDashboard(token)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Applicants list — loads verified-only from employer endpoint ──────────────
function ApplicantsList({
  jobId, job, token, onRefresh,
}: {
  jobId: string;
  job: any;
  token: string;
  onRefresh: () => void;
}) {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState<string | null>(null);

  useEffect(() => { load(); }, [jobId]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/jobs/employer/jobs/${jobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setApplicants(data.data.applications);
    } catch {}
    setLoading(false);
  }

  async function hire(appId: string) {
    setActing(appId + "_hire");
    try {
      const res = await fetch(`${API}/api/jobs/employer/applications/${appId}/hire`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("🎉 Worker hired! SMS sent to them.");
        await load();
        onRefresh();
      } else {
        toast.error(data.message || "Failed to hire");
      }
    } catch {
      toast.error("Network error");
    }
    setActing(null);
  }

  async function reject(appId: string) {
    setActing(appId + "_reject");
    try {
      const res = await fetch(`${API}/api/jobs/employer/applications/${appId}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Application declined. Worker notified.");
        await load();
        onRefresh();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    }
    setActing(null);
  }

  if (loading) {
    return (
      <div className="px-4 pb-4 flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (applicants.length === 0) {
    return (
      <div className="px-4 pb-5 border-t border-gray-100 pt-4">
        <div className="bg-gray-50 rounded-2xl p-5 text-center">
          <p className="text-3xl mb-2">⏳</p>
          <p className="font-black text-kazi-dark text-sm">No verified applicants yet</p>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            Applicants appear here after admin verifies their Equity payment
          </p>
        </div>
      </div>
    );
  }

  const pending  = applicants.filter((a) => a.status === "PENDING");
  const hired    = applicants.filter((a) => a.status === "HIRED");
  const declined = applicants.filter((a) => a.status === "DECLINED");

  return (
    <div className="border-t border-gray-100">

      {/* Pending review */}
      {pending.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-black text-kazi-orange uppercase tracking-widest mb-3">
            ⏳ Awaiting Your Decision ({pending.length})
          </p>
          <div className="space-y-3">
            {pending.map((app: any) => (
              <ApplicantCard
                key={app.id}
                app={app}
                job={job}
                type="pending"
                acting={acting}
                onHire={() => hire(app.id)}
                onReject={() => reject(app.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hired */}
      {hired.length > 0 && (
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-3">
            ✅ Hired by You ({hired.length})
          </p>
          <div className="space-y-3">
            {hired.map((app: any) => (
              <ApplicantCard
                key={app.id}
                app={app}
                job={job}
                type="hired"
                acting={acting}
                onHire={() => {}}
                onReject={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Declined */}
      {declined.length > 0 && (
        <div className="px-4 pt-2 pb-4">
          <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-3">
            ❌ Declined by You ({declined.length})
          </p>
          <div className="space-y-3">
            {declined.map((app: any) => (
              <ApplicantCard
                key={app.id}
                app={app}
                job={job}
                type="declined"
                acting={acting}
                onHire={() => {}}
                onReject={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual applicant card ─────────────────────────────────────────────────
function ApplicantCard({
  app, job, type, acting, onHire, onReject,
}: {
  app: any;
  job: any;
  type: "pending" | "hired" | "declined";
  acting: string | null;
  onHire: () => void;
  onReject: () => void;
}) {
  const waNumber = app.applicantPhone?.replace(/^0/, "254").replace(/\s/g, "");

  return (
    <div className={`rounded-2xl overflow-hidden border-2 ${
      type === "hired"    ? "border-green-200 bg-green-50/50" :
      type === "declined" ? "border-red-100 bg-red-50/50" :
                           "border-kazi-orange/20 bg-white"
    }`}>

      {/* Status banner */}
      {type !== "pending" && (
        <div className={`px-4 py-2 text-xs font-black ${
          type === "hired" ? "bg-green-500 text-white" : "bg-red-400 text-white"
        }`}>
          {type === "hired"
            ? "🎉 You hired this person — SMS sent to them"
            : "❌ You declined — SMS sent"}
        </div>
      )}

      <div className="p-4">

        {/* Avatar + name + phone */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-2xl flex-shrink-0 ${
            type === "hired"    ? "bg-green-500" :
            type === "declined" ? "bg-gray-400" :
                                 "bg-kazi-orange"
          }`}>
            {(app.applicantName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-kazi-dark text-lg leading-tight">{app.applicantName}</p>
            <button
              onClick={() => window.open(`tel:${app.applicantPhone}`)}
              className="flex items-center gap-1.5 text-kazi-orange font-bold text-sm mt-0.5"
            >
              <Phone className="w-3.5 h-3.5" />
              {app.applicantPhone}
            </button>
          </div>
          <div className="text-xs text-gray-400 text-right flex-shrink-0">
            <p>Applied</p>
            <p className="font-bold text-kazi-dark">
              {new Date(app.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl p-3 mb-3 border border-gray-100">
          <p className="text-xs font-black text-gray-400 uppercase mb-1.5">About</p>
          <p className="text-gray-700 text-sm leading-relaxed">{app.applicantBio || "No description provided"}</p>
        </div>

        {/* Contact buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => window.open(`tel:${app.applicantPhone}`)}
            className="flex-1 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            📞 Call
          </button>
          <button
            onClick={() => window.open(`https://wa.me/${waNumber}`, "_blank")}
            className="flex-1 py-2.5 bg-green-50 border border-green-200 text-green-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            💬 WhatsApp
          </button>
        </div>

        {/* Hire / Decline — pending only */}
        {type === "pending" && (
          <div className="flex gap-3">
            <button
              onClick={onReject}
              disabled={acting === app.id + "_reject"}
              className="flex-1 py-3.5 bg-red-50 border-2 border-red-200 text-red-600 font-black rounded-2xl text-sm disabled:opacity-60"
            >
              {acting === app.id + "_reject" ? "Declining..." : "❌ Decline"}
            </button>
            <button
              onClick={onHire}
              disabled={acting === app.id + "_hire"}
              className="flex-1 py-3.5 bg-kazi-orange text-white font-black rounded-2xl text-sm disabled:opacity-60 shadow-md shadow-orange-200"
            >
              {acting === app.id + "_hire" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Hiring...
                </span>
              ) : "✅ Hire"}
            </button>
          </div>
        )}

        {/* Hired info */}
        {type === "hired" && (
          <div className="bg-green-100 rounded-2xl p-3 text-center">
            <p className="text-green-700 font-black text-sm">SMS sent to {app.applicantName}</p>
            <p className="text-green-600 text-xs mt-0.5">
              They've been told to call you on {job?.employerPhone || "your number"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
