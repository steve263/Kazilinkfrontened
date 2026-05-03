"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
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
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSaveDraft = async () => {
    if (!title || !content) {
      toast.error("Please fill in at least title and content");
      return;
    }

    const token = localStorage.getItem("kazishow_token");
    if (!token) {
      toast.error("You must be logged in");
      router.push("/auth/login");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API}/api/tips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          coverImage: coverImage || null,
          category,
          status: "DRAFT",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Guide saved as draft!");
        router.push("/tips/my-guides");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content || excerpt.length < 50) {
      toast.error("Please fill in all fields. Excerpt must be at least 50 characters.");
      return;
    }

    const token = localStorage.getItem("kazishow_token");
    if (!token) {
      toast.error("You must be logged in");
      router.push("/auth/login");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/api/tips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          coverImage: coverImage || null,
          category,
          status: "PENDING",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Your guide has been submitted! It will appear after review — usually within 24 hours.");
        router.push("/tips/my-guides");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to submit guide");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/tips" className="flex items-center gap-2 text-sm text-gray-600 hover:text-kazi-orange transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Tips
          </Link>
          <h1 className="text-2xl font-black text-kazi-dark">Write a Guide</h1>
          <div className="w-20" />
        </div>
      </section>

      {/* Editor */}
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
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-bold text-kazi-dark mb-2">Cover Image URL (Cloudinary)</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-bold text-kazi-dark mb-2">Summary (min 50 characters)</label>
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
                disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all text-sm"
              >
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
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
