import Link from "next/link";
import { Home, Search, ArrowLeft, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-kazi-dark flex items-center justify-center px-5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-kazi-orange/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-kazi-amber/10 rounded-full filter blur-3xl" />
      </div>

      <div className="relative text-center max-w-sm mx-auto">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-kazi-orange flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/30">
          <Zap className="w-9 h-9 text-white" fill="white" />
        </div>

        {/* 404 */}
        <p className="text-8xl font-black text-kazi-orange mb-2">404</p>
        <h1 className="text-2xl font-black text-white mb-3">Page not found</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Looks like this page packed up and left. Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/discover"
            className="w-full py-3.5 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Browse Services
          </Link>
          <button
            onClick={() => history.back()}
            className="w-full py-3 text-white/40 text-sm font-medium flex items-center justify-center gap-1.5 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
