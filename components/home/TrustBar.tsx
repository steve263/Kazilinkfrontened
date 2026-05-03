"use client";
import { Shield, Lock, CheckCircle, Wifi } from "lucide-react";

export default function TrustBar() {
  return (
    <div className="bg-kazi-dark border-b border-white/10 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          {/* Uptime */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-kazi-green animate-pulse" />
            <span className="text-xs text-white/60 font-medium whitespace-nowrap">All systems operational</span>
          </div>

          <div className="w-px h-4 bg-white/10 flex-shrink-0 hidden sm:block" />

          {/* Company reg */}
          <div className="flex-shrink-0 hidden md:block">
            <span className="text-xs text-white/40 font-medium">KaziShow Ltd · Reg. PVT-2024-NBI-04821</span>
          </div>

          <div className="w-px h-4 bg-white/10 flex-shrink-0 hidden sm:block" />

          {/* Security badges */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {[
              { icon: Lock, label: "SSL Encrypted" },
              { icon: Shield, label: "KYC Verified" },
              { icon: CheckCircle, label: "Data Protected" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-kazi-green" />
                <span className="text-xs text-white/50 whitespace-nowrap hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
