"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MapPin, Clock, Users, Star, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [note, setNote] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    const raw = localStorage.getItem("kazishow_user");
    setToken(t);
    if (raw) try { setUser(JSON.parse(raw)); } catch {}
    fetchJob();
  }, []);

  async function fetchJob() {
    try {
      const res = await fetch(`${API}/api/jobs/${params.id}`);
      const data = await res.json();
      if (data.success) setJob(data.data);
    } catch {}
    setLoading(false);
  }

  async function handleApply() {
    if (!token) { router.push("/auth/login"); return; }
    setApplying(true);
    try {
      const res = await fetch(`${API}/api/jobs/${params.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workerNote: note }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Application submitted! 🎉");
        setShowApply(false);
        router.push("/jobs/my-applications");
      } else {
        toast.error(data.message || "Failed to apply");
      }
    } catch {
      toast.error("Network error — please try again");
    }
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!job) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-gray-500 font-bold">Job not found</p>
          <button onClick={() => router.back()} className="mt-4 text-kazi-orange text-sm font-bold">← Back</button>
        </div>
      </div>
    );
  }

  const spotsLeft = job.workersNeeded - job.workersHired;
  const workerPay = Math.round(job.pay * 0.9);

  return (
    <div className="min-h-screen bg-kazi-cream pb-32">
      <Toaster position="top-center" />

      {/* Header */}
      <div className={`px-4 pt-12 pb-6 ${job.isUrgent ? "bg-red-600" : "bg-kazi-dark"}`}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 mb-4 text-sm hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {job.isUrgent && (
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-black tracking-widest">URGENT JOB</span>
          </div>
        )}
        <h1 className="text-white font-black text-2xl leading-tight">{job.title}</h1>
        <p className="text-white/60 text-sm mt-1">
          {job.employer?.employerProfile?.companyName || "Private employer"}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

        {/* Pay + key info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Total pay</p>
              <p className="font-black text-kazi-orange text-3xl">KSh {job.pay.toLocaleString()}</p>
              <p className="text-gray-400 text-xs">{job.payType}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-0.5">You receive</p>
              <p className="font-black text-green-600 text-2xl">KSh {workerPay.toLocaleString()}</p>
              <p className="text-gray-400 text-xs">after 10% KaziShow fee</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Location", val: job.location, icon: MapPin },
              { label: "Start", val: new Date(job.startDate).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" }), icon: Clock },
              { label: "Spots left", val: `${spotsLeft} of ${job.workersNeeded}`, icon: Users },
              { label: "Duration", val: job.duration, icon: null },
            ].map(({ label, val, icon: Icon }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <p className="font-bold text-kazi-dark text-sm flex items-center gap-1">
                  {Icon && <Icon className="w-3.5 h-3.5 text-kazi-orange flex-shrink-0" />}
                  {val}
                </p>
              </div>
            ))}
          </div>

          {job.address && (
            <div className="mt-3 bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Exact address</p>
              <p className="text-sm font-bold text-kazi-dark">{job.address}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-black text-kazi-dark text-base mb-3">About this job</h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-kazi-dark text-base mb-3">Requirements</h3>
            <div className="space-y-2">
              {job.requirements.split("\n").filter(Boolean).map((req: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600 text-sm">{req}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills wanted */}
        {job.skills && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-kazi-dark text-base mb-3">Skills needed</h3>
            <p className="text-gray-600 text-sm">{job.skills}</p>
          </div>
        )}

        {/* Employer */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-black text-kazi-dark text-base mb-3">About the Employer</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center font-black text-kazi-orange text-xl">
              {(job.employer?.employerProfile?.companyName || "P").charAt(0)}
            </div>
            <div>
              <p className="font-black text-kazi-dark">{job.employer?.employerProfile?.companyName || "Private"}</p>
              {job.employer?.employerProfile?.rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold">{job.employer.employerProfile.rating.toFixed(1)}</span>
                </div>
              )}
              {job.employer?.employerProfile?.totalJobsPosted > 0 && (
                <p className="text-xs text-gray-400">{job.employer.employerProfile.totalJobsPosted} jobs posted</p>
              )}
            </div>
          </div>
        </div>

        {/* Spots warning */}
        {spotsLeft > 0 && spotsLeft <= 2 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm font-bold">
              Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left! Apply before it fills up.
            </p>
          </div>
        )}
      </div>

      {/* Apply bottom sheet */}
      {showApply && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-black text-kazi-dark text-xl mb-1">Apply for this job</h3>
            <p className="text-gray-400 text-sm mb-4">{job.title} · You receive KSh {workerPay.toLocaleString()}</p>

            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell the employer why you are the right person for this job…"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange resize-none mb-4 transition-colors"
            />

            <div className="flex gap-3">
              <button onClick={() => setShowApply(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">
                Cancel
              </button>
              <button onClick={handleApply} disabled={applying} className="flex-1 py-3 bg-kazi-orange text-white font-black rounded-2xl disabled:opacity-60">
                {applying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Applying…
                  </span>
                ) : "Apply Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-lg mx-auto">
        {spotsLeft <= 0 ? (
          <button disabled className="w-full py-4 bg-gray-200 text-gray-400 font-black rounded-2xl text-base">
            Job Fully Filled
          </button>
        ) : (
          <button
            onClick={() => { if (!token) { router.push("/auth/login"); return; } setShowApply(true); }}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-base shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform"
          >
            Apply — KSh {workerPay.toLocaleString()} net pay
          </button>
        )}
      </div>
    </div>
  );
}
