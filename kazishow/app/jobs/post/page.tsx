"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Clock, Users, Zap,
  Briefcase, ChevronRight, ChevronLeft,
  Check, DollarSign, Calendar, FileText,
  Sparkles, Phone,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = [
  { value: "Loading and Moving",     emoji: "📦" },
  { value: "Cleaning",               emoji: "🧹" },
  { value: "Catering and Cooking",   emoji: "🍽️" },
  { value: "Security",               emoji: "🔒" },
  { value: "Events and Hospitality", emoji: "🎉" },
  { value: "Construction",           emoji: "🏗️" },
  { value: "Driving",                emoji: "🚗" },
  { value: "Gardening",              emoji: "🌿" },
  { value: "Childcare",              emoji: "👶" },
  { value: "Office Work",            emoji: "💼" },
  { value: "Sales and Promotions",   emoji: "📢" },
  { value: "Other",                  emoji: "⚡" },
];

const PAY_TYPES = [
  { value: "per day",  label: "Per Day",  emoji: "📅" },
  { value: "per hour", label: "Per Hour", emoji: "⏱️" },
  { value: "per job",  label: "Per Job",  emoji: "✅" },
  { value: "per week", label: "Per Week", emoji: "📆" },
];

const DURATIONS = [
  "Few hours", "1 day", "2 to 3 days",
  "1 week", "2 weeks", "1 month", "Ongoing",
];

const WORKERS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50];

const STEP_LABELS = ["Job Details", "Pay & Schedule", "Review & Post"];

