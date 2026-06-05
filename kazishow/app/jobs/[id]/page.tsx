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
  const [token, setToken] = useState("");

  // Apply modal state
  const [showApply, setShowApply] = useState(false);
  const [applyStep, setApplyStep] = useState<"details" | "payment" | "success">("details");
  const [applicantForm, setApplicantForm] = useState({
    applicantName: "",
    applicantPhone: "",
    applicantBio: "",
  });
  const [mpesaRef, setMpesaRef] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    setToken(t);
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
        body: JSON.stringify({
          applicantName: applicantForm.applicantName,
          applicantPhone: applicantForm.applicantPhone,
          applicantBio: applicantForm.applicantBio,
          mpesaRef,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApplyStep("success");
      } else {
        toast.error(data.message || "Failed to apply");
      }
    } catch {
      toast.error("Network error — please try again");
    }
    setApplying(false);
  }

  function openApply() {
    if (!token) { router.push("/auth/login"); return; }
    setApplyStep("details");
    setApplicantForm({ applicantName: "", applicantPhone: "", applicantBio: "" });
    setMpesaRef("");
    setShowApply(true);
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
  const isFull = spotsLeft <= 0;
  const appFee = job.applicationFee || 100;

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
              <p className="text-gray-400 text-xs mb-0.5">Pay</p>
              <p className="font-black text-kazi-orange text-3xl">KSh {job.pay.toLocaleString()}</p>
              <p className="text-gray-400 text-xs">{job.payType} — full amount, no deduction</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-0.5">Application fee</p>
              <p className="font-black text-kazi-dark text-2xl">KSh {appFee}</p>
              <p className="text-gray-400 text-xs">paid to apply</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Location", val: job.location, icon: MapPin },
              { label: "Start", val: new Date(job.startDate).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" }), icon: Clock },
              { label: "Spots left", val: isFull ? "No Vacancy" : `${spotsLeft} of ${job.workersNeeded}`, icon: Users },
              { label: "Duration", val: job.duration, icon: null },
            ].map(({ label, val, icon: Icon }) => (
              <div key={label} className={`rounded-xl p-3 ${label === "Spots left" && isFull ? "bg-red-50" : "bg-slate-50"}`}>
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <p className={`font-bold text-sm flex items-center gap-1 ${label === "Spots left" && isFull ? "text-red-600" : "text-kazi-dark"}`}>
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

          {job.employerPhone && (
            <div className="mt-3 bg-blue-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Employer phone</p>
                <p className="text-sm font-bold text-kazi-dark">{job.employerPhone}</p>
              </div>
              <button
                onClick={() => window.open(`tel:${job.employerPhone}`)}
                className="bg-blue-500 text-white text-xs font-black px-3 py-2 rounded-xl"
              >
                📞 Call
              </button>
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
        {!isFull && spotsLeft <= 2 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm font-bold">
              Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left! Apply before it fills up.
            </p>
          </div>
        )}
      </div>

      {/* ── 3-STEP APPLY MODAL ─────────────────────────────────────────────────── */}
      {showApply && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* STEP 1 — WORKER DETAILS */}
            {applyStep === "details" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-kazi-dark text-xl">Apply for Job</h3>
                  <button
                    onClick={() => { setShowApply(false); setApplyStep("details"); }}
                    className="text-gray-400 text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Job summary */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                  <p className="font-black text-kazi-dark">{job.title}</p>
                  <p className="text-kazi-orange font-black text-lg mt-1">KSh {job.pay?.toLocaleString()} {job.payType}</p>
                  <p className="text-gray-400 text-xs mt-1">📍 {job.location}</p>
                </div>

                {/* Employer contact */}
                {job.employerPhone && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-5 flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-bold text-blue-700 text-sm">Have a question first?</p>
                      <button
                        onClick={() => window.open(`tel:${job.employerPhone}`)}
                        className="text-blue-600 font-black text-base"
                      >
                        Call {job.employerPhone}
                      </button>
                    </div>
                  </div>
                )}

                {/* Fields */}
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Your Full Name *
                    </label>
                    <input
                      value={applicantForm.applicantName}
                      onChange={(e) => setApplicantForm({ ...applicantForm, applicantName: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-kazi-orange"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Your Phone Number *
                    </label>
                    <input
                      value={applicantForm.applicantPhone}
                      onChange={(e) => setApplicantForm({ ...applicantForm, applicantPhone: e.target.value })}
                      placeholder="e.g. 0712345678"
                      type="tel"
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-kazi-orange"
                    />
                    <p className="text-xs text-gray-400 mt-1">The employer will call you on this number</p>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      About Yourself *
                    </label>
                    <textarea
                      value={applicantForm.applicantBio}
                      onChange={(e) => setApplicantForm({ ...applicantForm, applicantBio: e.target.value })}
                      placeholder={"Tell the employer about yourself...\n\nExample:\nI am John from Westlands.\nI have 3 years loading experience.\nI am available immediately.\nI am reliable and hardworking."}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!applicantForm.applicantName || !applicantForm.applicantPhone || !applicantForm.applicantBio) {
                      toast.error("Please fill all fields");
                      return;
                    }
                    setApplyStep("payment");
                  }}
                  className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg"
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* STEP 2 — PAYMENT */}
            {applyStep === "payment" && (
              <div className="p-6">
                <button
                  onClick={() => setApplyStep("details")}
                  className="text-gray-400 text-sm mb-4 flex items-center gap-1"
                >
                  ← Back
                </button>

                <h3 className="font-black text-kazi-dark text-xl mb-2">Pay Application Fee</h3>
                <p className="text-gray-500 text-sm mb-5">
                  Pay this fee to submit your application. Admin will review and approve it.
                </p>

                {/* Fee amount */}
                <div className="bg-kazi-orange rounded-3xl p-5 text-center mb-5">
                  <p className="text-white/80 text-sm mb-1">Application Fee</p>
                  <p className="text-white font-black text-5xl mb-1">KSh {appFee}</p>
                  <p className="text-white/60 text-xs">One time payment to apply</p>
                </div>

                {/* Payment instructions */}
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-5 mb-5 space-y-4">
                  <h4 className="font-black text-kazi-dark">📱 How to Pay</h4>
                  {[
                    { step: 1, text: "Open M-Pesa on your phone" },
                    { step: 2, text: "Go to Lipa Na M-Pesa → Pay Bill" },
                    { step: 3, label: "Paybill Number", value: "247247" },
                    { step: 4, label: "Account Number", value: "0795542312" },
                    { step: 5, label: "Amount", value: `KSh ${appFee}` },
                    { step: 6, text: "Enter PIN and confirm" },
                  ].map((item: any) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                        {item.step}
                      </div>
                      {item.label ? (
                        <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                          <span className="text-gray-400 text-xs">{item.label}</span>
                          <span className="font-black text-kazi-dark">{item.value}</span>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">{item.text}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Paste SMS */}
                <div className="mb-5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    Paste M-Pesa SMS Here *
                  </label>
                  <textarea
                    value={mpesaRef}
                    onChange={(e) => setMpesaRef(e.target.value)}
                    placeholder={`Paste the full M-Pesa SMS you received after paying KSh ${appFee}...\n\nExample:\nConfirmed. Payment of KES ${appFee} to KAZISHOW on 26-05-2026. Ref. XXXXXXXX. Thank you.`}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange resize-none"
                  />
                </div>

                <button
                  onClick={handleApply}
                  disabled={applying || mpesaRef.trim().length < 20}
                  className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60"
                >
                  {applying ? "Submitting..." : "✅ Submit Application"}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Admin reviews and approves within 1 hour
                </p>
              </div>
            )}

            {/* STEP 3 — SUCCESS */}
            {applyStep === "success" && (
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎉</span>
                </div>
                <h3 className="font-black text-kazi-dark text-2xl mb-2">Application Submitted!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Your application and payment have been submitted. Admin will review within 1 hour and the employer will call you if selected.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                  <p className="font-black text-amber-700 text-sm mb-2">What happens next:</p>
                  <p className="text-amber-600 text-xs">1. Admin verifies your M-Pesa payment</p>
                  <p className="text-amber-600 text-xs mt-1">2. Your application is approved</p>
                  <p className="text-amber-600 text-xs mt-1">3. Employer sees your details</p>
                  <p className="text-amber-600 text-xs mt-1">4. Employer calls you directly</p>
                </div>

                {job.employerPhone && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5">
                    <p className="text-green-700 font-bold text-sm">You can also call the employer:</p>
                    <button
                      onClick={() => window.open(`tel:${job.employerPhone}`)}
                      className="text-green-600 font-black text-xl mt-1"
                    >
                      📞 {job.employerPhone}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowApply(false);
                    setApplyStep("details");
                    router.push("/jobs");
                  }}
                  className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
                >
                  Browse More Jobs
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-lg mx-auto">
        {isFull ? (
          <button disabled className="w-full py-4 bg-gray-200 text-gray-400 font-black rounded-2xl text-base">
            🚫 No Vacancy — All Positions Filled
          </button>
        ) : (
          <button
            onClick={openApply}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-base shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform"
          >
            Apply Now — KSh {appFee} application fee
          </button>
        )}
      </div>
    </div>
  );
}
