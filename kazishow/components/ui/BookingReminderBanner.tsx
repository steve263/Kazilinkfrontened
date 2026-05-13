"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, X, Clock, ChevronRight, Calendar } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DISMISSED_KEY = "kazishow_dismissed_reminders";
const SCHEDULED_KEY = "kazishow_scheduled_notifs";

function formatTime(timeStr: string) {
  const [h, m] = (timeStr || "").split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getBookingMs(scheduledDate: string, scheduledTime: string) {
  const [h, m] = scheduledTime.split(":").map(Number);
  const d = new Date(scheduledDate);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function timeUntilLabel(ms: number) {
  const diff = ms - Date.now();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0)   return `Tomorrow`;
  if (hrs > 1)    return `in ${hrs}h`;
  if (hrs === 1)  return `in 1 hr`;
  if (mins >= 1)  return `in ${mins} min`;
  return "now";
}

async function scheduleBrowserNotif(booking: any) {
  if (!("Notification" in window)) return;
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return;

  const scheduled: string[] = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || "[]");
  if (scheduled.includes(booking.id)) return;

  const bookingMs = getBookingMs(booking.scheduledDate, booking.scheduledTime);
  const msUntil1h = bookingMs - Date.now() - 60 * 60 * 1000;

  if (msUntil1h > 0 && msUntil1h < 25 * 60 * 60 * 1000) {
    setTimeout(() => {
      new Notification("⏰ Booking in 1 hour!", {
        body:  `Your booking with ${booking.provider?.businessName} is in 1 hour at ${formatTime(booking.scheduledTime)}.`,
        icon:  "/logo.png",
        tag:   booking.id,
      });
    }, msUntil1h);
  }

  const msUntil30m = bookingMs - Date.now() - 30 * 60 * 1000;
  if (msUntil30m > 0 && msUntil30m < 25 * 60 * 60 * 1000) {
    setTimeout(() => {
      new Notification("⏰ Booking in 30 minutes!", {
        body:  `${booking.provider?.businessName} is coming in 30 minutes. Be ready!`,
        icon:  "/logo.png",
        tag:   `${booking.id}-30m`,
      });
    }, msUntil30m);
  }

  scheduled.push(booking.id);
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(scheduled));
}

export default function BookingReminderBanner() {
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    const user  = (() => { try { return JSON.parse(localStorage.getItem("kazishow_user") || "null"); } catch { return null; } })();
    if (!token || user?.role !== "CUSTOMER") return;

    // Respect notification preference
    const prefs = (() => { try { return JSON.parse(localStorage.getItem("kazishow_notif_prefs") || "{}"); } catch { return {}; } })();
    if (prefs.reminder === false) return;

    const dismissed: string[] = (() => { try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"); } catch { return []; } })();

    fetch(`${API}/api/bookings?limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const now   = Date.now();
        const in24h = now + 24 * 60 * 60 * 1000;

        const upcoming = (data.data?.bookings || []).filter((b: any) => {
          if (!["PENDING", "ACCEPTED", "EN_ROUTE"].includes(b.status)) return false;
          if (!b.scheduledDate || !b.scheduledTime) return false;
          const ms = getBookingMs(b.scheduledDate, b.scheduledTime);
          return ms > now && ms <= in24h && !dismissed.includes(b.id);
        });

        // Sort soonest first
        upcoming.sort((a: any, b: any) =>
          getBookingMs(a.scheduledDate, a.scheduledTime) - getBookingMs(b.scheduledDate, b.scheduledTime)
        );

        setReminders(upcoming);
        upcoming.forEach(scheduleBrowserNotif);
      })
      .catch(() => {});
  }, []);

  const dismiss = (id: string) => {
    setReminders((prev) => prev.filter((b) => b.id !== id));
    const dismissed: string[] = (() => { try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"); } catch { return []; } })();
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  };

  if (reminders.length === 0) return null;

  return (
    <div className="px-4 pt-3 space-y-2">
      {reminders.map((b) => {
        const ms        = getBookingMs(b.scheduledDate, b.scheduledTime);
        const minsLeft  = Math.floor((ms - Date.now()) / 60000);
        const isUrgent  = minsLeft <= 60;
        const label     = timeUntilLabel(ms);

        return (
          <div
            key={b.id}
            className={`relative flex items-center gap-3 bg-white rounded-2xl shadow-sm border px-4 py-3 overflow-hidden ${
              isUrgent ? "border-red-200" : "border-orange-100"
            }`}
          >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isUrgent ? "bg-red-500" : "bg-kazi-orange"}`} />

            {/* Bell icon */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isUrgent ? "bg-red-50" : "bg-orange-50"}`}>
              <Bell className={`w-4 h-4 ${isUrgent ? "text-red-500 animate-bounce" : "text-kazi-orange"}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-kazi-dark truncate">
                {b.provider?.businessName || "Upcoming Booking"}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatTime(b.scheduledTime)}
                </span>
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                  isUrgent ? "bg-red-100 text-red-600" : "bg-orange-100 text-kazi-orange"
                }`}>
                  {label}
                </span>
                {b.service?.name && (
                  <span className="text-[11px] text-gray-400 truncate">{b.service.name}</span>
                )}
              </div>
            </div>

            {/* View button */}
            <Link
              href="/profile"
              className={`flex-shrink-0 flex items-center gap-0.5 px-3 py-1.5 text-white text-xs font-bold rounded-xl ${
                isUrgent ? "bg-red-500 hover:bg-red-600" : "bg-kazi-orange hover:bg-orange-600"
              } transition-colors`}
            >
              View <ChevronRight className="w-3 h-3" />
            </Link>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(b.id)}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
