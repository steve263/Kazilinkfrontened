"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Star, MessageCircle, Eye, Filter, X, Upload, Heart } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"recent" | "rated" | "viewed">("recent");
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [rating, setRating] = useState(5);
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const categories = ["All", "Fundi", "Hotel", "Restaurant", "Shop", "Tech"];

  useEffect(() => {
    const user = localStorage.getItem("kazishow_user");
    if (user) setLoggedInUser(JSON.parse(user));
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/testimonials`);
      const data = await res.json();
      if (data.success) setTestimonials(data.data);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!loggedInUser) {
      toast.error("Please login to share a testimonial");
      return;
    }
    if (loggedInUser.role !== "CUSTOMER") {
      toast.error("Only customers can share testimonials");
      return;
    }
    setShowUploadModal(true);
  };

  const handleSubmitTestimonial = async () => {
    if (!videoUrl || !summary || rating < 1) {
      toast.error("Please fill in all fields");
      return;
    }

    const token = localStorage.getItem("kazishow_token");

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/api/testimonials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoUrl,
          summary,
          rating,
          category: selectedCategory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Thank you! Your testimonial is under review. It will appear within 24 hours.");
        setShowUploadModal(false);
        setVideoUrl("");
        setSummary("");
        setRating(5);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to submit testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = testimonials.filter((t) => {
    if (selectedCategory !== "All" && t.category !== selectedCategory) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "rated") return b.rating - a.rating;
    if (sortBy === "viewed") return b.views - a.views;
    return 0;
  });

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      {/* Hero */}
      <section className="relative bg-kazi-dark overflow-hidden py-12 sm:py-16">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, #FF6B2B22 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #F59E0B22 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Real Testimonials</h1>
          <p className="text-white/70 max-w-xl mx-auto">See how KaziShow has transformed the way people find and hire services</p>
          {loggedInUser?.role === "CUSTOMER" ? (
            <button
              onClick={handleUploadClick}
              className="mt-6 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all inline-flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" /> Share Your Experience
            </button>
          ) : !loggedInUser ? (
            <Link
              href="/auth/login"
              className="mt-6 px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all inline-flex items-center gap-2 text-sm"
            >
              Login to Share
            </Link>
          ) : null}
        </div>
      </section>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <h2 className="text-2xl font-black text-kazi-dark mb-6">Share Your Testimonial</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-kazi-dark mb-2">Video URL (Cloudinary)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange"
                />
                <p className="text-xs text-gray-500 mt-1">Max 60 seconds, 50MB, MP4 only</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-kazi-dark mb-2">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${r <= rating ? "text-kazi-amber" : "text-gray-300"}`}
                        fill={r <= rating ? "#F59E0B" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-kazi-dark mb-2">Your Experience (min 50 chars)</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange min-h-[120px]"
                />
                <p className="text-xs text-gray-500 mt-1">{summary.length}/200</p>
              </div>

              <button
                onClick={handleSubmitTestimonial}
                disabled={submitting}
                className="w-full py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all"
              >
                {submitting ? "Submitting..." : "Submit Testimonial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black rounded-3xl max-w-2xl w-full relative">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="aspect-video bg-black rounded-3xl overflow-hidden">
              <video
                src={selectedTestimonial.videoUrl}
                controls
                className="w-full h-full"
                autoPlay
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-600">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-kazi-orange text-white"
                    : "bg-white text-gray-700 hover:bg-orange-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-kazi-orange"
          >
            <option value="recent">Most Recent</option>
            <option value="rated">Highest Rated</option>
            <option value="viewed">Most Viewed</option>
          </select>
        </div>
      </section>

      {/* Testimonials Grid */}
      {loading ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : sorted.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-gray-600 text-lg mb-4">Be the first to share your experience!</p>
          {loggedInUser?.role === "CUSTOMER" && (
            <button
              onClick={handleUploadClick}
              className="px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Share Now
            </button>
          )}
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all group cursor-pointer"
                onClick={() => {
                  setSelectedTestimonial(testimonial);
                  setShowVideoModal(true);
                }}
              >
                {/* Video Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-50 relative overflow-hidden group">
                  <img
                    src={testimonial.thumbnailUrl || `https://via.placeholder.com/400x225?text=${testimonial.customer?.name || "Testimonial"}`}
                    alt="thumbnail"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <Play className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-kazi-orange flex items-center justify-center text-white text-xs font-black">
                      {testimonial.customer?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-kazi-dark truncate">{testimonial.customer?.name}</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-3 h-3"
                            fill={i < testimonial.rating ? "#F59E0B" : "none"}
                            color={i < testimonial.rating ? "#F59E0B" : "#D1D5DB"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{testimonial.summary}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {testimonial.views}
                      </div>
                    </div>
                    <span className="text-kazi-orange font-semibold">{testimonial.category}</span>
                  </div>
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
