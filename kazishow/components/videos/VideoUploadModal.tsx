"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, CheckCircle, Star, Music2, ChevronRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Preset background tracks — replace audioUrl values with real Cloudinary URLs
const PRESET_TRACKS = [
  { id: "p1",  name: "Nairobi Nights",      artist: "KaziBeats",     audioUrl: "" },
  { id: "p2",  name: "Hustle Mode",          artist: "AfroVibes",     audioUrl: "" },
  { id: "p3",  name: "Jua Kali Anthem",      artist: "Kenya Sounds",  audioUrl: "" },
  { id: "p4",  name: "Morning Rush",         artist: "City Pulse",    audioUrl: "" },
  { id: "p5",  name: "Fundi Beat",           artist: "Work Tunes",    audioUrl: "" },
  { id: "p6",  name: "Biashara Flow",        artist: "Market Vibes",  audioUrl: "" },
  { id: "p7",  name: "Upendo Wa Kazi",       artist: "Bongo Mix",     audioUrl: "" },
  { id: "p8",  name: "Jasho la Jasho",       artist: "Swahili Soul",  audioUrl: "" },
  { id: "p9",  name: "Nairobi Afrobeats",    artist: "East Africa",   audioUrl: "" },
  { id: "p10", name: "Peaceful Vibes",       artist: "Ambient Plus",  audioUrl: "" },
];

interface Provider {
  id: string;
  businessName: string;
  category: string;
}

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onPosted: (video: any) => void;
}

