"use client";
import { useEffect, useState } from "react";
import { Search, User, Calendar, Smartphone, CheckCircle, ChevronRight } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    label: "Search",
    desc: "Type 'plumber' and see verified results near you",
    color: "#FF6B2B",
    preview: (
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 flex-1">plumber nairobi</span>
          <span className="text-xs text-kazi-orange font-semibold">Search</span>
        </div>
        {["James Mwangi ⭐ 4.9", "Peter Otieno ⭐ 4.8"].map((r) => (
          <div key={r} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
            <div className="w-8 h-8 rounded-xl bg-kazi-orange/20 flex items-center justify-center text-kazi-orange font-bold text-xs">P</div>
            <div>
              <p className="text-xs font-bold text-kazi-dark">{r}</p>
              <p className="text-xs text-gray-400">0.8 km · Verified Fundi</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: User,
    label: "View Profile",
    desc: "See verified badge, portfolio photos and reviews",
    color: "#0EA5E9",
    preview: (
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-kazi-blue/20 flex items-center justify-center text-xl">👷</div>
          <div>
            <p className="text-sm font-black text-kazi-dark">James Mwangi</p>
            <span className="text-xs bg-kazi-orange text-white px-2 py-0.5 rounded-full font-bold">✅ Verified Fundi</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["🪛 Wiring", "💡 Install", "🔌 Repairs"].map((s) => (
            <div key={s} className="bg-gray-50 rounded-xl p-2 text-center text-xs font-semibold text-gray-600">{s}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Calendar,
    label: "Book",
    desc: "Pick a date and time that works for you",
    color: "#F59E0B",
    preview: (
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <p className="text-xs font-bold text-gray-500 mb-2">Select a time slot</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"].map((t, i) => (
            <div key={t} className={`py-2 rounded-xl text-center text-xs font-bold border transition-all ${i === 1 ? "bg-kazi-amber text-white border-kazi-amber" : "border-gray-100 text-gray-500"}`}>{t}</div>
          ))}
        </div>
        <div className="w-full py-2.5 bg-kazi-orange rounded-xl text-center text-xs font-bold text-white">Confirm Booking</div>
      </div>
    ),
  },
  {
    icon: Smartphone,
    label: "Pay via M-Pesa",
    desc: "Lipa Na M-Pesa — secure, fast, no cash needed",
    color: "#00C896",
    preview: (
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">M</span>
          </div>
          <p className="text-sm font-black text-kazi-dark">M-Pesa Payment</p>
        </div>
        <div className="space-y-2 text-xs text-gray-500 mb-3">
          <div className="flex justify-between"><span>Service fee</span><span className="font-bold text-kazi-dark">KSh 1,500</span></div>
          <div className="flex justify-between"><span>Platform fee</span><span className="font-bold text-kazi-dark">KSh 50</span></div>
          <div className="flex justify-between font-bold text-sm text-kazi-dark border-t border-gray-50 pt-2"><span>Total</span><span>KSh 1,550</span></div>
        </div>
        <div className="w-full py-2.5 bg-green-600 rounded-xl text-center text-xs font-bold text-white">Pay Now →</div>
      </div>
    ),
  },
  {
    icon: CheckCircle,
    label: "Done!",
    desc: "Provider confirmed. Track arrival on the map",
    color: "#00C896",
    preview: (
      <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
        <div className="w-14 h-14 rounded-full bg-kazi-green/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-kazi-green" fill="#00C896" />
        </div>
        <p className="text-sm font-black text-kazi-dark mb-1">Booking Confirmed! 🎉</p>
        <p className="text-xs text-gray-400 mb-3">James is on his way · Est. 20 min</p>
        <div className="bg-gray-50 rounded-xl p-2 text-xs text-gray-500 font-medium">📍 Tracking live...</div>
      </div>
    ),
  },
];

export default function BookingDemo() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <section className="bg-kazi-dark2 py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white mb-2">
            See how easy it is to{" "}
            <span className="bg-gradient-to-r from-kazi-orange to-kazi-amber bg-clip-text text-transparent">
              book a service
            </span>
          </h2>
          <p className="text-white/50 text-sm">Under 2 minutes from search to confirmed booking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Step list */}
          <div className="space-y-2">
            {STEPS.map((s, i) => {
              const SIcon = s.icon;
              const isActive = i === active;
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                    isActive ? "bg-white/10 border border-white/20" : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ backgroundColor: isActive ? s.color : `${s.color}20` }}
                  >
                    <SIcon className="w-5 h-5" style={{ color: isActive ? "white" : s.color }} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-black transition-colors ${isActive ? "text-white" : "text-white/50"}`}>
                      Step {i + 1}: {s.label}
                    </p>
                    {isActive && <p className="text-xs text-white/50 mt-0.5">{s.desc}</p>}
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />}
                </button>
              );
            })}
            {/* Progress bar */}
            <div className="flex gap-1.5 pt-2 px-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-500"
                  style={{ backgroundColor: i <= active ? STEPS[i].color : "rgba(255,255,255,0.15)" }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-20 transition-all duration-500" style={{ backgroundColor: step.color }} />
            <div className="relative p-6 transition-all duration-500">
              {step.preview}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
