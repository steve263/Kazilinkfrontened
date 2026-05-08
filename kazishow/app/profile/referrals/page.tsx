"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Share2, Users, TrendingUp, CheckCircle,
  Gift, Loader2, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:   "bg-green-100 text-green-700",
    USED:     "bg-gray-100 text-gray-500",
    EXPIRED:  "bg-red-100 text-red-500",
    PENDING:  "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function ReferralsPage() {
  const router = useRouter();
  const [stats, setStats]         = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [rewards, setRewards]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { router.replace("/auth/login"); return; }
    const h = { Authorization: `Bearer ${token}` };

    const [sRes, rRes, rwRes] = await Promise.all([
      fetch(`${API}/api/referrals/stats`,        { headers: h }),
      fetch(`${API}/api/referrals/my-referrals`, { headers: h }),
      fetch(`${API}/api/referrals/my-rewards`,   { headers: h }),
    ]);

    const [sData, rData, rwData] = await Promise.all([sRes.json(), rRes.json(), rwRes.json()]);

    if (sData.success)  setStats(sData.data);
    if (rData.success)  setReferrals(rData.data.referrals);
    if (rwData.success) setRewards(rwData.data.rewards);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyLink = () => {
    if (!stats?.referralLink) return;
    navigator.clipboard.writeText(stats.referralLink);
    toast.success("Referral link copied!");
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Join KaziShow and get KSh 100 off your first booking! Use my link: ${stats?.referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-kazi-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-kazi-dark px-4 pt-8 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-black text-white mb-1">Refer &amp; Earn 💰</h1>
        <p className="text-white/50 text-sm">Earn KSh 200 for every friend you refer</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Total Rewards Banner */}
        <div className="bg-[#FF6B2B] rounded-2xl p-5 text-white text-center shadow-lg shadow-orange-200">
          <p className="text-orange-100 text-sm mb-1">Total Rewards Earned</p>
          <p className="text-5xl font-black">KSh {(stats?.totalEarned || 0).toLocaleString()}</p>
          <p className="text-orange-100 text-xs mt-1.5">
            {stats?.completedReferrals || 0} successful {stats?.completedReferrals === 1 ? "referral" : "referrals"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Users className="w-5 h-5 text-kazi-orange" />, value: stats?.totalReferrals || 0,    label: "Referred"  },
            { icon: <CheckCircle className="w-5 h-5 text-kazi-green" />, value: stats?.completedReferrals || 0, label: "Completed" },
            { icon: <TrendingUp className="w-5 h-5 text-blue-500" />, value: stats?.pendingReferrals || 0,  label: "Pending"   },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-xl font-black text-kazi-dark">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-kazi-dark mb-3">Your Referral Link</p>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2 mb-3 border border-gray-100">
            <p className="text-xs text-gray-500 truncate flex-1 font-mono">{stats?.referralLink || "—"}</p>
            <button onClick={copyLink} className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors flex-shrink-0">
              <Copy className="w-4 h-4 text-kazi-orange" />
            </button>
          </div>
          <button
            onClick={shareWhatsApp}
            className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="w-full py-2.5 mt-2 bg-gray-50 text-gray-600 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-kazi-dark mb-4">How It Works</p>
          <div className="space-y-3">
            {[
              { step: "1", emoji: "📤", text: "Share your referral link with friends" },
              { step: "2", emoji: "👤", text: "Friend registers using your link" },
              { step: "3", emoji: "✅", text: "Friend completes their first booking" },
              { step: "4", emoji: "💰", text: "You earn KSh 200 reward!" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-kazi-orange font-black text-sm flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="mr-1">{item.emoji}</span>{item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* My Rewards */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-bold text-kazi-dark mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-kazi-orange" />
              My Rewards
            </p>
            <div className="space-y-2">
              {rewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-kazi-dark truncate">{reward.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-400">
                        {new Date(reward.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {reward.expiresAt && reward.status === "ACTIVE" && (
                        <p className="text-xs text-amber-500">
                          · expires {new Date(reward.expiresAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="font-black text-kazi-orange text-sm">KSh {reward.amount.toLocaleString()}</p>
                    <StatusBadge status={reward.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* People I Referred */}
        {referrals.length > 0 ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-bold text-kazi-dark mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-kazi-orange" />
              People I Referred ({referrals.length})
            </p>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center font-black text-kazi-orange text-sm flex-shrink-0">
                      {(referral.referred?.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-kazi-dark">{referral.referred?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(referral.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    referral.status === "REWARDED"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {referral.status === "REWARDED" ? "✅ KSh 200 earned" : "⏳ Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-3">🎁</div>
            <h3 className="font-bold text-kazi-dark mb-1">No referrals yet</h3>
            <p className="text-gray-500 text-sm mb-5">
              Share your link and start earning KSh 200 per referral!
            </p>
            <button
              onClick={shareWhatsApp}
              className="px-6 py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-green-500 transition-colors flex items-center gap-2 mx-auto"
            >
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
