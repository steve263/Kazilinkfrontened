"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, XCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_STYLE: Record<string, string> = {
  OPEN:      "bg-green-100 text-green-700",
  FILLED:    "bg-blue-100 text-blue-700",
  CLOSED:    "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const APP_STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  HIRED:     "bg-green-100 text-green-700",
  DECLINED:  "bg-red-100 text-red-600",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function EmployerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, any[]>>({});
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token") || "";
    if (!token) { router.push("/auth/login"); return; }
    fetch(`${API}/api/jobs/employer/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setJobs(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadApplications(jobId: string) {
    if (applications[jobId]) { setExpandedJob(expandedJob === jobId ? null : jobId); return; }
    const token = localStorage.getItem("kazishow_token") || "";
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setApplications((prev) => ({ ...prev, [jobId]: data.data }));
    } catch {}
    setExpandedJob(expandedJob === jobId ? null : jobId);
  }

  async function hireOrDecline(appId: string, action: "hire" | "decline", jobId: string) {
    const token = localStorage.getItem("kazishow_token") || "";
    setActioning(appId);
    try {
      const res = await fetch(`${API}/api/jobs/applications/${appId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "hire" ? "Worker hired! They have been notified via SMS." : "Application declined.");
        setApplications((prev) => ({
          ...prev,
          [jobId]: (prev[jobId] || []).map((a) => a.id === appId ? { ...a, status: action === "hire" ? "HIRED" : "DECLINED" } : a),
        }));
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Network error");
    }
    setActioning(null);
  }

  async function confirmPay(appId: string, jobId: string) {
    const mpesaRef = prompt("Enter M-Pesa reference number (optional):");
    const token = localStorage.getItem("kazishow_token") || "";
    setActioning(appId);
    try {
      const res = await fetch(`${API}/api/jobs/applications/${appId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mpesaRef: mpesaRef || "" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Payment confirmed! Worker receives KSh ${data.workerPay}`);
        setApplications((prev) => ({
          ...prev,
          [jobId]: (prev[jobId] || []).map((a) => a.id === appId ? { ...a, paymentStatus: "PAID" } : a),
        }));
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    }
    setActioning(null);
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 mb-4 text-sm hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl">📢 My Posted Jobs</h1>
            <p className="text-white/50 text-sm mt-1">{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
          </div>
          <Link href="/jobs/post" className="bg-kazi-orange text-white font-black px-4 py-2.5 rounded-2xl text-sm">
            + Post Job
          </Link>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">📢</div>
            <p className="font-black text-kazi-dark text-lg">No jobs posted yet</p>
            <p className="text-gray-400 text-sm mt-2 mb-5">Post your first job to find workers fast</p>
            <Link href="/jobs/post" className="px-6 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm">
              Post a Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-kazi-dark text-base leading-tight">{job.title}</p>
                      <p className="text-kazi-orange font-bold text-sm mt-0.5">KSh {job.pay.toLocaleString()} · {job.payType}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[job.status] || "bg-gray-100 text-gray-600"}`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>{job.location}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {job.workersHired}/{job.workersNeeded} hired
                    </span>
                    <span>{job._count?.applications || 0} applicants</span>
                    <span>{new Date(job.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => loadApplications(job.id)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    {expandedJob === job.id ? "Hide" : "View"} Applications ({job._count?.applications || 0})
                  </button>
                </div>

                {/* Applications */}
                {expandedJob === job.id && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {!applications[job.id] ? (
                      <div className="p-4 text-center">
                        <div className="w-5 h-5 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : applications[job.id].length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">No applications yet</div>
                    ) : (
                      applications[job.id].map((app) => (
                        <div key={app.id} className="p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                              <p className="font-bold text-kazi-dark text-sm">{app.worker?.name}</p>
                              <p className="text-gray-400 text-xs">{app.worker?.workerProfile?.skills || "—"}</p>
                              {app.workerNote && <p className="text-gray-500 text-xs mt-1 italic">"{app.workerNote}"</p>}
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${APP_STATUS_STYLE[app.status] || "bg-gray-100 text-gray-600"}`}>
                              {app.status}
                            </span>
                          </div>

                          {app.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => hireOrDecline(app.id, "hire", job.id)}
                                disabled={actioning === app.id}
                                className="flex-1 py-2 bg-green-500 text-white font-bold rounded-xl text-xs disabled:opacity-60 flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Hire
                              </button>
                              <button
                                onClick={() => hireOrDecline(app.id, "decline", job.id)}
                                disabled={actioning === app.id}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs disabled:opacity-60 flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Decline
                              </button>
                            </div>
                          )}

                          {app.status === "COMPLETED" && app.paymentStatus !== "PAID" && (
                            <button
                              onClick={() => confirmPay(app.id, job.id)}
                              disabled={actioning === app.id}
                              className="w-full py-2 bg-kazi-orange text-white font-black rounded-xl text-xs disabled:opacity-60"
                            >
                              {actioning === app.id ? "Processing…" : `💳 Confirm Payment — KSh ${Math.round(job.pay * 0.9).toLocaleString()}`}
                            </button>
                          )}

                          {app.paymentStatus === "PAID" && (
                            <p className="text-green-600 text-xs font-bold">✅ Paid — KSh {app.paymentAmount?.toLocaleString()}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
