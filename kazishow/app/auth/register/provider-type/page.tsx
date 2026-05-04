"use client";
import Link from "next/link";
import {
  ArrowLeft,
  HardHat,
  Store,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function ProviderTypePage() {
  return (
    <div className="min-h-screen bg-kazi-dark flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-kazi-green/8 rounded-full filter blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-sm mx-auto w-full">
        <div className="w-full mb-8">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Progress */}
        <div className="w-full flex gap-1.5 mb-8">
          <div className="h-1 flex-1 rounded-full bg-kazi-green" />
          <div className="h-1 flex-1 rounded-full bg-white/10" />
          <div className="h-1 flex-1 rounded-full bg-white/10" />
          <div className="h-1 flex-1 rounded-full bg-white/10" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">
            What type of provider are you?
          </h1>
          <p className="text-white/50 text-sm">
            Choose the option that best describes you
          </p>
        </div>

        <div className="w-full space-y-4">
          {/* Fundi / Skilled Worker */}
          <Link href="/auth/register/fundi">
            <div className="group w-full bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-kazi-orange/60 rounded-3xl p-5 transition-all duration-200 cursor-pointer active:scale-[0.98]">
              <div className="flex items-start gap-4">
                <div className="w-13 h-13 w-14 h-14 rounded-2xl bg-kazi-orange/20 flex items-center justify-center flex-shrink-0 group-hover:bg-kazi-orange/30 transition-colors">
                  <HardHat className="w-7 h-7 text-kazi-orange" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-white">
                      Skilled Worker (Fundi)
                    </h2>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-kazi-orange transition-colors" />
                  </div>
                  <p className="text-sm text-white/50 mt-1 leading-snug">
                    Individual technician, artisan, or tradesperson
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {["Plumber", "Electrician", "Cleaner", "Carpenter", "Mechanic", "Tutor"].map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-orange-900/30 text-kazi-orange/80 text-xs rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verification note */}
              <div className="flex items-start gap-2 mt-4 pt-4 border-t border-white/5">
                <ShieldCheck className="w-4 h-4 text-kazi-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-kazi-orange">Strict Verification Required</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    National ID + portfolio. Approved within 24–48 hrs. You earn a{" "}
                    <span className="text-kazi-orange font-semibold">"Verified Fundi"</span> badge.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Business Owner */}
          <Link href="/auth/register/business">
            <div className="group w-full bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-kazi-blue/60 rounded-3xl p-5 transition-all duration-200 cursor-pointer active:scale-[0.98]">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-kazi-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-kazi-blue/30 transition-colors">
                  <Store className="w-7 h-7 text-kazi-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-white">
                      Business Owner
                    </h2>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-kazi-blue transition-colors" />
                  </div>
                  <p className="text-sm text-white/50 mt-1 leading-snug">
                    Shop, salon, hotel, company, or registered service business
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {["Salon", "Restaurant", "Cleaning Co.", "Gym", "Hospital", "School"].map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-900/30 text-kazi-blue/80 text-xs rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 mt-4 pt-4 border-t border-white/5">
                <Clock className="w-4 h-4 text-kazi-blue mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-kazi-blue">Basic Verification</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Business photos &amp; details only. Approved within 24 hrs. You earn a{" "}
                    <span className="text-kazi-blue font-semibold">"Verified Business"</span> badge.
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 mt-8">
          <CheckCircle className="w-4 h-4 text-kazi-green flex-shrink-0" />
          <p className="text-xs text-white/40 text-center">
            All accounts are free to create
          </p>
        </div>
      </div>
    </div>
  );
}
