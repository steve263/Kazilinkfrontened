"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAYBILL = "247247";
const ACCOUNT = "0795542312";

function CommissionPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId    = searchParams.get("bookingId") || "";
  const totalAmount  = parseFloat(searchParams.get("amount") || "0");
  const serviceName  = searchParams.get("service")  || "Service";
  const customerName = searchParams.get("customer") || "Customer";
  const commissionAmount = Math.round(totalAmount * 0.10);

  const [equityMsg, setEquityMsg]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [copied, setCopied]         = useState("");
  const [token, setToken]           = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("kazishow_token") || "");
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    if (!bookingId) {
      toast.error("Missing booking info. Go back and tap the button again.");
      return;
    }
    if (!equityMsg.trim() || equityMsg.trim().length < 20) {
      toast.error("Please paste your full Equity Bank confirmation message");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/mark-cash-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mpesaCode: equityMsg.trim(),
          commissionAmount,
          totalAmount,
        }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        console.error("Non-JSON response:", text.slice(0, 200));
        toast.error("Server error. Please try again.");
        return;
      }
      if (data.success) {
        setSubmitted(true);
      } else {
        toast.error(data.message || "Failed to submit. Try again.");
      }
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-black text-kazi-dark text-2xl mb-3">Payment Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your Equity Bank message has been submitted. Admin will verify your payment and confirm within 1 hour.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
            <p className="text-amber-700 text-sm font-bold mb-1">⚠️ Important</p>
            <p className="text-amber-600 text-xs">
              If commission is not confirmed within 24 hours your account will be suspended.
              Make sure you paid the correct amount to Paybill 247247.
            </p>
          </div>
          <button
            onClick={() => router.push("/provider/notifications")}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
          >
            Back to My Jobs
          </button>
        </div>
      </div>
    );
  }

  const CopyBtn = ({ label, value }: { label: string; value: string }) => (
    <button
      onClick={() => copy(value, label)}
      className="mt-2 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-kazi-orange transition-all"
    >
      <p className="font-black text-kazi-dark text-2xl tracking-widest">{value}</p>
      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
        copied === label ? "bg-green-100 text-green-600" : "bg-kazi-orange/10 text-kazi-orange"
      }`}>
        {copied === label
          ? <><CheckCircle className="w-3 h-3" /> Copied!</>
          : <><Copy className="w-3 h-3" /> Tap to Copy</>
        }
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">💰 Pay Commission</h1>
        <p className="text-white/50 text-sm mt-1">Pay KaziShow 10% commission to keep your account active</p>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {/* Job summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Job Summary</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service</span>
              <span className="font-bold text-kazi-dark">{serviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-bold text-kazi-dark">{customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cash Received</span>
              <span className="font-bold text-green-600">KSh {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
              <span className="font-black text-kazi-dark">Commission to Pay (10%)</span>
              <span className="font-black text-kazi-orange text-lg">KSh {commissionAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-600 font-bold text-sm">Pay within 24 hours</p>
            <p className="text-red-500 text-xs mt-0.5">
              Your account will be suspended if commission is not paid and confirmed within 24 hours.
            </p>
          </div>
        </div>

        {/* Payment instructions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="font-black text-kazi-dark text-lg">📱 How to Pay Commission</h3>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">1</div>
            <div>
              <p className="font-bold text-kazi-dark text-sm">Open M-Pesa on your phone</p>
              <p className="text-gray-400 text-xs mt-0.5">Go to M-Pesa → Lipa Na M-Pesa → Pay Bill</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">2</div>
            <div className="flex-1">
              <p className="font-bold text-kazi-dark text-sm">Enter Business Number (Paybill)</p>
              <CopyBtn label="Paybill" value={PAYBILL} />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">3</div>
            <div className="flex-1">
              <p className="font-bold text-kazi-dark text-sm">Enter Account Number</p>
              <CopyBtn label="Account" value={ACCOUNT} />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">4</div>
            <div className="flex-1">
              <p className="font-bold text-kazi-dark text-sm">Enter Amount</p>
              <CopyBtn label="Amount" value={`${commissionAmount}`} />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">5</div>
            <div>
              <p className="font-bold text-kazi-dark text-sm">Enter your M-Pesa PIN and send</p>
              <p className="text-gray-400 text-xs mt-0.5">You will receive an Equity Bank SMS confirmation</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">6</div>
            <div className="flex-1">
              <p className="font-bold text-kazi-dark text-sm">Paste Your Equity Bank Confirmation Message</p>
              <p className="text-gray-400 text-xs mt-0.5 mb-2">
                e.g. Confirmed. Payment of KES {commissionAmount} to KAZISHOW Till No. 0795542312 has been received. Ref. UELDN4V6NN on 21-05-2026...
              </p>
              <textarea
                rows={4}
                value={equityMsg}
                onChange={(e) => setEquityMsg(e.target.value)}
                placeholder={`Confirmed. Payment of KES ${commissionAmount} to KAZISHOW Till No. 0795542312 has been received. Ref. UELDN4V6NN...`}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Copy and paste the full SMS message from Equity Bank after payment</p>
            </div>
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="font-black text-green-700 text-sm mb-2">📋 Payment Summary</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Paybill</span>
              <span className="font-black text-kazi-dark">{PAYBILL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account</span>
              <span className="font-black text-kazi-dark">{ACCOUNT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-black text-kazi-orange">KSh {commissionAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || equityMsg.trim().length < 20}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "✅ I Have Paid — Submit Confirmation"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Admin verifies within 1 hour and confirms your payment
        </p>
      </div>
    </div>
  );
}

export default function CommissionPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CommissionPaymentContent />
    </Suspense>
  );
}
