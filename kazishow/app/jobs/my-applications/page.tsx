"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, CheckCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  HIRED:     "bg-green-100 text-green-700",
  DECLINED:  "bg-red-100 text-red-600",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token") || "";
    if (!token) { router.push("/auth/login"); return; }
    fetch(`${API}/api/jobs/worker/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setApps(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function markComplete(appId: string) {
    const token = localStorage.getItem("kazishow_token") || "";
    setCompleting(appId);
    try {
      const res = await fetch(`${API}/api/jobs/applications/${appId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Job marked as complete! Employer will pay via M-Pesa.");
        setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: "COMPLETED" } : a));
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    }
    setCompleting(null);
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 mb-4 text-sm hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">📋 My Applications</h1>
        <p className="text-white/50 text-sm mt-1">{apps.length} application{apps.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-black text-kazi-dark text-lg">No applications yet</p>
            <p className="text-gray-400 text-sm mt-2 mb-5">Start applying for jobs to see them here</p>
            <Link href="/jobs" className="px-6 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => {
              const job = app.job;
              const workerPay = Math.round((job?.pay || 0) * 0.9);
              return (
                <div key={app.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-kazi-dark text-base leading-tight">{job?.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {job?.employer?.employerProfile?.companyName || "Private"}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[app.status] || "bg-gray-100 text-gray-600"}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" /> {job?.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {job?.startDate && new Date(job.startDate).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <span className="text-xs font-black text-kazi-orange">KSh {workerPay.toLocaleString()} net</span>
                    </div>

                    {app.status === "HIRED" && (
                      <div className="mt-3 bg-green-50 rounded-xl p-3">
                        <p className="text-green-700 text-sm font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> You are hired! Report as scheduled.
                        </p>
                        {job?.address && <p className="text-green-600 text-xs mt-1">Address: {job.address}</p>}
                      </div>
                    )}

                    {app.paymentStatus === "PAID" && (
                      <div className="mt-3 bg-blue-50 rounded-xl p-3">
                        <p className="text-blue-700 text-sm font-bold">
                          ✅ Paid — KSh {app.paymentAmount?.toLocaleString()}
                          {app.mpesaRef && ` (${app.mpesaRef})`}
                        </p>
                      </div>
                    )}
                  </div>

                  {app.status === "HIRED" && app.paymentStatus !== "PAID" && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => markComplete(app.id)}
                        disabled={completing === app.id}
                        className="w-full py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
                      >
                        {completing === app.id ? "Marking…" : "✅ Mark Job as Complete"}
                      </button>
                    </div>
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
