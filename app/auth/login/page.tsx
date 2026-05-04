"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Smartphone, Lock, Zap, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const [phone, setPhone] = useState("+254 ");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\s/g, ""),
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("kazishow_token", data.data.token);
        localStorage.setItem("kazishow_user", JSON.stringify(data.data.user));
        toast.success("Welcome back! 🎉");
        const user = data.data.user;
        if (user.role === "ADMIN") {
          router.push("/admin");
        } else if (user.role === "PROVIDER") {
          router.push("/provider/notifications");
        } else {
          router.push("/");
        }
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-kazi-orange" />
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

          <button className="w-full py-3.5 bg-white text-kazi-dark text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
            <span className="text-xl">🌐</span>
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