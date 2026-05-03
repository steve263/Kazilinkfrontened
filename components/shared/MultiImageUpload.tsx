"use client";
import { useState, useRef } from "react";
import { Plus, X, Loader2 } from "lucide-react";

interface UploadedImage {
  url: string;
  publicId: string;
  uploading: boolean;
}

interface Props {
  folder: string;
  maxFiles?: number;
  onUpload: (urls: string[]) => void;
  theme?: "dark" | "light";
  label?: string;
  hint?: string;
  accentColor?: "orange" | "blue";
}

export default function MultiImageUpload({
  folder,
  maxFiles = 6,
  onUpload,
  theme = "dark",
  label,
  hint,
  accentColor = "orange",
}: Props) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";
  const accent = accentColor === "blue" ? "border-kazi-blue bg-kazi-blue/10" : "border-kazi-orange bg-kazi-orange/10";
  const accentIcon = accentColor === "blue" ? "text-kazi-blue" : "text-kazi-orange";

  const handleFiles = async (files: FileList) => {
    const toUpload = Array.from(files).slice(0, maxFiles - images.length);

    for (const file of toUpload) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) continue;

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const localUrl = URL.createObjectURL(file);

      setImages((prev) => [...prev, { url: localUrl, publicId: tempId, uploading: true }]);

      try {
        const token = localStorage.getItem("kazishow_token");
        const uploadUrl = token
          ? `http://localhost:5000/api/upload/image?folder=${folder}`
          : `http://localhost:5000/api/upload/public?folder=${folder}`;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(uploadUrl, { method: "POST", headers, body: formData });
        const data = await res.json();

        setImages((prev) => {
          const updated = data.success
            ? prev.map((img) =>
                img.publicId === tempId
                  ? { url: data.data.url, publicId: data.data.publicId, uploading: false }
                  : img
              )
            : prev.filter((img) => img.publicId !== tempId);
          onUpload(updated.filter((img) => !img.uploading).map((img) => img.url));
          return updated;
        });
      } catch {
        setImages((prev) => {
          const updated = prev.filter((img) => img.publicId !== tempId);
          onUpload(updated.map((img) => img.url));
          return updated;
        });
      }
    }
  };

  const removeImage = async (publicId: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.publicId !== publicId);
      onUpload(updated.filter((img) => !img.uploading).map((img) => img.url));
      return updated;
    });
    if (!publicId.startsWith("temp-")) {
      try {
        const token = localStorage.getItem("kazishow_token");
        if (token) {
          await fetch("http://localhost:5000/api/upload/image", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ publicId }),
          });
        }
      } catch {}
    }
  };

  const uploadedCount = images.filter((img) => !img.uploading).length;
  const totalSlots = maxFiles;
  const emptySlots = totalSlots - images.length - 1; // -1 for the "add" button

  return (
    <div>
      {label && (
        <p className={`text-sm font-semibold mb-1.5 ${isDark ? "text-white/70" : "text-gray-700"}`}>
          {label}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <div
            key={img.publicId}
            className={`relative aspect-square rounded-xl overflow-hidden border-2 ${accent}`}
          >
            <img src={img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            {img.uploading ? (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => removeImage(img.publicId)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        ))}

        {images.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              isDark
                ? "border-white/15 bg-white/5 hover:border-kazi-orange/40 hover:bg-white/8"
                : "border-gray-200 bg-gray-50 hover:border-kazi-orange/50 hover:bg-orange-50"
            }`}
          >
            <Plus className={`w-6 h-6 ${isDark ? "text-white/30" : "text-gray-300"}`} />
            <span className={`text-xs mt-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>Add</span>
          </button>
        )}

        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              onClick={() => inputRef.current?.click()}
              className={`aspect-square rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center transition-all ${
                isDark ? "border-white/8 bg-white/3" : "border-gray-100 bg-gray-50/50"
              }`}
            >
              <Plus className={`w-5 h-5 ${isDark ? "text-white/10" : "text-gray-200"}`} />
            </div>
          ))}
      </div>

      <p className={`text-xs mt-2 text-center ${isDark ? "text-white/30" : "text-gray-400"}`}>
        {uploadedCount} / {maxFiles} photos uploaded
        {uploadedCount === 0 && " · minimum 1 required"}
      </p>

      {hint && (
        <p className={`text-xs mt-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>{hint}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
