"use client";
import { useState, useEffect } from "react";
import { useAdminGuard } from "@/middleware/adminGuard";
import { ChevronLeft, CheckCircle, XCircle, MessageSquare, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_BADGE: Record<string, string> = {
  PENDING:          "bg-amber-100 text-amber-700",
  UNDER_REVIEW:     "bg-blue-100 text-blue-700",
  MORE_INFO_NEEDED: "bg-orange-100 text-orange-700",
  APPROVED:         "bg-green-100 text-green-700",
  REJECTED:         "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:          "Pending",
  UNDER_REVIEW:     "Under Review",
  MORE_INFO_NEEDED: "More Info Needed",
  APPROVED:         "Approved",
  REJECTED:         "Rejected",
};

export default function AdminAppealsPage() {
  const ready = useAdminGuard();
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [actionModal, setActionModal] = useState<{ id: string; type: "approve" | "reject" | "info" } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [acting, setActing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, underReview: 0, approvedToday: 0, rejectedToday: 0 });

  const fetchAppeals = async (statusFilter?: string) => {
    const token = localStorage.getItem("kazishow_token");
    console.log("Fetching appeals, token:", token ? "exists" : "MISSING");
    if (!token) return;
    setLoading(true);
    try {
      const qs = (statusFilter || filter) !== "ALL" ? `?status=${statusFilter || filter}` : "";
      const res = await fetch(`${API_URL}/api/trust/admin/appeals${qs}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      console.log("Appeals response status:", res.status);
      const data = await res.json();
      console.log("Appeals data:", data);
      if (data.success) {
        setAppeals(data.data);
      } else {
        toast.error(`Failed to load appeals: ${data.message}`);
      }
    } catch (err: any) {
      console.error("Appeals fetch error:", err);
      toast.error(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    try {
      const [pending, review, all] = await Promise.all([
        fetch(`${API_URL}/api/trust/admin/appeals?status=PENDING`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/trust/admin/appeals?status=UNDER_REVIEW`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/trust/admin/appeals`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      const today = new Date().toDateString();
      const allAppeals: any[] = all.data || [];
      setStats({
        pending: pending.data?.length || 0,
        underReview: review.data?.length || 0,
        approvedToday: allAppeals.filter((a) => a.status === "APPROVED" && new Date(a.resolvedAt).toDateString() === today).length,
        rejectedToday: allAppeals.filter((a) => a.status === "REJECTED" && new Date(a.resolvedAt).toDateString() === today).length,
      });
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  useEffect(() => {
    if (!ready) return;
    fetchAppeals();
    fetchStats();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    fetchAppeals(filter);
  }, [filter, ready]);

  const handleAction = async () => {
    if (!actionModal) return;
    if (actionModal.type === "reject" && !actionNote.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    if (actionModal.type === "info" && !actionNote.trim()) {
      toast.error("Please enter your questions for the provider");
      return;
    }

    setActing(true);
    const token = localStorage.getItem("kazishow_token");
    const endpoint =
      actionModal.type === "approve" ? "approve" :
      actionModal.type === "reject"  ? "reject"  : "request-info";

    const body =
      actionModal.type === "approve" ? { adminNote: actionNote } :
      actionModal.type === "reject"  ? { reason: actionNote }    :
      { questions: actionNote };

    try {
      const res = await fetch(`${API_URL}/api/trust/admin/appeals/${actionModal.id}/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          actionModal.type === "approve" ? "Appeal approved — account reinstated!" :
          actionModal.type === "reject"  ? "Appeal rejected" : "More info requested"
        );
        setActionModal(null);
        setActionNote("");
        fetchAppeals();
        fetchStats();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Cannot connect to server");
    } finally {
      setActing(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-center" />

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-kazi-dark text-lg mb-2">
              {actionModal.type === "approve" ? "✅ Approve Appeal" :
               actionModal.type === "reject"  ? "❌ Reject Appeal" :
               "📋 Request More Information"}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {actionModal.type === "approve" ? "Add an optional note to the provider (e.g., what they should avoid in future)." :
               actionModal.type === "reject"  ? "Provide a clear reason for rejection. The provider will receive this message." :
               "What additional information do you need from the provider?"}
            </p>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder={
                actionModal.type === "approve" ? "Optional note for the provider..." :
                actionModal.type === "reject"  ? "Rejection reason (required)..." :
                "Your questions for the provider..."
              }
              rows={4}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setActionModal(null); setActionNote(""); }}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={acting}
                className={`flex-1 py-3 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
                  actionModal.type === "approve" ? "bg-green-500" :
                  actionModal.type === "reject"  ? "bg-red-500"   : "bg-amber-500"
                }`}
              >
                {acting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {actionModal.type === "approve" ? "Approve & Reinstate" :
                 actionModal.type === "reject"  ? "Reject Appeal" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-black text-kazi-dark text-xl">Suspension Appeals</h1>
              <p className="text-gray-400 text-xs">Review and respond to provider appeals</p>
            </div>
          </div>
          <button
            onClick={() => { fetchAppeals(); fetchStats(); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending",        value: stats.pending,        color: "text-amber-600 bg-amber-50" },
            { label: "Under Review",   value: stats.underReview,    color: "text-blue-600 bg-blue-50" },
            { label: "Approved Today", value: stats.approvedToday,  color: "text-green-600 bg-green-50" },
            { label: "Rejected Today", value: stats.rejectedToday,  color: "text-red-600 bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["PENDING", "UNDER_REVIEW", "MORE_INFO_NEEDED", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === s ? "bg-kazi-orange text-white" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Appeals list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appeals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">⚖️</p>
            <p className="font-semibold">No {STATUS_LABEL[filter].toLowerCase()} appeals</p>
            <p className="text-sm mt-1">Appeals will appear here when providers submit them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appeals.map((appeal) => (
              <div key={appeal.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                {/* Provider header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-black text-kazi-orange text-lg shrink-0">
                    {appeal.user?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-kazi-dark">{appeal.user?.name}</p>
                    <p className="text-xs text-gray-400">
                      {appeal.user?.provider?.businessName
                        ? `${appeal.user.provider.businessName} · ${appeal.user.provider.category}`
                        : appeal.user?.role}
                    </p>
                    <p className="text-xs text-gray-400">{appeal.user?.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[appeal.status]}`}>
                      {STATUS_LABEL[appeal.status]}
                    </span>
                    <span className="text-xs text-gray-300">
                      {new Date(appeal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Provider stats */}
                {appeal.user?.provider && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Rating",  value: appeal.user.provider.rating || "—" },
                      { label: "Reviews", value: appeal.user.provider.totalReviews || 0 },
                      { label: "Joined",  value: new Date(appeal.user.createdAt).getFullYear() },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="font-black text-kazi-dark text-sm">{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Appeal reason */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-gray-400 mb-1">APPEAL REASON</p>
                  <p className="text-sm font-semibold text-kazi-dark">{appeal.appealReason?.replace(/_/g, " ")}</p>
                </div>

                {/* Explanation */}
                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-400 mb-1">EXPLANATION</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{appeal.explanation}</p>
                </div>

                {/* Evidence */}
                {appeal.evidence?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 mb-2">EVIDENCE ({appeal.evidence.length} files)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {appeal.evidence.map((url: string, i: number) => (
                        <button key={i} onClick={() => window.open(url)} className="relative group">
                          <img src={url} alt="" className="w-full h-16 object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin note */}
                {appeal.adminNote && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-4">
                    <p className="text-xs font-bold text-blue-500 mb-1">ADMIN NOTE</p>
                    <p className="text-sm text-blue-700">{appeal.adminNote}</p>
                  </div>
                )}

                {/* Actions */}
                {["PENDING", "UNDER_REVIEW", "MORE_INFO_NEEDED"].includes(appeal.status) && (
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setActionModal({ id: appeal.id, type: "approve" })}
                      className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve — Reinstate Account
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActionModal({ id: appeal.id, type: "info" })}
                        className="flex-1 py-3 bg-amber-100 text-amber-700 font-bold rounded-xl text-sm hover:bg-amber-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" /> Need More Info
                      </button>
                      <button
                        onClick={() => setActionModal({ id: appeal.id, type: "reject" })}
                        className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl text-sm hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Reject Appeal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
