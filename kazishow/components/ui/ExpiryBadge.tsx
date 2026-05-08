"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function msLeft(expiresAt: string) {
  return new Date(expiresAt).getTime() - Date.now();
}

function format(ms: number) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m left`;
  const s = Math.floor((ms % (60 * 1000)) / 1000);
  return `${s}s left`;
}

function urgencyClass(ms: number) {
  if (ms <= 60 * 60 * 1000)        return "bg-red-500/20 text-red-400 border-red-500/30";
  if (ms <= 6 * 60 * 60 * 1000)    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-white/10 text-white/60 border-white/10";
}

export default function ExpiryBadge({ expiresAt, className = "" }: { expiresAt: string; className?: string }) {
  const [remaining, setRemaining] = useState(() => msLeft(expiresAt));

  useEffect(() => {
    const tick = () => setRemaining(msLeft(expiresAt));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const label = format(remaining);
  if (!label) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${urgencyClass(remaining)} ${className}`}>
      <Clock className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

export function ExpiryBadgeLight({ expiresAt, className = "" }: { expiresAt: string; className?: string }) {
  const [remaining, setRemaining] = useState(() => msLeft(expiresAt));

  useEffect(() => {
    const tick = () => setRemaining(msLeft(expiresAt));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const label = format(remaining);
  if (!label) return null;

  const urgent = remaining <= 60 * 60 * 1000;
  const warn   = remaining <= 6 * 60 * 60 * 1000;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      urgent ? "bg-red-50 text-red-500 border-red-200"
      : warn  ? "bg-amber-50 text-amber-600 border-amber-200"
             : "bg-gray-100 text-gray-500 border-gray-200"
    } ${className}`}>
      <Clock className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
