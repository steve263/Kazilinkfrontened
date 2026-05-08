"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = [
  "Home Improvement",
  "Tech Tips",
  "Food and Dining",
  "Beauty and Wellness",
  "Legal and Finance",
  "Business Growth",
  "General Tips",
];

export default function CreateTipPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image file (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API}/api/upload/public?folder=general`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token || ""}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCoverImage(data.data.url);
        toast.success("Image uploaded!");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title || !content) {
      toast.error("Please fill in at least title and content");
      return;
    }
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("You must be logged in"); router.push("/auth/login"); return; }
    try {
      setSaving(true);
      const res = await fetch(`${API}/api/tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, excerpt: excerpt || content.substring(0, 200), coverImage: coverImage || null, category, status: "DRAFT" }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Guide saved as draft!"); router.push("/tips/my-guides"); }
      else toast.error(data.message);
    } catch { toast.error("Failed to save draft"); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!title || !content || excerpt.length < 50) {
      toast.error("Please fill in all fields. Excerpt must be at least 50 characters.");
      return;
    }
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("You must be logged in"); router.push("/auth/login"); return; }
    try {
      setSubmitting(true);
      const res = await fetch(`${API}/api/tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, excerpt, coverImage: coverImage || null, category, status: "PENDING" }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Your guide has been submitted! It will appear after review — usually within 24 hours."); router.push("/tips/my-guides"); }
      else toast.error(data.message);
    } catch { toast.error("Failed to submit guide"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/tips" className="flex items-center gap-2 text-sm text-gray-600 hover:text-kazi-orange transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Tips
          </Link>
          <h1 className="text-2xl font-black text-kazi-dark">Write a Guide</h1>
          <div className="w-20" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl card-shadow p-6 sm:p-8">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-kazi-dark mb-2">Guide Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., How to Fix a Leaky Kitchen Faucet"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-kazi-dark mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange"
              >
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Cover Image — real upload */}
            <div>
              <label className="block text-sm font-bold text-kazi-dark mb-2">Cover Image</label>
              {coverImage ? (
                <div className="relative rounded-2xl overflow-hidden h-48">
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCoverImage("")}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 text-sm font-bold"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    ✅ Uploaded
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${uploading ? "border-kazi-orange bg-orange-50" : "border-gray-300 hover:border-kazi-orange hover:bg-orange-50"}`}>
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-kazi-orange animate-spin" />
                        <p className="text-sm text-kazi-orange font-semibold">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🖼️</div>
                        <p className="font-bold text-gray-700">Click to upload cover image</p>
                        <p className="text-xs text-gray-400">JPG, PNG, WebP up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-bold text-kazi-dark mb-2">Summary <span className="text-gray-400 font-normal">(min 50 characters)</span></label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value.substring(0, 200))}
                placeholder="Write a brief summary of your guide..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange min-h-[80px]"
              />
              <p className="text-xs text-gray-500 mt-1">{excerpt.length}/200</p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-bold text-kazi-dark mb-2">Full Guide Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your full guide here. You can use markdown formatting like # for headings, **bold**, *italic*, - for bullets, etc."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange min-h-[300px] font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Supports basic markdown formatting</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleSaveDraft}
                disabled={saving || uploading}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all text-sm"
              >
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="px-6 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all text-sm"
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
      <WhatsAppBubble />
    </div>
  );
}
