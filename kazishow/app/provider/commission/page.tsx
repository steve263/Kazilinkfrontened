"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle, AlertTriangle, Clock, ArrowLeft, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAYBILL = "247247";
const ACCOUNT = "0795542312";

function hoursAgo(dateStr: string) {
  return (Date.now() - new Date(dateStr).getTime()) / 3600000;
}

export default function CommissionPaymentPage() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [equityMsg, setEquityMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [token, setToken] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [overdueHours, setOverdueHours] = useState(0);

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
        const list = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
        setCommissions(list);
        if (list.length > 0) {
          setSelected(list[0]);
          const overdue = list.find(
            (c: any) => ["PENDING", "OVERDUE"].includes(c.status) && hoursAgo(c.createdAt) >= 8
          );
          if (overdue) {
            setOverdueHours(Math.floor(hoursAgo(overdue.createdAt)));
            setShowPopup(true);
          }
        }
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
    if (!equityMsg || equityMsg.trim().length < 20) {
      toast.error("Please paste the full Equity Bank confirmation message");
      return;
    }
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/commission/${selected.id}/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mpesaCode: equityMsg.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Payment submitted! Admin will verify within 1 hour.");
        setEquityMsg("");
        setShowPopup(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingList = commissions.filter((c) => ["PENDING", "OVERDUE"].includes(c.status));
  const verifyList = commissions.filter((c) => c.status === "PENDING_VERIFICATION");
  const paidList = commissions.filter((c) => c.status === "PAID");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Toaster position="top-right" />

      {/* 8-hour overdue popup — non-dismissible until paid */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-6 pt-8 pb-6 text-center">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="text-white font-black text-xl">Commission Overdue!</h2>
              <p className="text-red-100 text-sm mt-1">{overdueHours}+ hours since job completed</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-700 text-sm text-center mb-4">
                Your account will be <span className="font-black text-red-600">suspended</span> until commission is paid. Pay now via Paybill:
              </p>
              <div className="bg-orange-50 border-2 border-kazi-orange rounded-2xl p-4 mb-4 text-center space-y-1">
                <p className="text-xs text-gray-500">Paybill</p>
                <p className="font-black text-kazi-dark text-3xl tracking-widest">{PAYBILL}</p>
                <p className="text-xs text-gray-500 mt-2">Account</p>
                <p className="font-black text-kazi-orange text-xl">{ACCOUNT}</p>
                <p className="font-black text-kazi-dark text-2xl mt-2">KSh {selected?.commissionAmount?.toLocaleString()}</p>
              </div>
              <textarea
                rows={3}
                value={equityMsg}
                onChange={(e) => setEquityMsg(e.target.value)}
                placeholder="Confirmed. Payment of KES 500 to KAZISHOW Till No. 0795542312..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange resize-none mb-3"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !equityMsg}
                className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-base disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "✅ Submit Payment Now"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">You cannot close this until payment is submitted</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 mb-4 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl">💰 My Commission</h1>
            <p className="text-white/50 text-sm mt-1">10% of each completed job goes to KaziShow</p>
          </div>
          <button onClick={() => fetchCommissions(token)} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {pendingList.length > 0 && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-1.5">
              <p className="text-red-200 text-xs font-bold">
                {pendingList.length} Pending · KSh {pendingList.reduce((s, c) => s + (c.commissionAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          )}
          {verifyList.length > 0 && (
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-1.5">
              <p className="text-amber-200 text-xs font-bold">⏳ {verifyList.length} Verifying</p>
            </div>
          )}
          {paidList.length > 0 && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-3 py-1.5">
              <p className="text-green-200 text-xs font-bold">✅ {paidList.length} Paid</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {commissions.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="text-6xl mb-4">🎉</div>
            <p className="font-black text-kazi-dark text-xl">All Clear!</p>
            <p className="text-gray-400 text-sm mt-2">No pending commission. Keep accepting jobs!</p>
            <Link href="/provider/notifications" className="mt-5 inline-block px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl text-sm">
              View My Jobs
            </Link>
          </div>
        )}

        {/* Pending — pay now */}
        {pendingList.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Pending Payment</p>

            {pendingList.length > 1 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <p className="text-xs font-bold text-gray-400 mb-1">Select commission to pay:</p>
                {pendingList.map((c) => (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${selected?.id === c.id ? "border-kazi-orange bg-orange-50" : "border-gray-100"}`}>
                    <p className="font-bold text-sm text-kazi-dark">{c.booking?.service?.name ?? "Service"}</p>
                    <p className="text-xs text-gray-400">KSh {c.commissionAmount?.toLocaleString()} · {c.status}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="bg-gradient-to-br from-kazi-orange to-orange-600 rounded-3xl p-6 text-center shadow-lg shadow-orange-200">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Commission Due</p>
              <p className="text-white font-black text-5xl mb-1">KSh {selected?.commissionAmount?.toLocaleString()}</p>
              <p className="text-white/60 text-xs">10% of KSh {selected?.cashAmount?.toLocaleString()} job</p>
              <div className="mt-4 bg-white/15 rounded-2xl px-4 py-2">
                <p className="text-white text-xs">{selected?.booking?.service?.name ?? "Service"} · {selected?.booking?.customer?.name ?? "Customer"}</p>
              </div>
              {selected?.createdAt && hoursAgo(selected.createdAt) >= 6 && (
                <div className="mt-3 bg-red-500/30 rounded-xl px-3 py-2 flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-red-200" />
                  <p className="text-red-100 text-xs font-bold">
                    {Math.floor(hoursAgo(selected.createdAt))}h elapsed · Pay before 8h to avoid suspension
                  </p>
                </div>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">Account suspended if commission not paid within <span className="font-black">8 hours</span> of job completion.</p>
            </div>

            {/* Payment steps */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
              <h3 className="font-black text-kazi-dark text-base">📱 Pay via M-Pesa Paybill</h3>
              {[
                { n: 1, title: "Open M-Pesa", sub: "Lipa Na M-Pesa → Pay Bill" },
                { n: 2, title: "Business Number", copyVal: PAYBILL, copyLabel: "Paybill", display: PAYBILL, big: true },
                { n: 3, title: "Account Number", copyVal: ACCOUNT, copyLabel: "Account", display: ACCOUNT, big: false },
                { n: 4, title: "Amount", copyVal: String(selected?.commissionAmount ?? ""), copyLabel: "Amount", display: `KSh ${selected?.commissionAmount?.toLocaleString()}`, big: true, orange: true },
                { n: 5, title: "Enter PIN & Confirm", sub: "You'll receive an Equity Bank SMS" },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-kazi-orange rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 mt-0.5">{step.n}</div>
                  <div className="flex-1">
                    <p className="font-bold text-kazi-dark text-sm">{step.title}</p>
                    {step.sub && <p className="text-gray-400 text-xs mt-0.5">{step.sub}</p>}
                    {step.copyVal !== undefined && (
                      <button onClick={() => copy(step.copyVal!, step.copyLabel!)}
                        className="mt-2 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-100 hover:border-kazi-orange rounded-xl px-4 py-3 transition-all">
                        <p className={`font-black ${step.big ? "text-2xl tracking-wider" : "text-base"} ${step.orange ? "text-kazi-orange" : "text-kazi-dark"}`}>{step.display}</p>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${copied === step.copyLabel ? "bg-green-100 text-green-600" : "bg-orange-50 text-kazi-orange"}`}>
                          {copied === step.copyLabel ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 mt-0.5">6</div>
                <div className="flex-1">
                  <p className="font-bold text-kazi-dark text-sm">Paste Equity Bank Confirmation SMS</p>
                  <p className="text-gray-400 text-xs mt-0.5 mb-2">Copy the full SMS from Equity Bank and paste it here</p>
                  <textarea rows={4} value={equityMsg} onChange={(e) => setEquityMsg(e.target.value)}
                    placeholder="Confirmed. Payment of KES 500 to KAZISHOW Till No. 0795542312 has been received. Ref. UELDN4V6NN on 21-05-2026 at 17:41. Thank you."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="font-black text-green-700 text-sm mb-3">📋 Summary</p>
              {[["Paybill", PAYBILL, false], ["Account", ACCOUNT, false], ["Amount", `KSh ${selected?.commissionAmount?.toLocaleString()}`, true]].map(([l, v, h]) => (
                <div key={l as string} className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{l}</span>
                  <span className={`font-black ${h ? "text-kazi-orange" : "text-kazi-dark"}`}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={submitting || !equityMsg}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg disabled:opacity-60 shadow-lg shadow-orange-200">
              {submitting ? "Submitting..." : "✅ Submit Payment"}
            </button>
            <p className="text-center text-xs text-gray-400">Admin verifies within 1 hour and unlocks your account</p>
          </div>
        )}

        {verifyList.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Awaiting Verification</p>
            {verifyList.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">⏳</div>
                  <div>
                    <p className="font-black text-kazi-dark text-sm">{c.booking?.service?.name ?? "Service"}</p>
                    <p className="text-xs text-gray-400">KSh {c.commissionAmount?.toLocaleString()} · Under review</p>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl px-3 py-2">
                  <p className="text-amber-700 text-xs font-bold">Admin will verify your Equity Bank message within 1 hour and notify you.</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {paidList.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Paid</p>
            {paidList.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-kazi-dark text-sm">{c.booking?.service?.name ?? "Service"}</p>
                  <p className="text-xs text-green-600 font-bold">KSh {c.commissionAmount?.toLocaleString()} · Paid ✅</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
