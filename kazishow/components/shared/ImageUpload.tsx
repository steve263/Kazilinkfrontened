"use client";
import { useState, useRef } from "react";
import { Camera, Loader2, Upload } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "${API}";

interface Props {
  folder: string;
  onUpload: (url: string, publicId: string) => void;
  shape?: "circle" | "square";
  label?: string;
  hint?: string;
  theme?: "dark" | "light";
  currentUrl?: string;
  className?: string;
}

export default function ImageUpload({
  folder,
  onUpload,
  shape = "square",
  label,
  hint,
  theme = "dark",
  currentUrl,
  className = "",
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";

  const handleFile = async (file: File) => {
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, and WebP files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB");
      return;
    }
    setError(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const token = localStorage.getItem("kazishow_token");
      const uploadUrl = token
        ? `${API}/api/upload/image?folder=${folder}`
        : `${API}/api/upload/public?folder=${folder}`;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(uploadUrl, { method: "POST", headers, body: formData });
      const data = await res.json();
      if (data.success) {
        setPreview(data.data.url);
        onUpload(data.data.url, data.data.publicId);
      } else {
        setError(data.message || "Upload failed");
        setPreview(currentUrl || null);
      }
    } catch {
      setError("Upload failed. Check your connection.");
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const isCircle = shape === "circle";

  return (
    <div className={className}>
      {label && (
        <p className={`text-sm font-semibold mb-1.5 ${isDark ? "text-white/70" : "text-gray-700"}`}>
          {label}
        </p>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative cursor-pointer transition-all overflow-hidden flex items-center justify-center border-2 border-dashed ${
          isCircle ? "w-20 h-20 rounded-full mx-auto" : "w-full aspect-square rounded-2xl"
        } ${
          preview
            ? "border-transparent"
            : isDark
            ? "border-white/20 bg-white/5 hover:border-kazi-orange/50 hover:bg-white/8"
            : "border-gray-200 bg-gray-50 hover:border-kazi-orange/50 hover:bg-orange-50"
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
            {!uploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <Upload className={`w-7 h-7 ${isDark ? "text-white/30" : "text-gray-300"}`} />
            {!isCircle && (
              <span className={`text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>
                Tap to upload
              </span>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {isCircle && preview && !uploading && (
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-kazi-orange rounded-full flex items-center justify-center border-2 border-white shadow">
            <Camera className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {error && <p className="text-xs mt-1.5 text-red-400 text-center">{error}</p>}
      {hint && !error && (
        <p className={`text-xs mt-1.5 ${isDark ? "text-white/30" : "text-gray-400"} text-center`}>
          {hint}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
