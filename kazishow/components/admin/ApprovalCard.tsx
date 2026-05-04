"use client";
import { useState } from "react";
import { CheckCircle, XCircle, MapPin, Phone, Calendar, User, Image as ImageIcon, X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Provider {
  id: string;
  businessName: string;
  category: string;
  description?: string;
  idPhotoUrl?: string;
  idBackPhotoUrl?: string;
  portfolioPhotos?: string[];
  profileImage?: string;
  coverImage?: string;
  user: { name: string; phone: string; location?: string; createdAt: string; profilePhoto?: string };
}

interface Props {
  provider: Provider;
  token: string;
  onAction: (id: string) => void;
  compact?: boolean;
}

const CATEGORY_COLOR: Record<string, string> = {
  FUNDI:        "bg-orange-100 text-kazi-orange",
  SHOP:         "bg-blue-100 text-blue-600",
  HOTEL:        "bg-purple-100 text-purple-600",
  RESTAURANT:   "bg-red-100 text-red-600",
  TECH:         "bg-cyan-100 text-cyan-600",
  PROFESSIONAL: "bg-green-100 text-green-700",
  BUSINESS:     "bg-gray-100 text-gray-600",
};

function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
        <X className="w-5 h-5 text-white" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      <img
        src={images[idx]}
        alt={`Photo ${idx + 1}`}
        className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {idx + 1} / {images.length}
        </p>
      )}
    </div>
  );
}

function PhotoGrid({ label, images, icon }: { label: string; images: string[]; icon?: React.ReactNode }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  if (!images.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        {icon}
        {label}
        <span className="text-gray-400 font-normal normal-case">({images.length})</span>
      </p>
      <div className="grid grid-cols-4 gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 hover:scale-105 transition-all ring-2 ring-transparent hover:ring-kazi-orange"
          >
            <img src={url} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {lightbox !== null && (
        <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

export default function ApprovalCard({ provider, token, onAction, compact = false }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const dismiss = (id: string) => {
    setDismissed(true);
    setTimeout(() => onAction(id), 400);
  };

  async function approve() {
    setLoading("approve");
    try {
      const res = await fetch(`${API}/api/admin/providers/${provider.id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`✅ ${provider.businessName} is now live!`);
      dismiss(provider.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
      setLoading(null);
    }
  }

  async function reject() {
    if (!reason.trim()) { toast.error("Enter a rejection reason"); return; }
    setLoading("reject");
    try {
      const res = await fetch(`${API}/api/admin/providers/${provider.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast(`Rejected: ${provider.businessName}`, { icon: "❌" });
      dismiss(provider.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Rejection failed");
      setLoading(null);
    }
  }

  const idPhotos = [provider.idPhotoUrl, provider.idBackPhotoUrl].filter(Boolean) as string[];
  const portfolioPhotos = provider.portfolioPhotos?.filter(Boolean) ?? [];
  const avatarUrl = provider.profileImage || provider.user?.profilePhoto;

  return (
    <div
      className={`bg-white rounded-2xl card-shadow border-l-4 border-amber-400 overflow-hidden transition-all duration-400 ${
        dismissed ? "opacity-0 scale-95 max-h-0 p-0 border-0 mb-0" : "opacity-100 scale-100 mb-4"
      }`}
      style={{ transition: "opacity 0.4s, transform 0.4s, max-height 0.4s" }}
    >
      {/* Cover strip */}
      {provider.coverImage && !compact && (
        <div className="h-24 overflow-hidden">
          <img src={provider.coverImage} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-xl font-black text-kazi-orange flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={provider.businessName} className="w-full h-full object-cover" />
            ) : (
              provider.businessName.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-kazi-dark text-base">{provider.businessName}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CATEGORY_COLOR[provider.category] ?? "bg-gray-100 text-gray-600"}`}>
                {provider.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{provider.user.name}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{provider.user.phone}</span>
              {provider.user.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.user.location}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Applied {new Date(provider.user.createdAt).toLocaleDateString("en-KE")}
              </span>
            </div>
          </div>
        </div>

        {provider.description && !compact && (
          <p className="text-sm text-gray-500 mb-4 leading-relaxed bg-gray-50 rounded-xl p-3">
            {provider.description}
          </p>
        )}

        {/* Documents */}
        {!compact && (
          <div className="space-y-4 mb-4">
            {idPhotos.length > 0 && (
              <PhotoGrid
                label="ID Documents"
                images={idPhotos}
                icon={<FileText className="w-3 h-3" />}
              />
            )}
            {portfolioPhotos.length > 0 && (
              <PhotoGrid
                label="Portfolio / Business Photos"
                images={portfolioPhotos}
                icon={<ImageIcon className="w-3 h-3" />}
              />
            )}
            {idPhotos.length === 0 && portfolioPhotos.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <ImageIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700">No documents or photos uploaded</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!showReject ? (
          <div className="flex gap-2">
            <button
              onClick={approve}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-200"
            >
              <CheckCircle className="w-4 h-4" />
              {loading === "approve" ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 text-sm font-bold rounded-xl transition-all border border-red-200 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection — sent via SMS to the provider…"
              rows={2}
              autoFocus
              className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={reject}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-200"
              >
                <XCircle className="w-4 h-4" />
                {loading === "reject" ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button
                onClick={() => { setShowReject(false); setReason(""); }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
