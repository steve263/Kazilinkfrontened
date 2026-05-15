"use client";
import { useState, useEffect, useCallback } from "react";
import { Video, RefreshCw, Plus } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import VideoCard from "@/components/videos/VideoCard";
import VideoUploadModal from "@/components/videos/VideoUploadModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const FILTERS = [
  { id: "all",      label: "For You" },
  { id: "fundi",    label: "🔧 Fundis" },
  { id: "business", label: "🏪 Business" },
  { id: "customer", label: "⭐ Reviews" },
];

export default function ShowReelPage() {
  const [videos, setVideos]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filter, setFilter]       = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kazishow_user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
  }, []);

  const fetchVideos = useCallback(async (type = filter) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("kazishow_token");
      const params = type !== "all" ? `?type=${type}` : "";
      const res = await fetch(`${API}/api/videos${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setVideos(data.data);
      else setError(data.message || "Failed to load videos");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchVideos(filter); }, [filter]);

  function handlePosted(v: any) { setVideos((p) => [v, ...p]); }
  function handleDelete(id: string) { setVideos((p) => p.filter((v) => v.id !== id)); }

  return (
    /* Full-screen black canvas — no outer scroll, everything inside snaps */
    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* ── Snap-scroll feed — one video per "page" ── */}
      <div
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="snap-start flex-shrink-0 bg-gray-900 animate-pulse"
              style={{ height: "100dvh" }}
            />
          ))
        ) : error ? (
          <div
            className="snap-start flex-shrink-0 flex flex-col items-center justify-center text-center px-6"
            style={{ height: "100dvh" }}
          >
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-white font-black text-lg mb-2">Cannot load videos</h3>
            <p className="text-gray-400 text-sm mb-5">Check your connection and try again</p>
            <button
              onClick={() => fetchVideos(filter)}
              className="flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div
            className="snap-start flex-shrink-0 flex flex-col items-center justify-center text-center px-6"
            style={{ height: "100dvh" }}
          >
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-white font-black text-xl mb-2">No videos yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              {filter !== "all" ? "No videos for this filter." : "Be the first to share!"}
            </p>
            {currentUser && (
              <button
                onClick={() => setUploadOpen(true)}
                className="px-6 py-3 bg-kazi-orange text-white font-black rounded-xl hover:bg-orange-600 transition-all"
              >
                📹 Share First Video
              </button>
            )}
          </div>
        ) : (
          videos.map((v) => (
            /* Each slot = exactly one screen height — snap locks scroll here */
            <div
              key={v.id}
              className="snap-start flex-shrink-0 relative"
              style={{ height: "100dvh" }}
            >
              <VideoCard
                video={v}
                currentUserId={currentUser?.id}
                onDelete={handleDelete}
              />
            </div>
          ))
        )}
      </div>

      {/* ── Floating top overlay (filter tabs + upload) ── */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        {/* Logo + upload button */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-kazi-orange flex items-center justify-center shadow-lg">
              <Video className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-white font-black text-lg drop-shadow-lg">
              Show<span className="text-kazi-orange">Reel</span>
            </span>
          </div>
          {currentUser ? (
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-kazi-orange text-white text-xs font-black rounded-xl shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Share
            </button>
          ) : (
            <a
              href="/auth/login"
              className="px-3 py-2 bg-black/40 backdrop-blur-sm text-white text-xs font-bold rounded-xl border border-white/20"
            >
              Login
            </a>
          )}
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-2 px-4 pb-3 overflow-x-auto pointer-events-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all backdrop-blur-sm ${
                filter === f.id
                  ? "bg-white text-kazi-dark shadow"
                  : "bg-black/40 text-white border border-white/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom Nav stays fixed over the feed ── */}
      <BottomNav />

      {currentUser && (
        <VideoUploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          userRole={currentUser.role}
          onPosted={handlePosted}
        />
      )}
    </div>
  );
}
