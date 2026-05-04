"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  label: string;
  value: number | string;
  change?: number;
  prefix?: string;
  icon: React.ReactNode;
  color: "orange" | "green" | "blue" | "red" | "purple";
  loading?: boolean;
}

const COLOR = {
  orange: { bg: "bg-orange-50", icon: "bg-kazi-orange text-white", text: "text-kazi-orange" },
  green:  { bg: "bg-green-50",  icon: "bg-green-500 text-white",   text: "text-green-600" },
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-500 text-white",    text: "text-blue-600" },
  red:    { bg: "bg-red-50",    icon: "bg-red-500 text-white",     text: "text-red-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-500 text-white",  text: "text-purple-600" },
};

export default function StatCard({ label, value, change, prefix, icon, color, loading }: Props) {
  const c = COLOR[color];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 card-shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
        <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    );
  }

  const formatted = typeof value === "number"
    ? prefix === "KSh"
      ? `KSh ${value.toLocaleString()}`
      : value.toLocaleString()
    : value;

  return (
    <div className={`bg-white rounded-2xl p-5 card-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black text-kazi-dark mb-1">{formatted}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          {change > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : change < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className={`text-xs font-semibold ${change > 0 ? "text-green-600" : change < 0 ? "text-red-500" : "text-gray-400"}`}>
            {change > 0 ? "+" : ""}{change}% vs last week
          </span>
        </div>
      )}
    </div>
  );
}
