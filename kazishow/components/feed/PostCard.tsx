"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  HardHat, Store, CheckCircle, UserPlus, UserCheck, Tag, Download, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface FeedPost {
  id: string;
  caption: string;
  image?: string | null;
  type: "WORK" | "PROMOTION" | "UPDATE";
  hashtags: string[];
  discountPct?: number | null;
  originalPrice?: number | null;
  discountedPrice?: number | null;
  promoUntil?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  provider: {
    id: string;
    businessName: string;
    category: string;
    badge?: string | null;
    isVerified: boolean;
    isFollowed: boolean;
    user: { id: string; name: string; location?: string | null };
  };
}

interface Props {
  post: FeedPost;
  token?: string | null;
  onOpenComments?: (postId: string) => void;
}

const TYPE_COLOR: Record<string, string> = {
  PROMOTION: "bg-green-500",
  UPDATE: "bg-blue-500",
  WORK: "bg-kazi-orange",
};

const TYPE_LABEL: Record<string, string> = {
  PROMOTION: "Promo",
  UPDATE: "Update",
  WORK: "Work",
};

export default function PostCard({ post, token, onOpenComments }: Props) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [followed, setFollowed] = useState(post.provider?.isFollowed ?? false);
  const [lightbox, setLightbox] = useState(false);

  if (!post.provider) return null;
  const [likeLoading, setLikeLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isFundi = post.provider.category === "FUNDI";

  async function handleLike() {
    if (!token) return;
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    setLikeLoading(true);
    try {
      await fetch(`${API}/api/posts/${post.id}/like`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleFollow() {
    if (!token) return;
    setFollowed((v) => !v);
    setFollowLoading(true);
    try {
      await fetch(`${API}/api/follows/${post.provider.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleDownload() {
    if (!post.image) return;
    try {
      const res = await fetch(post.image);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kazishow-${post.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(post.image, "_blank");
    }
  }

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <Link href={`/business/${post.provider.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border-2 border-kazi-orange">
              <span className="text-kazi-orange font-bold text-sm">
                {post.provider.businessName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-kazi-dark truncate">{post.provider.businessName}</span>
              {post.provider.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 text-kazi-orange flex-shrink-0" fill="#FF6B2B" />
              )}
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 ${TYPE_COLOR[post.type]} text-white text-xs font-bold rounded-full flex-shrink-0`}>
                {post.type === "PROMOTION" && <Tag className="w-2.5 h-2.5" />}
                {TYPE_LABEL[post.type]}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 ${isFundi ? "bg-kazi-orange" : "bg-blue-500"} text-white text-xs font-semibold rounded-full`}>
                {isFundi ? <HardHat className="w-2.5 h-2.5" /> : <Store className="w-2.5 h-2.5" />}
                {isFundi ? "Fundi" : "Business"}
              </span>
              <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>
          </div>
        </Link>

        {token && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              followed
                ? "bg-gray-100 text-gray-600"
                : "bg-orange-50 text-kazi-orange border border-orange-200"
            }`}
          >
            {followed ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {followed ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Promotion banner */}
      {post.type === "PROMOTION" && post.discountPct && (
        <div className="mx-4 mb-3 bg-gradient-to-r from-green-500 to-emerald-400 rounded-xl px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-xl">{post.discountPct}% OFF</p>
            {post.originalPrice && post.discountedPrice && (
              <p className="text-white/90 text-xs">
                <span className="line-through">KSh {post.originalPrice.toLocaleString()}</span>
                {" → "}
                <span className="font-bold">KSh {post.discountedPrice.toLocaleString()}</span>
              </p>
            )}
          </div>
          {post.promoUntil && (
            <div className="text-right">
              <p className="text-white/80 text-xs">Ends</p>
              <p className="text-white font-bold text-xs">
                {new Date(post.promoUntil).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image */}
      {post.image && (
        <div className="relative mx-4 rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt={post.caption}
            onClick={() => setLightbox(true)}
            className="w-full max-h-80 object-cover rounded-xl cursor-pointer hover:brightness-95 transition-all active:scale-[0.99]"
          />
          <button
            onClick={handleDownload}
            title="Download image"
            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-sm transition-all active:scale-90"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && post.image && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt={post.caption}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Caption + hashtags */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-sm text-kazi-dark leading-relaxed">
          <Link href={`/business/${post.provider.id}`} className="font-bold mr-1.5 hover:underline">
            {post.provider.businessName}
          </Link>
          {post.caption}
        </p>
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-kazi-orange font-medium">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={likeLoading || !token}
          className="flex items-center gap-1.5 group"
        >
          <Heart
            className={`w-6 h-6 transition-all duration-200 group-active:scale-125 ${
              liked ? "text-red-500 scale-110" : "text-gray-500"
            }`}
            fill={liked ? "#EF4444" : "none"}
          />
          <span className={`text-sm font-semibold ${liked ? "text-red-500" : "text-gray-500"}`}>
            {likeCount}
          </span>
        </button>

        <button
          onClick={() => onOpenComments?.(post.id)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-kazi-orange transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-semibold">{post.commentsCount}</span>
        </button>

        <button className="text-gray-500 hover:text-kazi-orange transition-colors ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
