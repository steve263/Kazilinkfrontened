"use client";
import { useState, useEffect } from "react";
import { Bell, X, Loader2 } from "lucide-react";
import { requestNotificationPermission } from "@/lib/firebase";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    if (localStorage.getItem("notif_dismissed")) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;

    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        const authToken = localStorage.getItem("kazishow_token");
        await fetch(`${API}/api/auth/device-token`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ deviceToken: fcmToken }),
        }).catch(console.error);
      }
    } finally {
      setLoading(false);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("notif_dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-[#1A1714] border border-white/10 rounded-2xl p-4 shadow-2xl z-40 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FF6B2B]/20 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-[#FF6B2B]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm mb-1">Enable Push Notifications</p>
          <p className="text-white/50 text-xs mb-3 leading-relaxed">
            Get instant alerts for bookings, payments and messages — even when the app is closed.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1 py-2 bg-[#FF6B2B] text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "🔔"}
              {loading ? "Enabling…" : "Enable Now"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 bg-white/10 text-white/60 text-xs rounded-xl hover:bg-white/20 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
