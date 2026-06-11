"use client";
import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Flame, Plus, Tag, MapPin, Search, X, RefreshCw,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import PostCard, { FeedPost } from "@/components/feed/PostCard";
import CreatePostModal from "@/components/feed/CreatePostModal";
import CommentsSheet from "@/components/feed/CommentsSheet";
import BroadcastBanner from "@/components/notifications/BroadcastBanner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TABS = [
  { key: "forYou", label: "For You", icon: TrendingUp },
  { key: "promotions", label: "Promotions", icon: Tag },
  { key: "following", label: "Following", icon: Flame },
  { key: "nearMe", label: "Near Me", icon: MapPin },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("forYou");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [hashtag, setHashtag] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [nearRadius] = useState(10);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token");
    const u = localStorage.getItem("kazishow_user");
    if (t) setToken(t);
    if (u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "promotions") params.set("type", "PROMOTION");
      if (activeTab === "following") params.set("followed", "true");
      if (hashtag) params.set("hashtag", hashtag);

      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/posts?${params}`, { headers });
      const data = await res.json();
      if (data.success) setPosts(data.data?.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, token, hashtag]);

  useEffect(() => {
    if (activeTab === "nearMe") {
      if (!userCoords) {
        navigator.geolocation?.getCurrentPosition(
          (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setGeoError("Location permission denied. Please enable location."),
        );
      }
    } else {
      fetchPosts();
    }
  }, [activeTab, fetchPosts, userCoords]);

  useEffect(() => {
    if (activeTab === "nearMe" && userCoords) fetchPosts();
  }, [activeTab, userCoords, fetchPosts]);

  const displayPosts =
    activeTab === "nearMe" && userCoords
      ? posts.filter((p) => {
          const { lat, lng } = p.provider.user as { lat?: number | null; lng?: number | null };
          if (!lat || !lng) return false;
          return haversineKm(userCoords.lat, userCoords.lng, lat, lng) <= nearRadius;
        })
      : posts;

  function applyHashtag() {
    const tag = hashtagInput.trim();
    setHashtag(tag ? (tag.startsWith("#") ? tag : `#${tag}`) : "");
    setHashtagInput("");
  }

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />
      <BroadcastBanner />

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        {/* Hashtag search bar */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-3 py-2.5 card-shadow">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyHashtag()}
              placeholder="Search #hashtag…"
              className="flex-1 bg-transparent text-sm outline-none text-kazi-dark placeholder:text-gray-400"
            />
            {hashtag && (
              <button onClick={() => setHashtag("")} className="text-gray-400 hover:text-kazi-orange">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={applyHashtag}
            className="px-4 py-2.5 bg-kazi-orange text-white text-sm font-bold rounded-2xl shadow-md shadow-orange-200 active:scale-95 transition-all"
          >
            Search
          </button>
        </div>

        {/* Active hashtag chip */}
        {hashtag && (
          <div className="mb-3 flex items-center gap-2">
            <span className="flex items-center gap-1 bg-orange-100 text-kazi-orange px-3 py-1 rounded-full text-sm font-semibold">
              {hashtag}
              <button onClick={() => setHashtag("")}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-xs text-gray-400">{displayPosts.length} posts</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 mb-5 card-shadow overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap px-2 ${
                activeTab === key
                  ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                  : "text-gray-500 hover:text-kazi-orange"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab-specific banners */}
        {activeTab === "promotions" && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-2xl border border-green-100">
            <Tag className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-kazi-dark">Active Promotions</p>
              <p className="text-xs text-gray-500">Discounts & special offers from local providers</p>
            </div>
          </div>
        )}
        {activeTab === "following" && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 rounded-2xl border border-orange-100">
            <Flame className="w-5 h-5 text-kazi-orange" fill="#FF6B2B" />
            <div>
              <p className="text-sm font-bold text-kazi-dark">Following Feed</p>
              <p className="text-xs text-gray-500">Latest posts from providers you follow</p>
            </div>
          </div>
        )}
        {activeTab === "nearMe" && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-bold text-kazi-dark">Near Me</p>
              <p className="text-xs text-gray-500">
                {userCoords
                  ? `Providers within ${nearRadius} km of you`
                  : geoError || "Getting your location…"}
              </p>
            </div>
            {userCoords && (
              <button
                onClick={() => {
                  setUserCoords(null);
                  setGeoError("");
                }}
                className="text-xs text-blue-500 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading posts…</p>
          </div>
        ) : (
          <>
            {/* Posts */}
            <div className="space-y-4">
              {displayPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  token={token}
                  onOpenComments={(id) => setCommentsPostId(id)}
                />
              ))}
            </div>

            {displayPosts.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">
                  {activeTab === "nearMe" ? "📍" : activeTab === "following" ? "👥" : "📭"}
                </div>
                <h3 className="font-bold text-kazi-dark mb-1">
                  {activeTab === "nearMe" && !userCoords ? "Location required" : "No posts here yet"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {activeTab === "following"
                    ? "Follow providers to see their updates here"
                    : activeTab === "nearMe" && !userCoords
                    ? geoError || "Allow location access to find nearby providers"
                    : "Check back soon"}
                </p>
                {activeTab === "nearMe" && geoError && (
                  <button
                    onClick={() => {
                      setGeoError("");
                      navigator.geolocation?.getCurrentPosition(
                        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        () => setGeoError("Location permission denied."),
                      );
                    }}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl"
                  >
                    Try Again
                  </button>
                )}
                {/* Prompt logged-in users to post */}
                {token && activeTab === "forYou" && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-black rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Be the first to post
                  </button>
                )}
              </div>
            )}

            {/* Refresh */}
            {displayPosts.length > 0 && (
              <button
                onClick={fetchPosts}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white rounded-2xl card-shadow text-gray-500 text-sm font-semibold hover:text-kazi-orange transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Feed
              </button>
            )}
          </>
        )}
      </div>

      {/* FAB — create post (any logged-in user; backend enforces provider check) */}
      {token && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-24 md:bottom-44 right-4 w-14 h-14 bg-kazi-orange text-white rounded-full shadow-xl shadow-orange-300 flex items-center justify-center z-[60] active:scale-90 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      {showCreate && token && (
        <CreatePostModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={fetchPosts}
        />
      )}
      {commentsPostId && (
        <CommentsSheet
          postId={commentsPostId}
          token={token}
          userName={user?.name ?? ""}
          onClose={() => setCommentsPostId(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
