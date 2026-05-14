"use client";
import { useState, useEffect, useCallback } from "react";
import { Video, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import VideoCard from "@/components/videos/VideoCard";
import VideoUploadModal from "@/components/videos/VideoUploadModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const FILTERS = [
  { id: "all",      label: "All Videos" },
  { id: "fundi",    label: "🔧 Fundis" },
  { id: "business", label: "🏪 Businesses" },
  { id: "customer", label: "⭐ Customer Reviews" },
];

function CardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden animate-pulse aspect-[9/16]" />
  );
}

export default function ShowReelPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
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

  function handlePosted(newVideo: any) {
    setVideos((prev) => [newVideo, ...prev]);
  }

  function handleDelete(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div className="min-h-screen bg-kazi-dark">
      <Navbar />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-white/10 sticky top-16 z-30">
        <div className="max-w-sm mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-kazi-orange flex items-center justify-center">
                <Video className="w-5 h-5 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-white font-black text-xl leading-tight">ShowReel</h1>
                <p className="text-gray-400 text-xs">Real videos from real people</p>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-kazi-orange text-white text-sm font-black rounded-xl hover:bg-orange-600 transition-all active:scale-95"
              >
                📹 Share Video
              </button>
            ) : (
              <a
                href="/auth/login"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                Login to share
              </a>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === f.id
                    ? "bg-kazi-orange text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feed ────────────────────────────────────────────────────────── */}
      <div className="max-w-sm mx-auto px-4 py-6">
        {loading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-white font-black text-lg mb-2">Cannot load videos</h3>
            <p className="text-gray-400 text-sm mb-5">Make sure the backend is running on port 5000</p>
            <button
              onClick={() => fetchVideos(filter)}
              className="flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all mx-auto"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-white font-black text-xl mb-2">No videos yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              {filter !== "all"
                ? "No videos found for this filter. Try a different one."
                : "Be the first to share a video on ShowReel!"}
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
        )}

        {!loading && !error && videos.length > 0 && (
          <div className="space-y-6">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                currentUserId={currentUser?.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pb-24 md:pb-8" />
      <BottomNav />

      {/* Upload modal */}
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
