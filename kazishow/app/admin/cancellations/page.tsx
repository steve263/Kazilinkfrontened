"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  XCircle, DollarSign, Clock, CheckCircle, Search, RefreshCw,
  ChevronLeft, ChevronRight, Filter, ArrowLeft, Phone,
  AlertTriangle, Banknote, CreditCard,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const REFUND_STATUS_STYLE: Record<string, string> = {
  PENDING:        "bg-amber-100 text-amber-700 border-amber-200",
  REFUNDED:       "bg-green-100 text-green-700 border-green-200",
  NOT_APPLICABLE: "bg-gray-100 text-gray-500 border-gray-200",
};

const REFUND_STATUS_LABEL: Record<string, string> = {
  PENDING:        "Refund Pending",
  REFUNDED:       "Refunded",
  NOT_APPLICABLE: "No Payment",
};

type Filter = "ALL" | "PENDING_REFUND" | "REFUNDED" | "NOT_APPLICABLE";

export default function CancellationsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pendingRefundAmount, setPendingRefundAmount] = useState(0);
  const [pendingRefunds, setPendingRefunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cancellations" | "refund_requests">("cancellations");

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, page: String(page), limit: "20" });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API}/api/bookings/admin/cancellations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCancellations(data.data.cancellations);
        setRefundRequests(data.data.refundRequests || []);
        setSummary(data.data.summary);
        setPendingRefunds(data.data.pendingRefunds);
        setPendingRefundAmount(data.data.pendingRefundAmount);
        setPagination(data.data.pagination);
      }
    } catch {
      toast.error("Failed to load cancellations");
    } finally {
      setLoading(false);
    }
  }, [token, filter, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markRefundDone = async (id: string) => {
    if (!confirm("Mark this refund as processed? This confirms you have sent the money.")) return;
    setMarkingId(id);
    try {
      const res = await fetch(`${API}/api/bookings/admin/cancellations/${id}/refund-processed`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Refund marked as processed");
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setMarkingId(null);
    }
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "ALL",            label: "All" },
    { key: "PENDING_REFUND", label: "Pending Refund" },
    { key: "REFUNDED",       label: "Refunded" },
    { key: "NOT_APPLICABLE", label: "No Payment" },
  ];

  if (!ready) return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-right" />

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-kazi-dark">Cancellations & Refunds</h1>
          <p className="text-xs text-gray-400">All booking cancellations and refund requests</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-5 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-gray-400 font-semibold">Total Cancellations</p>
            </div>
            <p className="text-2xl font-black text-gray-800">{summary?.totalCancellations ?? "—"}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-gray-400 font-semibold">Pending Refunds</p>
            </div>
            <p className="text-2xl font-black text-amber-600">{pendingRefunds}</p>
            <p className="text-xs text-amber-500 mt-0.5">KSh {pendingRefundAmount.toLocaleString()} owed</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-400 font-semibold">Refunds Processed</p>
            </div>
            <p className="text-2xl font-black text-green-600">{summary?.totalRefunded ?? "—"}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-gray-400 font-semibold">Total Refund Amount</p>
            </div>
            <p className="text-xl font-black text-blue-600">
              KSh {(summary?.totalRefundAmount ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab("cancellations")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === "cancellations" ? "bg-kazi-dark text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Cancellations
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-black ${activeTab === "cancellations" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
              {pagination.total}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("refund_requests")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === "refund_requests" ? "bg-kazi-dark text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            M-Pesa Refund Requests
            {refundRequests.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${activeTab === "refund_requests" ? "bg-red-400 text-white" : "bg-red-100 text-red-600"}`}>
                {refundRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "cancellations" && (
          <>
            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by customer, provider, reason…"
                  className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400 self-center shrink-0" />
                {FILTERS.map((f) => (
                  <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      filter === f.key
                        ? "bg-kazi-dark text-white border-kazi-dark"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancellations list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
              </div>
            ) : cancellations.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <XCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-500">No cancellations found</p>
                <p className="text-sm text-gray-400 mt-1">Try changing your filters</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_120px_120px_110px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                  {["Customer", "Provider", "Service", "Cancelled By", "Refund", "Action"].map((h) => (
                    <p key={h} className="text-xs font-black text-gray-400 uppercase tracking-wide">{h}</p>
                  ))}
                </div>

                {cancellations.map((c, i) => (
                  <div key={c.id}
                    className={`p-4 sm:px-5 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-kazi-dark">
                            {c.booking?.customer?.name}
                            <span className="text-gray-400 font-normal mx-1">→</span>
                            {c.booking?.provider?.businessName}
                          </p>
                          <p className="text-xs text-gray-400">{c.booking?.service?.name}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${REFUND_STATUS_STYLE[c.refundStatus] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {REFUND_STATUS_LABEL[c.refundStatus] || c.refundStatus}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-semibold">Reason:</span> {c.reason}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">By: <span className="font-semibold text-gray-600">{c.user?.name}</span> ({c.user?.role})</p>
                          {c.booking?.customer?.phone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />{c.booking.customer.phone}
                            </p>
                          )}
                          <p className="text-xs text-gray-300 mt-0.5">{new Date(c.createdAt).toLocaleDateString("en-KE")}</p>
                        </div>
                        <div className="text-right">
                          {c.refundAmount > 0 && (
                            <p className="text-sm font-black text-kazi-orange">KSh {c.refundAmount.toLocaleString()}</p>
                          )}
                          {c.refundStatus === "PENDING" && c.refundAmount > 0 && (
                            <button onClick={() => markRefundDone(c.id)} disabled={markingId === c.id}
                              className="mt-1 text-xs px-3 py-1.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50">
                              {markingId === c.id ? "..." : "Mark Sent"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_120px_120px_110px] gap-3 items-center">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-kazi-dark truncate">{c.booking?.customer?.name}</p>
                        {c.booking?.customer?.phone && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{c.booking.customer.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-300">{new Date(c.createdAt).toLocaleDateString("en-KE")}</p>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{c.booking?.provider?.businessName}</p>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600 truncate">{c.booking?.service?.name || "—"}</p>
                        <p className="text-xs text-gray-400 truncate" title={c.reason}>{c.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{c.user?.name}</p>
                        <p className="text-xs text-gray-400">{c.user?.role}</p>
                      </div>
                      <div>
                        {c.refundAmount > 0 ? (
                          <>
                            <p className="text-sm font-black text-kazi-orange">KSh {c.refundAmount.toLocaleString()}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${REFUND_STATUS_STYLE[c.refundStatus] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                              {REFUND_STATUS_LABEL[c.refundStatus] || c.refundStatus}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No payment</span>
                        )}
                      </div>
                      <div>
                        {c.refundStatus === "PENDING" && c.refundAmount > 0 && (
                          <button onClick={() => markRefundDone(c.id)} disabled={markingId === c.id}
                            className="text-xs px-3 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 w-full">
                            {markingId === c.id ? "..." : "✓ Mark Sent"}
                          </button>
                        )}
                        {c.refundStatus === "REFUNDED" && (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Page {page} of {pagination.pages} · {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "refund_requests" && (
          <div className="space-y-3">
            {refundRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-500">No M-Pesa refund requests</p>
                <p className="text-sm text-gray-400 mt-1">Customers who paid via M-Pesa and had their booking declined or cancelled will appear here</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">Action Required</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      These customers paid via M-Pesa but their booking was declined or cancelled.
                      Send the refund via M-Pesa B2C to the customer&apos;s phone number.
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {refundRequests.map((b, i) => (
                    <div key={b.id}
                      className={`p-4 sm:p-5 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-kazi-dark">
                              {b.customer?.name}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">{b.status}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{b.service?.name} · {b.provider?.businessName}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                              <Phone className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-sm font-black text-green-700">{b.customer?.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                              <Banknote className="w-3.5 h-3.5 text-kazi-orange" />
                              <span className="text-sm font-black text-kazi-orange">KSh {b.totalAmount?.toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 mt-2">
                            Ref: {b.id.slice(-10).toUpperCase()} · {new Date(b.updatedAt || b.createdAt).toLocaleDateString("en-KE")}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-600 border border-blue-200">
                            REFUND REQUESTED
                          </span>
                          <p className="text-xs text-gray-400 mt-2">Send via M-Pesa B2C</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