export default function PostJobPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) {
      toast.error("Please log in to post a job");
      router.replace("/auth/login");
    }
  }, []);

  const [form, setForm] = useState({
    title: "", description: "", category: "",
    location: "", address: "", pay: "",
    payType: "per day", workersNeeded: "1",
    startDate: "", duration: "1 day",
    requirements: "", isUrgent: false,
    employerPhone: "",
    applicationFee: "100",
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const selectedCat = CATEGORIES.find((c) => c.value === form.category);

  function canNext() {
    if (step === 1) return !!(form.title && form.category && form.description);
    if (step === 2) return !!(form.location && form.pay && form.startDate && form.employerPhone);
    return true;
  }

  async function handleSubmit() {
    const token = localStorage.getItem("kazishow_token") || "";
    if (!token) {
      toast.error("Please log in to post a job");
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/jobs/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, payType: form.payType || "per day" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Job posted! 🎉");
        router.push(`/jobs/${data.data.id}`);
      } else {
        toast.error(data.message || "Failed to post");
      }
    } catch {
      toast.error("Network error — please try again");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-center" />

      {/* ── Hero Header ── */}
      <div className="bg-kazi-dark relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-kazi-orange/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-kazi-orange/5 rounded-full translate-y-20 -translate-x-10" />
        </div>

        <div className="relative px-4 pt-12 pb-6">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="flex items-center gap-1 text-white/60 text-sm mb-4 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 1 ? "Back" : "Cancel"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-kazi-orange rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/30">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl">Post a Job</h1>
              <p className="text-white/50 text-sm">Find the right workers fast</p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center">
            {[1, 2, 3].map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                    step > s ? "bg-green-500 text-white" :
                    step === s ? "bg-kazi-orange text-white shadow-lg shadow-orange-900/40" :
                    "bg-white/10 text-white/30"
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <p className={`text-[10px] font-bold whitespace-nowrap ${step >= s ? "text-white" : "text-white/30"}`}>
                    {STEP_LABELS[i]}
                  </p>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${step > s ? "bg-green-500" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto pb-32">

        {/* ── STEP 1 — JOB DETAILS ── */}
        {step === 1 && (
          <div className="space-y-4">

            {/* Title */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <FileText className="w-3.5 h-3.5 text-kazi-orange" /> Job Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Need 5 Loaders Today"
                className="w-full text-xl font-black text-kazi-dark placeholder-gray-200 border-0 outline-none bg-transparent"
              />
              <div className="mt-3 h-0.5 bg-gray-100 rounded" />
              <p className="text-xs text-gray-400 mt-2">Be specific — good titles get 3× more applications</p>
            </div>

            {/* Category grid */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                <Sparkles className="w-3.5 h-3.5 text-kazi-orange" /> Category *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => set("category", cat.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      form.category === cat.value
                        ? "border-kazi-orange bg-orange-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className={`text-xs font-bold text-center leading-tight ${
                      form.category === cat.value ? "text-kazi-orange" : "text-gray-600"
                    }`}>
                      {cat.value.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <FileText className="w-3.5 h-3.5 text-kazi-orange" /> Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={"Describe the work clearly...\n\nWhat workers will do\nWhat to bring or wear\nAny special requirements"}
                rows={5}
                className="w-full text-sm text-gray-700 placeholder-gray-300 border-0 outline-none bg-transparent resize-none leading-relaxed"
              />
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <Check className="w-3.5 h-3.5 text-kazi-orange" /> Requirements
              </label>
              <textarea
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
                placeholder={"One per line:\nMust have valid Kenyan ID\nMust be physically fit\nMust be punctual"}
                rows={4}
                className="w-full text-sm text-gray-700 placeholder-gray-300 border-0 outline-none bg-transparent resize-none leading-relaxed"
              />
            </div>

            {/* Urgent toggle */}
            <button
              onClick={() => set("isUrgent", !form.isUrgent)}
              className={`w-full rounded-3xl p-5 flex items-center justify-between transition-all active:scale-[0.99] ${
                form.isUrgent ? "bg-red-500 shadow-lg shadow-red-200" : "bg-white shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${form.isUrgent ? "bg-white/20" : "bg-red-50"}`}>
                  <Zap className={`w-5 h-5 ${form.isUrgent ? "text-white" : "text-red-500"}`} />
                </div>
                <div className="text-left">
                  <p className={`font-black text-base ${form.isUrgent ? "text-white" : "text-kazi-dark"}`}>
                    Mark as Urgent
                  </p>
                  <p className={`text-xs ${form.isUrgent ? "text-white/70" : "text-gray-400"}`}>
                    Gets 3× more applications faster
                  </p>
                </div>
              </div>
              <div className={`w-14 h-7 rounded-full transition-all relative ${form.isUrgent ? "bg-white/30" : "bg-gray-200"}`}>
                <div className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all ${form.isUrgent ? "bg-white translate-x-7" : "bg-white translate-x-0.5"}`} />
              </div>
            </button>
          </div>
        )}

        {/* ── STEP 2 — PAY & SCHEDULE ── */}
        {step === 2 && (
          <div className="space-y-4">

            {/* Location */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <MapPin className="w-3.5 h-3.5 text-kazi-orange" /> Location *
              </label>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Area / Estate in Nairobi"
                className="w-full text-lg font-bold text-kazi-dark placeholder-gray-200 border-0 outline-none bg-transparent mb-3"
              />
              <div className="h-0.5 bg-gray-100 rounded mb-3" />
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Exact address or landmark (optional)"
                className="w-full text-sm text-gray-500 placeholder-gray-300 border-0 outline-none bg-transparent"
              />
            </div>

            {/* Pay */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                <DollarSign className="w-3.5 h-3.5 text-kazi-orange" /> Pay Per Person *
              </label>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-gray-300 font-black text-3xl">KSh</span>
                <input
                  value={form.pay}
                  onChange={(e) => set("pay", e.target.value)}
                  placeholder="0"
                  type="number"
                  className="flex-1 text-4xl font-black text-kazi-dark placeholder-gray-200 border-0 outline-none bg-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                {PAY_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => set("payType", pt.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                      form.payType === pt.value
                        ? "bg-kazi-orange border-kazi-orange text-white shadow-sm"
                        : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    <span>{pt.emoji}</span> {pt.label}
                  </button>
                ))}
              </div>
              {form.pay && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-2">
                  <span className="text-green-500 text-lg">✅</span>
                  <div>
                    <p className="text-green-700 font-black text-sm">Workers receive full KSh {parseFloat(form.pay).toLocaleString()}</p>
                    <p className="text-green-600 text-xs">No commission cut from your side</p>
                  </div>
                </div>
              )}
            </div>

            {/* Workers needed */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                <Users className="w-3.5 h-3.5 text-kazi-orange" /> Workers Needed
              </label>
              <div className="flex gap-2 flex-wrap">
                {WORKERS_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => set("workersNeeded", n.toString())}
                    className={`w-12 h-12 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                      form.workersNeeded === n.toString()
                        ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Duration */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <Calendar className="w-3.5 h-3.5 text-kazi-orange" /> Start Date & Time *
              </label>
              <input
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                type="datetime-local"
                className="w-full text-base font-bold text-kazi-dark border-2 border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:border-kazi-orange mb-5 transition-colors"
              />

              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <Clock className="w-3.5 h-3.5 text-kazi-orange" /> Duration
              </label>
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => set("duration", d)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                      form.duration === d
                        ? "bg-kazi-orange border-kazi-orange text-white"
                        : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Employer phone */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <Phone className="w-3.5 h-3.5 text-kazi-orange" /> Your Phone Number *
              </label>
              <p className="text-xs text-gray-400 mb-3">Workers will use this to call you directly with questions</p>
              <input
                value={form.employerPhone}
                onChange={(e) => set("employerPhone", e.target.value)}
                placeholder="e.g. 0712345678"
                type="tel"
                className="w-full text-xl font-bold text-kazi-dark placeholder-gray-200 border-0 outline-none bg-transparent"
              />
            </div>

            {/* Application fee */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                <DollarSign className="w-3.5 h-3.5 text-kazi-orange" /> Application Fee (KaziShow charges workers)
              </label>
              <p className="text-xs text-gray-400 mb-3">Workers pay this small fee to apply. This is how KaziShow earns. You pay nothing.</p>
              <div className="flex gap-2 flex-wrap">
                {["50", "100", "150", "200"].map((fee) => (
                  <button
                    key={fee}
                    onClick={() => set("applicationFee", fee)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                      form.applicationFee === fee
                        ? "bg-kazi-orange border-kazi-orange text-white"
                        : "bg-gray-50 border-gray-100 text-gray-600"
                    }`}
                  >
                    KSh {fee}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 — REVIEW & POST ── */}
        {step === 3 && (
          <div className="space-y-4">

            {/* Live job preview */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-kazi-orange to-orange-600 p-5 relative overflow-hidden">
                <div className="absolute top-2 right-4 w-20 h-20 rounded-full border-2 border-white/20 pointer-events-none" />
                <div className="absolute top-6 right-10 w-10 h-10 rounded-full border border-white/15 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl border border-white/30">
                      {selectedCat?.emoji || "💼"}
                    </div>
                    {form.isUrgent && (
                      <div className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> URGENT
                      </div>
                    )}
                  </div>
                  <p className="text-white font-black text-xl leading-tight">{form.title || "Your Job Title"}</p>
                  <p className="text-white/70 text-sm mt-0.5">{form.category || "Category"}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Location",       val: `📍 ${form.location || "—"}` },
                    { label: "Workers",         val: `👥 ${form.workersNeeded} needed` },
                    { label: "Duration",        val: `⏱️ ${form.duration}` },
                    { label: "Pay per worker",  val: `KSh ${parseFloat(form.pay || "0").toLocaleString()}`, highlight: true },
                  ].map(({ label, val, highlight }) => (
                    <div key={label} className={`rounded-2xl p-3 ${highlight ? "bg-orange-50 border border-orange-100" : "bg-gray-50"}`}>
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className={`font-bold text-sm ${highlight ? "text-kazi-orange font-black" : "text-kazi-dark"}`}>{val}</p>
                    </div>
                  ))}
                </div>

                {form.description && (
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{form.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Job summary */}
            <div className="bg-kazi-dark rounded-3xl p-5">
              <p className="text-white font-black text-lg mb-4">📋 Job Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Pay per person</span>
                  <span className="text-green-400 font-black text-lg">
                    KSh {parseFloat(form.pay || "0").toLocaleString()} ✅
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Workers needed</span>
                  <span className="text-white font-bold">{form.workersNeeded} people</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Your phone (for questions)</span>
                  <span className="text-kazi-orange font-bold">{form.employerPhone || "Not added"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Application fee workers pay</span>
                  <span className="text-kazi-orange font-bold">KSh {form.applicationFee}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="bg-green-500/20 rounded-2xl p-3">
                  <p className="text-green-400 font-black text-sm">
                    ✅ You pay NOTHING to KaziShow. Workers pay the application fee.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-4">
              <p className="text-blue-700 font-black text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Tips for more applications
              </p>
              {[
                "Be specific about the work",
                "Mention if food or transport is provided",
                "State the exact location",
                "Mark as urgent for fastest response",
              ].map((tip) => (
                <p key={tip} className="text-blue-600 text-xs mb-1.5">✓ {tip}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-lg mx-auto">
        {step < 3 ? (
          <button
            onClick={() => {
              if (!canNext()) { toast.error("Please fill all required fields"); return; }
              setStep(step + 1);
            }}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60 shadow-lg shadow-orange-200 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Posting your job…
                </span>
              ) : "🚀 Post Job Now"}
            </button>
            <p className="text-center text-xs text-gray-400">
              Workers near {form.location || "Nairobi"} will be notified instantly
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
