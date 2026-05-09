"use client";

interface TrustBadgeProps {
  level: string;
  score?: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

const BADGES: Record<string, { emoji: string; label: string; color: string }> = {
  ELITE:     { emoji: "⭐", label: "Elite",      color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  VERIFIED:  { emoji: "✅", label: "Verified",    color: "bg-green-100 text-green-700 border-green-300" },
  TRUSTED:   { emoji: "🛡️", label: "Trusted",     color: "bg-blue-100 text-blue-700 border-blue-300" },
  BASIC:     { emoji: "👤", label: "Basic",        color: "bg-gray-100 text-gray-600 border-gray-300" },
  NEW:       { emoji: "🆕", label: "New",          color: "bg-gray-100 text-gray-500 border-gray-200" },
  SUSPENDED: { emoji: "🚫", label: "Suspended",    color: "bg-red-100 text-red-600 border-red-300" },
};

export default function TrustBadge({ level, score, showScore = false, size = "sm" }: TrustBadgeProps) {
  const badge = BADGES[level] || BADGES.NEW;
  const sizeClass = size === "lg" ? "text-base px-4 py-2" : size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${badge.color} ${sizeClass}`}>
      {badge.emoji} {badge.label}
      {showScore && score !== undefined && <span className="opacity-70">· {Math.round(score)}</span>}
    </span>
  );
}
