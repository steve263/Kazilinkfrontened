"use client";
import { useState, useRef } from "react";
import { X, ImageIcon, Tag, Megaphone, Briefcase, Upload, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Props {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}

const TYPES = [
  { value: "WORK", label: "Work", icon: Briefcase, color: "bg-kazi-orange" },
  { value: "PROMOTION", label: "Promotion", icon: Tag, color: "bg-green-500" },
  { value: "UPDATE", label: "Update", icon: Megaphone, color: "bg-blue-500" },
] as const;

export default function CreatePostModal({ token, onClose, onCreated }: Props) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState("");
  const [type, setType] = useState<"WORK" | "PROMOTION" | "UPDATE">("WORK");
  const [discountPct, setDiscountPct] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [promoUntil, setPromoUntil] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageFile(file: File) {
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, WebP allowed"); return;
    }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    setError("");
    setUploadingImage(true);
    setImage(URL.createObjectURL(file)); // show preview immediately
    try {
      const t = localStorage.getItem("kazishow_token");
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${API}/api/upload/image?folder=posts`, {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setImage(data.data.url);
      } else {
        setError(data.message || "Upload failed");
        setImage("");
      }
    } catch {
      setError("Upload failed. Check your connection.");
      setImage("");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit() {
    if (!caption.trim()) { setError("Caption is required"); return; }
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = { caption: caption.trim(), type };
      if (image.trim()) body.image = image.trim();
      if (type === "PROMOTION") {
        if (discountPct) body.discountPct = Number(discountPct);
        if (originalPrice) body.originalPrice = Number(originalPrice);
        if (discountedPrice) body.discountedPrice = Number(discountedPrice);
        if (promoUntil) body.promoUntil = promoUntil;
      }
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-black text-kazi-dark">New Post</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Post type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Post Type</p>
            <div className="flex gap-2">
              {TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    type === value ? `${color} text-white shadow-md` : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Caption</p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption… use #hashtags"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-kazi-dark outline-none focus:border-kazi-orange resize-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Photo (optional)
            </p>

            {image ? (
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Post preview" className="w-full max-h-64 object-cover rounded-2xl" />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <span className="text-white text-sm font-semibold ml-2">Uploading…</span>
                  </div>
                )}
                {!uploadingImage && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:border-kazi-orange hover:bg-orange-50 transition-all"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-600">Add a photo</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP · Max 5 MB</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* Promotion fields */}
          {type === "PROMOTION" && (
            <div className="space-y-3 p-3 bg-green-50 rounded-2xl border border-green-200">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Promotion Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Discount %</p>
                  <input
                    type="number"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    placeholder="e.g. 20"
                    min={1} max={100}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                  <input
                    type="date"
                    value={promoUntil}
                    onChange={(e) => setPromoUntil(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Original Price (KSh)</p>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Discounted Price (KSh)</p>
                  <input
                    type="number"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    placeholder="e.g. 4000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm font-medium text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || uploadingImage || !caption.trim()}
            className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-orange-200"
          >
            {loading ? "Posting…" : uploadingImage ? "Uploading image…" : "Post Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
