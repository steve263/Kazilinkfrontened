"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, User, Smartphone, MapPin, Navigation,
  Upload, Camera, CheckCircle, Loader2, HardHat, BookOpen,
  Briefcase, Plus, X, Star, ShieldCheck, FileText, ScanFace,
  AlertTriangle, ImageIcon, Lock, Eye, EyeOff, Clock, Package,
  Trash2, Video,
} from "lucide-react";
import toast from "react-hot-toast";
import { FUNDI_CATEGORIES, EDUCATION_LEVELS } from "@/lib/data";
import OTPModal from "@/components/trust/OTPModal";
import ImageUpload from "@/components/shared/ImageUpload";
import MultiImageUpload from "@/components/shared/MultiImageUpload";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ServiceEntry {
  name: string;
  price: string;
  priceType: "FIXED" | "FROM" | "NEGOTIABLE";
}

interface CertEntry {
  name: string;
  fileUrl: string;
  publicId: string;
}

interface FundiForm {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePhoto: string;
  category: string;
  yearsExperience: string;
  description: string;
  skills: string[];
  skillInput: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  services: ServiceEntry[];
  education: string;
  certificates: CertEntry[];
  certName: string;
  idPhotoUrl: string;
  idBackPhotoUrl: string;
  portfolioPhotos: string[];
  beforeAfterPhotos: string[];
  portfolioVideoUrl: string;
  portfolioVideoPublicId: string;
  location: string;
  locationDetected: boolean;
}

const STEPS = [
  { title: "Basic Info",    icon: User      },
  { title: "Skills",        icon: BookOpen  },
  { title: "Services",      icon: Package   },
  { title: "Documents",     icon: FileText  },
  { title: "Portfolio",     icon: Camera    },
  { title: "Location",      icon: MapPin    },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return `${h}:00`;
});

