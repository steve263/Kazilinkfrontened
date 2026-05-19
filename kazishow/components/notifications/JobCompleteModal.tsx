"use client";
import { useState, useRef } from "react";
import { Camera, X, CheckCircle, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const LABELS = ["BEFORE", "AFTER", "PHOTO 3", "PHOTO 4"];

interface Props {
  bookingId: string;
  customerName: string;
  token: string;
  bookingLabel: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function JobCompleteModal({
  bookingId,
  customerName,
  token,
  bookingLabel,
  onComplete,
  onCancel,
}: Props) {
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhotos = (files: FileList) => {
    const next = Array.from(files)
      .slice(0, 4 - photos.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...next].slice(0, 4));
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (withPhotos = true) => {
    setSubmitting(true);
    let photoUrls: string[] = [];

    if (withPhotos && photos.length > 0) {
      setUploading(true);
      try {
        const formData = new FormData();
        photos.forEach((p) => formData.append("images", p.file));
        const res = await fetch(`${API}/api/upload/images?folder=general`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          photoUrls = data.data.map((d: { url: string }) => d.url);
        }
      } catch {}
      setUploading(false);
    }

    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", photos: photoUrls }),
      });
      const data = await res.json();
      if (data.success) onComplete();
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-kazi-dark rounded-3xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="font-black text-white text-lg">{bookingLabel} Complete</h3>
            <p className="text-xs text-gray-400">
              Add before/after photos — {customerName} sees them before confirming
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          {/* Photo grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-white/5">
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <span className="absolute bottom-2 left-2 text-[10px] font-black text-white bg-black/60 px-1.5 py-0.5 rounded-full">
                  {LABELS[i]}
                </span>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-kazi-orange hover:text-kazi-orange transition-colors"
              >
                <Camera className="w-8 h-8" />
                <span className="text-xs font-bold">
                  {photos.length === 0 ? "Add Photo" : "Add More"}
                </span>
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addPhotos(e.target.files)}
          />

          {photos.length === 0 && (
            <p className="text-xs text-gray-500 text-center mb-5">
              Photos are optional but help build customer trust.
            </p>
          )}

          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="w-full py-4 bg-kazi-green text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 mb-3 active:scale-95 transition-transform"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? "Uploading photos..." : "Completing..."}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {photos.length > 0
                  ? `Submit with ${photos.length} photo${photos.length > 1 ? "s" : ""}`
                  : `Mark ${bookingLabel} Complete`}
              </>
            )}
          </button>

          {photos.length > 0 && (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="w-full py-3 bg-white/5 text-gray-500 font-bold rounded-2xl text-sm disabled:opacity-50"
            >
              Skip photos — just mark complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
