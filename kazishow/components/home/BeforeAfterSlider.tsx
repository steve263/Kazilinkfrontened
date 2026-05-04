"use client";
import { useState } from "react";
import { CheckCircle, X, HardHat } from "lucide-react";

export default function BeforeAfterSlider() {
  const [pos, setPos] = useState(50);

  const beforeItems = [
    { ok: false, text: "No ID verification" },
    { ok: false, text: "No portfolio review" },
    { ok: false, text: "Price agreed on phone" },
    { ok: false, text: "Cash only — no receipt" },
    { ok: false, text: "No insurance or guarantee" },
    { ok: false, text: "No way to leave reviews" },
  ];

  const afterItems = [
    { ok: true, text: "National ID verified" },
    { ok: true, text: "Portfolio reviewed by team" },
    { ok: true, text: "Upfront transparent pricing" },
    { ok: true, text: "M-Pesa — tracked & receipted" },
    { ok: true, text: "KaziShow liability coverage" },
    { ok: true, text: "Public reviews & star ratings" },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-kazi-dark mb-2">
          Random Fundi vs{" "}
          <span className="bg-gradient-to-r from-kazi-orange to-kazi-amber bg-clip-text text-transparent">
            KaziShow Fundi
          </span>
        </h2>
        <p className="text-gray-400 text-sm">Drag the slider to compare</p>
      </div>

      <div className="relative bg-white rounded-3xl overflow-hidden card-shadow select-none">
        {/* Labels */}
        <div className="grid grid-cols-2">
          <div className="p-4 border-r border-gray-100 flex items-center gap-2 bg-red-50/50">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-sm font-black text-red-400">Random Fundi</span>
          </div>
          <div className="p-4 flex items-center gap-2 bg-green-50/50">
            <HardHat className="w-4 h-4 text-kazi-orange" />
            <span className="text-sm font-black text-kazi-orange">KaziShow Verified</span>
          </div>
        </div>

        {/* Content rows */}
        <div className="relative">
          {beforeItems.map((item, i) => (
            <div key={i} className="grid grid-cols-2 border-t border-gray-50">
              {/* Before (left) */}
              <div className="px-5 py-3 flex items-center gap-2 bg-red-50/20 border-r border-gray-100">
                <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-xs text-gray-500">{item.text}</span>
              </div>
              {/* After (right) */}
              <div className="px-5 py-3 flex items-center gap-2 bg-green-50/20">
                <CheckCircle className="w-3.5 h-3.5 text-kazi-green flex-shrink-0" fill="#00C896" />
                <span className="text-xs text-gray-700 font-medium">{afterItems[i].text}</span>
              </div>
            </div>
          ))}

          {/* Slider overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to right, rgba(254,242,242,0.6) ${pos}%, rgba(240,253,244,0.6) ${pos}%)`,
            }}
          />
          {/* Divider handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-kazi-orange pointer-events-none"
            style={{ left: `${pos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-kazi-orange rounded-full shadow-lg flex items-center justify-center pointer-events-none">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M8 12H16M8 12L5 9M8 12L5 15M16 12L19 9M16 12L19 15" />
              </svg>
            </div>
          </div>
          {/* Invisible drag area */}
          <input
            type="range" min={10} max={90} value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />
        </div>

        <div className="p-5 bg-kazi-orange/5 border-t border-kazi-orange/10 text-center">
          <p className="text-sm font-black text-kazi-dark">
            Every KaziShow Fundi meets all 6 standards. <span className="text-kazi-orange">No exceptions.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
