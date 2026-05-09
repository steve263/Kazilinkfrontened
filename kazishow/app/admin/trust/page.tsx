"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, AlertTriangle, Flag, CheckCircle, XCircle, Ban, RefreshCw, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const SEVERITY_COLOR: Record<string, string> = {
  LOW:      "bg-gray-100 text-gray-600",
  MEDIUM:   "bg-amber-100 text-amber-700",
  HIGH:     "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:       "bg-yellow-100 text-yellow-700",
  INVESTIGATING: "bg-blue-100 text-blue-700",
  RESOLVED:      "bg-green-100 text-green-700",
  DISMISSED:     "bg-gray-100 text-gray-500",
};

export default function AdminTrustPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"reports" | "alerts" | "suspended">("reports");
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suspended, setSuspended] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionNote, setActionNote] = useState<Record<string, string>>({});

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const [statsRes, suspRes] = await Promise.all([
      fetch(`${API}/api/trust/admin/stats`, { headers: h }),
      fetch(`${API}/api/users?suspended=true`, { headers: h }),
    ]);
    const s = await statsRes.json();
    if (s.success) setStats(s.data);
    const su = await suspRes.json();
    if (su.success) setSuspended((su.data?.users || []).filter((u: any) => u.isSuspended));
  }, [token]);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${API}/api/trust/admin/reports`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setReports(data.data);
    setLoading(false);
  }, [token]);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${API}/api/trust/admin/fraud-alerts`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setAlerts(data.data);
    setLoading(false);
  }, [token]);

  const fetchSuspended = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${API}/api/admin/users?page=1&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setSuspended((data.data?.users || []).filter((u: any) => u.isSuspended));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchStats();
    if (tab === "reports") fetchReports();
    if (tab === "alerts") fetchAlerts();
    if (tab === "suspended") fetchSuspended();
  }, [token, tab, fetchStats, fetchReports, fetchAlerts, fetchSuspended]);

  const resolveReport = async (id: string, action?: string) => {
    const note = actionNote[id] || "";
    const res = await fetch(`${API}/api/trust/admin/reports/${id}/resolve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ adminNote: note, action }),
    });
    const data = await res.json();
    if (data.success) { toast.success("Report resolved"); fetchReports(); fetchStats(); }
    else toast.error(data.message);
  };

  const dismissReport = async (id: string) => {
    const res = await fetch(`${API}/api/trust/admin/reports/${id}/dismiss`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) { toast.success("Report dismissed"); fetchReports(); fetchStats(); }
    else toast.error(data.message);
  };

  const resolveAlert = async (id: string) => {
    const res = await fetch(`${API}/api/trust/admin/fraud-alerts/${id}/resolve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) { toast.success("Alert resolved"); fetchAlerts(); fetchStats(); }
    else toast.error(data.message);
  };

  const suspendUser = async (userId: string) => {
    const reason = prompt("Reason for suspension:");
    if (!reason) return;
    const res = await fetch(`${API}/api/trust/admin/users/${userId}/suspend`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (data.success) { toast.success("User suspended"); fetchStats(); fetchReports(); }
    else toast.error(data.message);
  };

  const unsuspendUser = async (userId: string) => {
    const res = await fetch(`${API}/api/trust/admin/users/${userId}/unsuspend`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) { toast.success("User reinstated"); fetchSuspended(); fetchStats(); }
    else toast.error(data.message);
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600"><ChevronRight className="w-5 h-5 rotate-180" /></Link>
          <Shield className="w-6 h-6 text-red-500" />
          <h1 className="font-black text-xl text-gray-900">Trust & Safety</h1>
        </div>
        <button onClick={() => { fetchStats(); if (tab === "reports") fetchReports(); if (tab === "alerts") fetchAlerts(); if (tab === "suspended") fetchSuspended(); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Pending Reports", value: stats.pendingReports, color: "text-red-500", bg: "bg-red-50 border-red-200" },
              { label: "Fraud Alerts",    value: stats.fraudAlerts,    color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
              { label: "Suspended Users", value: stats.suspendedUsers, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              { label: "Resolved Today",  value: stats.resolvedToday,  color: "text-green-500", bg: "bg-green-50 border-green-200" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
                <p className={`font-black text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white border rounded-2xl p-1">
          {(["reports", "alerts", "suspended"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${
                tab === t ? "bg-kazi-orange text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "reports" ? "📋 Reports" : t === "alerts" ? "🚨 Fraud Alerts" : "🚫 Suspended"}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-kazi-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* Reports tab */}
        {!loading && tab === "reports" && (
          <div className="space-y-4">
            {reports.length === 0 && <p className="text-center text-gray-400 py-12">No reports yet</p>}
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] || "bg-gray-100 text-gray-500"}`}>
                        {r.status}
                      </span>
                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.type}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      <span className="text-red-500">{r.reporter?.name}</span> reported <span className="text-gray-900">{r.reported?.name}</span>
                      <span className="text-gray-400 text-xs ml-1">({r.reported?.role})</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {r.status === "PENDING" && (
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <input
                      placeholder="Admin note (optional)..."
                      value={actionNote[r.id] || ""}
                      onChange={(e) => setActionNote((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-kazi-orange"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveReport(r.id)}
                        className="flex-1 py-2 bg-green-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Resolve
                      </button>
                      <button
                        onClick={() => resolveReport(r.id, "SUSPEND")}
                        className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1"
                      >
                        <Ban className="w-4 h-4" /> Resolve + Suspend
                      </button>
                      <button
                        onClick={() => dismissReport(r.id)}
                        className="flex-1 py-2 bg-gray-200 text-gray-600 text-sm font-bold rounded-xl flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Dismiss
                      </button>
                    </div>
                  </div>
                )}
                {r.adminNote && (
                  <p className="text-xs text-gray-400 mt-2 italic">Note: {r.adminNote}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fraud alerts tab */}
        {!loading && tab === "alerts" && (
          <div className="space-y-4">
            {alerts.length === 0 && <p className="text-center text-gray-400 py-12">No active fraud alerts</p>}
            {alerts.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[a.severity] || "bg-gray-100 text-gray-500"}`}>
                        {a.severity}
                      </span>
                      <span className="text-xs text-gray-500 font-bold">{a.type}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {a.user?.name} <span className="text-gray-400 font-normal">({a.user?.role})</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => resolveAlert(a.id)}
                      className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-xl"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => suspendUser(a.userId)}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-xl"
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suspended users tab */}
        {!loading && tab === "suspended" && (
          <div className="space-y-4">
            {suspended.length === 0 && <p className="text-center text-gray-400 py-12">No suspended users</p>}
            {suspended.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-800">{u.name}</p>
                  <p className="text-sm text-gray-500">{u.phone} · {u.role}</p>
                </div>
                <button
                  onClick={() => unsuspendUser(u.id)}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-xl flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Reinstate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
