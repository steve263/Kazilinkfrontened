"use client";
import { useState } from "react";
import { X, AlertTriangle, Flag } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const REPORT_TYPES = [
  { value: "FAKE_PROVIDER",  label: "Fake Provider",   emoji: "🎭" },
  { value: "NO_SHOW",        label: "Did Not Show Up", emoji: "🚶" },
  { value: "POOR_QUALITY",   label: "Poor Quality",    emoji: "👎" },
  { value: "OVERCHARGING",   label: "Overcharging",    emoji: "💸" },
  { value: "HARASSMENT",     label: "Harassment",      emoji: "⚠️" },
  { value: "FAKE_REVIEWS",   label: "Fake Reviews",    emoji: "⭐" },
  { value: "PAYMENT_FRAUD",  label: "Payment Fraud",   emoji: "💳" },
  { value: "SCAM",           label: "Scam",            emoji: "🚨" },
  { value: "OTHER",          label: "Other",           emoji: "📝" },
];

interface Props {
  reportedId: string;
  reportedName: string;
  bookingId?: string;
  onClose: () => void;
}

export default function ReportModal({ reportedId, reportedName, bookingId, onClose }: Props) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!type) { toast.error("Please select a report type"); return; }
    if (description.length < 20) { toast.error("Please provide more details (min 20 characters)"); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/trust/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reportedId, type, description, bookingId: bookingId || null }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); }
      else { toast.error(data.message || "Failed to submit report"); }
    } catch {
      toast.error("Cannot connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Fixed header */}
        <div className="bg-red-500 p-5 text-white flex items-center justify-between rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3">
            <Flag className="w-6 h-6" />
            <div>
              <h2 className="font-black text-lg">Report User</h2>
              <p className="text-red-100 text-sm">{reportedName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-black text-kazi-dark text-xl mb-2">Report Submitted!</h3>
            <p className="text-gray-500 text-sm mb-6">
              Our team will review your report within 24 hours. Thank you for keeping KaziShow safe!
            </p>
            <button onClick={onClose} className="w-full py-3 bg-kazi-orange text-white font-bold rounded-2xl">
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <p className="font-bold text-kazi-dark text-sm mb-3">What is the issue?</p>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setType(rt.value)}
                      className={`p-3 rounded-xl text-left text-sm transition-all border-2 ${
                        type === rt.value
                          ? "border-red-400 bg-red-50 text-red-700 font-bold"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-red-200"
                      }`}
                    >
                      <span className="text-lg block mb-1">{rt.emoji}</span>
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-kazi-dark text-sm mb-2">Describe what happened</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about the issue..."
                  rows={4}
                  maxLength={500}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{description.length}/500 characters (min 20)</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  False reports may result in your account being penalized. Only report genuine violations.
                </p>
              </div>
            </div>

            {/* Pinned submit button */}
            <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl shrink-0">
              <button
                onClick={handleSubmit}
                disabled={submitting || !type || description.length < 20}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><Flag className="w-4 h-4" /> Submit Report</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
