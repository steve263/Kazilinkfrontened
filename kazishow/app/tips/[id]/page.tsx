"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, Heart, MessageCircle, Share2, ArrowLeft, Copy } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TipDetailPage() {
  const params = useParams();
  const tipId = params.id as string;
  const [tip, setTip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("kazishow_user");
    if (user) setLoggedInUser(JSON.parse(user));
    fetchTip();
  }, [tipId]);

  const fetchTip = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/tips/${tipId}`);
      const data = await res.json();
      if (data.success) {
        setTip(data.data);
        setComments(data.data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch tip:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!loggedInUser) {
      toast.error("Please login to like");
      return;
    }

    try {
      const res = await fetch(`${API}/api/tips/${tipId}/like`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("kazishow_token")}` },
      });

      if (res.ok) {
        setLiked(true);
        setTip({ ...tip, likes: tip.likes + 1 });
        toast.success("Liked!");
      }
    } catch (error) {
      toast.error("Failed to like");
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    if (!loggedInUser) {
      toast.error("Please login to comment");
      return;
    }

    try {
      const res = await fetch(`${API}/api/tips/${tipId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("kazishow_token")}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await res.json();
      if (data.success) {
        setComments([...comments, data.data]);
        setNewComment("");
        toast.success("Comment added!");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleShare = (platform: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Check out: ${tip?.title} on KaziShow`;

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`);
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    } else if (platform === "facebook") {
      window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
            <div className="h-4 bg-gray-200 rounded mb-3 w-1/2" />
            <div className="h-64 bg-gray-200 rounded mt-6" />
          </div>
        </section>
      </div>
    );
  }

  if (!tip) {
    return (
      <div className="min-h-screen bg-kazi-cream">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-gray-600">Guide not found</p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <Link href="/tips" className="flex items-center gap-2 text-sm text-gray-600 hover:text-kazi-orange mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tips
        </Link>

        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          {/* Cover */}
          {tip.coverImage && (
            <img src={tip.coverImage} alt={tip.title} className="w-full h-80 object-cover" />
          )}

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-kazi-orange bg-orange-50 px-3 py-1 rounded-full">
                  {tip.category}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {tip.readTime} min read
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-kazi-dark mb-3">{tip.title}</h1>

              {/* Author */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-kazi-orange flex items-center justify-center text-white font-black text-sm">
                    {tip.author?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-kazi-dark">{tip.author?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tip.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    disabled={liked}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="prose prose-sm max-w-none mb-8">
              {tip.content.split("\n").map((para: string, i: number) => {
                if (para.startsWith("# ")) return <h2 key={i} className="text-2xl font-black text-kazi-dark mt-6 mb-3">{para.replace("# ", "")}</h2>;
                if (para.startsWith("## ")) return <h3 key={i} className="text-xl font-black text-kazi-dark mt-4 mb-2">{para.replace("## ", "")}</h3>;
                if (para.startsWith("- "))
                  return (
                    <ul key={i} className="list-disc pl-5 mb-4">
                      <li>{para.replace("- ", "")}</li>
                    </ul>
                  );
                if (para.trim()) return <p key={i} className="text-gray-700 mb-3 leading-relaxed">{para}</p>;
                return null;
              })}
            </div>

            {/* Share */}
            <div className="border-t border-gray-100 pt-6 flex items-center gap-2">
              <span className="text-sm text-gray-600 font-semibold">Share:</span>
              <button
                onClick={() => handleShare("whatsapp")}
                className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                title="Share on WhatsApp"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                title="Share on Twitter"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Copy link"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            {/* Comments */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-black text-kazi-dark mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> Comments ({comments.length})
              </h3>

              {loggedInUser ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange"
                  />
                  <button
                    onClick={handleComment}
                    className="mt-3 px-4 py-2 bg-kazi-orange text-white font-bold rounded-lg hover:bg-orange-600 transition-all text-sm"
                  >
                    Post Comment
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-6">
                  <Link href="/auth/login" className="text-kazi-orange font-semibold hover:underline">
                    Login
                  </Link>
                  {" "}to comment
                </p>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-kazi-orange flex items-center justify-center text-white text-xs font-black">
                        {comment.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-kazi-dark">{comment.user?.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
      <WhatsAppBubble />
    </div>
  );
}
