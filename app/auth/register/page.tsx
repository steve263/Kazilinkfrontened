"use client";
import Link from "next/link";
import { ArrowLeft, Search, Wrench, ChevronRight, Zap, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-kazi-dark flex flex-col">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-kazi-orange/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-kazi-green/8 rounded-full filter blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-sm mx-auto w-full">
        {/* Back */}
        <div className="w-full mb-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>

        {/* Logo + heading */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-kazi-orange flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-orange-500/30">
            <Zap className="w-9 h-9 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 leading-tight">
            Join KaziShow
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Africa&apos;s trusted platform for local services.
            <br />
            How would you like to use KaziShow?
          </p>
        </div>

        {/* Role cards */}
        <div className="w-full space-y-4">
          {/* Customer */}
          <Link href="/auth/register/customer">
            <div className="group relative w-full bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-kazi-orange/60 rounded-3xl p-6 transition-all duration-200 cursor-pointer active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-kazi-orange/20 flex items-center justify-center flex-shrink-0 group-hover:bg-kazi-orange/30 transition-colors">
                  <Search className="w-7 h-7 text-kazi-orange" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-white mb-0.5">
                    I need services
                  </h2>
                  <p className="text-sm text-white/50 leading-snug">
                    Find and book local fundis, cleaners, salons &amp; more
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-kazi-orange transition-colors flex-shrink-0" />
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {["Fast booking", "Verified providers", "M-Pesa payments"].map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 font-medium">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Service Provider */}
          <Link href="/auth/register/provider-type">
            <div className="group relative w-full bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-kazi-green/60 rounded-3xl p-6 transition-all duration-200 cursor-pointer active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-kazi-green/20 flex items-center justify-center flex-shrink-0 group-hover:bg-kazi-green/30 transition-colors">
                  <Wrench className="w-7 h-7 text-kazi-green" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-white mb-0.5">
                    I offer services
                  </h2>
                  <p className="text-sm text-white/50 leading-snug">
                    List your skills or business and get booked
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-kazi-green transition-colors flex-shrink-0" />
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {["Grow your income", "Verified badge", "More customers"].map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        </div>

        {/* Trust note */}
        <div className="flex items-center gap-2 mt-8">
          <ShieldCheck className="w-4 h-4 text-kazi-green flex-shrink-0" />
          <p className="text-xs text-white/40 text-center">
            All service providers are verified before going live
          </p>
        </div>

        <p className="text-sm text-white/40 mt-6 text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-kazi-orange font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
