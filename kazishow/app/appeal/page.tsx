"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ChevronLeft, AlertTriangle, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const APPEAL_REASONS = [
  { value: "WRONG_SUSPENSION",       label: "I was wrongly suspended",       emoji: "❌" },
  { value: "MISUNDERSTANDING",       label: "It was a misunderstanding",      emoji: "🤝" },
  { value: "FIRST_OFFENSE",          label: "This is my first offense",       emoji: "🙏" },
  { value: "RESOLVED_ISSUE",         label: "I have resolved the issue",      emoji: "✅" },
  { value: "CUSTOMER_FALSE_REPORT",  label: "Customer made a false report",   emoji: "⚠️" },
  { value: "TECHNICAL_ERROR",        label: "It was a technical error",       emoji: "🔧" },
  { value: "OTHER",                  label: "Other reason",                   emoji: "📝" },
];

export default function AppealPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [appealReason, setAppealReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appealId, setAppealId] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/upload/public`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setEvidence((prev) => [...prev, data.data.url]);
        toast.success("Evidence uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!contactPhone) { toast.error("Please provide your phone number"); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/trust/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appealReason, explanation, evidence, contactPhone, contactEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setAppealId(data.data.appeal.id.slice(0, 8).toUpperCase());
        setSubmitted(true);
      } else {
        toast.error(data.message || "Failed to submit appeal");
      }
    } catch {
      toast.error("Cannot connect to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-kazi-dark flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-3">Appeal Submitted!</h2>
          <p className="text-white/50 text-sm mb-2">Your appeal ID is:</p>
          <p className="text-kazi-orange font-black text-3xl mb-6">#{appealId}</p>

          <div className="bg-white/5 rounded-2xl p-5 mb-6 text-left space-y-4">
            {[
              { icon: "📋", title: "What happens next?", desc: "Our team will review your appeal within 48 hours" },
              { icon: "📱", title: "You will be notified", desc: "Via SMS and push notification when a decision is made" },
              { icon: "💬", title: "Need urgent help?", desc: "WhatsApp: 0795542312 or 0731421635" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{item.title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-dark">
      {/* Header */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-black text-white text-lg">Appeal Suspension</h1>
          <p className="text-white/40 text-xs">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-white/10">
        <div className="h-1 bg-kazi-orange transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="p-5 max-w-lg mx-auto">

        {/* Step 1 — Reason */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-black text-xl mb-1">Why are you appealing?</h2>
              <p className="text-white/40 text-sm">Select the reason that best describes your situation</p>
            </div>
            <div className="space-y-2">
              {APPEAL_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setAppealReason(r.value)}
                  className={`w-full p-4 rounded-2xl text-left flex items-center gap-3 transition-all border-2 ${
                    appealReason === r.value
                      ? "border-kazi-orange bg-kazi-orange/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className={`font-semibold text-sm ${appealReason === r.value ? "text-kazi-orange" : "text-white/80"}`}>
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => (appealReason ? setStep(2) : toast.error("Please select a reason"))}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl mt-4"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Explanation + Evidence */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-white font-black text-xl mb-1">Tell us your story</h2>
              <p className="text-white/40 text-sm">Provide as much detail as possible to support your appeal</p>
            </div>

            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">
                Your Explanation *
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value.slice(0, 1000))}
                placeholder="Explain why you believe your account should be reinstated. Be honest and provide as much detail as possible..."
                rows={6}
                className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-kazi-orange resize-none transition-colors"
              />
              <div className="flex justify-between mt-1">
                <p className={`text-xs ${explanation.length < 50 ? "text-red-400" : "text-green-400"}`}>
                  {explanation.length < 50 ? `${50 - explanation.length} more characters needed` : "✓ Good length"}
                </p>
                <p className="text-xs text-white/30">{explanation.length}/1000</p>
              </div>
            </div>

            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">
                Supporting Evidence <span className="normal-case font-normal">(optional — up to 5 files)</span>
              </label>

              {evidence.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {evidence.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-xl" />
                      <button
                        onClick={() => setEvidence((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {evidence.length < 5 && (
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${uploading ? "border-kazi-orange" : "border-white/20 hover:border-kazi-orange"}`}>
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
                        <p className="text-white/50 text-sm">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-white/30" />
                        <p className="text-white/50 text-sm">Upload photos or documents ({evidence.length}/5)</p>
                        <p className="text-white/20 text-xs">Screenshots, photos, PDFs</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </div>

            <button
              onClick={() => (explanation.length >= 50 ? setStep(3) : toast.error("Please provide more details (at least 50 characters)"))}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 3 — Contact + Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-white font-black text-xl mb-1">Contact Details</h2>
              <p className="text-white/40 text-sm">How can we reach you about your appeal?</p>
            </div>

            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">Phone Number *</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                type="tel"
                className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-kazi-orange transition-colors"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">Email Address (Optional)</label>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                type="email"
                className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-kazi-orange transition-colors"
              />
            </div>

            {/* Summary */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-2">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Appeal Summary</p>
              {[
                { label: "Reason", value: APPEAL_REASONS.find((r) => r.value === appealReason)?.label },
                { label: "Explanation", value: `${explanation.length} characters` },
                { label: "Evidence", value: `${evidence.length} file(s)` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-white/40">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-200/70 text-xs leading-relaxed">
                By submitting this appeal you confirm all information is truthful and accurate. Providing false information may result in permanent suspension.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !contactPhone}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting Appeal...
                </>
              ) : (
                "Submit Appeal ⚖️"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
