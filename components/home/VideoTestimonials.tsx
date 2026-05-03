"use client";
import { useState } from "react";
import { Play, Star, X } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Wanjiku Kamau",
    role: "Homeowner, Kilimani",
    quote: "I found a plumber in 10 minutes. He arrived on time, fixed the pipe and the M-Pesa was seamless. No more WhatsApp drama!",
    rating: 5,
    avatar: "W",
    color: "#FF6B2B",
    duration: "1:23",
    thumbnail: "🪛",
  },
  {
    name: "Omar Abdi",
    role: "Restaurant Owner, CBD",
    quote: "KaziShow helped me find a reliable electrician for our new branch. Verified badge meant I didn't have to worry about scams.",
    rating: 5,
    avatar: "O",
    color: "#0EA5E9",
    duration: "2:05",
    thumbnail: "⚡",
  },
  {
    name: "Purity Njeri",
    role: "Event Planner, Westlands",
    quote: "Booked 3 cleaners the night before a corporate event. All three showed up, all verified. KaziShow is a lifesaver!",
    rating: 5,
    avatar: "P",
    color: "#EC4899",
    duration: "1:47",
    thumbnail: "🧹",
  },
];

export default function VideoTestimonials() {
  const [playing, setPlaying] = useState<number | null>(null);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-kazi-dark mb-2">
          Hear it from our{" "}
          <span className="bg-gradient-to-r from-kazi-orange to-kazi-amber bg-clip-text text-transparent">
            customers
          </span>
        </h2>
        <p className="text-gray-500 text-sm">Real people, real experiences</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="group">
            {/* Video card */}
            <div
              className="relative rounded-3xl overflow-hidden cursor-pointer mb-4 aspect-video"
              style={{ background: `linear-gradient(135deg, ${t.color}30 0%, ${t.color}10 100%)` }}
              onClick={() => setPlaying(i)}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="text-5xl">{t.thumbnail}</div>
                <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-kazi-dark ml-0.5" fill="#1A1714" />
                </div>
                <span className="text-xs font-semibold text-gray-600 bg-white/80 px-2 py-0.5 rounded-full">{t.duration}</span>
              </div>
            </div>

            {/* Text */}
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                style={{ backgroundColor: t.color }}
              >
                {t.avatar}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 text-kazi-amber" fill="#F59E0B" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed italic">"{t.quote}"</p>
                <p className="text-xs font-bold text-kazi-dark mt-1.5">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal placeholder */}
      {playing !== null && (
        <div
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPlaying(null)}
        >
          <div className="bg-kazi-dark2 rounded-3xl p-8 max-w-md w-full text-center relative">
            <button className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="text-6xl mb-4">{TESTIMONIALS[playing].thumbnail}</div>
            <p className="text-white font-bold">{TESTIMONIALS[playing].name}</p>
            <p className="text-white/50 text-sm mt-1">{TESTIMONIALS[playing].role}</p>
            <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-white/70 text-sm italic leading-relaxed">"{TESTIMONIALS[playing].quote}"</p>
            </div>
            <p className="text-white/30 text-xs mt-4">Video playback requires backend integration</p>
          </div>
        </div>
      )}
    </section>
  );
}
