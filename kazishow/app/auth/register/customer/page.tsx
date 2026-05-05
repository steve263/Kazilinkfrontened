"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Smartphone, MapPin, Navigation,
  CheckCircle, Loader2, Zap, ShieldCheck, ArrowRight, Lock, Eye, EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import OTPModal from "@/components/trust/OTPModal";
import ImageUpload from "@/components/shared/ImageUpload";

type Step = "details" | "verify" | "location";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ name: "", phone: "+254 ", location: "", profilePhoto: "", password: "", confirmPassword: "" });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const detectLocation = () => {
    setDetectingLocation(true);
    if (!navigator.geolocation) {
      toast.error("Location not supported on this device");
      setDetectingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        set("location", "Nairobi, Kenya (GPS detected)");
        setDetectingLocation(false);
        toast.success("Location detected!");
      },
      () => {
        setDetectingLocation(false);
        toast.error("Could not detect location. Enter manually.");
      }
    );
  };

  const handleDetailsNext = () => {
    if (!form.name || !form.phone) return;
    if (!form.password || form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setShowOTP(true);
  };

  const handleOTPVerified = () => {
    setShowOTP(false);
    setPhoneVerified(true);
    setStep("location");
  };

const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.replace(/\s/g, ""),
          password: form.password,
          role: "CUSTOMER",
          location: form.location || "Nairobi",
          ...(form.profilePhoto && { profilePhoto: form.profilePhoto }),
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

  if (done) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center px-5">
        <div className="text-center max-w-xs mx-auto animate-slide-up">
          <div className="w-20 h-20 bg-kazi-green/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-11 h-11 text-kazi-green" fill="#00C896" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Welcome, {form.name.split(" ")[0]}! 🎉
          </h2>
          <p className="text-white/50 text-sm mb-4 leading-relaxed">
            Your account is ready. Start discovering and booking local services near you.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-2 text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-kazi-green" />
              <span className="text-xs text-white/70">Phone number verified ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-kazi-green" fill="#00C896" />
              <span className="text-xs text-white/70">Account secured with OTP</span>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all text-sm"
          >
            Explore KaziShow
          </button>
        </div>
      </div>
    );
  }

  const STEPS = ["Details", "Verify", "Location"];
  const stepIndex = step === "details" ? 0 : step === "verify" ? 1 : 2;

  return (
    <div className="min-h-screen bg-kazi-dark flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-kazi-orange/10 rounded-full filter blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-sm mx-auto w-full">
        <div className="w-full mb-6">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Progress */}
        <div className="w-full flex gap-1.5 mb-7">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= stepIndex ? "bg-kazi-orange" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="w-full mb-7">
          <div className="w-12 h-12 rounded-2xl bg-kazi-orange/20 flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-kazi-orange" />
          </div>
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">
            Step {stepIndex + 1} of {STEPS.length} — Customer
          </p>
          <h1 className="text-2xl font-black text-white mb-1">
            {step === "details" ? "Create your account" : step === "verify" ? "Verify your phone" : "Set your location"}
          </h1>
          <p className="text-white/50 text-sm">
            {step === "details" ? "Quick and easy — takes under a minute" :
             step === "verify" ? "We'll send a one-time code to your number" :
             "Help us show services near you"}
          </p>
        </div>

        {/* Step: Details */}
        {step === "details" && (
          <div className="w-full space-y-4">
            {/* Profile photo */}
            <div className="flex flex-col items-center gap-2 mb-2">
              <ImageUpload
                folder="customers"
                shape="circle"
                theme="dark"
                currentUrl={form.profilePhoto}
                onUpload={(url) => set("profilePhoto", url)}
              />
              <p className="text-xs text-white/30">Add profile photo (optional)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1.5">
                Full Name <span className="text-kazi-orange">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  type="text"
                  required
                  placeholder="e.g. Amina Kamau"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1.5">
                Phone Number <span className="text-kazi-orange">*</span>
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  type="tel"
                  required
                  placeholder="+254 7XX XXX XXX"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-white/30 mt-1.5 ml-1">We'll send a verification code to this number</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1.5">
                Password <span className="text-kazi-orange">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-11 pr-11 py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1.5">
                Confirm Password <span className="text-kazi-orange">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  className={`w-full pl-11 pr-11 py-3.5 bg-white/[0.08] border rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all ${
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
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input type="checkbox" required className="mt-0.5 w-4 h-4 accent-kazi-orange flex-shrink-0" />
              <span className="text-xs text-white/40 leading-relaxed">
                I agree to KaziShow&apos;s{" "}
                <Link href="#" className="text-kazi-orange hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="#" className="text-kazi-orange hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button
              onClick={handleDetailsNext}
              disabled={!form.name || !form.phone || !form.password || form.password.length < 6 || form.password !== form.confirmPassword}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Continue &amp; Verify Phone
            </button>
          </div>
        )}

        {/* Step: Location */}
        {step === "location" && (
          <div className="w-full space-y-4">
            {phoneVerified && (
              <div className="flex items-center gap-2 p-3 bg-kazi-green/10 border border-kazi-green/30 rounded-2xl">
                <CheckCircle className="w-4 h-4 text-kazi-green" fill="#00C896" />
                <span className="text-xs text-kazi-green font-semibold">Phone number verified ✓</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1.5">
                Location <span className="text-white/30 font-normal">(recommended)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  type="text"
                  placeholder="e.g. Westlands, Nairobi"
                  className="w-full pl-11 pr-[100px] py-3.5 bg-white/[0.08] border border-white/15 rounded-2xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 bg-kazi-orange/20 hover:bg-kazi-orange/30 text-kazi-orange text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {detectingLocation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  {detectingLocation ? "Detecting…" : "Use GPS"}
                </button>
              </div>
              <p className="text-xs text-white/30 mt-1.5 ml-1">Helps us show nearby services first</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating account…</>
              ) : (
                <><Zap className="w-5 h-5" /> Create Account</>
              )}
            </button>

            <button
              onClick={handleSubmit}
              className="w-full text-center text-sm text-white/30 hover:text-white/50 transition-colors"
            >
              Skip location for now
            </button>
          </div>
        )}
      </div>

      {showOTP && (
        <OTPModal
          phone={form.phone}
          onVerified={handleOTPVerified}
          onClose={() => setShowOTP(false)}
        />
      )}
    </div>
  );
}
