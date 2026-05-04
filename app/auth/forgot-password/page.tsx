"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, Lock, Eye, EyeOff, KeyRound, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Step = "phone" | "otp" | "newpass";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+254 ");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalPhone = phone.replace(/\s/g, "");

  const startCountdown = () => {
    setResendCountdown(60);
    countdownRef.current = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  async function sendOTP() {
    if (!normalPhone || normalPhone.length < 9) { toast.error("Enter a valid phone number"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalPhone }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("OTP sent to your phone");
      setStep("otp");
      startCountdown();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalPhone, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Code verified!");
      setStep("newpass");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalPhone, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Password reset! Please log in.");
      router.push("/auth/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  const STEPS = ["Phone", "Verify", "New Password"];
  const stepIndex = step === "phone" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-kazi-orange/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-kazi-blue/10 rounded-full filter blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <Link href="/auth/login"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= stepIndex ? "bg-kazi-orange" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-kazi-orange/20 flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7 text-kazi-orange" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            {step === "phone" ? "Forgot Password?" : step === "otp" ? "Enter the code" : "New Password"}
          </h1>
          <p className="text-white/50 text-sm">
            {step === "phone"
              ? "Enter your registered phone number and we'll send you a reset code."
              : step === "otp"
              ? `We sent a 6-digit code to ${normalPhone}`
              : "Choose a new secure password for your account."}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 space-y-4">

          {/* ── Step: Phone ── */}
          {step === "phone" && (
            <>
              <div>
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={sendOTP}
                disabled={loading || normalPhone.length < 9}
                className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : "Send OTP Code"}
              </button>
            </>
          )}

          {/* ── Step: OTP ── */}
          {step === "otp" && (
            <>
              <div>
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">6-Digit Code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="tel"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/20 text-2xl font-black text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                />
                <p className="text-xs text-white/30 mt-2 text-center">
                  Code expires in 5 minutes
                </p>
              </div>
              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying…</> : "Verify Code"}
              </button>
              <button
                onClick={() => { setOtp(""); sendOTP(); }}
                disabled={resendCountdown > 0 || loading}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/70 disabled:opacity-40 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
              </button>
            </>
          )}

          {/* ── Step: New Password ── */}
          {step === "newpass" && (
            <>
              <div className="flex items-center gap-2 p-3 bg-kazi-green/10 border border-kazi-green/30 rounded-xl">
                <CheckCircle className="w-4 h-4 text-kazi-green flex-shrink-0" fill="#00C896" />
                <span className="text-xs text-kazi-green font-semibold">Identity verified ✓</span>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-11 pr-11 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    className={`w-full pl-11 pr-11 py-3.5 bg-white/10 border rounded-2xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent ${
                      confirmPassword && password !== confirmPassword ? "border-red-500/60" : "border-white/20"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1.5 ml-0.5">Passwords do not match</p>
                )}
              </div>

              <button
                onClick={resetPassword}
                disabled={loading || password.length < 6 || password !== confirmPassword}
                className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting…</> : "Reset Password"}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-kazi-orange font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
