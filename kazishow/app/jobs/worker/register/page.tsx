"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, User } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function WorkerRegisterPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    skills: "", experience: "", location: "", phone: "", bio: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress image to max 800px and <1MB before upload
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
        setPhoto(compressed);
        setPhotoPreview(canvas.toDataURL("image/jpeg", 0.85));
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.85);
    };
    img.src = url;
  }

  async function handleSubmit() {
    if (!form.skills.trim()) { toast.error("Please enter your skills"); return; }
    if (!form.location.trim()) { toast.error("Please enter your location"); return; }
    if (!form.phone.trim()) { toast.error("Please enter your phone number"); return; }
    if (!photo) { toast.error("Your photo is required — employers need to see who you are"); return; }

    const token = localStorage.getItem("kazishow_token") || "";
    if (!token) { router.push("/auth/login"); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("skills",    form.skills.trim());
      fd.append("location",  form.location.trim());
      fd.append("idNumber",  form.phone.trim());   // backend field name kept as idNumber
      if (form.experience.trim()) fd.append("experience", form.experience.trim());
      if (form.bio.trim())        fd.append("bio",        form.bio.trim());
      fd.append("idPhoto", photo);                 // reusing idPhoto field for profile photo

      const res = await fetch(`${API}/api/jobs/worker/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Worker profile created! Find jobs now 🎉");
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
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 mb-4 text-sm hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">👷 Create Worker Profile</h1>
        <p className="text-white/50 text-sm mt-1">Free to register. Start getting hired for casual jobs today.</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">

        {/* Benefits banner */}
        <div className="bg-kazi-orange rounded-2xl p-4">
          <p className="text-white font-black text-base mb-2">Why join KaziShow Jobs?</p>
          {[
            "Find same-day casual work near you",
            "Get paid via M-Pesa after every job",
            "Build your reputation with ratings",
            "Free to register — no subscription fees",
          ].map((b) => (
            <p key={b} className="text-white/90 text-sm flex items-center gap-2 mb-1">
              <span>✓</span> {b}
            </p>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="font-black text-kazi-dark text-base">Your Details</h3>

          {/* ── Profile Photo (REQUIRED) ── */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Your Photo <span className="text-red-500">* Required</span>
            </label>
            <div className="flex items-center gap-4">
              {/* Photo preview */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-dashed transition-colors ${
                  photoPreview ? "border-kazi-orange" : "border-gray-300 hover:border-kazi-orange bg-gray-50"
                }`}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Your photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <User className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Tap to add</span>
                  </div>
                )}
              </button>

              <div className="flex-1">
                <p className="text-sm font-bold text-kazi-dark mb-1">
                  {photoPreview ? "✅ Photo added" : "Add your photo"}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Employers want to see who they are hiring. A clear face photo gets you hired faster.
                </p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-kazi-orange text-white font-bold rounded-xl text-xs active:scale-95 transition-transform"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {photoPreview ? "Change Photo" : "Upload Photo"}
                </button>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* ── Skills ── */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Your Skills <span className="text-red-500">*</span>
            </label>
            <input
              value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="e.g. Loading, cleaning, catering, security, driving"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors"
            />
          </div>

          {/* ── Location ── */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Location / Area <span className="text-red-500">*</span>
            </label>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors"
            />
          </div>

          {/* ── Phone Number ── */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. 0712 345 678"
              type="tel"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">
              Employers will use this to contact you when you are hired. M-Pesa payment sent here.
            </p>
          </div>

          {/* ── Experience ── */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Work Experience
            </label>
            <textarea
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
              placeholder="e.g. 2 years loading at Mombasa port, event waiter at hotels, house cleaner…"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none transition-colors"
            />
          </div>

          {/* ── Bio ── */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Short Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Tell employers a bit about yourself — reliable, hardworking, punctual…"
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none transition-colors"
            />
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-black text-kazi-dark text-sm mb-3">What happens after you register?</p>
          {[
            { step: "1", text: "Your profile is live immediately" },
            { step: "2", text: "Browse jobs at kazishow.co.ke/jobs" },
            { step: "3", text: "Apply for jobs with one tap" },
            { step: "4", text: "Employer reviews and hires you" },
            { step: "5", text: "Do the job — get paid via M-Pesa" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3 mb-2.5">
              <div className="w-6 h-6 bg-kazi-orange rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-black">{step}</span>
              </div>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-base disabled:opacity-60 active:scale-[0.98] transition-all shadow-lg shadow-orange-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating profile…
            </span>
          ) : "Create Profile & Find Jobs — FREE"}
        </button>
      </div>
    </div>
  );
}
