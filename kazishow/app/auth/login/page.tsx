"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Smartphone, Lock, Zap, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const [phone, setPhone] = useState("+254 ");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  function handleLoginSuccess(userData: any, remembered: boolean) {
    const { token, user } = userData;
    // Always store in localStorage so protected pages (which read localStorage) work
    localStorage.setItem("kazishow_token", token);
    localStorage.setItem("kazishow_user", JSON.stringify(user));
    localStorage.setItem("kazishow_remember", remembered ? "true" : "false");
    localStorage.setItem("kazishow_login_time", Date.now().toString());
    // sessionStorage mirrors — cleared automatically when browser is closed
    sessionStorage.setItem("kazishow_token", token);
    sessionStorage.setItem("kazishow_user", JSON.stringify(user));
    if (user.role === "ADMIN") router.push("/admin");
    else if (user.role === "PROVIDER") router.push("/provider/notifications");
    else router.push("/");
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const data = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        }).then((r) => r.json());
        if (data.success) {
          toast.success("Welcome! 🎉");
          handleLoginSuccess(data.data, rememberMe);
        } else {
          toast.error(data.message || "Google sign-in failed");
        }
      } catch {
        toast.error("Network error — please try again");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google sign-in failed"),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\s/g, ""),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Welcome back, ${data.data.user.name}! 👋`);
        handleLoginSuccess(data.data, rememberMe);
      } else {
        toast.error(data.message || "Invalid phone or password");
      }
    } catch (error) {
      toast.error("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-kazi-orange/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-kazi-amber/10 rounded-full filter blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-kazi-orange flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/30">
            <Zap className="w-9 h-9 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">
            Welcome back
          </h1>
          <p className="text-white/50 text-sm">Sign in to KaziShow</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">
                Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRememberMe((v) => !v)}>
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    rememberMe ? "bg-kazi-orange border-kazi-orange" : "border-white/30 bg-white/10"
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-white/60">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-kazi-orange hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={() => {
              if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
                googleLogin();
              } else {
                toast.error("Google sign-in is not configured yet");
              }
            }}
            disabled={loading}
            className="w-full py-3.5 bg-white text-kazi-dark text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-sm text-white/50 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-kazi-orange font-bold hover:underline">
            Sign up free
          </Link>
        </p>

        <div className="flex items-center justify-center gap-6 mt-6">
          {["Secure Login", "Free Account", "M-Pesa Ready"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-kazi-green" />
              <span className="text-xs text-white/40">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}