export default function FundiRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [done, setDone] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [certUploading, setCertUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [serviceEntry, setServiceEntry] = useState<ServiceEntry>({ name: "", price: "", priceType: "FIXED" });

  const [form, setForm] = useState<FundiForm>({
    name: "", phone: "+254 ", email: "", password: "", confirmPassword: "", profilePhoto: "",
    category: "", yearsExperience: "",
    description: "", skills: [], skillInput: "",
    workingHoursStart: "08:00", workingHoursEnd: "18:00",
    services: [],
    education: "", certificates: [], certName: "", idPhotoUrl: "", idBackPhotoUrl: "",
    portfolioPhotos: [], beforeAfterPhotos: [],
    portfolioVideoUrl: "", portfolioVideoPublicId: "",
    location: "", locationDetected: false,
  });

  const set = (field: keyof FundiForm, value: FundiForm[typeof field]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Skills ──────────────────────────────────────────────────────────────────

  const addSkill = () => {
    const s = form.skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 8) {
      set("skills", [...form.skills, s]);
      set("skillInput", "");
    }
  };

  const removeSkill = (s: string) => set("skills", form.skills.filter((x) => x !== s));

  // ── Services ────────────────────────────────────────────────────────────────

  const addService = () => {
    if (!serviceEntry.name.trim() || !serviceEntry.price) {
      toast.error("Enter service name and price");
      return;
    }
    if (form.services.length >= 8) {
      toast.error("Maximum 8 services");
      return;
    }
    set("services", [...form.services, { ...serviceEntry, name: serviceEntry.name.trim() }]);
    setServiceEntry({ name: "", price: "", priceType: "FIXED" });
  };

  const removeService = (i: number) =>
    set("services", form.services.filter((_, idx) => idx !== i));

  // ── Certificate file upload ──────────────────────────────────────────────────

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.certName.trim()) {
      toast.error("Enter certificate name first");
      e.target.value = "";
      return;
    }
    setCertUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/api/upload/public-document`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        const newCert: CertEntry = {
          name: form.certName.trim(),
          fileUrl: data.data.url,
          publicId: data.data.publicId || "",
        };
        set("certificates", [...form.certificates, newCert]);
        set("certName", "");
        toast.success("Certificate uploaded ✓");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload error");
    }
    setCertUploading(false);
    e.target.value = "";
  };

  const removeCert = (i: number) =>
    set("certificates", form.certificates.filter((_, idx) => idx !== i));

  // ── Portfolio video upload ───────────────────────────────────────────────────

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be under 50 MB");
      e.target.value = "";
      return;
    }
    setVideoUploading(true);
    try {
      const fd = new FormData();
      fd.append("video", file);
      const res = await fetch(`${API}/api/upload/public-video`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        set("portfolioVideoUrl", data.data.url);
        set("portfolioVideoPublicId", data.data.publicId || "");
        toast.success("Video uploaded ✓");
      } else {
        toast.error(data.message || "Video upload failed");
      }
    } catch {
      toast.error("Video upload error");
    }
    setVideoUploading(false);
    e.target.value = "";
  };

  // ── Location ────────────────────────────────────────────────────────────────

  const detectLocation = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      toast.error("Location not supported");
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        set("location", "Nairobi, Kenya (GPS)");
        set("locationDetected", true);
        setDetecting(false);
        toast.success("Location detected!");
      },
      () => {
        setDetecting(false);
        toast.error("Could not detect. Enter manually.");
      }
    );
  };

  // ── Step validation ──────────────────────────────────────────────────────────

  const canProceed = () => {
    if (step === 0) return !!(form.name && form.phone && form.category && form.yearsExperience && form.password.length >= 6 && form.password === form.confirmPassword && termsAccepted);
    if (step === 1) return form.description.length >= 30 && form.skills.length >= 1;
    if (step === 2) return form.services.length >= 1;
    if (step === 3) return !!(form.idPhotoUrl && form.idBackPhotoUrl && form.education);
    if (step === 4) return form.portfolioPhotos.length >= 1;
    if (step === 5) return form.location.length > 0;
    return true;
  };

  const next = () => {
    if (!canProceed()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step === 0 && !phoneVerified) {
      setShowOTP(true);
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleOTPVerified = () => {
    setShowOTP(false);
    setPhoneVerified(true);
    setStep(1);
    toast.success("Phone verified! Continue your registration.");
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const allPhotos = [...form.portfolioPhotos, ...form.beforeAfterPhotos];
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.replace(/\s/g, ""),
          ...(form.email.trim() && { email: form.email.trim() }),
          password: form.password,
          role: "PROVIDER",
          location: form.location || "Nairobi",
          category: "FUNDI",
          businessName: form.name,
          description: form.description,
          workingHoursStart: form.workingHoursStart,
          workingHoursEnd: form.workingHoursEnd,
          skills: form.skills,
          yearsExperience: form.yearsExperience,
          education: form.education,
          ...(form.profilePhoto && { profilePhoto: form.profilePhoto }),
          ...(form.idPhotoUrl && { idPhotoUrl: form.idPhotoUrl }),
          ...(form.idBackPhotoUrl && { idBackPhotoUrl: form.idBackPhotoUrl }),
          ...(allPhotos.length > 0 && { portfolioPhotos: allPhotos }),
          ...(form.services.length > 0 && { services: form.services }),
          ...(form.certificates.length > 0 && { certificates: form.certificates }),
          ...(form.portfolioVideoUrl && {
            portfolioVideoUrl: form.portfolioVideoUrl,
            portfolioVideoPublicId: form.portfolioVideoPublicId,
          }),
        }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("kazishow_token", data.data.token);
        localStorage.setItem("kazishow_user", JSON.stringify(data.data.user));
        setLoading(false);
        setDone(true);
      } else {
        toast.error(data.message || "Registration failed");
        setLoading(false);
      }
    } catch {
      toast.error("Cannot connect to server");
      setLoading(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center px-5">
        <div className="text-center max-w-xs mx-auto animate-slide-up">
          <div className="w-20 h-20 bg-kazi-orange/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <HardHat className="w-11 h-11 text-kazi-orange" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Application Submitted! 🎉</h2>
          <p className="text-white/50 text-sm mb-5 leading-relaxed">
            Thank you, <strong className="text-white">{form.name.split(" ")[0]}</strong>! Your profile is under review.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2.5">
            {[
              { icon: ShieldCheck, label: "ID Verification", status: "Under review" },
              { icon: FileText,    label: form.certificates.length > 0 ? `${form.certificates.length} Certificate(s)` : "Documents", status: "Pending review" },
              { icon: Star,        label: '"Verified Fundi" badge', status: "Awarded on approval" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-white/40 flex-shrink-0" />
                <p className="text-xs text-white/70 font-medium flex-1">{item.label}</p>
                <span className="text-xs font-semibold text-kazi-amber">{item.status}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 mb-6">
            You&apos;ll receive an SMS at {form.phone} once approved (usually 24–48 hours).
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all text-sm"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-dark flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-0 w-96 h-96 bg-kazi-orange/8 rounded-full filter blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative px-5 pt-10 pb-4 max-w-sm mx-auto w-full">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.push("/auth/register/provider-type"))}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          {step > 0 ? "Back" : "Change type"}
        </button>

        {/* Step progress */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-kazi-orange" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-kazi-orange/20 flex items-center justify-center flex-shrink-0">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-kazi-orange" />; })()}
          </div>
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
              Step {step + 1} of {STEPS.length} — Skilled Worker
            </p>
            <h2 className="text-lg font-black text-white">{STEPS[step].title}</h2>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="relative flex-1 px-5 max-w-sm mx-auto w-full pb-32 space-y-4 animate-fade-in">

        {/* ── Step 0: Basic Info ─────────────────────────────────── */}
        {step === 0 && (
          <>
            <div className="flex flex-col items-center gap-1 mb-2">
              <ImageUpload
                folder="customers"
                shape="circle"
                theme="dark"
                currentUrl={form.profilePhoto}
                onUpload={(url) => set("profilePhoto", url)}
              />
              <p className="text-xs text-white/30">Profile photo (optional)</p>
            </div>

            <Field label="Full Name" required>
              <InputIcon icon={User}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  type="text" placeholder="e.g. John Kamau" className={inputCls} />
              </InputIcon>
            </Field>

            <Field label="Phone Number" required>
              <InputIcon icon={Smartphone}>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  type="tel" placeholder="+254 7XX XXX XXX" className={inputCls} />
              </InputIcon>
            </Field>

            <Field label="Email Address" hint="We'll send booking alerts here">
              <InputIcon icon={Briefcase}>
                <input value={form.email} onChange={(e) => set("email", e.target.value)}
                  type="email" placeholder="you@example.com" className={inputCls} />
              </InputIcon>
            </Field>

            <Field label="Password" required hint="Minimum 6 characters">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                <input value={form.password} onChange={(e) => set("password", e.target.value)}
                  type={showPassword ? "text" : "password"} placeholder="Create a password"
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirm Password" required>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                <input value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)}
                  type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
                  className={`w-full pl-11 pr-11 py-3.5 bg-white/[0.08] border rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all ${
                    form.confirmPassword && form.password !== form.confirmPassword ? "border-red-500/60" : "border-white/15"
                  }`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5 ml-0.5">Passwords do not match</p>
              )}
            </Field>

            <Field label="Service Category" required hint="What is your main skill?">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selectCls}>
                <option value="">Select a category…</option>
                {FUNDI_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Years of Experience" required>
              <select value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} className={selectCls}>
                <option value="">Select years…</option>
                {["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"].map((y) => <option key={y}>{y}</option>)}
              </select>
            </Field>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-kazi-orange flex-shrink-0"
              />
              <span className="text-xs text-white/40 leading-relaxed">
                I agree to KaziShow&apos;s{" "}
                <Link href="/terms" className="text-kazi-orange hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-kazi-orange hover:underline">Privacy Policy</Link>
              </span>
            </label>
          </>
        )}

        {/* ── Step 1: Skills & Description ──────────────────────── */}
        {step === 1 && (
          <>
            <Field label="Describe Your Services" required hint="Minimum 30 characters — explain what you do and what sets you apart">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="e.g. I am a certified electrician with 8 years of experience in residential and commercial wiring…"
                className="w-full px-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange resize-none transition-all"
              />
              <p className={`text-xs mt-1 text-right ${form.description.length >= 30 ? "text-kazi-green" : "text-white/30"}`}>
                {form.description.length}/30 min
              </p>
            </Field>

            <Field label="Skills" required hint="Add up to 8 specific skills (press Enter or Add)">
              <div className="flex gap-2">
                <input
                  value={form.skillInput}
                  onChange={(e) => set("skillInput", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="e.g. House Wiring, Solar Installation"
                  className={`flex-1 ${inputCls}`}
                />
                <button type="button" onClick={addSkill}
                  className="px-4 py-3 bg-kazi-orange/20 text-kazi-orange rounded-2xl hover:bg-kazi-orange/30 transition-colors font-semibold text-sm">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {form.skills.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-kazi-orange/20 text-kazi-orange text-xs font-semibold rounded-xl">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Working Hours" hint="When are you available to take jobs?">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">From</p>
                  <select value={form.workingHoursStart} onChange={(e) => set("workingHoursStart", e.target.value)} className={selectCls}>
                    {HOURS.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <Clock className="w-4 h-4 text-white/30 mt-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">To</p>
                  <select value={form.workingHoursEnd} onChange={(e) => set("workingHoursEnd", e.target.value)} className={selectCls}>
                    {HOURS.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </Field>
          </>
        )}

        {/* ── Step 2: Services ───────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="bg-kazi-orange/10 border border-kazi-orange/30 rounded-2xl p-4 flex items-start gap-3">
              <Package className="w-5 h-5 text-kazi-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                List specific services with prices so customers know exactly what you offer. <strong className="text-white">At least 1 required.</strong>
              </p>
            </div>

            {/* Add service form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wide">Add a Service</p>

              <Field label="Service Name" required>
                <input
                  value={serviceEntry.name}
                  onChange={(e) => setServiceEntry((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addService()}
                  placeholder="e.g. House Wiring, Pipe Repair, Painting"
                  className={inputCls.replace("pl-11", "pl-4")}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (KSh)" required>
                  <input
                    type="number"
                    value={serviceEntry.price}
                    onChange={(e) => setServiceEntry((p) => ({ ...p, price: e.target.value }))}
                    placeholder="e.g. 3000"
                    className={inputCls.replace("pl-11", "pl-4")}
                  />
                </Field>
                <Field label="Price Type">
                  <select
                    value={serviceEntry.priceType}
                    onChange={(e) => setServiceEntry((p) => ({ ...p, priceType: e.target.value as any }))}
                    className={selectCls}
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="FROM">From</option>
                    <option value="NEGOTIABLE">Quote</option>
                  </select>
                </Field>
              </div>

              <button
                type="button"
                onClick={addService}
                className="w-full py-2.5 bg-kazi-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>

            {/* Services list */}
            {form.services.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 font-medium">
                  {form.services.length} service{form.services.length !== 1 ? "s" : ""} added
                </p>
                {form.services.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">{svc.name}</p>
                      <p className="text-xs text-kazi-orange font-semibold">
                        {svc.priceType === "NEGOTIABLE" ? "Quote" : svc.priceType === "FROM" ? `From KSh ${parseInt(svc.price).toLocaleString()}` : `KSh ${parseInt(svc.price).toLocaleString()}`}
                      </p>
                    </div>
                    <button onClick={() => removeService(i)} className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Documents ──────────────────────────────────── */}
        {step === 3 && (
          <>
            <div className="bg-kazi-orange/10 border border-kazi-orange/30 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-kazi-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Document verification builds <strong className="text-white">trust with customers</strong> and earns you the <span className="text-kazi-orange font-semibold">"Verified Fundi"</span> badge.
              </p>
            </div>

            <Field label="Front of National ID / Passport" required hint="Upload a clear photo of the front">
              <ImageUpload folder="ids" theme="dark" shape="square"
                currentUrl={form.idPhotoUrl}
                onUpload={(url) => { set("idPhotoUrl", url); toast.success("ID front uploaded ✓"); }}
                hint="JPG, PNG or WebP · Max 5 MB"
              />
              {form.idPhotoUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-kazi-green" fill="#00C896" />
                  <span className="text-xs text-kazi-green font-semibold">Front uploaded ✓</span>
                </div>
              )}
            </Field>

            <Field label="Back of National ID / Passport" required hint="Upload a clear photo of the back">
              <ImageUpload folder="ids" theme="dark" shape="square"
                currentUrl={form.idBackPhotoUrl}
                onUpload={(url) => { set("idBackPhotoUrl", url); toast.success("ID back uploaded ✓"); }}
                hint="JPG, PNG or WebP · Max 5 MB"
              />
              {form.idBackPhotoUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-kazi-green" fill="#00C896" />
                  <span className="text-xs text-kazi-green font-semibold">Back uploaded ✓</span>
                </div>
              )}
            </Field>

            <Field label="Level of Education" required>
              <select value={form.education} onChange={(e) => set("education", e.target.value)} className={selectCls}>
                <option value="">Select education level…</option>
                {EDUCATION_LEVELS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Field>

            {/* Real certificate upload */}
            <Field label="Certificates / Qualifications" hint="Upload actual certificate files (PDF, JPG, PNG). These go to admin for review.">
              <div className="flex gap-2 mb-2">
                <input
                  value={form.certName}
                  onChange={(e) => set("certName", e.target.value)}
                  placeholder="Certificate name (e.g. KPLC License)"
                  className={`flex-1 ${inputCls.replace("pl-11", "pl-4")}`}
                />
              </div>
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                disabled={certUploading || !form.certName.trim()}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm text-white/60 disabled:opacity-40"
              >
                {certUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {certUploading ? "Uploading…" : "Upload Certificate File (PDF/Image)"}
              </button>
              <input
                ref={certInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleCertUpload}
              />
              <p className="text-xs text-white/30 mt-1 ml-0.5">Type certificate name above, then tap to upload the file</p>

              {form.certificates.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.certificates.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-kazi-green/10 border border-kazi-green/30 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-kazi-green flex-shrink-0" />
                        <span className="text-xs font-semibold text-white truncate">{c.name}</span>
                        <span className="text-[10px] text-kazi-green font-bold flex-shrink-0">✓ Uploaded</span>
                      </div>
                      <button onClick={() => removeCert(i)} className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </>
        )}

        {/* ── Step 4: Portfolio ──────────────────────────────────── */}
        {step === 4 && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
              <Camera className="w-5 h-5 text-kazi-amber flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Customers choose fundis <strong className="text-white">3× more often</strong> when they can see real photos of your work.
              </p>
            </div>

            <div className="bg-kazi-orange/10 border border-kazi-orange/20 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-kazi-orange flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/60 leading-relaxed">
                Only upload <strong className="text-white">your own real work photos</strong>. We detect stock or duplicate images.
              </p>
            </div>

            <MultiImageUpload
              folder="portfolio" maxFiles={6} theme="dark" label="Work Photos"
              hint="Upload original photos of completed work · JPG, PNG, WebP · Max 5 MB each"
              onUpload={(urls) => set("portfolioPhotos", urls)}
            />

            <MultiImageUpload
              folder="portfolio" maxFiles={4} theme="dark" label="Before & After Photos"
              hint="Before/after pairs boost bookings 5×."
              onUpload={(urls) => set("beforeAfterPhotos", urls)}
            />

            {/* Real video upload */}
            <Field label="Short Video (Optional)" hint="A 30–60 second video of your work. Goes to admin for approval before being shown publicly.">
              {form.portfolioVideoUrl ? (
                <div className="bg-kazi-green/10 border border-kazi-green/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-kazi-green" />
                    <div>
                      <p className="text-sm font-bold text-white">Video uploaded ✓</p>
                      <p className="text-xs text-white/40">Pending admin approval</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { set("portfolioVideoUrl", ""); set("portfolioVideoPublicId", ""); }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                  className="w-full py-8 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 hover:border-kazi-orange/40 hover:bg-white/8 transition-all flex flex-col items-center gap-2"
                >
                  {videoUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-kazi-orange animate-spin" />
                      <span className="text-sm text-white/60">Uploading video…</span>
                      <span className="text-xs text-white/30">This may take a minute</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white/40" />
                      </div>
                      <span className="text-sm text-white/40">Tap to upload a short video</span>
                      <span className="text-xs text-white/25">MP4, MOV, WebM · Max 50 MB · ~60 sec</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </Field>
          </>
        )}

        {/* ── Step 5: Location ───────────────────────────────────── */}
        {step === 5 && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-kazi-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Your location is shown on the map so nearby customers can find you.
              </p>
            </div>

            <Field label="Your Location" required hint="Enable GPS for best accuracy, or type your area">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Westlands, Nairobi"
                  className="w-full pl-11 pr-[110px] py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange transition-all"
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detecting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 bg-kazi-orange/20 hover:bg-kazi-orange/30 text-kazi-orange text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  {detecting ? "Detecting…" : "Use GPS"}
                </button>
              </div>
            </Field>

            {/* Map placeholder */}
            <div className="h-40 rounded-2xl overflow-hidden relative"
              style={{ background: "#1d2d1d", backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "30px 30px" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                {form.location ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-kazi-orange rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                      <MapPin className="w-5 h-5 text-white" fill="white" />
                    </div>
                    <div className="mt-2 px-3 py-1 bg-kazi-dark2 rounded-lg shadow">
                      <p className="text-xs text-white font-semibold">{form.location}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/20 text-sm">Enter location above</p>
                )}
              </div>
            </div>

            {/* Registration summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-bold text-white mb-3">Registration Summary</h4>
              {[
                { label: "Name",         value: form.name || "—" },
                { label: "Category",     value: form.category || "—" },
                { label: "Experience",   value: form.yearsExperience || "—" },
                { label: "Skills",       value: form.skills.length > 0 ? `${form.skills.length} added` : "—" },
                { label: "Services",     value: form.services.length > 0 ? `${form.services.length} service${form.services.length !== 1 ? "s" : ""}` : "—" },
                { label: "Hours",        value: `${form.workingHoursStart} – ${form.workingHoursEnd}` },
                { label: "ID Documents", value: form.idPhotoUrl && form.idBackPhotoUrl ? "Front & Back ✓" : "Incomplete" },
                { label: "Certificates", value: form.certificates.length > 0 ? `${form.certificates.length} uploaded` : "None" },
                { label: "Portfolio",    value: `${form.portfolioPhotos.length} photo${form.portfolioPhotos.length !== 1 ? "s" : ""}` },
                { label: "Video",        value: form.portfolioVideoUrl ? "Uploaded ✓" : "None" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-white/40">{row.label}</span>
                  <span className={`font-semibold ${["—", "Incomplete", "None"].includes(row.value) ? "text-white/30" : "text-white"}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-kazi-dark via-kazi-dark to-transparent">
        <div className="max-w-sm mx-auto">
          {step === 0 && !phoneVerified && (
            <p className="text-xs text-white/40 text-center mb-2 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Phone verification required to continue
            </p>
          )}
          {step === 0 && phoneVerified && (
            <div className="flex items-center justify-center gap-1 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-kazi-green" fill="#00C896" />
              <span className="text-xs text-kazi-green font-semibold">Phone verified ✓</span>
            </div>
          )}
          <button
            onClick={next}
            disabled={loading || !canProceed()}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-2xl shadow-orange-500/30"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
            ) : step === STEPS.length - 1 ? (
              <><ShieldCheck className="w-5 h-5" /> Submit for Verification</>
            ) : step === 0 && !phoneVerified ? (
              <><Smartphone className="w-5 h-5" /> Verify Phone &amp; Continue</>
            ) : (
              <>Continue <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
          <p className="text-center text-xs text-white/30 mt-3">
            Step {step + 1} of {STEPS.length}
            {step === STEPS.length - 1 && " · Reviewed within 24–48 hours"}
          </p>
        </div>
      </div>

      {showOTP && (
        <OTPModal phone={form.phone} onVerified={handleOTPVerified} onClose={() => setShowOTP(false)} />
      )}
    </div>
  );
}

// ─── Mini helpers ──────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/70 mb-1.5">
        {label}{required && <span className="text-kazi-orange"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-white/30 mt-1.5 ml-0.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function InputIcon({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
      {children}
    </div>
  );
}

const inputCls =
  "w-full pl-11 pr-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all";

const selectCls =
  "w-full px-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange appearance-none transition-all [&>option]:bg-kazi-dark2 [&>option]:text-white";
