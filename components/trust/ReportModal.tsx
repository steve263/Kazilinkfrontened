"use client";
import { useState } from "react";
import { X, Flag, AlertTriangle, ChevronDown, Send, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { ReportReason } from "@/lib/data";

interface ReportModalProps {
  targetId: string;
  targetName: string;
  targetType: "provider" | "customer";
  onClose: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "fraud", label: "Fraud / Scam", description: "Took money without providing service" },
  { value: "fake_profile", label: "Fake Profile", description: "Photos or identity appear to be fake" },
  { value: "no_show", label: "No-Show", description: "Confirmed booking but never arrived" },
  { value: "harassment", label: "Harassment", description: "Threatening, abusive, or inappropriate behaviour" },
  { value: "fake_reviews", label: "Fake Reviews", description: "Reviews appear to be fabricated or manipulated" },
  { value: "overcharging", label: "Overcharging", description: "Charged more than the agreed price" },
  { value: "impersonation", label: "Impersonation", description: "Claiming to be someone else or another business" },
  { value: "other", label: "Other", description: "Something else not listed above" },
];

export default function ReportModal({ targetId, targetName, targetType, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = reason && description.length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-kazi-dark text-base">Report {targetType === "provider" ? "Provider" : "Customer"}</h2>
              <p className="text-sm text-gray-500">{targetName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="flex flex-col items-center py-6 animate-slide-up">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-9 h-9 text-kazi-green" fill="#00C896" />
              </div>
              <h3 className="text-lg font-black text-kazi-dark mb-2">Report Submitted</h3>
              <p className="text-sm text-gray-500 text-center mb-2 leading-relaxed">
                Thank you for helping keep KaziShow safe. Our team will review your report within 24 hours.
              </p>
              <p className="text-xs text-gray-400 text-center mb-6">
                Report ID: <span className="font-mono font-semibold text-kazi-dark">REP-{Date.now().toString().slice(-6)}</span>
              </p>
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  False reports may result in your account being reviewed. Only report genuine violations.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-kazi-dark mb-2">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`w-full flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                        reason === r.value
                          ? "border-red-400 bg-red-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all ${reason === r.value ? "border-red-400" : "border-gray-300"}`}>
                        {reason === r.value && <div className="w-2 h-2 bg-red-400 rounded-full" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-kazi-dark">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-kazi-dark mb-2">
                  Describe what happened <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Please describe the incident in detail — what happened, when, and any relevant information…"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all"
                />
                <p className={`text-xs mt-1 text-right ${description.length >= 20 ? "text-kazi-green" : "text-gray-400"}`}>
                  {description.length}/20 min
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                ) : (
                  <><Send className="w-5 h-5" /> Submit Report</>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Your identity will remain confidential. We take all reports seriously.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
