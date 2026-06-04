"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  "https://kazishow-backend-production.up.railway.app";

export default function EmployerApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    if (!t) { router.push("/auth/login"); return; }
    setToken(t);
    fetchApplicants(t);
  }, []);

  const fetchApplicants = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/jobs/${params.jobId}/applications`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      const data = await res.json();
      if (data.success) setApplicants(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async (appId: string) => {
    setActing(appId);
    try {
      const res = await fetch(
        `${API_URL}/api/jobs/applications/${appId}/hire`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Worker hired! 🎉");
        fetchApplicants(token);
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (appId: string) => {
    setActing(appId);
    try {
      const res = await fetch(
        `${API_URL}/api/jobs/applications/${appId}/decline`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Applicant declined");
        fetchApplicants(token);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActing(null);
    }
  };

  const verifiedApplicants = applicants.filter((a) => a.paymentStatus === "PAYMENT_VERIFIED" && a.status !== "HIRED" && a.status !== "DECLINED");
  const pendingApplicants  = applicants.filter((a) => a.paymentStatus === "PENDING_VERIFICATION");
  const hiredApplicants    = applicants.filter((a) => a.status === "HIRED");
  const declinedApplicants = applicants.filter((a) => a.status === "DECLINED");

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-3 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-black text-2xl">👥 Applicants</h1>
        <p className="text-white/50 text-sm mt-1">Review and hire workers for your job</p>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total",    value: applicants.length,        color: "text-kazi-dark"  },
            { label: "Ready",    value: verifiedApplicants.length, color: "text-green-600" },
            { label: "Hired",    value: hiredApplicants.length,    color: "text-blue-600"  },
            { label: "Declined", value: declinedApplicants.length, color: "text-red-500"   },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <p className={`font-black text-xl ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Role note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-700 font-black text-sm">⚡ Your Role as Employer</p>
          <p className="text-amber-600 text-xs mt-1 leading-relaxed">
            Only applicants whose payment has been verified by KaziShow admin will appear
            here for you to review. You can hire or decline each applicant.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Ready to review */}
            {verifiedApplicants.length > 0 && (
              <div>
                <h3 className="font-black text-kazi-dark text-base mb-3">
                  ✅ Ready to Review ({verifiedApplicants.length})
                </h3>
                <div className="space-y-3">
                  {verifiedApplicants.map((app) => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      showActions
                      acting={acting}
                      onHire={() => handleHire(app.id)}
                      onDecline={() => handleDecline(app.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hired */}
            {hiredApplicants.length > 0 && (
              <div>
                <h3 className="font-black text-kazi-dark text-base mb-3">
                  🎉 Hired ({hiredApplicants.length})
                </h3>
                <div className="space-y-3">
                  {hiredApplicants.map((app) => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      showActions={false}
                      acting={null}
                      onHire={() => {}}
                      onDecline={() => {}}
                      status="hired"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Declined */}
            {declinedApplicants.length > 0 && (
              <div>
                <h3 className="font-black text-kazi-dark text-base mb-3">
                  ❌ Declined ({declinedApplicants.length})
                </h3>
                <div className="space-y-3">
                  {declinedApplicants.map((app) => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      showActions={false}
                      acting={null}
                      onHire={() => {}}
                      onDecline={() => {}}
                      status="declined"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {verifiedApplicants.length === 0 && hiredApplicants.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">⏳</div>
                <p className="font-black text-kazi-dark text-lg">No applicants yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  {pendingApplicants.length > 0
                    ? `${pendingApplicants.length} applicant(s) waiting for payment verification by admin`
                    : "Applicants will appear here once they apply and admin verifies their payment"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ApplicantCard({
  app,
  showActions,
  acting,
  onHire,
  onDecline,
  status,
}: {
  app: any;
  showActions: boolean;
  acting: string | null;
  onHire: () => void;
  onDecline: () => void;
  status?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 ${
      status === "hired"
        ? "border-green-200"
        : status === "declined"
        ? "border-red-100"
        : "border-gray-100"
    }`}>
      {/* Status strip */}
      {status && (
        <div className={`px-4 py-1.5 text-xs font-black ${
          status === "hired" ? "bg-green-500 text-white" : "bg-red-50 text-red-600"
        }`}>
          {status === "hired" ? "🎉 You hired this worker" : "❌ You declined this applicant"}
        </div>
      )}

      <div className="p-4 space-y-3">

        {/* Name and phone */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-kazi-orange rounded-2xl flex items-center justify-center font-black text-white text-xl">
            {(app.applicantName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-black text-kazi-dark text-lg">{app.applicantName || "—"}</p>
            <button
              onClick={() => window.open(`tel:${app.applicantPhone}`)}
              className="text-kazi-orange font-bold text-sm flex items-center gap-1"
            >
              📞 {app.applicantPhone}
              <span className="text-xs text-gray-400">(tap to call)</span>
            </button>
          </div>
        </div>

        {/* About */}
        {app.applicantBio && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">About</p>
            <p className="text-gray-600 text-sm leading-relaxed">{app.applicantBio}</p>
          </div>
        )}

        {/* WhatsApp */}
        <button
          onClick={() =>
            window.open(
              `https://wa.me/${app.applicantPhone?.replace(/^0/, "254")?.replace(/\s/g, "")}`,
              "_blank"
            )
          }
          className="w-full py-2.5 bg-green-50 border border-green-200 text-green-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
        >
          💬 WhatsApp {app.applicantName}
        </button>

        {/* Hire / Decline */}
        {showActions && (
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              disabled={acting === app.id}
              className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-sm disabled:opacity-60"
            >
              ❌ Decline
            </button>
            <button
              onClick={onHire}
              disabled={acting === app.id}
              className="flex-1 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm disabled:opacity-60"
            >
              {acting === app.id ? "Hiring..." : "✅ Hire"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
