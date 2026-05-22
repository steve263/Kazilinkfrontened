"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Copy, CheckCircle, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAYBILL = "247247";
const ACCOUNT = "0795542312";
const COMMISSION_RATE = 0.1;

// ─── Direct payment (bookingId in URL params) ─────────────────────────────────

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
  const commissionAmount = Math.round(totalAmount * COMMISSION_RATE);
  const [mpesaCode, setMpesaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    const code = mpesaCode.trim().toUpperCase();
    if (code.length < 8) {
      toast.error("Enter your M-Pesa confirmation code (e.g. QGH7YU89KL)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/mark-cash-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mpesaCode: code, commissionAmount, totalAmount }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("Server error. Please try again."); return;
      }
      if (data.success) {
        setSubmitted(true);
        toast.success("✅ Code submitted! Admin will verify shortly.");
        // Clear grace period so popup knows commission was submitted
        window.dispatchEvent(new CustomEvent("commission:refresh"));
        setTimeout(() => router.push("/provider/notifications"), 3000);
      } else {
        toast.error(data.message || "Failed to submit. Try again.");
      }
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kazi-cream pb-28">
      <Toaster position="top-center" />

      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">💰 Pay Commission</h1>
        <p className="text-white/50 text-sm mt-1">{serviceName} · {customerName}</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="bg-kazi-orange rounded-2xl p-5 text-center">
          <p className="text-white/80 text-sm">Commission Due (10%)</p>
          <p className="text-white font-black text-4xl mt-1">KSh {commissionAmount.toLocaleString()}</p>
          <p className="text-white/60 text-xs mt-1">Job value: KSh {totalAmount.toLocaleString()}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-xs font-medium">
            Pay within 24 hours or your account will be suspended.
          </p>
        </div>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-black text-xl">✅ Code Submitted!</p>
            <p className="text-green-600 text-sm mt-2">Admin will verify and confirm shortly.</p>
            <p className="text-green-500 text-xs mt-1">Redirecting back to your jobs...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-kazi-dark px-5 py-4">
              <p className="text-white font-black text-base">📱 Pay via M-Pesa Paybill</p>
            </div>
            <div className="p-5 space-y-3">
              <a
                href="tel:*334%23"
                className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 text-white font-black rounded-2xl text-base active:scale-95 transition-transform"
              >
                📱 Open M-Pesa on Your Phone
              </a>

              {[
                { label: "Paybill Number", value: PAYBILL },
                { label: "Account Number", value: ACCOUNT },
                { label: "Amount (KSh)", value: `${commissionAmount}` },
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
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                  Paste Your Equity Bank Confirmation Message
                </label>
                <input
                  type="text"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QGH7YU89KL"
                  maxLength={12}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-black tracking-widest text-lg text-center focus:outline-none focus:border-kazi-orange uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Copy from the Equity Bank SMS you receive after paying
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || mpesaCode.trim().length < 8}
                className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "✅ I Have Paid — Submit Code"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Outstanding commissions list ─────────────────────────────────────────────

function CommissionListView({ token }: { token: string }) {
  const router = useRouter();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bookings/commission/outstanding`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast.error("Server error. Please try again.");
        return;
      }
      if (data.success && Array.isArray(data.data)) {
        setCommissions(data.data);
        if (data.data.length > 0) setSelected((prev: any) => prev ?? data.data[0]);
      }
    } catch {
      toast.error("Could not load commissions. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const code = mpesaCode.trim().toUpperCase();
    if (code.length < 8) {
      toast.error("Enter your M-Pesa confirmation code (e.g. QGH7YU89KL)");
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
        toast.error("Server error. Please try again."); return;
      }
      if (data.success) {
        setSubmitted(selected.id);
        setMpesaCode("");
        toast.success("✅ Code submitted! Admin will verify shortly.");
        setTimeout(() => { setSubmitted(null); fetchCommissions(); }, 3000);
      } else {
        toast.error(data.message || "Failed to submit. Try again.");
      }
    } catch {
      toast.error("Network error. Check your connection.");
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
        <p className="text-white/50 text-sm mt-1">Pay KaziShow 10% to keep your account active</p>
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
                  <a
                    href="tel:*334%23"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 text-white font-black rounded-2xl text-base active:scale-95 transition-transform"
                  >
                    📱 Open M-Pesa on Your Phone
                  </a>

                  {[
                    { label: "Paybill Number", value: PAYBILL },
                    { label: "Account Number", value: ACCOUNT },
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
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                      Paste Your Equity Bank Confirmation Message
                    </label>
                    <input
                      type="text"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                      placeholder="e.g. QGH7YU89KL"
                      maxLength={12}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-black tracking-widest text-lg text-center focus:outline-none focus:border-kazi-orange uppercase"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Copy from the Equity Bank SMS you receive after paying
                    </p>
                  </div>

                  {submitted === selected.id ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                      <p className="text-green-700 font-black">✅ Code Submitted!</p>
                      <p className="text-green-600 text-sm mt-1">Admin will verify and confirm shortly.</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || mpesaCode.trim().length < 8}
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
                  M-Pesa code <strong className="tracking-widest">{selected.mpesaRef}</strong> submitted.
                </p>
                <p className="text-blue-500 text-xs mt-1">
                  Admin will confirm within 1 hour. You'll receive an SMS.
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

// ─── Router: picks direct vs list view based on URL params ────────────────────

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
  const serviceParam = searchParams.get("service") || "Service";
  const customerParam = searchParams.get("customer") || "Customer";

  if (bookingId && amountParam) {
    return (
      <DirectPaymentView
        bookingId={bookingId}
        totalAmount={parseFloat(amountParam)}
        serviceName={serviceParam}
        customerName={customerParam}
        token={token}
      />
    );
  }

  return <CommissionListView token={token} />;
}

// ─── Page export (Suspense required for useSearchParams) ──────────────────────

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
