"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function WorkerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    skills: "", experience: "", location: "", idNumber: "", bio: "",
  });
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.skills || !form.location || !form.idNumber) {
      toast.error("Skills, location and ID number are required");
      return;
    }
    const token = localStorage.getItem("kazishow_token") || "";
    if (!token) { router.push("/auth/login"); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (idPhoto) fd.append("idPhoto", idPhoto);

      const res = await fetch(`${API}/api/jobs/worker/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Worker profile created! 🎉");
        router.push("/jobs");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("Network error — please try again");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 mb-4 text-sm hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">👷 Create Worker Profile</h1>
        <p className="text-white/50 text-sm mt-1">Free to register. Start getting hired for casual jobs.</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">

        {/* Benefits */}
        <div className="bg-kazi-orange rounded-2xl p-4">
          <p className="text-white font-black text-base mb-2">Why join KaziShow Jobs?</p>
          {["Find same-day casual work near you", "Get paid via M-Pesa after every job", "Build your reputation with ratings", "Free to register — no subscription fees"].map((b) => (
            <p key={b} className="text-white/90 text-sm flex items-center gap-2 mb-1">
              <span className="text-white">✓</span> {b}
            </p>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-kazi-dark text-base">Your Details</h3>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Skills *</label>
            <input value={form.skills} onChange={(e) => set("skills", e.target.value)}
              placeholder="e.g. Loading, cleaning, catering, security, driving"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Location / Area *</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">National ID Number *</label>
            <input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)}
              placeholder="e.g. 12345678"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
            <p className="text-xs text-gray-400 mt-1">Required for verification and trust. Not shared publicly.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Experience</label>
            <textarea value={form.experience} onChange={(e) => set("experience", e.target.value)}
              placeholder="Briefly describe your work experience…"
              rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Short Bio</label>
            <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)}
              placeholder="Tell employers a bit about yourself…"
              rows={2} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none transition-colors" />
          </div>

          {/* ID Photo upload */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">ID Photo (optional but recommended)</label>
            <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${idPhoto ? "border-kazi-orange bg-orange-50" : "border-gray-200 hover:border-kazi-orange"}`}>
              <Upload className="w-5 h-5 text-kazi-orange flex-shrink-0" />
              <span className="text-sm text-gray-600">
                {idPhoto ? idPhoto.name : "Upload a photo of your National ID"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setIdPhoto(e.target.files?.[0] || null)} />
            </label>
            <p className="text-xs text-gray-400 mt-1">Verified workers get hired faster and build trust with employers.</p>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-base disabled:opacity-60 active:scale-[0.98] transition-all shadow-lg shadow-orange-200">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…
            </span>
          ) : "Create Worker Profile — FREE"}
        </button>
      </div>
    </div>
  );
}
