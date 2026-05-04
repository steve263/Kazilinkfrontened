"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Filter, CheckCircle, XCircle, Shield, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ApprovalCard from "@/components/admin/ApprovalCard";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const CATEGORIES = ["ALL", "FUNDI", "SHOP", "HOTEL", "RESTAURANT", "TECH", "PROFESSIONAL", "BUSINESS"];
const STATUSES   = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export default function ProvidersPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchPending = useCallback(async () => {
    if (!token) return;
    const r = await fetch(`${API}/api/admin/providers/pending`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    if (d.success) setPending(d.data);
  }, [token]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (category !== "ALL") params.set("category", category);
    if (status !== "ALL") params.set("status", status);
    const r = await fetch(`${API}/api/admin/providers?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    if (d.success) { setProviders(d.data.providers); setTotal(d.data.pagination.total); }
    setLoading(false);
  }, [token, page, search, category, status]);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  useEffect(() => { if (tab === "all") fetchAll(); }, [fetchAll, tab]);

  async function toggleVerified(id: string, current: boolean) {
    const r = await fetch(`${API}/api/admin/providers/${id}/toggle-verified`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    if (d.success) {
      toast.success(current ? "Verified badge removed" : "Provider verified!");
      fetchAll();
    }
  }

  if (!ready) return <div className="min-h-screen bg-kazi-dark flex items-center justify-center"><div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-right" />
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-1.5 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-kazi-dark">Provider Management</h1>
          <p className="text-xs text-gray-400">{total} providers total · {pending.length} pending</p>
        </div>
        <button onClick={() => { fetchPending(); fetchAll(); }} className="p-2 rounded-xl hover:bg-gray-100"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
      </div>

      <div className="p-5 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 card-shadow mb-5 w-fit">
          {(["pending", "all"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors capitalize ${tab === t ? "bg-kazi-orange text-white" : "text-gray-500 hover:text-kazi-orange"}`}>
              {t === "pending" ? `Pending (${pending.length})` : "All Providers"}
            </button>
          ))}
        </div>

        {tab === "pending" ? (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 card-shadow text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="font-bold text-gray-600">No pending applications</p>
              </div>
            ) : pending.map((p) => (
              <ApprovalCard key={p.id} provider={p} token={token}
                onAction={(id) => setPending((prev) => prev.filter((x) => x.id !== id))} />
            ))}
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 card-shadow">
                <Search className="w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search business name…" className="flex-1 text-sm outline-none" />
              </div>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="bg-white rounded-xl px-3 py-2.5 text-sm font-semibold card-shadow outline-none border-0">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="bg-white rounded-xl px-3 py-2.5 text-sm font-semibold card-shadow outline-none border-0">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Business", "Category", "Rating", "Bookings", "Status", "Verified", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                      ))
                    ) : providers.map((p, i) => (
                      <tr key={p.id} className={`border-b border-gray-50 hover:bg-orange-50/20 ${i % 2 ? "bg-gray-50/40" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-kazi-dark">{p.businessName}</p>
                          <p className="text-xs text-gray-400">{p.user?.phone}</p>
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{p.category}</span></td>
                        <td className="px-4 py-3 font-semibold text-kazi-amber">⭐ {p.rating?.toFixed(1)}</td>
                        <td className="px-4 py-3 text-gray-600">{p._count?.bookings}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[p.verificationStatus] || "bg-gray-100 text-gray-600"}`}>{p.verificationStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleVerified(p.id, p.isVerified)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${p.isVerified ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                            {p.isVerified ? "✓ Verified" : "Unverified"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {p.verificationStatus === "PENDING" && (
                              <>
                                <button onClick={async () => {
                                  const r = await fetch(`${API}/api/admin/providers/${p.id}/approve`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
                                  const d = await r.json();
                                  if (d.success) { toast.success("Approved!"); fetchAll(); }
                                }} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={async () => {
                                  const reason = prompt("Rejection reason:");
                                  if (!reason) return;
                                  const r = await fetch(`${API}/api/admin/providers/${p.id}/reject`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }) });
                                  const d = await r.json();
                                  if (d.success) { toast.success("Rejected"); fetchAll(); }
                                }} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="text-gray-500">Showing {providers.length} of {total}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="px-3 py-1.5 font-semibold text-kazi-dark">{page}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={providers.length < 20} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
