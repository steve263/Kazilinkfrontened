"use client";
import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

const NOTIFICATIONS = [
  { name: "James", area: "Westlands", service: "Plumber", time: "2 min ago" },
  { name: "Amina", area: "Kilimani", service: "Cleaner", time: "4 min ago" },
  { name: "Brian", area: "Kasarani", service: "Electrician", time: "6 min ago" },
  { name: "Faith", area: "Langata", service: "Salon", time: "9 min ago" },
  { name: "David", area: "Eastleigh", service: "Carpenter", time: "11 min ago" },
  { name: "Grace", area: "Ruaka", service: "Plumber", time: "13 min ago" },
  { name: "Kevin", area: "Karen", service: "AC Repair", time: "15 min ago" },
  { name: "Mercy", area: "Thika Rd", service: "Painter", time: "18 min ago" },
];

export default function LiveBookingToast() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const show = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(show);
  }, [dismissed]);

  useEffect(() => {
    if (!visible || dismissed) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % NOTIFICATIONS.length);
        setVisible(true);
      }, 600);
    }, 5000);
    return () => clearInterval(cycle);
  }, [visible, dismissed]);

  const n = NOTIFICATIONS[current];

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-28 md:bottom-24 left-4 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl px-4 py-3 border border-gray-100 max-w-[280px] card-shadow">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-kazi-green" fill="#00C896" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-kazi-dark leading-tight">
            {n.name} in {n.area} just booked a <span className="text-kazi-orange">{n.service}</span> ✅
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
        </div>
        <button
          onClick={() => { setDismissed(true); setVisible(false); }}
          className="text-gray-300 hover:text-gray-500 flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
