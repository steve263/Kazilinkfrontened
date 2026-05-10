"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, Ban, CheckCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ROLE_COLOR: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-700",
  PROVIDER: "bg-orange-100 text-kazi-orange",
  ADMIN:    "bg-purple-100 text-purple-700",
};

export default function UsersPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ id: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (role !== "ALL") params.set("role", role);
    const r = await fetch(`${API}/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    if (d.success) { setUsers(d.data.users); setTotal(d.data.pagination.total); }
    setLoading(false);
  }, [token, page, search, role]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSuspend = async () => {
    if (!suspendModal) return;
    if (!suspendReason.trim()) { toast.error("Please enter a suspension reason"); return; }
    setSuspending(true);
    try {
      const r = await fetch(`${API}/api/trust/admin/users/${suspendModal.id}/suspend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: suspendReason }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success(`${suspendModal.name} suspended. User notified via SMS.`);
        setSuspendModal(null);
        setSuspendReason("");
        fetchUsers();
      } else {
        toast.error(d.message);
      }
    } catch {
      toast.error("Failed to suspend user");
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspend = async (id: string, name: string) => {
    const r = await fetch(`${API}/api/trust/admin/users/${id}/unsuspend`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    if (d.success) {
      toast.success(`${name} reinstated`);
      fetchUsers();
    } else {
      toast.error(d.message);
    }
  };

  async function deleteUser(id: string) {
    const r = await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    if (d.success) {
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
    } else toast.error(d.message);
    setConfirmDelete(null);
  }

  if (!ready) return <div className="min-h-screen bg-kazi-dark flex items-center justify-center"><div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-right" />

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-black text-kazi-dark text-lg mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-5">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteUser(confirmDelete)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-black text-kazi-dark text-lg mb-1">🚫 Suspend Account</h3>
            <p className="text-gray-500 text-sm mb-4">
              <span className="font-semibold text-gray-700">{suspendModal.name}</span> will be immediately notified via SMS and push notification.
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter reason for suspension (required)..."
              rows={3}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-red-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setSuspendModal(null); setSuspendReason(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={suspending || !suspendReason.trim()}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {suspending
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : "🚫 Suspend & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-1.5 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-kazi-dark">User Management</h1>
          <p className="text-xs text-gray-400">{total} users total</p>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-xl hover:bg-gray-100"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
      </div>

      <div className="p-5 max-w-6xl mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 card-shadow">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or phone…" className="flex-1 text-sm outline-none" />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="bg-white rounded-xl px-3 py-2.5 text-sm font-semibold card-shadow outline-none">
            {["ALL", "CUSTOMER", "PROVIDER", "ADMIN"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Name", "Phone", "Role", "Location", "Bookings", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                )) : users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-orange-50/20 ${i % 2 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-4 py-3 font-bold text-kazi-dark">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_COLOR[u.role] || "bg-gray-100"}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.location || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{u._count?.bookingsAsCustomer ?? 0}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("en-KE")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.isSuspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== "ADMIN" && (
                        <div className="flex gap-1">
                          {u.isSuspended ? (
                            <button
                              onClick={() => handleUnsuspend(u.id, u.name)}
                              title="Reinstate"
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspendModal({ id: u.id, name: u.name })}
                              title="Suspend"
                              className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete(u.id)} title="Delete"
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {users.length} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 py-1 font-semibold">{page} / {Math.ceil(total / 20) || 1}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
