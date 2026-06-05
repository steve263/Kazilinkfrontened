"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EmployerApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [job, setJob]               = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [token, setToken]           = useState("");
  const [acting, setActing]         = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    if (!t) { router.push("/auth/login"); return; }
    setToken(t);
    fetchApplicants(t);
  }, []);

  async function fetchApplicants(t: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/jobs/employer/jobs/${params.jobId}/applicants`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const data = await res.json();
      if (data.success) {
        setApplicants(data.data.applications);
        setJob(data.data.job);
      } else {
        toast.error(data.message || "Failed to load");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleHire(appId: string) {
    setActing(appId + "_hire");
    try {
      const res = await fetch(
        `${API}/api/jobs/employer/applications/${appId}/hire`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("🎉 Hired! SMS sent to worker.");
        fetchApplicants(token);
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActing(null);
    }
  }

  async function handleDecline(appId: string) {
    setActing(appId + "_reject");
    try {
      const res = await fetch(
        `${API}/api/jobs/employer/applications/${appId}/reject`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Declined. Worker notified.");
        fetchApplicants(token);
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActing(null);
    }
  }

  const pending  = applicants.filter((a) => a.status === "PENDING");
  const hired    = applicants.filter((a) => a.status === "HIRED");
  const declined = applicants.filter((a) => a.status === "DECLINED");

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 mb-3 text-sm hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">👥 Applicants</h1>
        {job && (
          <p className="text-white/60 text-sm mt-1">{job.title} · {job.location}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Total",    value: applicants.length,   color: "text-white"      },
            { label: "Review",   value: pending.length,      color: "text-kazi-orange"},
            { label: "Hired",    value: hired.length,        color: "text-green-400"  },
            { label: "Declined", value: declined.length,     color: "text-red-400"    },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">

        {/* Role note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-700 font-black text-sm">⚡ Your Role as Employer</p>
          <p className="text-amber-600 text-xs mt-1 leading-relaxed">
            Only applicants whose Equity payment has been verified by admin appear here.
            You can hire or decline each applicant.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-3">⏳</div>
            <p className="font-black text-kazi-dark text-lg">No verified applicants yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Applicants appear here once admin verifies their Equity payment
            </p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-black text-kazi-orange uppercase tracking-widest mb-3">
                  ⏳ Awaiting Your Decision ({pending.length})
                </p>
                <div className="space-y-3">
                  {pending.map((app) => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      job={job}
                      type="pending"
                      acting={acting}
                      onHire={() => handleHire(app.id)}
                      onDecline={() => handleDecline(app.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hired */}
            {hired.length > 0 && (
              <div>
                <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-3">
                  ✅ Hired by You ({hired.length})
                </p>
                <div className="space-y-3">
                  {hired.map((app) => (
                    <ApplicantCard key={app.id} app={app} job={job} type="hired" acting={null} onHire={() => {}} onDecline={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {/* Declined */}
            {declined.length > 0 && (
              <div>
                <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-3">
                  ❌ Declined by You ({declined.length})
                </p>
                <div className="space-y-3">
                  {declined.map((app) => (
                    <ApplicantCard key={app.id} app={app} job={job} type="declined" acting={null} onHire={() => {}} onDecline={() => {}} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ApplicantCard({
  app, job, type, acting, onHire, onDecline,
}: {
  app: any;
  job: any;
  type: "pending" | "hired" | "declined";
  acting: string | null;
  onHire: () => void;
  onDecline: () => void;
}) {
  const waNumber = app.applicantPhone?.replace(/^0/, "254").replace(/\s/g, "");

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 ${
      type === "hired"    ? "border-green-200" :
      type === "declined" ? "border-red-100"   : "border-gray-100"
    }`}>
      {type !== "pending" && (
        <div className={`px-4 py-1.5 text-xs font-black ${
          type === "hired" ? "bg-green-500 text-white" : "bg-red-400 text-white"
        }`}>
          {type === "hired" ? "🎉 You hired this worker — SMS sent" : "❌ You declined — SMS sent"}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Name + phone */}
        <div className="flex items-center gap-3">
          <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0 ${
            type === "hired" ? "bg-green-500" : type === "declined" ? "bg-gray-400" : "bg-kazi-orange"
          }`}>
            {(app.applicantName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-black text-kazi-dark text-lg">{app.applicantName || "—"}</p>
            <button
              onClick={() => window.open(`tel:${app.applicantPhone}`)}
              className="flex items-center gap-1.5 text-kazi-orange font-bold text-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              {app.applicantPhone}
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(app.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
          </span>
        </div>

        {/* About */}
        {app.applicantBio && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-black text-gray-400 uppercase mb-1">About</p>
            <p className="text-gray-600 text-sm leading-relaxed">{app.applicantBio}</p>
          </div>
        )}

        {/* Fee */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
          <span className="text-gray-500 text-sm">Application fee paid</span>
          <span className="font-black text-kazi-orange">KSh {app.applicationFee || 100}</span>
        </div>

        {/* Contact */}
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`tel:${app.applicantPhone}`)}
            className="flex-1 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1"
          >
            📞 Call
          </button>
          <button
            onClick={() => window.open(`https://wa.me/${waNumber}`, "_blank")}
            className="flex-1 py-2.5 bg-green-50 border border-green-200 text-green-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1"
          >
            💬 WhatsApp
          </button>
        </div>

        {/* Actions */}
        {type === "pending" && (
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              disabled={acting === app.id + "_reject"}
              className="flex-1 py-3 bg-red-50 border-2 border-red-200 text-red-600 font-black rounded-2xl text-sm disabled:opacity-60"
            >
              {acting === app.id + "_reject" ? "Declining..." : "❌ Decline"}
            </button>
            <button
              onClick={onHire}
              disabled={acting === app.id + "_hire"}
              className="flex-1 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm disabled:opacity-60 shadow-md shadow-orange-200"
            >
              {acting === app.id + "_hire" ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Hiring...
                </span>
              ) : "✅ Hire"}
            </button>
          </div>
        )}

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
