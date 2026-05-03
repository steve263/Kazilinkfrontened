"use client";
import { ShieldCheck, Star, Smartphone, Camera, MapPin, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { TrustScore, TrustLevel } from "@/lib/data";

interface TrustScoreCardProps {
  trustScore: TrustScore;
  providerName: string;
  compact?: boolean;
}

const LEVEL_CONFIG: Record<TrustLevel, { color: string; bg: string; border: string; label: string; emoji: string }> = {
  bronze: { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", label: "Bronze", emoji: "🥉" },
  silver: { color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200", label: "Silver", emoji: "🥈" },
  gold: { color: "text-kazi-amber", bg: "bg-amber-50", border: "border-amber-200", label: "Gold", emoji: "🥇" },
  platinum: { color: "text-kazi-orange", bg: "bg-orange-50", border: "border-orange-200", label: "Platinum", emoji: "💎" },
};

const SCORE_COMPONENTS = [
  { key: "identity" as const, icon: ShieldCheck, label: "Identity Verified", max: 25, color: "bg-kazi-orange" },
  { key: "phone" as const, icon: Smartphone, label: "Phone Verified", max: 15, color: "bg-kazi-blue" },
  { key: "portfolio" as const, icon: Camera, label: "Portfolio Photos", max: 20, color: "bg-kazi-green" },
  { key: "ratings" as const, icon: Star, label: "Customer Ratings", max: 25, color: "bg-kazi-amber" },
  { key: "completions" as const, icon: TrendingUp, label: "Completed Jobs", max: 10, color: "bg-purple-500" },
];

export default function TrustScoreCard({ trustScore, providerName, compact = false }: TrustScoreCardProps) {
  const level = LEVEL_CONFIG[trustScore.level];
  const reportDeduction = Math.abs(trustScore.components.reports);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${level.bg} ${level.border}`}>
        <ShieldCheck className={`w-4 h-4 ${level.color}`} />
        <span className={`text-xs font-black ${level.color}`}>{trustScore.overall}</span>
        <span className={`text-xs font-semibold ${level.color}`}>{level.emoji} {level.label}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-kazi-dark flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-kazi-orange" />
          Trust Score
        </h3>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${level.bg} ${level.border}`}>
          <span className="text-sm">{level.emoji}</span>
          <span className={`text-xs font-bold ${level.color}`}>{level.label}</span>
        </div>
      </div>

      {/* Big score */}
      <div className="flex items-end gap-3 mb-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={trustScore.overall >= 80 ? "#FF6B2B" : trustScore.overall >= 60 ? "#F59E0B" : "#EF4444"}
              strokeWidth="3"
              strokeDasharray={`${trustScore.overall} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-black ${trustScore.overall >= 80 ? "text-kazi-orange" : trustScore.overall >= 60 ? "text-kazi-amber" : "text-red-500"}`}>
              {trustScore.overall}
            </span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-kazi-dark mb-1">
            {trustScore.overall >= 90 ? "Highly Trusted" :
             trustScore.overall >= 75 ? "Well Trusted" :
             trustScore.overall >= 60 ? "Moderately Trusted" : "Low Trust"}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {providerName} has completed verification steps and maintains a strong track record on KaziShow.
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2.5">
        {SCORE_COMPONENTS.map((item) => {
          const score = trustScore.components[item.key];
          const pct = (score / item.max) * 100;
          const earned = score > 0;
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-3.5 h-3.5 ${earned ? "text-kazi-dark" : "text-gray-300"}`} />
                  <span className={`text-xs font-medium ${earned ? "text-kazi-dark" : "text-gray-400"}`}>{item.label}</span>
                  {earned && <CheckCircle className="w-3 h-3 text-kazi-green" fill="#00C896" />}
                </div>
                <span className={`text-xs font-bold ${earned ? "text-kazi-dark" : "text-gray-400"}`}>
                  {score}/{item.max}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${item.color}`}
                  style={{ width: `${Math.max(0, pct)}%` }}
                />
              </div>
            </div>
          );
        })}

        {reportDeduction > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-medium text-red-500">Reports Against</span>
              </div>
              <span className="text-xs font-bold text-red-500">-{reportDeduction}</span>
            </div>
            <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${(reportDeduction / 20) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">Updated {trustScore.lastUpdated}</p>
    </div>
  );
}
