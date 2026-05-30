"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Trash2, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProviderPortfolioPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [token, setToken] = useState("");
  const [providerId, setProviderId] = useState("");
  const [form, setForm] = useState({ title: "", description: "", price: "" });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("kazishow_token") || "";
    const raw = localStorage.getItem("kazishow_user");
    setToken(t);
    if (!t || !raw) { router.replace("/auth/login"); return; }
    try {
      const user = JSON.parse(raw);
      if (user.role !== "PROVIDER") { router.replace("/profile"); return; }
      const pid = user.provider?.id || "";
      setProviderId(pid);
      if (pid) fetchPosts(pid, t);
    } catch {
      router.replace("/auth/login");
    }
  }, []);

  async function fetchPosts(pid: string, t: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/providers/${pid}/posts`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch {}
    setLoading(false);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!selectedImage) { toast.error("Please select a photo"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      if (form.price) formData.append("price", form.price);

      const res = await fetch(`${API}/api/providers/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Post added!");
        setPosts([data.data, ...posts]);
        setShowForm(false);
        resetForm();
      } else {
        toast.error(data.message || "Failed to post");
      }
    } catch {
      toast.error("Network error — please try again");
    }
    setUploading(false);
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API}/api/providers/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter((p) => p.id !== postId));
        toast.success("Post deleted");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  function resetForm() {
    setForm({ title: "", description: "", price: "" });
    setSelectedImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-white/60 mb-4 text-sm hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl">📸 Portfolio Posts</h1>
            <p className="text-white/50 text-sm mt-1">
              Show customers your work with price
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-kazi-orange text-white font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" /> Add Post
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">

        {/* ── Add Post Form ── */}
        {showForm && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-kazi-dark text-lg">New Post</h3>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Image Upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`w-full h-48 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer mb-4 overflow-hidden transition-colors ${
                imagePreview ? "border-kazi-orange" : "border-gray-200 hover:border-kazi-orange"
              }`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">Tap to upload photo</p>
                  <p className="text-gray-300 text-xs mt-1">JPG, PNG or WebP</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Title */}
            <div className="mb-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Fresh fade haircut"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors"
              />
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Low fade with skin taper. Book now for this exact look!"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors resize-none"
              />
            </div>

            {/* Price */}
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                Price (KSh)
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 500"
                type="number"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm disabled:opacity-60 active:scale-95 transition-all"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Posting...
                  </span>
                ) : "Post"}
              </button>
            </div>
          </div>
        )}

        {/* ── Posts Grid ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📸</div>
            <p className="font-black text-kazi-dark text-lg mb-2">No posts yet</p>
            <p className="text-gray-400 text-sm mb-6 px-8">
              Add your first post to show customers your work with prices. Each post has a Book Now button.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm active:scale-95 transition-transform"
            >
              📸 Add First Post
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3 text-center">
              {posts.length} post{posts.length !== 1 ? "s" : ""} · visible on your public profile
            </p>
            <div className="grid grid-cols-2 gap-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative w-full h-36">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="font-black text-kazi-dark text-sm leading-tight">{post.title}</p>
                    {post.description && (
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                    )}
                    {post.price != null && (
                      <p className="text-kazi-orange font-black text-sm mt-1.5">
                        KSh {Number(post.price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
