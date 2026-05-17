"use client";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import JobCompletionPopup from "./JobCompletionPopup";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function JobCompletionManager() {
  const [jobData, setJobData] = useState<any>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let userRaw: string | null = null;
    try { userRaw = localStorage.getItem("kazishow_user"); } catch { return; }
    if (!userRaw) return;

    let user: any;
    try { user = JSON.parse(userRaw); } catch { return; }
    if (user?.role !== "CUSTOMER") return;

    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });

    // Join the user's personal room so backend can emit to this customer
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", user.id);
    });

    socketRef.current.on("job_completion_request", (data: any) => {
      console.log("✅ Job completion popup received:", data);
      setJobData(data);
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch {}
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  if (!jobData) return null;

  return <JobCompletionPopup data={jobData} onClose={() => setJobData(null)} />;
}
