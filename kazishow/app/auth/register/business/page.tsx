"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Store, Smartphone, MapPin, Navigation,
  Upload, Camera, CheckCircle, Loader2, Clock, Plus, X,
  ShieldCheck, FileText, Image as ImageIcon, Lock, Eye, EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { BUSINESS_CATEGORIES } from "@/lib/data";
import ImageUpload from "@/components/shared/ImageUpload";
import MultiImageUpload from "@/components/shared/MultiImageUpload";

const CATEGORY_ENUM: Record<string, string> = {
  "Salon & Barbershop":       "SHOP",
  "Restaurant & Hotel":       "RESTAURANT",
  "Cleaning Company":         "BUSINESS",
  "Repair Shop":              "SHOP",
  "Gym & Fitness Centre":     "BUSINESS",
  "Clinic & Hospital":        "PROFESSIONAL",
  "School & Training Centre": "PROFESSIONAL",
  "Photography Studio":       "BUSINESS",
  "Event Company":            "BUSINESS",
  "Security Company":         "BUSINESS",
  "Catering Company":         "RESTAURANT",
  "Other":                    "BUSINESS",
};

interface BusinessForm {
  // Step 1 — Business info
  businessName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  category: string;
  description: string;
  // Step 2 — Services & hours
  services: { name: string; price: string; duration: string }[];
  serviceInput: string;
  openTime: string;
  closeTime: string;
  workDays: string;
  // Step 3 — Media
  logoUrl: string;
  businessPhotos: string[];
  videoUploaded: boolean;
  // Step 4 — Location
  location: string;
}

const DAYS_OPTIONS = [
  "Mon–Fri", "Mon–Sat", "Mon–Sun (7 days)", "Tue–Sun", "Wed–Sun", "By appointment only",
];

