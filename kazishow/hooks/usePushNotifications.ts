"use client";
import { useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function usePushNotifications() {
  useEffect(() => {
    const setup = async () => {
      const authToken = localStorage.getItem("kazishow_token");
      if (!authToken) return;

      const fcmToken = await requestNotificationPermission();

      if (fcmToken) {
        await fetch(`${API}/api/auth/device-token`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ deviceToken: fcmToken }),
        }).catch(console.error);
      }

      // Show foreground push notifications as custom toasts
      onForegroundMessage((payload) => {
        const { title, body } = payload.notification || {};
        const emoji = payload.data?.emoji || "🔔";
        const url   = payload.data?.url;

        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"} transition-all max-w-sm w-full bg-[#1A1714] border border-white/10 shadow-2xl rounded-2xl p-4 cursor-pointer`}
              onClick={() => {
                toast.dismiss(t.id);
                if (url) window.location.href = url;
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{title}</p>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{body}</p>
                  {url && <p className="text-xs text-[#FF6B2B] mt-1.5 font-semibold">Tap to open →</p>}
                </div>
              </div>
            </div>
          ),
          { duration: 6000, position: "top-right" }
        );
      });
    };

    setup();
  }, []);
}
