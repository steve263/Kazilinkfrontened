"use client";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import JobCompletionPopup from "./JobCompletionPopup";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function JobCompletionManager() {
  const [jobData, setJobData] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let userRaw: string | null = null;
    let token: string | null = null;
    try {
      userRaw = localStorage.getItem("kazishow_user");
      token = localStorage.getItem("kazishow_token") ||
              sessionStorage.getItem("kazishow_token");
    } catch { return; }

    if (!userRaw || !token) return;

    let user: any;
    try { user = JSON.parse(userRaw); } catch { return; }

    // Only customers need this popup — providers mark complete, customers confirm
    if (user?.role !== "CUSTOMER") {
      console.log("⏭️ JobCompletionManager: skipping — user is not a customer");
      return;
    }

    console.log(`✅ JobCompletionManager: starting for customer ${user.id}`);

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log(`🔌 Customer socket connected: ${socketRef.current?.id}`);
      // Join both event names for maximum compatibility
      socketRef.current?.emit("join", user.id);
      socketRef.current?.emit("join_room", user.id);
      console.log(`🏠 Customer ${user.id} joined room`);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("❌ JobCompletionManager socket error:", err.message);
    });

    socketRef.current.on("job_completion_request", (data: any) => {
      console.log("🔔 Job completion popup received by customer:", data);
      setJobData(data);
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch {}
    });

    return () => {
      console.log("🔌 JobCompletionManager socket disconnecting");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  if (!jobData) return null;

  return (
    <JobCompletionPopup
      data={jobData}
      onClose={() => setJobData(null)}
    />
  );
}