const STEPS = [
  { title: "Business Info", icon: Store },
  { title: "Services & Hours", icon: Clock },
  { title: "Photos & Video", icon: Camera },
  { title: "Location", icon: MapPin },
];

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [done, setDone] = useState(false);
  const [serviceInput, setServiceInput] = useState({ name: "", price: "", duration: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [form, setForm] = useState<BusinessForm>({
    businessName: "", phone: "+254 ", email: "", password: "", confirmPassword: "", category: "", description: "",
    services: [], serviceInput: "",
    openTime: "08:00", closeTime: "18:00", workDays: "Mon–Sat",
    logoUrl: "", businessPhotos: [], videoUploaded: false,
    location: "",
  });

  const set = (field: keyof BusinessForm, value: BusinessForm[typeof field]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addService = () => {
    if (!serviceInput.name) return;
    set("services", [...form.services, { ...serviceInput }]);
    setServiceInput({ name: "", price: "", duration: "" });
  };

  const removeService = (i: number) =>
    set("services", form.services.filter((_, idx) => idx !== i));

  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation?.getCurrentPosition(
      () => {
        set("location", "Nairobi, Kenya (GPS)");
        setDetecting(false);
        toast.success("Location detected!");
      },
      () => { setDetecting(false); toast.error("Enter location manually."); }
    );
  };

  const canProceed = () => {
    if (step === 0) return !!(form.businessName && form.phone && form.category && form.description.length >= 20 && form.password.length >= 6 && form.password === form.confirmPassword && termsAccepted);
    if (step === 1) return form.services.length >= 1 && form.openTime && form.closeTime;
    if (step === 2) return form.businessPhotos.length >= 1;
    if (step === 3) return form.location.length > 0;
    return true;
  };

  const next = () => {
    if (!canProceed()) { toast.error("Please fill all required fields"); return; }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

const handleSubmit = async () => {
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.businessName,
          phone: form.phone.replace(/\s/g, ""),
          ...(form.email.trim() && { email: form.email.trim() }),
          password: form.password,
          role: "PROVIDER",
          location: form.location || "Nairobi",
          category: CATEGORY_ENUM[form.category] || "BUSINESS",
          businessName: form.businessName,
          description: form.description,
          workingHoursStart: form.openTime,
          workingHoursEnd: form.closeTime,
          ...(form.services.length > 0 && { services: form.services }),
          ...(form.logoUrl && { coverImage: form.logoUrl }),
          ...(form.businessPhotos.length > 0 && { portfolioPhotos: form.businessPhotos }),
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
    } catch (err) {
      toast.error("Cannot connect to server");
      setLoading(false);
    }
  };

  // ─── Success ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center px-5">
        <div className="text-center max-w-xs mx-auto animate-slide-up">
          <div className="w-20 h-20 bg-kazi-blue/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Store className="w-11 h-11 text-kazi-blue" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Business Submitted! 🎉</h2>
          <p className="text-white/50 text-sm mb-5 leading-relaxed">
            <strong className="text-white">{form.businessName}</strong> is under review. We&apos;ll verify your business within 24 hours.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2.5">
            {[
              { icon: CheckCircle, label: "Business details received", status: "Done", color: "text-kazi-green" },
              { icon: ShieldCheck, label: "Admin verification", status: "In progress", color: "text-kazi-amber" },
              { icon: FileText, label: '"Verified Business" badge', status: "On approval", color: "text-kazi-blue" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span className="flex-1 text-xs text-white/60">{item.label}</span>
                <span className={`text-xs font-semibold ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 mb-6">
            SMS confirmation will be sent to {form.phone}
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
        <div className="absolute -top-40 right-0 w-96 h-96 bg-kazi-blue/8 rounded-full filter blur-3xl" />
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

        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-kazi-blue" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-kazi-blue/20 flex items-center justify-center flex-shrink-0">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-kazi-blue" />; })()}
          </div>
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
              Step {step + 1} of {STEPS.length} — Business Owner
            </p>
            <h2 className="text-lg font-black text-white">{STEPS[step].title}</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 px-5 max-w-sm mx-auto w-full pb-32 space-y-4 animate-fade-in">

        {/* ── Step 0: Business Info ────────────────────────────── */}
        {step === 0 && (
          <>
            {/* Business logo */}
            <div className="flex flex-col items-center gap-1 mb-2">
              <ImageUpload
                folder="businesses"
                shape="circle"
                theme="dark"
                currentUrl={form.logoUrl}
                onUpload={(url) => set("logoUrl", url)}
              />
              <p className="text-xs text-white/30">Business logo (optional)</p>
            </div>

            <Field label="Business / Service Name" required>
              <InputIcon icon={Store}>
                <input
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="e.g. Glamour Studio Nairobi"
                  className={inputCls}
                />
              </InputIcon>
            </Field>

            <Field label="Phone Number" required hint="Customers will contact you on this number">
              <InputIcon icon={Smartphone}>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  className={inputCls}
                />
              </InputIcon>
            </Field>

            <Field label="Email Address" hint="Receive booking alerts and approval notifications">
              <InputIcon icon={Smartphone}>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </InputIcon>
            </Field>

            <Field label="Password" required hint="Minimum 6 characters">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                <input
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full pl-11 pr-11 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-blue focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirm Password" required>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                <input
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  className={`w-full pl-11 pr-11 py-3.5 bg-white/[0.08] border rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-blue focus:border-transparent transition-all ${
                    form.confirmPassword && form.password !== form.confirmPassword ? "border-red-500/60" : "border-white/15"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5 ml-0.5">Passwords do not match</p>
              )}
            </Field>

            <Field label="Business Category" required>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={selectCls}
              >
                <option value="">Select a category…</option>
                {BUSINESS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Business Description" required hint="Minimum 20 characters — describe your services clearly">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="e.g. We offer premium hair and beauty services including braids, weaves, and natural hair treatments…"
                className="w-full px-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-blue resize-none transition-all"
              />
              <p className={`text-xs mt-1 text-right ${form.description.length >= 20 ? "text-kazi-green" : "text-white/30"}`}>
                {form.description.length}/20 min
              </p>
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

        {/* ── Step 1: Services & Hours ─────────────────────────── */}
        {step === 1 && (
          <>
            <Field label="Services Offered" required hint="Add at least 1 service with name and price">
              <div className="space-y-2.5 mb-3">
                <input
                  value={serviceInput.name}
                  onChange={(e) => setServiceInput((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Service name (e.g. Box Braids)"
                  className={inputCls2}
                />
                <div className="flex gap-2">
                  <input
                    value={serviceInput.price}
                    onChange={(e) => setServiceInput((p) => ({ ...p, price: e.target.value }))}
                    placeholder="Price (KES)"
                    type="number"
                    className={`flex-1 ${inputCls2}`}
                  />
                  <input
                    value={serviceInput.duration}
                    onChange={(e) => setServiceInput((p) => ({ ...p, duration: e.target.value }))}
                    placeholder="Duration (e.g. 2 hrs)"
                    className={`flex-1 ${inputCls2}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={addService}
                  disabled={!serviceInput.name}
                  className="w-full py-2.5 bg-kazi-blue/20 text-kazi-blue text-sm font-semibold rounded-xl hover:bg-kazi-blue/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              </div>

              {form.services.length > 0 && (
                <div className="space-y-2">
                  {form.services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-white">{s.name}</p>
                        <p className="text-xs text-white/40">
                          {s.price ? `KES ${s.price}` : ""}
                          {s.price && s.duration ? " · " : ""}
                          {s.duration}
                        </p>
                      </div>
                      <button onClick={() => removeService(i)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4 text-white/40 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Opening Hours" required>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Opens</label>
                  <input
                    type="time"
                    value={form.openTime}
                    onChange={(e) => set("openTime", e.target.value)}
                    className={inputCls2}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Closes</label>
                  <input
                    type="time"
                    value={form.closeTime}
                    onChange={(e) => set("closeTime", e.target.value)}
                    className={inputCls2}
                  />
                </div>
              </div>
            </Field>

            <Field label="Working Days">
              <select
                value={form.workDays}
                onChange={(e) => set("workDays", e.target.value)}
                className={selectCls}
              >
                {DAYS_OPTIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </>
        )}

        {/* ── Step 2: Photos & Video ───────────────────────────── */}
        {step === 2 && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
              <ImageIcon className="w-5 h-5 text-kazi-amber flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Businesses with photos get <strong className="text-white">5× more bookings</strong>. Add at least 1 photo of your premises or work.
              </p>
            </div>

            <MultiImageUpload
              folder="businesses"
              maxFiles={6}
              theme="dark"
              label="Business Photos"
              hint="Photos of your premises, team, or service results · required"
              accentColor="blue"
              onUpload={(urls) => set("businessPhotos", urls)}
            />

            <Field label="Showcase Video" hint="Optional. A short video of your business dramatically increases trust">
              <button
                type="button"
                onClick={() => { set("videoUploaded", true); toast.success("Video uploaded!"); }}
                className={`w-full py-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${
                  form.videoUploaded
                    ? "border-kazi-green bg-kazi-green/10"
                    : "border-white/15 bg-white/5 hover:border-kazi-blue/40"
                }`}
              >
                {form.videoUploaded ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-kazi-green" fill="#00C896" />
                    <span className="text-sm font-semibold text-kazi-green">Video Uploaded ✓</span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white/40 border-b-[8px] border-b-transparent ml-1" />
                    </div>
                    <span className="text-sm text-white/40">Tap to upload a business video</span>
                    <span className="text-xs text-white/25">MP4 · Max 50 MB</span>
                  </>
                )}
              </button>
            </Field>
          </>
        )}

        {/* ── Step 3: Location ─────────────────────────────────── */}
        {step === 3 && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-kazi-blue flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Your business location appears on the KaziShow map so customers can find you. It is <strong className="text-white">required</strong>.
              </p>
            </div>

            <Field label="Business Location" required>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  required
                  placeholder="e.g. Kilimani, Nairobi"
                  className="w-full pl-11 pr-[110px] py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-blue transition-all"
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detecting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 bg-kazi-blue/20 hover:bg-kazi-blue/30 text-kazi-blue text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  {detecting ? "Detecting…" : "Use GPS"}
                </button>
              </div>
            </Field>

            {/* Map */}
            <div
              className="h-44 rounded-2xl overflow-hidden relative"
              style={{
                background: "#1a2230",
                backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {form.location ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-kazi-blue rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
                      <MapPin className="w-5 h-5 text-white" fill="white" />
                    </div>
                    <div className="mt-2 px-3 py-1 bg-kazi-dark2 rounded-lg shadow">
                      <p className="text-xs text-white font-semibold">{form.location}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/20 text-sm">Enter location above to see pin</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-bold text-white mb-3">Business Summary</h4>
              {[
                { label: "Business Name", value: form.businessName || "—" },
                { label: "Category", value: form.category || "—" },
                { label: "Services", value: `${form.services.length} service${form.services.length !== 1 ? "s" : ""}` },
                { label: "Hours", value: form.openTime && form.closeTime ? `${form.openTime}–${form.closeTime}` : "—" },
                { label: "Photos", value: `${form.businessPhotos.length} uploaded` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-white/40">{row.label}</span>
                  <span className={`font-semibold ${row.value === "—" ? "text-white/30" : "text-white"}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-kazi-dark via-kazi-dark to-transparent">
        <div className="max-w-sm mx-auto">
          <button
            onClick={next}
            disabled={loading || !canProceed()}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-2xl shadow-orange-500/20"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
            ) : step === STEPS.length - 1 ? (
              <><ShieldCheck className="w-5 h-5" /> Submit Business</>
            ) : (
              <>Continue <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
          <p className="text-center text-xs text-white/30 mt-3">
            Step {step + 1} of {STEPS.length}
            {step === STEPS.length - 1 && " · Reviewed within 24 hours"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/70 mb-1.5">
        {label} {required && <span className="text-kazi-orange">*</span>}
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
  "w-full pl-11 pr-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-blue focus:border-transparent transition-all";

const inputCls2 =
  "w-full px-4 py-3 bg-white/[0.08] border border-white/15 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-blue transition-all";

const selectCls =
  "w-full px-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-kazi-blue appearance-none transition-all [&>option]:bg-kazi-dark2 [&>option]:text-white";
