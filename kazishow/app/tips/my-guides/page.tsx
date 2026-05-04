"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MyGuidesPage() {
  const router = useRouter();
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"all" | "draft" | "pending" | "approved" | "rejected">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchMyTips();
  }, []);

  const fetchMyTips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API}/api/tips/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) setTips(data.data);
    } catch (error) {
      console.error("Failed to fetch tips:", error);
      toast.error("Failed to load your guides");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this guide?")) return;

    try {
      setDeleting(id);
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API}/api/tips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTips(tips.filter((t) => t.id !== id));
        toast.success("Guide deleted");
      } else {
        toast.error("Failed to delete guide");
      }
    } catch (error) {
      toast.error("Error deleting guide");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "DRAFT") return "gray";
    if (status === "PENDING") return "amber";
    if (status === "APPROVED") return "green";
    if (status === "REJECTED") return "red";
    return "gray";
  };

  const getStatusBgColor = (status: string) => {
    const color = getStatusColor(status);
    if (color === "gray") return "bg-gray-100 text-gray-700";
    if (color === "amber") return "bg-amber-100 text-amber-700";
    if (color === "green") return "bg-green-100 text-green-700";
    if (color === "red") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const filtered = tips.filter((t) => {
    if (selectedTab === "all") return true;
    return t.status === selectedTab.toUpperCase();
  });

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/tips" className="flex items-center gap-2 text-sm text-gray-600 hover:text-kazi-orange transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-2xl font-black text-kazi-dark">My Guides</h1>
          <Link href="/tips/create" className="text-sm text-kazi-orange font-semibold hover:text-orange-600 transition-colors">
            Write New
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1">
          {["all", "draft", "pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                selectedTab === tab
                  ? "border-kazi-orange text-kazi-orange"
                  : "border-transparent text-gray-600 hover:text-kazi-orange"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      {loading ? (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </section>
      ) : filtered.length === 0 ? (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-gray-600 mb-4">No guides in this category yet.</p>
          <Link href="/tips/create" className="text-kazi-orange font-semibold hover:underline">
            Create your first guide →
          </Link>
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-3">
            {filtered.map((tip) => (
              <div key={tip.id} className="bg-white rounded-2xl p-5 sm:p-6 card-shadow hover:card-shadow-hover transition-all flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-black text-kazi-dark truncate">{tip.title}</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getStatusBgColor(tip.status)}`}>
                      {tip.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{tip.excerpt}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{tip.category}</span>
                    <span>
                      {new Date(tip.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>{tip.views} views</span>
                    <span>{tip.likes} likes</span>
                  </div>

                  {tip.status === "REJECTED" && tip.rejectReason && (
                    <p className="text-xs text-red-600 mt-2 bg-red-50 px-3 py-2 rounded-lg">
                      <span className="font-semibold">Rejection reason:</span> {tip.rejectReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(tip.status === "DRAFT" || tip.status === "REJECTED") && (
                    <Link
                      href={`/tips/${tip.id}/edit`}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  )}

                  {tip.status === "REJECTED" && (
                    <button
                      title="Resubmit"
                      className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(tip.id)}
                    disabled={deleting === tip.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
      <WhatsAppBubble />
    </div>
  );
}
