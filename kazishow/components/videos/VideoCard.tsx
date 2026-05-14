"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Share2, MoreVertical, Star, Calendar, Flag, Trash2, Download, Zap } from "lucide-react";
import toast from "react-hot-toast";
import VideoPlayer from "./VideoPlayer";
import CommentsSheet from "./CommentsSheet";
import ExpiryBadge from "@/components/ui/ExpiryBadge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface VideoData {
  id: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  hashtags: string[];
  rating?: number | null;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  expiresAt?: string;
  _count?: { comments: number };
  user: {
    id: string;
    name: string;
    role: string;
    profilePhoto?: string | null;
    provider?: {
      id: string;
      category: string;
      businessName: string;
      profileImage?: string | null;
    } | null;
  };
  provider?: {
    id: string;
    businessName: string;
    category: string;
  } | null;
}

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  FUNDI:        { label: "Fundi",        color: "bg-orange-500 text-white" },
  SHOP:         { label: "Shop",         color: "bg-blue-500 text-white" },
  HOTEL:        { label: "Hotel",        color: "bg-amber-500 text-white" },
  RESTAURANT:   { label: "Restaurant",   color: "bg-red-500 text-white" },
  TECH:         { label: "Tech",         color: "bg-purple-500 text-white" },
  PROFESSIONAL: { label: "Professional", color: "bg-teal-500 text-white" },
  BUSINESS:     { label: "Business",     color: "bg-blue-500 text-white" },
  CUSTOMER:     { label: "Customer",     color: "bg-green-500 text-white" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const REPORT_REASONS = ["Inappropriate", "Spam", "Fake", "Misleading"];

export default function VideoCard({
  video,
  currentUserId,
  onDelete,
}: {
  video: VideoData;
  currentUserId?: string | null;
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const [likes, setLikes] = useState(video.likes);
  const [liked, setLiked] = useState(video.likedByMe);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwn = currentUserId === video.user.id;
  const providerCategory = video.user.role === "PROVIDER" ? video.user.provider?.category || null : null;
  const badge = providerCategory
    ? ROLE_BADGE[providerCategory]
    : video.user.role === "CUSTOMER"
    ? ROLE_BADGE.CUSTOMER
    : ROLE_BADGE.BUSINESS;

  const ctaProviderId = video.user.provider?.id || video.provider?.id;

  async function toggleLike() {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("Login to like videos"); return; }
    const prev = liked;
    setLiked(!liked);
    setLikes((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch(`${API}/api/videos/${video.id}/like`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) { setLiked(prev); setLikes(video.likes); }
    } catch {
      setLiked(prev);
      setLikes(video.likes);
    }
  }

  async function handleReport(reason: string) {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("Login to report"); return; }
    setReportOpen(false);
    setMenuOpen(false);
    try {
      const res = await fetch(`${API}/api/videos/${video.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) toast.success("Video reported. Thank you!");
      else toast.error(data.message || "Already reported");
    } catch { toast.error("Network error"); }
  }

  async function handleDelete() {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    setMenuOpen(false);
    if (!confirm("Delete this video? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/videos/${video.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast.success("Video deleted"); onDelete?.(video.id); }
      else toast.error(data.message || "Failed to delete");
    } catch { toast.error("Network error"); }
  }

  async function handleDownload() {
    try {
      const res = await fetch(video.videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kazishow-video-${video.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(video.videoUrl, "_blank"); }
  }

  function share() {
    const url = `${window.location.origin}/videos/${video.id}`;
    if (navigator.share) {
      navigator.share({ title: video.user.name, text: video.caption, url });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  }

  return (
    <>
      {/* Portrait card — 9:16 like Instagram Reels / WhatsApp Status */}
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-xl">

        {/* Video fills the full card */}
        <VideoPlayer
          src={video.videoUrl}
          thumbnail={video.thumbnailUrl}
          className="absolute inset-0 w-full h-full"
        />

        {/* Gradient overlays: dark top + dark bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent via-40% to-black/80 pointer-events-none" />

        {/* KaziShow watermark — bottom-right corner */}
        <div className="absolute bottom-4 right-3 flex items-center gap-1 opacity-60 pointer-events-none">
          <div className="w-4 h-4 rounded-md bg-kazi-orange flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white" fill="white" />
          </div>
          <span className="text-white text-[10px] font-black tracking-tight drop-shadow">
            Kazi<span className="text-kazi-orange">Show</span>
          </span>
        </div>

        {/* ── Top bar: avatar + name + badge + menu ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-kazi-orange flex-shrink-0 flex items-center justify-center text-white text-sm font-black overflow-hidden ring-2 ring-white/30">
              {video.user.profilePhoto
                ? <img src={video.user.profilePhoto} className="w-full h-full object-cover" alt="" />
                : video.user.name.charAt(0).toUpperCase()
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white text-sm font-black drop-shadow truncate max-w-[120px]">
                  {video.user.name}
                </span>
                {badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full flex-shrink-0 ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/60 text-[10px]">{timeAgo(video.createdAt)} ago</span>
                {video.expiresAt && <ExpiryBadge expiresAt={video.expiresAt} />}
              </div>
            </div>
          </div>

          {/* Three-dot menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setReportOpen(false); }}
              className="text-white/80 hover:text-white p-1.5 transition-colors"
            >
              <MoreVertical className="w-5 h-5 drop-shadow" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 py-1 min-w-[140px]">
                {isOwn ? (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 w-full text-left"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                ) : (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 w-full text-left"
                  >
                    <Flag className="w-4 h-4" /> Report
                  </button>
                )}
              </div>
            )}
            {reportOpen && (
              <div className="absolute right-0 top-8 z-30 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 py-1 min-w-[160px]">
                <p className="px-4 py-2 text-[10px] text-gray-500 uppercase font-black tracking-wider border-b border-white/10">
                  Report reason
                </p>
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleReport(r)}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10"
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => { setReportOpen(false); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right side actions (TikTok / Reels style) ── */}
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
          {/* Like */}
          <button
            onClick={toggleLike}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${liked ? "text-red-500" : "text-white"}`}
          >
            <Heart className="w-7 h-7 drop-shadow" fill={liked ? "currentColor" : "none"} />
            <span className="text-xs font-bold drop-shadow">{likes}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => setCommentsOpen(true)}
            className="flex flex-col items-center gap-1 text-white transition-all active:scale-90"
          >
            <MessageCircle className="w-7 h-7 drop-shadow" />
            <span className="text-xs font-bold drop-shadow">{video._count?.comments ?? 0}</span>
          </button>

          {/* Share */}
          <button
            onClick={share}
            className="flex flex-col items-center gap-1 text-white transition-all active:scale-90"
          >
            <Share2 className="w-7 h-7 drop-shadow" />
            <span className="text-xs font-bold drop-shadow">Share</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1 text-white transition-all active:scale-90"
          >
            <Download className="w-7 h-7 drop-shadow" />
            <span className="text-xs font-bold drop-shadow">Save</span>
          </button>
        </div>

        {/* ── Bottom overlay: caption + hashtags + CTA ── */}
        <div className="absolute bottom-0 left-0 right-14 px-4 pb-5">
          {/* Caption */}
          <p className="text-white text-sm leading-relaxed drop-shadow line-clamp-3">{video.caption}</p>

          {/* Hashtags */}
          {video.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {video.hashtags.map((h) => (
                <span key={h} className="text-kazi-orange text-xs font-semibold drop-shadow">#{h}</span>
              ))}
            </div>
          )}

          {/* Customer review stars + provider ref */}
          {video.user.role === "CUSTOMER" && (video.rating || video.provider) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {video.rating && (
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5" fill={i < video.rating! ? "#F59E0B" : "none"} color={i < video.rating! ? "#F59E0B" : "#6B7280"} />
                  ))}
                </div>
              )}
              {video.provider && (
                <span className="text-white/60 text-xs">Re: <span className="text-white font-semibold">{video.provider.businessName}</span></span>
              )}
            </div>
          )}

          {/* Book Now CTA */}
          {video.user.role === "PROVIDER" && ctaProviderId && (
            <button
              onClick={() => router.push(`/business/${ctaProviderId}`)}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-kazi-orange text-white text-sm font-black rounded-xl hover:bg-orange-600 transition-all active:scale-95 shadow-lg"
            >
              <Calendar className="w-4 h-4" /> Book Now
            </button>
          )}
        </div>
      </div>

      <CommentsSheet
        videoId={video.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </>
  );
}
