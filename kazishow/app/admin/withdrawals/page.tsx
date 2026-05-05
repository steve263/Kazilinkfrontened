"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Wallet, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_TABS = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "ALL"] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_STYLE: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED:  "bg-green-100 text-green-700",
  FAILED:     "bg-red-100 text-red-700",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:    <Clock className="w-3 h-3" />,
  PROCESSING: <RefreshCw className="w-3 h-3 animate-spin" />,
  COMPLETED:  <CheckCircle className="w-3 h-3" />,
  FAILED:     <XCircle className="w-3 h-3" />,
};

interface Withdrawal {
  id: string;
  amount: number;
  phone: string;
  status: string;
  mpesaRef: string | null;
  failReason: string | null;
  createdAt: string;
  provider: {
    businessName: string;
    category: string;
    walletBalance: number;
    user: { name: string; phone: string };
  };
}

type ConfirmAction = { id: string; action: "approve" | "reject"; businessName: string; amount: number } | null;

export default function AdminWithdrawalsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [status, setStatus] = useState<StatusTab>("PENDING");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchWithdrawals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/withdrawals?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setWithdrawals(d.data.withdrawals);
      else toast.error(d.message);
    } catch {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [token, status]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  async function processWithdrawal(id: string, action: "approve" | "reject") {
    setProcessing(id);
    setConfirm(null);
    try {
      const r = await fetch(`${API}/api/admin/withdrawals/${id}/process`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success(action === "approve" ? "Payout sent via M-Pesa" : "Withdrawal rejected & refunded");
        fetchWithdrawals();
      } else {
        toast.error(d.message || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setProcessing(null);
    }
  }

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  if (!ready) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-right" />

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${
              confirm.action === "approve" ? "bg-green-100" : "bg-red-100"
            }`}>
              {confirm.action === "approve"
                ? <CheckCircle className="w-6 h-6 text-green-600" />
                : <XCircle className="w-6 h-6 text-red-500" />}
            </div>
            <h3 className="font-black text-kazi-dark text-lg text-center mb-1">
              {confirm.action === "approve" ? "Send M-Pesa Payout?" : "Reject Withdrawal?"}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              <span className="font-bold text-kazi-dark">{confirm.businessName}</span>
            </p>
            <p className="text-2xl font-black text-center text-kazi-orange mb-4">
              KSh {confirm.amount.toLocaleString()}
            </p>
            {confirm.action === "reject" && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-4 text-center">
                The amount will be refunded to the provider's wallet.
              </p>
            )}
            {confirm.action === "approve" && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2 mb-4 text-center">
                This will trigger an M-Pesa B2C transfer immediately.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => processWithdrawal(confirm.id, confirm.action)}
                className={`flex-1 py-3 font-bold rounded-xl text-white ${
                  confirm.action === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {confirm.action === "approve" ? "Send Payout" : "Reject"}
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
              >
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
            <h1 className="text-lg font-black text-kazi-dark">Withdrawals</h1>
            <p className="text-xs text-gray-400">
              {pendingCount > 0 ? `${pendingCount} pending approval` : "All caught up"}
            </p>
          </div>
        </div>
        <button onClick={fetchWithdrawals} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-5 max-w-6xl mx-auto">
        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                status === tab
                  ? "bg-kazi-dark text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Provider", "Amount", "M-Pesa Phone", "Wallet After", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : withdrawals.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Wallet className="w-10 h-10 opacity-30" />
                          <p className="font-semibold">No {status === "ALL" ? "" : status.toLowerCase()} withdrawals</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : withdrawals.map((w, i) => (
                    <tr
                      key={w.id}
                      className={`border-b border-gray-50 hover:bg-orange-50/20 transition-colors ${
                        i % 2 ? "bg-gray-50/40" : ""
                      }`}
                    >
                      {/* Provider */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-kazi-dark">{w.provider.businessName}</p>
                        <p className="text-xs text-gray-400">{w.provider.user.name} · {w.provider.category}</p>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span className="font-black text-kazi-orange text-base">
                          KSh {w.amount.toLocaleString()}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{w.phone}</td>

                      {/* Wallet balance after */}
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        KSh {w.provider.walletBalance.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[w.status] || "bg-gray-100"}`}>
                          {STATUS_ICON[w.status]}
                          {w.status.charAt(0) + w.status.slice(1).toLowerCase()}
                        </span>
                        {w.mpesaRef && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{w.mpesaRef}</p>
                        )}
                        {w.failReason && (
                          <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {w.failReason}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(w.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        <br />
                        {new Date(w.createdAt).toLocaleTimeString("en-KE", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {w.status === "PENDING" ? (
                          <div className="flex gap-1.5">
                            <button
                              disabled={processing === w.id}
                              onClick={() => setConfirm({
                                id: w.id,
                                action: "approve",
                                businessName: w.provider.businessName,
                                amount: w.amount,
                              })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Pay
                            </button>
                            <button
                              disabled={processing === w.id}
                              onClick={() => setConfirm({
                                id: w.id,
                                action: "reject",
                                businessName: w.provider.businessName,
                                amount: w.amount,
                              })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : w.status === "PROCESSING" ? (
                          <span className="text-xs text-blue-500 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Processing…
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!loading && withdrawals.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {withdrawals.length} record{withdrawals.length !== 1 ? "s" : ""}
              {status !== "ALL" && ` · ${status.charAt(0) + status.slice(1).toLowerCase()}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