export default function VideoUploadModal({ isOpen, onClose, userRole, onPosted }: VideoUploadModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(null);

  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [bookedProviders, setBookedProviders] = useState<Provider[]>([]);
  const [posting, setPosting] = useState(false);

  // Audio state
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<{ name: string; audioUrl: string } | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const isCustomer = userRole === "CUSTOMER";

  useEffect(() => {
    if (!isOpen || !isCustomer) return;
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    fetch(`${API}/api/videos/booked-providers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setBookedProviders(d.data); })
      .catch(() => {});
  }, [isOpen, isCustomer]);

  function reset() {
    setStep(1);
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setUploading(false);
    setUploadedUrl(null);
    setUploadedPublicId(null);
    setCaption("");
    setHashtagInput("");
    setHashtags([]);
    setRating(0);
    setHoverRating(0);
    setSelectedProvider("");
    setPosting(false);
    setShowAudioPicker(false);
    setSelectedAudio(null);
    setAudioUploadProgress(0);
    setUploadingAudio(false);
  }

  function handleClose() { reset(); onClose(); }

  function pickFile(f: File) {
    if (!f.type.startsWith("video/")) { toast.error("Only video files are allowed"); return; }
    if (f.size > 100 * 1024 * 1024) { toast.error("Video must be under 100MB"); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    uploadToCloudinary(f);
  }

  function uploadToCloudinary(f: File) {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("Please log in first"); return; }
    const formData = new FormData();
    formData.append("video", f);
    setUploading(true);
    setUploadProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/upload/video`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.onload = () => {
      setUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          setUploadedUrl(data.data.url);
          setUploadedPublicId(data.data.publicId);
          setStep(2);
        } else {
          toast.error(data.message || "Upload failed");
          setFile(null); setPreviewUrl(null);
        }
      } catch { toast.error("Upload failed"); setFile(null); setPreviewUrl(null); }
    };
    xhr.onerror = () => { setUploading(false); toast.error("Upload failed — check your connection"); setFile(null); setPreviewUrl(null); };
    xhr.send(formData);
  }

  function pickAudioFile(f: File) {
    const validTypes = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/aac", "audio/m4a"];
    const isValid = validTypes.some((t) => f.type.startsWith(t.split("/")[0]) && f.type.includes(t.split("/")[1])) || f.type.startsWith("audio/");
    if (!isValid) { toast.error("Please select an audio file (MP3, M4A, WAV)"); return; }
    if (f.size > 20 * 1024 * 1024) { toast.error("Audio must be under 20MB"); return; }

    const token = localStorage.getItem("kazishow_token");
    if (!token) return;

    const formData = new FormData();
    formData.append("audio", f);

    setUploadingAudio(true);
    setAudioUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/upload/audio`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setAudioUploadProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.onload = () => {
      setUploadingAudio(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          const name = f.name.replace(/\.[^/.]+$/, "");
          setSelectedAudio({ name, audioUrl: data.data.url });
          setShowAudioPicker(false);
          toast.success(`🎵 "${name}" added`);
        } else {
          toast.error(data.message || "Audio upload failed");
        }
      } catch { toast.error("Audio upload failed"); }
    };
    xhr.onerror = () => { setUploadingAudio(false); toast.error("Network error"); };
    xhr.send(formData);
  }

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (!tag || hashtags.includes(tag) || hashtags.length >= 5) return;
    setHashtags([...hashtags, tag]);
    setHashtagInput("");
  }

  async function handlePost() {
    if (!uploadedUrl || !caption.trim()) { toast.error("Caption is required"); return; }
    if (isCustomer && rating === 0) { toast.error("Please select a star rating"); return; }
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("Please log in"); return; }
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          videoUrl: uploadedUrl,
          publicId: uploadedPublicId,
          caption: caption.trim(),
          hashtags,
          rating: isCustomer ? rating : undefined,
          providerId: isCustomer && selectedProvider ? selectedProvider : undefined,
          audioUrl: selectedAudio?.audioUrl || undefined,
          audioName: selectedAudio?.name || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Your video is now live on ShowReel!");
        onPosted(data.data);
        handleClose();
      } else {
        toast.error(data.message || "Failed to post");
      }
    } catch { toast.error("Network error"); }
    finally { setPosting(false); }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full sm:max-w-lg bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-lg">Share Your Video</h2>
            <p className="text-gray-400 text-xs">
              Step {step} of 2 · {step === 1 ? "Upload video" : "Add details"}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── STEP 1 — Upload ── */}
          {step === 1 && (
            <div>
              {!file ? (
                <div
                  ref={dropRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center cursor-pointer hover:border-kazi-orange hover:bg-white/5 transition-all"
                >
                  <Upload className="w-10 h-10 text-kazi-orange mx-auto mb-3" />
                  <p className="text-white font-bold mb-1">Drag & drop your video here</p>
                  <p className="text-gray-400 text-sm">or click to select</p>
                  <p className="text-gray-500 text-xs mt-3">MP4, MOV, AVI · Max 100MB · Max 3 minutes</p>
                </div>
              ) : uploading ? (
                <div className="space-y-4">
                  {previewUrl && <video src={previewUrl} className="w-full rounded-xl max-h-48 object-contain bg-black" muted />}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-semibold">Uploading…</span>
                      <span className="text-kazi-orange font-black text-sm">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-kazi-orange rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-gray-400 text-xs mt-2 text-center">Please wait while your video uploads…</p>
                  </div>
                </div>
              ) : null}
              <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
            </div>
          )}

          {/* ── STEP 2 — Details ── */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Video preview */}
              {previewUrl && (
                <video src={previewUrl} className="w-full rounded-xl max-h-40 object-contain bg-black" muted controls />
              )}

              {/* Caption */}
              <div>
                <label className="text-white text-xs font-black uppercase tracking-wider mb-2 block">
                  Caption <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                  placeholder="Tell people about this video…"
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-kazi-orange resize-none"
                />
                <p className="text-gray-500 text-xs text-right mt-1">{caption.length}/300</p>
              </div>

              {/* ── AUDIO PICKER ── */}
              <div>
                <label className="text-white text-xs font-black uppercase tracking-wider mb-2 block">
                  🎵 Background Music
                </label>

                {/* Selected audio pill */}
                {selectedAudio ? (
                  <div className="flex items-center justify-between bg-purple-500/20 border border-purple-500/40 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center animate-spin [animation-duration:3s]">
                        <Music2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{selectedAudio.name}</p>
                        <p className="text-purple-300 text-xs">Background audio selected</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAudio(null)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAudioPicker(true)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Music2 className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300 text-sm">Add music to your video</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-white text-xs font-black uppercase tracking-wider mb-2 block">
                  Hashtags (up to 5)
                </label>
                <div className="flex gap-2">
                  <input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value.replace(/\s/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addHashtag(); } }}
                    placeholder="#nairobi"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-kazi-orange"
                  />
                  <button onClick={addHashtag} disabled={hashtags.length >= 5} className="px-3 py-2 bg-kazi-orange text-white text-xs font-black rounded-xl disabled:opacity-50">
                    Add
                  </button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hashtags.map((h) => (
                      <span key={h} className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 text-kazi-orange text-xs font-bold rounded-full border border-orange-500/30">
                        #{h}
                        <button onClick={() => setHashtags(hashtags.filter((x) => x !== h))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer-only: Rating + Provider */}
              {isCustomer && (
                <>
                  <div>
                    <label className="text-white text-xs font-black uppercase tracking-wider mb-2 block">
                      Your Rating <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(n)} className="transition-transform active:scale-90">
                          <Star className="w-8 h-8 transition-colors" fill={(hoverRating || rating) >= n ? "#F59E0B" : "none"} color={(hoverRating || rating) >= n ? "#F59E0B" : "#6B7280"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {bookedProviders.length > 0 && (
                    <div>
                      <label className="text-white text-xs font-black uppercase tracking-wider mb-2 block">
                        Which provider did you work with?
                      </label>
                      <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kazi-orange">
                        <option value="" className="bg-gray-900">Select a provider (optional)</option>
                        {bookedProviders.map((p) => (
                          <option key={p.id} value={p.id} className="bg-gray-900">{p.businessName} · {p.category}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="px-5 py-4 border-t border-white/10">
            <button
              onClick={handlePost}
              disabled={posting || !caption.trim() || (isCustomer && rating === 0)}
              className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {posting
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><CheckCircle className="w-5 h-5" /> Post Video</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── AUDIO PICKER SHEET ── */}
      {showAudioPicker && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAudioPicker(false)} />
          <div className="relative w-full sm:max-w-lg bg-gray-900 rounded-t-3xl z-10 max-h-[80vh] flex flex-col">

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-black text-base">Add Music</h3>
              </div>
              <button onClick={() => setShowAudioPicker(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Upload your own audio */}
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wider mb-3">
                  Upload Your Own
                </p>
                {uploadingAudio ? (
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">Uploading audio…</span>
                      <span className="text-purple-400 font-black text-sm">{audioUploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${audioUploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 border border-dashed border-white/30 rounded-xl hover:bg-white/20 transition-all"
                  >
                    <Upload className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-white text-sm font-bold">Choose from your device</p>
                      <p className="text-gray-400 text-xs">MP3, M4A, WAV · Max 20MB</p>
                    </div>
                  </button>
                )}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickAudioFile(f); }}
                />
              </div>

              {/* Preset tracks */}
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wider mb-3">
                  Trending Sounds
                </p>
                <div className="space-y-2">
                  {PRESET_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setSelectedAudio({ name: `${track.name} · ${track.artist}`, audioUrl: track.audioUrl });
                        setShowAudioPicker(false);
                        toast.success(`🎵 "${track.name}" selected`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/15 rounded-xl transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Music2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{track.name}</p>
                        <p className="text-gray-400 text-xs">{track.artist}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
