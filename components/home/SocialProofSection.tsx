"use client";
import { useEffect, useState } from "react";
import { Star, Users, Eye } from "lucide-react";

const TICKER_EVENTS = [
  { user: "Wanjiku M.", service: "Plumber", area: "Westlands", ago: "just now" },
  { user: "Omar A.", service: "Electrician", area: "Kasarani", ago: "1 min ago" },
  { user: "Purity N.", service: "Salon", area: "Kilimani", ago: "2 min ago" },
  { user: "John K.", service: "Cleaner", area: "Langata", ago: "3 min ago" },
  { user: "Sarah W.", service: "Carpenter", area: "Ruaka", ago: "4 min ago" },
  { user: "David O.", service: "Painter", area: "Karen", ago: "5 min ago" },
  { user: "Fatuma H.", service: "AC Repair", area: "South C", ago: "7 min ago" },
  { user: "Brian M.", service: "Plumber", area: "Thika Rd", ago: "9 min ago" },
];

const RATING_BARS = [
  { stars: 5, pct: 68 },
  { stars: 4, pct: 22 },
  { stars: 3, pct: 7 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 1 },
];

export default function SocialProofSection() {
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [viewers, setViewers] = useState(47);

  useEffect(() => {
    const t = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx((i) => (i + 1) % TICKER_EVENTS.length);
        setTickerVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setViewers((v) => v + Math.floor(Math.random() * 3) - 1);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const ev = TICKER_EVENTS[tickerIdx];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Viewing nudge + ticker */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {/* Viewers nudge */}
          <div className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-kazi-orange/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-kazi-orange" />
            </div>
            <div>
              <p className="text-sm font-black text-kazi-dark">
                <span className="text-kazi-orange">{viewers}</span> people
              </p>
              <p className="text-xs text-gray-400">viewing this page right now</p>
            </div>
          </div>

          {/* Live booking ticker */}
          <div className="bg-white rounded-2xl p-4 card-shadow flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-kazi-green animate-pulse" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Live Bookings</p>
            </div>
            <div
              className="transition-all duration-300"
              style={{ opacity: tickerVisible ? 1 : 0, transform: tickerVisible ? "translateY(0)" : "translateY(-8px)" }}
            >
              <p className="text-sm font-black text-kazi-dark">
                {ev.user} booked a <span className="text-kazi-orange">{ev.service}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{ev.area} · {ev.ago}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
              {TICKER_EVENTS.slice(0, 4).map((e, i) => (
                <div key={i} className={`flex items-center gap-2 transition-opacity ${i === 0 ? "opacity-100" : "opacity-40"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-kazi-green flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">{e.user} booked {e.service} · {e.area}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rating breakdown */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 card-shadow">
          <div className="flex items-start gap-6 mb-6">
            <div className="text-center">
              <p className="text-5xl font-black text-kazi-dark">4.8</p>
              <div className="flex items-center gap-0.5 justify-center mt-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-kazi-amber" fill={s <= 4 ? "#F59E0B" : "none"} strokeWidth={s === 5 ? 1.5 : 0} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Overall rating</p>
            </div>
            <div className="flex-1 space-y-2">
              {RATING_BARS.map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 flex-shrink-0 w-16">
                    <span className="text-xs text-gray-500 font-medium">{stars}</span>
                    <Star className="w-3 h-3 text-kazi-amber" fill="#F59E0B" />
                  </div>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: stars >= 4 ? "#F59E0B" : stars === 3 ? "#FB923C" : "#EF4444" }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-50">
            {[
              { icon: "💬", value: "2,847", label: "Total reviews" },
              { icon: "⚡", value: "98%", label: "On-time arrival" },
              { icon: "🔁", value: "74%", label: "Repeat bookings" },
            ].map(({ icon, value, label }) => (
              <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-lg mb-0.5">{icon}</p>
                <p className="text-base font-black text-kazi-dark">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
