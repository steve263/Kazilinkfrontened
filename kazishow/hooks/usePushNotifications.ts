"use client";
import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function usePushNotifications() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const token = localStorage.getItem("kazishow_token");
    if (!token) return;

    // Only auto-init if permission already granted — banner handles the request prompt
    if (Notification.permission !== "granted") return;

    async function init() {
      try {
        const { requestNotificationPermission } = await import("@/lib/firebase");
        const fcmToken = await requestNotificationPermission();
        if (!fcmToken) return;
        await fetch(`${API}/api/auth/device-token`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ deviceToken: fcmToken }),
        });
      } catch {
        // Firebase not configured — silent fail
      }
    }

    init();
  }, []);
}
