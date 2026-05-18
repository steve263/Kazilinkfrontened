"use client";
import { Clock } from "lucide-react";

function formatResponseTime(minutes: number): { label: string; color: string } {
  if (minutes < 5)  return { label: "Usually replies in under 5 min",  color: "text-green-600 bg-green-50 border-green-100" };
  if (minutes < 15) return { label: "Usually replies in ~15 min",       color: "text-green-600 bg-green-50 border-green-100" };
  if (minutes < 30) return { label: "Usually replies in ~30 min",       color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
  if (minutes < 60) return { label: "Usually replies within an hour",   color: "text-amber-600 bg-amber-50 border-amber-100" };
  if (minutes < 120) return { label: "Usually replies in 1–2 hours",    color: "text-amber-600 bg-amber-50 border-amber-100" };
  if (minutes < 360) return { label: "Usually replies within a few hours", color: "text-orange-600 bg-orange-50 border-orange-100" };
  return { label: "Usually replies same day",                            color: "text-gray-600 bg-gray-50 border-gray-100" };
}

export default function ResponseTimeBadge({ minutes }: { minutes: number | null | undefined }) {
  if (!minutes || minutes <= 0) return null;
  const { label, color } = formatResponseTime(minutes);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <Clock className="w-3 h-3" />
      {label}
    </span>
  );
}
