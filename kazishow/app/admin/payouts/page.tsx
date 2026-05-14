"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, CheckCircle, XCircle,
  Clock, Wallet, AlertCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_TABS = ["PENDING", "COMPLETED", "REJECTED", "ALL"] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_STYLE: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  APPROVED:   "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  COMPLETED:  "bg-green-100 text-green-700",
  REJECTED:   "bg-red-100 text-red-700",
};

interface Payout {
  id: string;
  amount: number;
  phone: string;
  status: string;
  mpesaRef: string | null;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
  provider: {
    businessName: string;
    category: string;
    user: { name: string; phone: string };
  };
}

type Modal =
  | { type: "approve"; payout: Payout }
  | { type: "reject";  payout: Payout }
  | null;

export default function AdminPayoutsPage() {
  const ready = useAdminGuard();
  const [token, setToken]         = useState("");
  const [payouts, setPayouts]     = useState<Payout[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [status, setStatus]       = useState<StatusTab>("PENDING");
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [modal, setModal]         = useState<Modal>(null);
  const [mpesaRef, setMpesaRef]   = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchPayouts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/api/earnings/admin/payouts${status !== "ALL" ? `?status=${status}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await r.json();
      if (d.success) { setPayouts(d.data.payouts); setPendingTotal(d.data.pendingTotal ?? 0); }
      else toast.error(d.message);
    } catch { toast.error("Failed to load payouts"); }
    finally { setLoading(false); }
  }, [token, status]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  async function approvePayout() {
    if (modal?.type !== "approve") return;
    if (!mpesaRef.trim()) { toast.error("Enter M-Pesa reference"); return; }
    setProcessing(modal.payout.id);
    setModal(null);
    try {
      const r = await fetch(`${API}/api/earnings/admin/payouts/${modal.payout.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mpesaRef: mpesaRef.trim() }),
      });
      const d = await r.json();
      if (d.success) { toast.success("Payout marked as completed ✅"); fetchPayouts(); }
      else toast.error(d.message);
    } catch { toast.error("Failed to approve payout"); }
    finally { setProcessing(null); setMpesaRef(""); }
  }

  async function rejectPayout() {
    if (modal?.type !== "reject") return;
    if (!rejectReason.trim()) { toast.error("Enter a reason"); return; }
    setProcessing(modal.payout.id);
    setModal(null);
    try {
      const r = await fetch(`${API}/api/earnings/admin/payouts/${modal.payout.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const d = await r.json();
      if (d.success) { toast.success("Payout rejected"); fetchPayouts(); }
      else toast.error(d.message);
    } catch { toast.error("Failed to reject payout"); }
    finally { setProcessing(null); setRejectReason(""); }
  }

  if (!ready) return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pendingCount = payouts.filter(p => p.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-right" />

      {/* Approve modal */}
      {modal?.type === "approve" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-black text-kazi-dark text-lg text-center">Approve Payout</h3>
            <p className="text-center text-gray-500 text-sm">
              <span className="font-bold text-kazi-dark">{modal.payout.provider.businessName}</span>
              <br />
              <span className="text-2xl font-black text-kazi-orange">KSh {modal.payout.amount.toLocaleString()}</span>
              <br />
              <span className="font-mono text-xs">{modal.payout.phone}</span>
            </p>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">M-Pesa Reference Code</label>
              <input
                type="text"
                value={mpesaRef}
                onChange={e => setMpesaRef(e.target.value)}
                placeholder="e.g. QK3JH2L4MN"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={approvePayout}
                className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl text-sm hover:bg-green-600 transition-colors">
                Confirm Paid
              </button>
              <button onClick={() => { setModal(null); setMpesaRef(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {modal?.type === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-black text-kazi-dark text-lg text-center">Reject Payout?</h3>
            <p className="text-center text-sm text-gray-500">
              <span className="font-bold text-kazi-dark">{modal.payout.provider.businessName}</span>
              {" — "}KSh {modal.payout.amount.toLocaleString()}
            </p>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Reason for rejection</label>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid account details"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={rejectPayout}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors">
                Reject
              </button>
              <button onClick={() => { setModal(null); setRejectReason(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-1.5 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Wallet className="w-5 h-5 text-kazi-orange" />
          <div>
            <h1 className="text-lg font-black text-kazi-dark">Payout Requests</h1>
            <p className="text-xs text-gray-400">
              {pendingCount > 0
                ? `${pendingCount} pending · KSh ${pendingTotal.toLocaleString()} total`
                : "All caught up"}
            </p>
          </div>
        </div>
        <button onClick={fetchPayouts} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-5 max-w-6xl mx-auto">
        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {STATUS_TABS.map(tab => (
            <button key={tab}
              onClick={() => setStatus(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                status === tab ? "bg-kazi-dark text-white" : "bg-white text-gray-500 hover:bg-gray-100"
              }`}>
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Provider", "Amount", "M-Pesa", "Status", "Requested", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td></tr>
                    ))
                  : payouts.length === 0
                  ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm font-semibold">No {status === "ALL" ? "" : status.toLowerCase()} payouts</p>
                    </td></tr>
                  )
                  : payouts.map((p, i) => (
                    <tr key={p.id}
                      className={`border-b border-gray-50 hover:bg-orange-50/20 transition-colors ${i % 2 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-kazi-dark">{p.provider.businessName}</p>
                        <p className="text-xs text-gray-400">{p.provider.user.name} · {p.provider.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-kazi-orange text-base">KSh {p.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">
                        {p.phone}
                        {p.mpesaRef && <p className="text-green-600 mt-0.5">Ref: {p.mpesaRef}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {p.status === "PENDING" && <Clock className="w-3 h-3" />}
                          {p.status === "COMPLETED" && <CheckCircle className="w-3 h-3" />}
                          {p.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                          {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                        </span>
                        {p.adminNote && p.status === "REJECTED" && (
                          <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {p.adminNote}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(p.requestedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        <br />
                        {new Date(p.requestedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === "PENDING" ? (
                          <div className="flex gap-1.5">
                            <button
                              disabled={processing === p.id}
                              onClick={() => setModal({ type: "approve", payout: p })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors disabled:opacity-50">
                              <CheckCircle className="w-3.5 h-3.5" /> Pay
                            </button>
                            <button
                              disabled={processing === p.id}
                              onClick={() => setModal({ type: "reject", payout: p })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors disabled:opacity-50">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loading && payouts.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {payouts.length} record{payouts.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
