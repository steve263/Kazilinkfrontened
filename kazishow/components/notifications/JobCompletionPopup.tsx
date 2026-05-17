"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface JobCompletionData {
  bookingId: string;
  providerName: string;
  providerPhoto?: string;
  serviceName: string;
  amount: number;
  providerAmount: number;
  message: string;
}

interface Props {
  data: JobCompletionData;
  onClose: () => void;
}

type Step = "confirm" | "dispute" | "done" | "disputed";

export default function JobCompletionPopup({ data, onClose }: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [disputeReason, setDisputeReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleConfirmYes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/bookings/${data.bookingId}/confirm-complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setStep("done");
        setTimeout(onClose, 3500);
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason || disputeReason.trim().length < 10) {
      toast.error("Please explain the problem in detail (minimum 10 characters)");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/bookings/${data.bookingId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: disputeReason }),
      });
      const result = await res.json();
      if (result.success) {
        setStep("disputed");
        setTimeout(onClose, 4000);
      } else {
        toast.error(result.message || "Failed to submit dispute");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUp 0.3s ease-out" }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(60px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* ── CONFIRM STEP ─────────────────────────────────────────────────── */}
        {step === "confirm" && (
          <>
            <div className="bg-kazi-orange px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <p className="text-white text-xs font-bold opacity-80">LIVE UPDATE</p>
                </div>
                <div className="bg-white/20 px-2 py-0.5 rounded-full">
                  <p className="text-white text-xs font-bold">⏰ {formatTime(countdown)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  {data.providerPhoto ? (
                    <img
                      src={data.providerPhoto}
                      className="w-full h-full object-cover object-top"
                      alt={data.providerName}
                    />
                  ) : (
                    <span className="text-white font-black text-xl">
                      {data.providerName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">{data.providerName}</p>
                  <p className="text-white/80 text-sm">says the job is complete! ✅</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Service</span>
                  <span className="font-bold text-kazi-dark text-sm">{data.serviceName}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="text-gray-500 text-sm">Amount to Release</span>
                  <span className="font-black text-kazi-orange text-xl">
                    KSh {data.amount?.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="font-black text-kazi-dark text-center text-lg mb-1">
                Did {data.providerName} complete the job satisfactorily?
              </p>
              <p className="text-gray-400 text-xs text-center mb-6">
                If yes, KSh {data.providerAmount?.toLocaleString()} will be released to {data.providerName}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("dispute")}
                  className="flex-1 py-4 bg-red-50 border-2 border-red-200 text-red-500 font-black rounded-2xl flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  No — Dispute
                </button>
                <button
                  onClick={handleConfirmYes}
                  disabled={loading}
                  className="flex-1 py-4 bg-kazi-orange text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle className="w-5 h-5" />
                  {loading ? "..." : "Yes — Done!"}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-3">
                Payment auto-releases in 24 hours if no response
              </p>
            </div>
          </>
        )}

        {/* ── DISPUTE STEP ─────────────────────────────────────────────────── */}
        {step === "dispute" && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep("confirm")}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold"
              >
                ←
              </button>
              <div>
                <h3 className="font-black text-kazi-dark text-lg">Report a Problem</h3>
                <p className="text-gray-400 text-xs">Tell us what went wrong</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-700 font-bold text-sm">Payment will be held</p>
                <p className="text-amber-600 text-xs mt-0.5">
                  KSh {data.amount?.toLocaleString()} will be held safely until KaziShow admin reviews and resolves this dispute.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                What is the problem?
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Example: The work was not completed properly. The wiring is still not working and the provider left without finishing..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm h-32 resize-none focus:outline-none focus:border-kazi-orange"
              />
              <p className={`text-xs mt-1 text-right ${disputeReason.length < 10 ? "text-red-400" : "text-green-500"}`}>
                {disputeReason.length} characters (minimum 10)
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 mb-5">
              <p className="text-blue-700 text-xs font-bold mb-1">What happens next:</p>
              {[
                "Admin receives your dispute immediately",
                `Admin contacts both you and ${data.providerName}`,
                "Admin resolves within 24 hours",
                "Payment released or refunded accordingly",
              ].map((item, i) => (
                <p key={i} className="text-blue-600 text-xs">{i + 1}. {item}</p>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDispute}
                disabled={loading || disputeReason.trim().length < 10}
                className="flex-1 py-3 bg-red-500 text-white font-black rounded-2xl text-sm disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Dispute"}
              </button>
            </div>
          </div>
        )}

        {/* ── DONE STEP ────────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-black text-kazi-dark text-2xl mb-2">Payment Released!</h3>
            <p className="text-gray-500 text-sm mb-4">
              KSh {data.providerAmount?.toLocaleString()} has been released to {data.providerName}. Thank you!
            </p>
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-green-600 text-sm font-semibold">
                ⭐ Please rate your experience with {data.providerName}
              </p>
            </div>
          </div>
        )}

        {/* ── DISPUTED STEP ────────────────────────────────────────────────── */}
        {step === "disputed" && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-black text-kazi-dark text-xl mb-2">Dispute Submitted!</h3>
            <p className="text-gray-500 text-sm mb-4">
              Admin has been notified and will review your case within 24 hours.
            </p>
            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-amber-600 text-sm font-semibold">
                💰 KSh {data.amount?.toLocaleString()} is held safely until the dispute is resolved.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
