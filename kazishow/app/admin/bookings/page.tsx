"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight, Download } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_COLOR: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  ACCEPTED:    "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-600",
  DECLINED:    "bg-red-100 text-red-600",
  EN_ROUTE:    "bg-cyan-100 text-cyan-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  PREPARING:   "bg-orange-100 text-orange-700",
  READY:       "bg-teal-100 text-teal-700",
};

const PAYMENT_COLOR: Record<string, string> = {
  UNPAID:   "bg-gray-100 text-gray-600",
  PAID:     "bg-green-100 text-green-700",
  REFUNDED: "bg-blue-100 text-blue-700",
};

const STATUSES = ["ALL","PENDING","ACCEPTED","EN_ROUTE","IN_PROGRESS","COMPLETED","CANCELLED","DECLINED","PREPARING","READY"];

export default function BookingsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status !== "ALL") params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const r = await fetch(`${API}/api/admin/bookings?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    if (d.success) { setBookings(d.data.bookings); setTotal(d.data.pagination.total); }
    setLoading(false);
  }, [token, page, search, status, dateFrom, dateTo]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function changePaymentStatus(id: string, newPaymentStatus: string) {
    const r = await fetch(`${API}/api/admin/bookings/${id}/payment-status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentStatus: newPaymentStatus }),
    });
    const d = await r.json();
    if (d.success) {
      toast.success(`Payment marked as ${newPaymentStatus}`);
      setEditingPayment(null);
      fetchBookings();
    } else {
      toast.error(d.message);
    }
  }

  async function changeStatus(id: string, newStatus: string) {
    const r = await fetch(`${API}/api/admin/bookings/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    const d = await r.json();
    if (d.success) { toast.success("Status updated"); fetchBookings(); setSelected(null); }
    else toast.error(d.message);
  }

  if (!ready) return <div className="min-h-screen bg-kazi-dark flex items-center justify-center"><div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-right" />

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-3">
            <h3 className="font-black text-kazi-dark text-lg">Booking Details</h3>
            <div className="text-sm space-y-2">
              {[
                ["ID", selected.id],
                ["Customer", `${selected.customer?.name} · ${selected.customer?.phone}`],
                ["Provider", `${selected.provider?.businessName} (${selected.provider?.category})`],
                ["Service", selected.service?.name || "—"],
                ["Date", selected.scheduledDate ? new Date(selected.scheduledDate).toLocaleDateString("en-KE") : "—"],
                ["Time", selected.scheduledTime],
                ["Address", selected.address],
                ["Amount", `KSh ${selected.totalAmount?.toLocaleString()}`],
                ["Payment", selected.paymentStatus],
                ["M-Pesa Ref", selected.mpesaRef || "—"],
                ["Notes", selected.notes || "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-gray-50 pb-1.5">
                  <span className="text-gray-400 flex-shrink-0">{label}</span>
                  <span className="font-semibold text-kazi-dark text-right">{val}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Change Status (Admin Override)</p>
              <div className="flex flex-wrap gap-1.5">
                {["ACCEPTED","COMPLETED","CANCELLED"].map((s) => (
                  <button key={s} onClick={() => changeStatus(selected.id, s)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${STATUS_COLOR[s] || "bg-gray-100 text-gray-600"} hover:opacity-80`}>
                    → {s}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="w-full py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-1.5 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-kazi-dark">Bookings Management</h1>
          <p className="text-xs text-gray-400">{total} bookings total</p>
        </div>
        <button onClick={fetchBookings} className="p-2 rounded-xl hover:bg-gray-100"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
        <a
          href={`${API}/api/admin/export?type=bookings${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            const url = `${API}/api/admin/export?type=bookings${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`;
            const a = document.createElement("a");
            a.href = url;
            (a as any).headers = { Authorization: `Bearer ${token}` };
            fetch(url, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => r.blob())
              .then((blob) => {
                const bUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = bUrl;
                link.download = `kazishow-bookings-${new Date().toISOString().split("T")[0]}.csv`;
                link.click();
              });
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-kazi-orange text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      <div className="p-5 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 card-shadow">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search customer or provider…" className="flex-1 text-sm outline-none" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-white rounded-xl px-3 py-2.5 text-sm font-semibold card-shadow outline-none">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white rounded-xl px-3 py-2.5 text-sm card-shadow outline-none" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-white rounded-xl px-3 py-2.5 text-sm card-shadow outline-none" />
        </div>

        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Customer","Provider","Service","Date","Amount","Payment","Status",""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                )) : bookings.map((b, i) => (
                  <tr key={b.id} className={`border-b border-gray-50 hover:bg-orange-50/20 ${i % 2 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-4 py-3 font-medium text-kazi-dark cursor-pointer" onClick={() => setSelected(b)}>{b.customer?.name}</td>
                    <td className="px-4 py-3 text-gray-600 cursor-pointer" onClick={() => setSelected(b)}>{b.provider?.businessName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs cursor-pointer" onClick={() => setSelected(b)}>{b.service?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs cursor-pointer" onClick={() => setSelected(b)}>{new Date(b.scheduledDate || b.createdAt).toLocaleDateString("en-KE")}</td>
                    <td className="px-4 py-3 font-semibold cursor-pointer" onClick={() => setSelected(b)}>KSh {b.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {editingPayment === b.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <select
                            autoFocus
                            defaultValue={b.paymentStatus}
                            onChange={(e) => changePaymentStatus(b.id, e.target.value)}
                            onBlur={() => setEditingPayment(null)}
                            className="text-xs font-bold border-2 border-kazi-orange rounded-lg px-2 py-1 outline-none bg-white"
                          >
                            <option value="UNPAID">UNPAID</option>
                            <option value="PAID">PAID</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PAYMENT_COLOR[b.paymentStatus] || "bg-gray-100"}`}>
                            {b.paymentStatus}
                          </span>
                          <button
                            onClick={() => setEditingPayment(b.id)}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 hover:bg-kazi-orange hover:text-white text-gray-500 rounded-lg font-bold transition-colors"
                            title="Edit payment status"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(b)}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-kazi-orange font-semibold cursor-pointer" onClick={() => setSelected(b)}>Details →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {bookings.length} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 py-1 font-semibold">{page} / {Math.ceil(total / 20) || 1}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={bookings.length < 20} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
