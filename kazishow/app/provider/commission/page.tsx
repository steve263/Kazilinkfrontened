"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, CheckCircle, AlertTriangle, Clock, ArrowLeft, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useSettings } from "@/lib/settingsContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAYBILL = "247247";

// ─── Direct payment view (bookingId + amount in URL params) ──────────────────

function DirectPaymentView({
  bookingId,
  totalAmount,
  serviceName,
  customerName,
  token,
}: {
  bookingId: string;
  totalAmount: number;
  serviceName: string;
  customerName: string;
  token: string;
}) {
  const router = useRouter();
  const { cashCommissionRate, supportPhone } = useSettings();
  const commissionAmount = Math.round(totalAmount * (cashCommissionRate / 100));
  const account = supportPhone || "0795542312";

  const [mpesaCode, setMpesaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"instructions" | "waiting" | "approved" | "rejected">("instructions");
  const [copied, setCopied] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkExistingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const checkExistingStatus = async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`${API}/api/bookings/commission/status/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) return;
      const data = await res.json();
      if (data.success && data.data) {
        const status = data.data.status;
        if (status === "PENDING_VERIFICATION") {
          setSubmittedCode(data.data.mpesaRef || "");
          setStep("waiting");
          startPolling();
        } else if (status === "PAID") {
          setStep("approved");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      setCheckingStatus(true);
      try {
        const res = await fetch(`${API}/api/bookings/commission/status/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) return;
        const data = await res.json();
        if (data.success && data.data) {
          const status = data.data.status;
          if (status === "PAID") {
            clearInterval(pollingRef.current!);
            setStep("approved");
            toast.success("✅ Commission confirmed by admin!");
          } else if (status === "PENDING") {
            clearInterval(pollingRef.current!);
            setStep("rejected");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingStatus(false);
      }
    }, 30000);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmitCode = async () => {
    if (!mpesaCode || mpesaCode.trim().length < 20) {
      toast.error("Please paste the full M-Pesa SMS message");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/mark-cash-paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mpesaCode: mpesaCode.trim(), commissionAmount, totalAmount }),
      });
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Server error");
      const data = await res.json();
      if (data.success) {
        setSubmittedCode(mpesaCode.trim());
        setStep("waiting");
        startPolling();
        window.dispatchEvent(new CustomEvent("commission:refresh"));
      } else {
        toast.error(data.message || "Failed to submit");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── WAITING ────────────────────────────────────────────────────────────────
  if (step === "waiting") {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className={`w-10 h-10 text-amber-500 ${checkingStatus ? "animate-spin" : "animate-pulse"}`} />
          </div>
          <h2 className="font-black text-kazi-dark text-2xl mb-2">Payment Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">Waiting for admin to verify your payment...</p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-left space-y-2">
            <p className="font-black text-amber-700 text-sm">📋 Your Submission</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Service</span>
              <span className="font-bold text-kazi-dark">{serviceName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Job Value</span>
              <span className="font-bold text-kazi-dark">KSh {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Commission</span>
              <span className="font-black text-kazi-orange">KSh {commissionAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-amber-200 pt-2">
              <p className="text-xs text-gray-400">M-Pesa SMS submitted:</p>
              <p className="text-xs text-gray-600 mt-1 break-all">{submittedCode.slice(0, 80)}...</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
            <p className="text-blue-700 font-bold text-sm">⏳ Admin is verifying your payment</p>
            <p className="text-blue-500 text-xs mt-1">
              Admin checks your Equity Bank payment and confirms. This usually takes less than 1 hour.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-5">
            <p className="text-red-600 text-xs font-bold">🚫 New bookings are paused</p>
            <p className="text-red-500 text-xs mt-0.5">
              You will be able to accept new bookings once admin confirms your commission payment.
            </p>
          </div>

          {checkingStatus && (
            <p className="text-xs text-gray-400 animate-pulse mb-3">Checking payment status...</p>
          )}
          <p className="text-xs text-gray-400">
            This page checks automatically every 30 seconds. Contact support on WhatsApp:
            <span className="font-bold text-kazi-orange"> {account}</span>
          </p>
        </div>
      </div>
    );
  }

  // ── APPROVED ───────────────────────────────────────────────────────────────
  if (step === "approved") {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="font-black text-kazi-dark text-2xl mb-2">Commission Confirmed!</h2>
          <p className="text-gray-500 text-sm mb-6">Admin has verified your payment. Your account is fully active!</p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-green-700 font-bold text-sm">🎉 You can now receive new bookings!</p>
            <p className="text-green-600 text-xs mt-1">Keep up the great work. Your customers are waiting!</p>
          </div>
          <button
            onClick={() => router.push("/provider/notifications")}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg"
          >
            Go to My Jobs 🚀
          </button>
        </div>
      </div>
    );
  }

  // ── REJECTED ───────────────────────────────────────────────────────────────
  if (step === "rejected") {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="font-black text-kazi-dark text-2xl mb-2">Payment Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            Admin could not find your payment. Please pay again and submit the correct M-Pesa SMS.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left">
            <p className="text-red-700 font-bold text-sm mb-2">What to do:</p>
            <p className="text-red-600 text-xs">1. Go to M-Pesa → Lipa Na M-Pesa → Pay Bill</p>
            <p className="text-red-600 text-xs mt-1">2. Paybill: {PAYBILL} | Account: {account}</p>
            <p className="text-red-600 text-xs mt-1">3. Amount: KSh {commissionAmount.toLocaleString()}</p>
            <p className="text-red-600 text-xs mt-1">4. Paste the full M-Pesa SMS here</p>
          </div>
          <button
            onClick={() => { setMpesaCode(""); setStep("instructions"); }}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── INSTRUCTIONS ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />
      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">💰 Pay Commission</h1>
        <p className="text-white/50 text-sm mt-1">{serviceName} · {customerName}</p>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        <div className="bg-kazi-orange rounded-3xl p-5 text-center">
          <p className="text-white/80 text-sm font-semibold mb-1">Commission Due ({cashCommissionRate}%)</p>
          <p className="text-white font-black text-5xl mb-1">KSh {commissionAmount.toLocaleString()}</p>
          <p className="text-white/60 text-xs">Job value: KSh {totalAmount.toLocaleString()}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">Pay within 24 hours or your account will be suspended.</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="font-black text-kazi-dark text-lg">📱 How to Pay</h3>

          {[
            { step: 1, title: "Open M-Pesa", desc: "Go to M-Pesa → Lipa Na M-Pesa → Pay Bill", value: null, copyKey: null, display: null },
            { step: 2, title: "Business Number (Paybill)", desc: null, value: PAYBILL, copyKey: "Paybill", display: null },
            { step: 3, title: "Account Number", desc: null, value: account, copyKey: "Account", display: null },
            { step: 4, title: "Amount", desc: null, value: commissionAmount.toString(), copyKey: "Amount", display: `KSh ${commissionAmount.toLocaleString()}` },
            { step: 5, title: "Enter PIN and send", desc: "You will receive an M-Pesa SMS", value: null, copyKey: null, display: null },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="font-bold text-kazi-dark text-sm">{item.title}</p>
                {item.desc && <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>}
                {item.value && (
                  <button
                    onClick={() => copy(item.value!, item.copyKey!)}
                    className="mt-2 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-kazi-orange transition-all"
                  >
                    <p className="font-black text-kazi-dark text-xl tracking-widest">
                      {item.display || item.value}
                    </p>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                      copied === item.copyKey ? "bg-green-100 text-green-600" : "bg-kazi-orange/10 text-kazi-orange"
                    }`}>
                      {copied === item.copyKey
                        ? <><CheckCircle className="w-3 h-3" /> Copied!</>
                        : <><Copy className="w-3 h-3" /> Tap to Copy</>}
                    </div>
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              6
            </div>
            <div className="flex-1">
              <p className="font-bold text-kazi-dark text-sm">Paste Full M-Pesa SMS Here</p>
              <p className="text-gray-400 text-xs mt-0.5 mb-2">
                Copy and paste the entire SMS you receive from M-Pesa
              </p>
              <textarea
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
                placeholder={`Paste the full M-Pesa SMS here\n\nExample:\nConfirmed. Payment of KES ${commissionAmount} to KAZISHOW Till No. 0795542312 has been received. Ref. XXXXXXXX on 22-05-2026. Thank you.`}
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none"
              />
              <p className="text-xs text-green-600 font-semibold mt-1">
                ✅ Paste the entire SMS — not just the code
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="font-black text-green-700 text-sm mb-2">📋 Payment Summary</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Paybill</span>
              <span className="font-black">{PAYBILL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account</span>
              <span className="font-black">{account}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Commission</span>
              <span className="font-black text-kazi-orange">KSh {commissionAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmitCode}
          disabled={submitting || mpesaCode.trim().length < 20}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "✅ I Have Paid — Submit Code"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Admin verifies within 1 hour and confirms your payment
        </p>
      </div>
    </div>
  );
}

// ─── Outstanding commissions list (no URL params) ─────────────────────────────

function CommissionListView({ token }: { token: string }) {
  const router = useRouter();
  const { cashCommissionRate, supportPhone } = useSettings();
  const account = supportPhone || "0795542312";
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bookings/commission/outstanding`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("Server error."); return;
      }
      if (data.success && Array.isArray(data.data)) {
        setCommissions(data.data);
        if (data.data.length > 0) setSelected((prev: any) => prev ?? data.data[0]);
      }
    } catch {
      toast.error("Could not load commissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommissions(); }, []);

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const code = mpesaCode.trim();
    if (code.length < 20) {
      toast.error("Please paste your full M-Pesa SMS message");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/bookings/${selected.bookingId}/mark-cash-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mpesaCode: code,
          commissionAmount: selected.commissionAmount,
          totalAmount: selected.cashAmount,
        }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("Server error."); return;
      }
      if (data.success) {
        setSubmitted(selected.id);
        setMpesaCode("");
        toast.success("✅ Code submitted! Admin will verify shortly.");
        setTimeout(() => { setSubmitted(null); fetchCommissions(); }, 3000);
      } else {
        toast.error(data.message || "Failed to submit.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalOwed = commissions
    .filter((c) => c.status !== "PAID")
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-28">
      <Toaster position="top-center" />
      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">💰 My Commissions</h1>
        <p className="text-white/50 text-sm mt-1">Pay KaziShow {cashCommissionRate}% to keep your account active</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {commissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-4">✅</div>
            <p className="font-black text-kazi-dark text-xl">All Clear!</p>
            <p className="text-gray-400 text-sm mt-2">No outstanding commissions. Keep getting bookings!</p>
            <button
              onClick={() => router.push("/provider/notifications")}
              className="mt-5 px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl"
            >
              View My Jobs
            </button>
          </div>
        ) : (
          <>
            <div className="bg-kazi-orange rounded-2xl p-5 text-center">
              <p className="text-white/80 text-sm">Total Commission Owed</p>
              <p className="text-white font-black text-4xl mt-1">KSh {totalOwed.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-1">
                {commissions.filter((c) => c.status !== "PAID").length} commission(s) pending
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs font-medium">
                Pay within 24 hours or your account will be suspended.
              </p>
            </div>

            <div className="space-y-2">
              {commissions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c); setMpesaCode(""); setSubmitted(null); }}
                  className={`w-full bg-white rounded-2xl p-4 text-left border-2 transition-all shadow-sm ${
                    selected?.id === c.id ? "border-kazi-orange" : "border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-kazi-dark text-sm">{c.booking?.service?.name || "Service"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Customer: {c.booking?.customer?.name || "—"}</p>
                      <p className="text-xs text-gray-400">Job value: KSh {(c.cashAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-kazi-orange text-lg">KSh {(c.commissionAmount || 0).toLocaleString()}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        c.status === "PENDING_VERIFICATION"
                          ? "bg-blue-100 text-blue-600"
                          : c.status === "OVERDUE"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600"
                      }`}>
                        {c.status === "PENDING_VERIFICATION" ? "⏳ Verifying" : c.status === "OVERDUE" ? "⚠️ OVERDUE" : "PAY NOW"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selected && selected.status === "PENDING" && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-kazi-dark px-5 py-4">
                  <p className="text-white font-black text-base">📱 Pay via M-Pesa Paybill</p>
                  <p className="text-white/60 text-xs mt-0.5">
                    Paying for: {selected.booking?.service?.name || "Service"}
                  </p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "Paybill Number", value: PAYBILL },
                    { label: "Account Number", value: account },
                    { label: "Amount (KSh)", value: `${selected.commissionAmount}` },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => copy(item.value, item.label)}
                      className="w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-kazi-orange transition-all"
                    >
                      <div className="text-left">
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="font-black text-kazi-dark text-2xl tracking-widest">{item.value}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${
                        copied === item.label ? "bg-green-100 text-green-600" : "bg-kazi-orange/10 text-kazi-orange"
                      }`}>
                        {copied === item.label
                          ? <><CheckCircle className="w-3 h-3" /> Copied!</>
                          : <><Copy className="w-3 h-3" /> Copy</>}
                      </div>
                    </button>
                  ))}

                  <div className="pt-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Paste Your M-Pesa Message
                    </label>
                    <textarea
                      rows={5}
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                      placeholder={"Paste your M-Pesa message here\n\nExample:\nConfirmed. Payment of KES 230 to KAZISHOW Till No. 0795542312 has been received. Ref. UELDN4V6NN on 21-05-2026 at 17:41. Thank you."}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none"
                    />
                  </div>

                  {submitted === selected.id ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                      <p className="text-green-700 font-black">✅ Code Submitted!</p>
                      <p className="text-green-600 text-sm mt-1">Admin will verify and confirm shortly.</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || mpesaCode.trim().length < 20}
                      className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60"
                    >
                      {submitting ? "Submitting..." : "✅ I Have Paid — Submit Code"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {selected && selected.status === "PENDING_VERIFICATION" && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
                <p className="text-blue-700 font-black text-lg">⏳ Payment Being Verified</p>
                <p className="text-blue-600 text-sm mt-2">
                  M-Pesa code submitted. Admin will confirm within 1 hour.
                </p>
              </div>
            )}

            <button
              onClick={fetchCommissions}
              className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

function CommissionPageRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    setToken(t);
    setLoaded(true);
    if (!t) router.push("/auth/login");
  }, [router]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const bookingId = searchParams.get("bookingId");
  const amountParam = searchParams.get("amount");

  if (bookingId && amountParam) {
    return (
      <DirectPaymentView
        bookingId={bookingId}
        totalAmount={parseFloat(amountParam)}
        serviceName={searchParams.get("service") || "Service"}
        customerName={searchParams.get("customer") || "Customer"}
        token={token}
      />
    );
  }

  return <CommissionListView token={token} />;
}

// ─── Page export ──────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function CommissionPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CommissionPageRouter />
    </Suspense>
  );
}
