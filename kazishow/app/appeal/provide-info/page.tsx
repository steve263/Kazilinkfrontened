"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProvideInfoPage() {
  const router = useRouter();
  const [appeal, setAppeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [newEvidence, setNewEvidence] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { router.push("/auth/login"); return; }

    fetch(`${API_URL}/api/trust/appeal/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.status === "MORE_INFO_NEEDED") {
          setAppeal(d.data);
        } else {
          router.push("/");
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/upload/public`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setNewEvidence((prev) => [...prev, data.data.url]);
        toast.success("File uploaded!");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (additionalInfo.trim().length < 20) {
      toast.error("Please provide more details (at least 20 characters)");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/trust/appeal/${appeal.id}/provide-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ additionalInfo, newEvidence }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast.error(data.message || "Failed to submit");
      }
    } catch {
      toast.error("Cannot connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-kazi-dark flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-3">Information Submitted!</h2>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            Thank you for providing the additional information. Our team will continue reviewing your appeal.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-dark">
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-black text-white text-lg">Provide More Information</h1>
          <p className="text-white/40 text-xs">Admin has requested additional details</p>
        </div>
      </div>

      <div className="p-5 max-w-lg mx-auto space-y-5">
        {/* Admin questions */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">📋 Admin Questions</p>
          <p className="text-white/80 text-sm leading-relaxed">{appeal?.adminNote}</p>
        </div>

        {/* Additional info */}
        <div>
          <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">
            Your Response *
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Provide detailed answers to the admin's questions..."
            rows={6}
            className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-kazi-orange resize-none transition-colors"
          />
          <p className={`text-xs mt-1 ${additionalInfo.length < 20 ? "text-red-400" : "text-green-400"}`}>
            {additionalInfo.length < 20 ? `${20 - additionalInfo.length} more characters needed` : "✓ Good"}
          </p>
        </div>

        {/* Additional evidence */}
        <div>
          <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">
            Additional Evidence (Optional)
          </label>
          {newEvidence.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {newEvidence.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-full h-20 object-cover rounded-xl" />
                  <button
                    onClick={() => setNewEvidence((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {newEvidence.length < 5 && (
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${uploading ? "border-kazi-orange" : "border-white/20 hover:border-kazi-orange"}`}>
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-6 h-6 text-white/30" />
                    <p className="text-white/50 text-sm">Add files ({newEvidence.length}/5)</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
            </label>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || additionalInfo.trim().length < 20}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Information →"
          )}
        </button>
      </div>
    </div>
  );
}
