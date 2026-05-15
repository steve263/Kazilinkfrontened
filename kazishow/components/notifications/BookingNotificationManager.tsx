"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import BookingToast, { BookingRequest } from "./BookingToast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [0, 120, 240].forEach((delayMs, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880 + i * 220;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delayMs / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delayMs / 1000 + 0.3);
      osc.start(ctx.currentTime + delayMs / 1000);
      osc.stop(ctx.currentTime + delayMs / 1000 + 0.35);
    });
  } catch {}
}

export default function BookingNotificationManager() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    const raw = localStorage.getItem("kazishow_user");
    if (!token || !raw) return;

    let user: { id: string; role: string } | null = null;
    try { user = JSON.parse(raw); } catch {}
    if (!user || user.role !== "PROVIDER") return;

    const socket = io(API, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", user!.id);
      socket.emit("join", user!.id);
    });

    socket.on("new_booking_request", (payload: BookingRequest) => {
      setRequests((prev) => {
        if (prev.find((r) => r.bookingId === payload.bookingId)) return prev;
        return [...prev, payload];
      });
      playNotificationBeep();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function dismiss(bookingId: string) {
    setRequests((prev) => prev.filter((r) => r.bookingId !== bookingId));
  }

  if (requests.length === 0) return null;

  const token = typeof window !== "undefined"
    ? (localStorage.getItem("kazishow_token") ?? "")
    : "";

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 items-end"
      style={{ maxHeight: "calc(100dvh - 2rem)", overflowY: "auto" }}
    >
      {requests.map((r) => (
        <BookingToast
          key={r.bookingId}
          request={r}
          token={token}
          onDone={dismiss}
        />
      ))}
    </div>
  );
}
