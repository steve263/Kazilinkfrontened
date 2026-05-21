"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle, AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAYBILL = "247247";

export default function CommissionPaymentPage() {
  const router = useRouter();
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    setToken(t);
    fetchCommissions(t);
  }, []);

  const fetchCommissions = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/commission/outstanding`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        const commissions = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
        setPendingCommissions(commissions);
        if (commissions.length > 0) setSelected(commissions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    if (!mpesaCode || mpesaCode.trim().length < 8) {
      toast.error("Please enter a valid M-Pesa confirmation code");
      return;
    }
    if (!selected) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/commission/${selected.id}/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mpesaCode: mpesaCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Payment submitted! Admin will confirm shortly.");
        setMpesaCode("");
        fetchCommissions(token);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const accountRef = `KZS-${selected?.bookingId?.slice(0, 8).toUpperCase() ?? ""}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-right" />

      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-3 flex items-center gap-1 text-sm">
          ← Back
        </button>
        <h1 className="text-white font-black text-2xl">💰 Pay Commission</h1>
        <p className="text-white/50 text-sm mt-1">Pay your KaziShow commission to keep using the app</p>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {/* Always-visible Paybill info card */}
        <div className="bg-white rounded-2xl p-5 border-2 border-kazi-orange/20">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">KaziShow Paybill Details</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-kazi-cream rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Paybill Number</p>
              <p className="font-black text-kazi-dark text-2xl tracking-widest">247247</p>
            </div>
            <div className="flex-1 bg-kazi-cream rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Account</p>
              <p className="font-black text-kazi-dark text-sm">KZS-<span className="text-kazi-orange">BookingID</span></p>
              <p className="text-xs text-gray-400 mt-0.5">shown below per job</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            M-Pesa → Lipa Na M-Pesa → Pay Bill → enter details below
          </p>
        </div>

        {pendingCommissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-black text-kazi-dark text-xl">No Pending Commission</p>
            <p className="text-gray-400 text-sm mt-2">You are all caught up! Keep getting bookings.</p>
            <button
              onClick={() => router.push("/provider/notifications")}
              className="mt-4 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl"
            >
              View My Jobs
            </button>
          </div>
        ) : (
          <>
            {/* Selector when multiple commissions */}
            {pendingCommissions.length > 1 && (
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2">SELECT COMMISSION TO PAY</p>
                <div className="space-y-2">
                  {pendingCommissions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${selected?.id === c.id ? "border-kazi-orange bg-orange-50" : "border-gray-200"}`}
                    >
                      <p className="font-bold text-sm text-kazi-dark">{c.booking?.service?.name ?? "Service"}</p>
                      <p className="text-xs text-gray-400">KSh {c.commissionAmount?.toLocaleString()} commission · {c.status}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount due */}
            <div className="bg-kazi-orange rounded-3xl p-5 text-center">
              <p className="text-white/80 text-sm font-semibold mb-1">Commission Due to KaziShow</p>
              <p className="text-white font-black text-5xl mb-1">
                KSh {selected?.commissionAmount?.toLocaleString()}
              </p>
              <p className="text-white/60 text-xs">10% of KSh {selected?.cashAmount?.toLocaleString()} job</p>
              <div className="mt-3 bg-white/20 rounded-xl p-2">
                <p className="text-white text-xs font-semibold">
                  Job: {selected?.booking?.service?.name ?? "Service"} · Customer: {selected?.booking?.customer?.name ?? ""}
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">
                Your app will be blocked if commission is not paid within 24 hours of completing the job.
              </p>
            </div>

            {/* Step-by-step instructions */}
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <h3 className="font-black text-kazi-dark text-lg">📱 How to Pay</h3>

              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">1</div>
                <div>
                  <p className="font-bold text-kazi-dark text-sm">Open M-Pesa on your phone</p>
                  <p className="text-gray-400 text-xs mt-0.5">Go to M-Pesa → Lipa Na M-Pesa → Pay Bill</p>
                </div>
              </div>

              {/* Step 2 — Paybill */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">2</div>
                <div className="flex-1">
                  <p className="font-bold text-kazi-dark text-sm">Enter Business Number (Paybill)</p>
                  <button
                    onClick={() => copy(PAYBILL, "Paybill")}
                    className="mt-2 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-kazi-orange transition-all"
                  >
                    <div>
                      <p className="text-xs text-gray-400">Paybill Number</p>
                      <p className="font-black text-kazi-dark text-2xl tracking-wider">{PAYBILL}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${copied === "Paybill" ? "bg-green-100 text-green-600" : "bg-kazi-orange/10 text-kazi-orange"}`}>
                      {copied === "Paybill" ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3 — Account */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">3</div>
                <div className="flex-1">
                  <p className="font-bold text-kazi-dark text-sm">Enter Account Number</p>
                  <button
                    onClick={() => copy(accountRef, "Account")}
                    className="mt-2 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-kazi-orange transition-all"
                  >
                    <div>
                      <p className="text-xs text-gray-400">Account Number</p>
                      <p className="font-black text-kazi-dark text-xl tracking-wider">{accountRef}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${copied === "Account" ? "bg-green-100 text-green-600" : "bg-kazi-orange/10 text-kazi-orange"}`}>
                      {copied === "Account" ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 4 — Amount */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">4</div>
                <div className="flex-1">
                  <p className="font-bold text-kazi-dark text-sm">Enter Amount</p>
                  <button
                    onClick={() => copy(String(selected?.commissionAmount ?? ""), "Amount")}
                    className="mt-2 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-kazi-orange transition-all"
                  >
                    <div>
                      <p className="text-xs text-gray-400">Amount (KSh)</p>
                      <p className="font-black text-kazi-orange text-2xl">KSh {selected?.commissionAmount?.toLocaleString()}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${copied === "Amount" ? "bg-green-100 text-green-600" : "bg-kazi-orange/10 text-kazi-orange"}`}>
                      {copied === "Amount" ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 5 — PIN */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">5</div>
                <div>
                  <p className="font-bold text-kazi-dark text-sm">Enter your M-Pesa PIN and confirm</p>
                  <p className="text-gray-400 text-xs mt-0.5">You will receive an M-Pesa confirmation SMS</p>
                </div>
              </div>

              {/* Step 6 — Enter code */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">6</div>
                <div className="flex-1">
                  <p className="font-bold text-kazi-dark text-sm">Enter M-Pesa Confirmation Code</p>
                  <p className="text-gray-400 text-xs mt-0.5 mb-2">Copy the code from the SMS e.g. QGH7YU89K</p>
                  <input
                    type="text"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QGH7YU89K"
                    maxLength={12}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-black tracking-widest uppercase focus:outline-none focus:border-kazi-orange"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="font-black text-green-700 text-sm mb-2">📋 Payment Summary</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Paybill</span>
                  <span className="font-black text-kazi-dark">{PAYBILL}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Account</span>
                  <span className="font-black text-kazi-dark">{accountRef}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-black text-kazi-orange">KSh {selected?.commissionAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !mpesaCode}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "✅ Submit Payment Code"}
            </button>

            <p className="text-center text-xs text-gray-400">
              Admin will verify your payment within 1 hour and unlock your account
            </p>
          </>
        )}
      </div>
    </div>
  );
}
