"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ReferralLandingPage() {
  const { code } = useParams();
  const router = useRouter();
  const [referrer, setReferrer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    localStorage.setItem("referral_code", code as string);

    fetch(`${API_URL}/api/referrals/validate/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReferrer(data.data);
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-[#1A1714] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        <div className="text-6xl mb-5">⚡</div>
        <h1 className="text-4xl font-black text-white mb-2">
          Kazi<span className="text-[#FF6B2B]">Show</span>
        </h1>
        <p className="text-white/50 text-sm mb-8">Kenya's local business discovery platform</p>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-[#FF6B2B] animate-spin" />
          </div>
        ) : referrer ? (
          <div className="bg-[#FF6B2B]/10 border border-[#FF6B2B]/30 rounded-2xl p-5 mb-6">
            <p className="text-white/60 text-sm mb-1">
              <span className="font-bold text-white">{referrer.referrerName}</span> invited you to KaziShow!
            </p>
            <p className="text-white font-black text-xl mt-2">
              🎁 Get KSh 100 off your first booking
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-5 mb-6">
            <p className="text-white font-black text-xl">🎁 Join KaziShow today</p>
            <p className="text-white/50 text-sm mt-1">Discover and book local services</p>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {[
            { emoji: "🔧", text: "Book verified Fundis, shops, hotels and more" },
            { emoji: "💚", text: "Pay securely via M-Pesa" },
            { emoji: "⭐", text: "Verified reviews from real customers" },
          ].map((item) => (
            <div key={item.emoji} className="flex items-center gap-3 text-left bg-white/5 rounded-xl p-4">
              <span className="text-2xl">{item.emoji}</span>
              <p className="text-white text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push(`/auth/register?ref=${code}`)}
          className="w-full py-4 bg-[#FF6B2B] text-white font-black text-lg rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98] mb-3"
        >
          {referrer ? "🎁 Claim KSh 100 Bonus & Register" : "🚀 Register Free"}
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-white/10 text-white/70 font-semibold rounded-2xl hover:bg-white/15 transition-colors"
        >
          Browse Services First
        </button>

        <p className="text-white/30 text-xs mt-6">
          Already have an account?{" "}
          <button onClick={() => router.push("/auth/login")} className="text-[#FF6B2B] underline">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
