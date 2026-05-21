"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, CheckCircle, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAYBILL = "247247";
const ACCOUNT = "0795542312";

// ── Shared copy button ────────────────────────────────────────────────────────

function CopyBtn({ label, value, copied, onCopy }: { label: string; value: string; copied: string; onCopy: (v: string, l: string) => void }) {
  return (
    <button
      onClick={() => onCopy(value, label)}
      className="mt-2 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-kazi-orange transition-all"
    >
      <p className="font-black text-kazi-dark text-2xl tracking-widest">{value}</p>
      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
        copied === label ? "bg-green-100 text-green-600" : "bg-kazi-orange/10 text-kazi-orange"
      }`}>
        {copied === label ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Tap to Copy</>}
      </div>
    </button>
  );
}

// ── Payment instructions + equity message form (shared between both modes) ───

function PaymentForm({
  commissionAmount,
  totalAmount,
  serviceName,
  customerName,
  onSubmit,
  submitting,
}: {
  commissionAmount: number;
  totalAmount: number;
  serviceName: string;
  customerName: string;
  onSubmit: (msg: string) => void;
  submitting: boolean;
}) {
  const [equityMsg, setEquityMsg] = useState("");
  const [copied, setCopied] = useState("");

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Job summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Job Summary</p>
        <div className="space-y-2">
          {serviceName && serviceName !== "Service" && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service</span>
              <span className="font-bold text-kazi-dark">{serviceName}</span>
            </div>
          )}
          {customerName && customerName !== "Customer" && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-bold text-kazi-dark">{customerName}</span>
            </div>
          )}
          {totalAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cash Received</span>
              <span className="font-bold text-green-600">KSh {totalAmount.toLocaleString()}</span>
            </div>
          )}
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
          <p className="text-red-500 text-xs mt-0.5">Account will be suspended if commission is not paid and confirmed in time.</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
        <h3 className="font-black text-kazi-dark text-lg">📱 How to Pay Commission</h3>

        {[
          { n: 1, title: "Open M-Pesa on your phone", desc: "Go to M-Pesa → Lipa Na M-Pesa → Pay Bill" },
          { n: 2, title: "Enter Business Number (Paybill)", copy: { label: "Paybill", value: PAYBILL } },
          { n: 3, title: "Enter Account Number", copy: { label: "Account", value: ACCOUNT } },
          { n: 4, title: "Enter Amount", copy: { label: "Amount", value: `${commissionAmount}` } },
          { n: 5, title: "Enter your M-Pesa PIN and send", desc: "You will receive an Equity Bank SMS confirmation" },
        ].map(({ n, title, desc, copy: c }) => (
          <div key={n} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">{n}</div>
            <div className="flex-1">
              <p className="font-bold text-kazi-dark text-sm">{title}</p>
              {desc && <p className="text-gray-400 text-xs mt-0.5">{desc}</p>}
              {c && <CopyBtn label={c.label} value={c.value} copied={copied} onCopy={copy} />}
            </div>
          </div>
        ))}

        {/* Step 6 — paste Equity message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">6</div>
          <div className="flex-1">
            <p className="font-bold text-kazi-dark text-sm">Paste Your Equity Bank Confirmation Message</p>
            <p className="text-gray-400 text-xs mt-0.5 mb-2">
              e.g. Confirmed. Payment of KES {commissionAmount} to KAZISHOW Till No. 0795542312 has been received. Ref. UELDN4V6NN...
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

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <p className="font-black text-green-700 text-sm mb-2">📋 Payment Summary</p>
        <div className="space-y-1.5 text-xs">
          {[["Paybill", PAYBILL], ["Account", ACCOUNT], ["Amount", `KSh ${commissionAmount.toLocaleString()}`]].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-gray-500">{k}</span>
              <span className="font-black text-kazi-dark">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSubmit(equityMsg)}
        disabled={submitting || equityMsg.trim().length < 20}
        className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "✅ I Have Paid — Submit Confirmation"}
      </button>
      <p className="text-center text-xs text-gray-400 pb-4">Admin verifies within 1 hour and confirms your payment</p>
    </div>
  );
}

// ── MODE A: came from "Customer Paid Cash" button — specific booking ──────────

function BookingCommissionFlow({
  bookingId, totalAmount, serviceName, customerName, token,
}: {
  bookingId: string; totalAmount: number; serviceName: string; customerName: string; token: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const commissionAmount = Math.round(totalAmount * 0.10);

  const handleSubmit = async (equityMsg: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/mark-cash-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mpesaCode: equityMsg.trim(), commissionAmount, totalAmount }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("Server error. Please try again."); return;
      }
      if (data.success) { setSubmitted(true); }
      else { toast.error(data.message || "Failed to submit. Try again."); }
    } catch { toast.error("Network error. Check your connection."); }
    finally { setSubmitting(false); }
  };

  if (submitted) return <SubmittedScreen onBack={() => router.push("/provider/notifications")} />;

  return (
    <PaymentForm
      commissionAmount={commissionAmount}
      totalAmount={totalAmount}
      serviceName={serviceName}
      customerName={customerName}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}

// ── MODE B: arrived without params — show outstanding commissions ─────────────

function OutstandingCommissionsFlow({ token }: { token: string }) {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState<string[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/commission/outstanding`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      try {
        const d = JSON.parse(text);
        if (d.success) {
          const list = Array.isArray(d.data) ? d.data : d.data ? [d.data] : [];
          setCommissions(list);
        }
      } catch {}
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (commission: any, equityMsg: string) => {
    setSubmitting(true);
    try {
      const commissionAmount = commission.commissionAmount || commission.amount || 0;
      const totalAmount = commission.cashAmount || 0;
      const res = await fetch(`${API_URL}/api/bookings/${commission.bookingId}/mark-cash-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mpesaCode: equityMsg.trim(), commissionAmount, totalAmount }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("Server error. Try again."); return;
      }
      if (data.success) {
        setSubmitted(prev => [...prev, commission.id]);
        setSelected(null);
        toast.success("Payment submitted! Admin will verify shortly.");
      } else {
        toast.error(data.message || "Failed to submit.");
      }
    } catch { toast.error("Network error."); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pending = commissions.filter(c => ["PENDING", "OVERDUE"].includes(c.status) && !submitted.includes(c.id));
  const verifying = commissions.filter(c => c.status === "PENDING_VERIFICATION");
  const paid = commissions.filter(c => c.status === "PAID");

  if (commissions.length === 0) return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
      <div className="text-4xl mb-3">✅</div>
      <p className="font-black text-kazi-dark text-lg">No outstanding commissions</p>
      <p className="text-gray-400 text-sm mt-1">You are all clear! Keep getting bookings.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due Now</p>
          {pending.map(c => {
            const amount = c.commissionAmount || c.amount || 0;
            const isOpen = selected === c.id;
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setSelected(isOpen ? null : c.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div>
                    <p className="font-black text-kazi-dark text-sm">{c.booking?.service?.name || "Service"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.booking?.customer?.name || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-kazi-orange">KSh {amount.toLocaleString()}</p>
                    <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                      {c.status === "OVERDUE" ? "⚠️ OVERDUE" : "PAY NOW"}
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <PaymentForm
                      commissionAmount={amount}
                      totalAmount={c.cashAmount || 0}
                      serviceName={c.booking?.service?.name || ""}
                      customerName={c.booking?.customer?.name || ""}
                      onSubmit={(msg) => handleSubmit(c, msg)}
                      submitting={submitting}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {verifying.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting Verification</p>
          {verifying.map(c => (
            <div key={c.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-black text-kazi-dark text-sm">{c.booking?.service?.name || "Service"}</p>
                <span className="text-xs bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full">⏳ Verifying</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">KSh {(c.commissionAmount || c.amount || 0).toLocaleString()} — Admin will confirm shortly</p>
            </div>
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paid</p>
          {paid.map(c => (
            <div key={c.id} className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-black text-kazi-dark text-sm">{c.booking?.service?.name || "Service"}</p>
                <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">✅ Paid</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">KSh {(c.commissionAmount || c.amount || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={load} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4" /> Refresh
      </button>
    </div>
  );
}

// ── Submitted screen ──────────────────────────────────────────────────────────

function SubmittedScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="font-black text-kazi-dark text-2xl mb-3">Payment Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your Equity Bank message has been submitted. Admin will verify and confirm within 1 hour.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
          <p className="text-amber-700 text-sm font-bold mb-1">⚠️ Important</p>
          <p className="text-amber-600 text-xs">
            If commission is not confirmed within 24 hours your account will be suspended.
            Make sure you paid the correct amount to Paybill 247247.
          </p>
        </div>
        <button onClick={onBack} className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl">
          Back to My Jobs
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function CommissionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");

  const bookingId    = searchParams.get("bookingId") || "";
  const totalAmount  = parseFloat(searchParams.get("amount") || "0");
  const serviceName  = searchParams.get("service")  || "";
  const customerName = searchParams.get("customer") || "";

  useEffect(() => {
    setToken(localStorage.getItem("kazishow_token") || "");
  }, []);

  const hasBooking = !!bookingId;

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-right" />

      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">💰 {hasBooking ? "Pay Commission" : "My Commissions"}</h1>
        <p className="text-white/50 text-sm mt-1">
          {hasBooking ? "Pay KaziShow 10% commission to keep your account active" : "View and pay outstanding commissions"}
        </p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">
        {token && (
          hasBooking
            ? <BookingCommissionFlow bookingId={bookingId} totalAmount={totalAmount} serviceName={serviceName} customerName={customerName} token={token} />
            : <OutstandingCommissionsFlow token={token} />
        )}
      </div>
    </div>
  );
}

export default function CommissionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CommissionPageContent />
    </Suspense>
  );
}
