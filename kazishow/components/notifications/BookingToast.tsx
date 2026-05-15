"use client";
import { useEffect, useRef, useState } from "react";
import { X, Check, XCircle, User, MapPin, Calendar, Clock } from "lucide-react";

const COUNTDOWN_SECONDS = 30;
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface BookingRequest {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerPhoto: string | null;
  service: string | null;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  notes: string | null;
}

interface Props {
  request: BookingRequest;
  token: string;
  onDone: (id: string) => void;
}

export default function BookingToast({ request, token, onDone }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [state, setState] = useState<"pending" | "accepted" | "declined" | "expired">("pending");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setState("expired");
          setTimeout(() => onDone(request.bookingId), 1500);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  async function respond(action: "accept" | "decline") {
    clearInterval(timerRef.current!);
    const newState = action === "accept" ? "accepted" : "declined";
    setState(newState);
    try {
      const endpoint = action === "accept"
        ? `${API}/api/bookings/${request.bookingId}/accept`
        : `${API}/api/bookings/${request.bookingId}/decline`;
      await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setTimeout(() => onDone(request.bookingId), 2000);
  }

  const pct = (secondsLeft / COUNTDOWN_SECONDS) * 100;
  const dateStr = new Date(request.scheduledDate).toLocaleDateString("en-KE", {
    weekday: "short", month: "short", day: "numeric",
  });

  const bg =
    state === "accepted" ? "bg-green-600" :
    state === "declined" ? "bg-red-600" :
    state === "expired"  ? "bg-gray-700" : "bg-kazi-dark";

  return (
    <div
      className={`w-80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${bg}`}
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Countdown bar */}
      {state === "pending" && (
        <div className="h-1 bg-white/10 w-full">
          <div
            className="h-full bg-kazi-orange transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="p-4">
        {state === "pending" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-kazi-orange animate-pulse flex-shrink-0 mt-1" />
                <p className="text-xs font-bold text-kazi-orange uppercase tracking-wide">New Booking Request</p>
              </div>
              <span className="text-xs font-mono font-bold text-white/60">{secondsLeft}s</span>
            </div>

            {/* Customer */}
            <div className="flex items-center gap-3 mb-3">
              {request.customerPhoto ? (
                <img
                  src={request.customerPhoto}
                  alt={request.customerName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white/50" />
                </div>
              )}
              <div>
                <p className="font-black text-white text-sm leading-tight">{request.customerName}</p>
                {request.service && (
                  <p className="text-xs text-kazi-orange font-semibold">{request.service}</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-start gap-2 text-xs text-white/70">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white/40" />
                <span className="line-clamp-2">{request.address}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
                <span>{request.scheduledTime}</span>
              </div>
              {request.totalAmount > 0 && (
                <p className="text-sm font-black text-kazi-green">
                  KSh {request.totalAmount.toLocaleString()}
                </p>
              )}
              {request.notes && (
                <p className="text-xs text-white/50 italic line-clamp-2">"{request.notes}"</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => respond("decline")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={() => respond("accept")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-kazi-orange hover:bg-orange-500 text-white text-sm font-bold transition-colors"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
            </div>
          </>
        )}

        {state === "accepted" && (
          <div className="flex items-center gap-3 py-1">
            <Check className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <p className="font-black text-white text-sm">Booking Accepted!</p>
              <p className="text-xs text-white/70">{request.customerName}</p>
            </div>
          </div>
        )}

        {state === "declined" && (
          <div className="flex items-center gap-3 py-1">
            <XCircle className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <p className="font-black text-white text-sm">Booking Declined</p>
              <p className="text-xs text-white/70">{request.customerName}</p>
            </div>
          </div>
        )}

        {state === "expired" && (
          <div className="flex items-center gap-3 py-1">
            <Clock className="w-6 h-6 text-white/50 flex-shrink-0" />
            <div>
              <p className="font-black text-white/70 text-sm">Request Expired</p>
              <p className="text-xs text-white/50">{request.customerName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
