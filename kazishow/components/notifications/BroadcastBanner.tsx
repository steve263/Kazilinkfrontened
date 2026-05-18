"use client";
import { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DISMISSED_KEY = "kazishow_dismissed_broadcasts";

export default function BroadcastBanner() {
  const [banner, setBanner] = useState<{ id: string; title: string; body: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token") || sessionStorage.getItem("kazishow_token");
    if (!token) return;

    fetch(`${API}/api/notifications/broadcast/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) return;
        const notif = data.data;

        // Don't show if already dismissed this session
        const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
        if (dismissed.includes(notif.id)) return;

        setBanner({ id: notif.id, title: notif.title, body: notif.body });
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    if (!banner) return;

    // Mark as read on server
    const token = localStorage.getItem("kazishow_token") || sessionStorage.getItem("kazishow_token");
    if (token) {
      fetch(`${API}/api/notifications/${banner.id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // Save dismissed ID to localStorage so it stays gone after page navigation
    const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    dismissed.push(banner.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed.slice(-20)));

    setBanner(null);
  };

  if (!banner) return null;

  return (
    <div className="bg-kazi-orange text-white px-4 py-3 flex items-start gap-3">
      <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight">{banner.title}</p>
        <p className="text-sm text-white/90 mt-0.5 leading-snug">{banner.body}</p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
