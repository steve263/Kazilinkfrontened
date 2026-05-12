"use client";

import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import {
  X,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Lock,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import ProviderBusyModal from "./ProviderBusyModal";

interface BookingModalProps {
  business: any;
  service?: any;
  onClose: () => void;
  dealId?: string;
  dealPrice?: number;
  dealTitle?: string;
  discount?: number;
  discountType?: string;
  originalPrice?: number;
}

const TIMES = [
  "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00",
];

type Step =
  | "service"
  | "datetime"
  | "payment"
  | "confirm"
  | "searching"
  | "success"
  | "declined"
  | "timeout";

const PROGRESS_STEPS: Step[] = ["service", "datetime", "payment", "confirm"];

export default function BookingModal({ business, service, onClose, dealId, dealPrice, dealTitle, discount, discountType, originalPrice }: BookingModalProps) {
  const hasDeal = !!dealId;
  const [step, setStep] = useState<Step>(service ? "datetime" : "service");
  const [selectedService, setSelectedService] = useState<any>(service || null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("mpesa_before");
  const [notes, setNotes] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("+254 7");
  const [locationAddress, setLocationAddress] = useState(
    business.user?.location || "Nairobi"
  );
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const countdownMax = business.category === "FUNDI" ? 30 : 20;
  const [countdown, setCountdown] = useState(countdownMax);
  const [bookingId, setBookingId] = useState("");
  const [waitingForProvider, setWaitingForProvider] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [providerBusy, setProviderBusy] = useState(false);
  const [busyProviderData, setBusyProviderData] = useState<any>(null);

  const timerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const pollTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socketRef.current) socketRef.current.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label:
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric" }),
    };
  });

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLat(latitude);
        setLocationLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const name: string = data.display_name || `${latitude}, ${longitude}`;
          setLocationAddress(name.slice(0, 60));
        } catch {
          setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        toast.error("Could not get location");
      },
      { timeout: 10000 }
    );
  };

  const triggerMpesaPayment = async (bkgId: string, phone: string) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API}/api/payments/stk-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: bkgId, phone: phone.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("M-Pesa prompt sent! Enter your PIN to pay.");
        setCheckoutRequestId(data.data.checkoutRequestId);
      } else {
        toast.error(data.message || "Failed to send M-Pesa prompt");
        setWaitingForPayment(false);
        setStep("success");
      }
    } catch {
      toast.error("Payment trigger failed. Booking is confirmed.");
      setWaitingForPayment(false);
      setStep("success");
    }
  };

  const pollPaymentStatus = (bkgId: string) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    pollRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("kazishow_token");
        const res = await fetch(`${API}/api/payments/${bkgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const status = data.data?.payment?.status;
        if (status === "SUCCESS") {
          clearInterval(pollRef.current);
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          setWaitingForPayment(false);
          setStep("success");
          toast.success("Payment confirmed! Booking complete! 🎉");
        } else if (status === "FAILED") {
          clearInterval(pollRef.current);
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          setWaitingForPayment(false);
          toast.error("Payment failed. Please try again.");
          setStep("payment");
        }
      } catch {}
    }, 5000);

    pollTimeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current);
      setWaitingForPayment(false);
      setStep("success");
      toast("Booking confirmed. Pay on arrival if needed.", { icon: "⚠️" });
    }, 120000);
  };

  const handleConfirm = async () => {
    const token = localStorage.getItem("kazishow_token");
    const user = JSON.parse(localStorage.getItem("kazishow_user") || "null");
    if (!token || !user) {
      toast.error("Please login to book");
      return;
    }
    if (user.role !== "CUSTOMER") {
      toast.error("Only customers can book");
      return;
    }

    // Clean up any previous socket/timer before starting fresh
    if (timerRef.current) clearInterval(timerRef.current);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setWaitingForProvider(false);
    setCountdown(countdownMax);
    setStep("searching");

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerId: business.id,
          serviceId: selectedService?.id,
          scheduledDate: selectedDate,
          scheduledTime: selectedTime,
          address: locationAddress,
          lat: locationLat || undefined,
          lng: locationLng || undefined,
          totalAmount: hasDeal && dealPrice !== undefined ? dealPrice : (selectedService?.price || 0),
          notes,
          dealId: dealId || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.message === "PROVIDER_BUSY") {
          setBusyProviderData(data.data);
          setProviderBusy(true);
          setStep("confirm");
          return;
        }
        toast.error(data.message || "Booking failed");
        setStep("confirm");
        return;
      }

      const booking = data.data;
      setBookingId(booking.id);

      console.log("[BookingModal] booking.status =", booking.status, "| provider category =", business.category);

      // Business provider (auto-accepted by backend)
      if (booking.status !== "PENDING") {
        if (selectedPayment === "mpesa_before") {
          setWaitingForPayment(true);
          await triggerMpesaPayment(booking.id, mpesaPhone);
          pollPaymentStatus(booking.id);
        } else {
          setTimeout(() => setStep("success"), 1500);
        }
        return;
      }

      // Provider pending: start countdown then wait for socket events
      setWaitingForProvider(true);
      let count = countdownMax;
      setCountdown(countdownMax);
      timerRef.current = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timerRef.current);
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
          setStep("timeout");
        }
      }, 1000);

      // Connect socket AFTER starting countdown — avoids missing the first tick
      const socket = io(API, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join", user.id);
        console.log("[BookingModal] Socket joined room:", user.id);
      });

      const acceptedBookingId = booking.id;
      socket.on("booking_accepted", async () => {
        console.log("[BookingModal] booking_accepted received");
        clearInterval(timerRef.current);
        socket.disconnect();
        socketRef.current = null;
        if (selectedPayment === "mpesa_before") {
          setWaitingForPayment(true);
          await triggerMpesaPayment(acceptedBookingId, mpesaPhone);
          pollPaymentStatus(acceptedBookingId);
        } else {
          setStep("success");
        }
      });

      socket.on("booking_declined", () => {
        console.log("[BookingModal] booking_declined received");
        clearInterval(timerRef.current);
        socket.disconnect();
        socketRef.current = null;
        setStep("declined");
      });

    } catch {
      toast.error("Cannot connect. Please try again.");
      setStep("confirm");
      if (timerRef.current) clearInterval(timerRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  };

  const services = business.services || [];

  const paymentLabel = (id: string) => {
    if (id === "mpesa_before") return "M-Pesa Pay Now";
    if (id === "mpesa_after") return "M-Pesa Pay After";
    return "Cash";
  };

  const progressIndex = PROGRESS_STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-kazi-dark text-lg leading-tight">
              {business.category === "FUNDI" ? "Book Service" : "Place Order"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {business.businessName || business.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress bar (steps 1-4 only) */}
        {progressIndex >= 0 && (
          <div className="px-5 pt-3 pb-1">
            <div className="flex gap-1.5">
              {PROGRESS_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    progressIndex >= i ? "bg-kazi-orange" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2">
          {/* ─────────────────────────────────────────
              STEP 1: Select Service
          ───────────────────────────────────────── */}
          {step === "service" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-kazi-dark text-base">
                Choose a Service
              </h3>
              {services.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No services listed yet</p>
                </div>
              ) : (
                services.map((svc: any) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep("datetime");
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-kazi-orange hover:bg-orange-50 text-left transition-all active:scale-[0.99]"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-sm text-kazi-dark">
                        {svc.name}
                      </p>
                      {svc.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                          {svc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs bg-orange-100 text-kazi-orange px-2 py-0.5 rounded-full font-semibold">
                          {formatCurrency(svc.price)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {svc.duration || "1 hr"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 2: Date, Time & Location
          ───────────────────────────────────────── */}
          {step === "datetime" && (
            <div className="space-y-5">
              {/* Date row */}
              <div>
                <h3 className="font-semibold text-kazi-dark text-sm mb-2">
                  Select Date
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {dates.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        selectedDate === d.value
                          ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-kazi-orange"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time grid */}
              <div>
                <h3 className="font-semibold text-kazi-dark text-sm mb-2">
                  Select Time
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {TIMES.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedTime === time
                          ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                          : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-kazi-orange"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location row */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-kazi-dark mb-2">
                  <MapPin className="w-4 h-4 text-kazi-orange" />
                  Your Location
                </label>
                <div className="flex gap-2">
                  <input
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Enter your address"
                    className="flex-1 px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                  />
                  <button
                    onClick={handleGPS}
                    disabled={gpsLoading}
                    className="flex-shrink-0 px-3 py-2.5 bg-orange-50 border border-orange-200 text-kazi-orange text-xs font-semibold rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    {gpsLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>📍</span>
                    )}
                    {gpsLoading ? "" : "Use GPS"}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-kazi-dark mb-2 block">
                  Notes{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or details..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
                />
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 3: Payment Method
          ───────────────────────────────────────── */}
          {step === "payment" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-kazi-dark text-base">
                Payment Method
              </h3>

              {/* KaziShow Promise */}
              <div className="flex items-start gap-3 p-3.5 bg-green-50 border-2 border-kazi-green/30 rounded-2xl">
                <ShieldCheck className="w-4 h-4 text-kazi-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-kazi-dark mb-0.5">
                    Pay via KaziShow for full protection
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    In-app M-Pesa payments are secured. Full refund if provider
                    doesn't show up.
                  </p>
                </div>
              </div>

              {/* mpesa_before */}
              <button
                onClick={() => setSelectedPayment("mpesa_before")}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedPayment === "mpesa_before"
                    ? "border-kazi-orange bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">📱</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-kazi-dark">
                      M-Pesa Pay Now
                    </p>
                    <span className="text-xs bg-green-100 text-kazi-green font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Protected
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pay before service. Full refund if no-show.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedPayment === "mpesa_before"
                      ? "border-kazi-orange"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPayment === "mpesa_before" && (
                    <div className="w-2.5 h-2.5 bg-kazi-orange rounded-full" />
                  )}
                </div>
              </button>

              {/* mpesa_after */}
              <button
                onClick={() => setSelectedPayment("mpesa_after")}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedPayment === "mpesa_after"
                    ? "border-kazi-orange bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">📲</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-kazi-dark">
                    M-Pesa Pay After
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pay on completion. No platform protection.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedPayment === "mpesa_after"
                      ? "border-kazi-orange"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPayment === "mpesa_after" && (
                    <div className="w-2.5 h-2.5 bg-kazi-orange rounded-full" />
                  )}
                </div>
              </button>

              {/* cash */}
              <button
                onClick={() => setSelectedPayment("cash")}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedPayment === "cash"
                    ? "border-kazi-orange bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">💵</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-kazi-dark">Cash</p>
                  <p className="text-xs text-kazi-amber mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No platform protection for cash payments
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedPayment === "cash"
                      ? "border-kazi-orange"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPayment === "cash" && (
                    <div className="w-2.5 h-2.5 bg-kazi-orange rounded-full" />
                  )}
                </div>
              </button>

              {/* M-Pesa phone input */}
              {selectedPayment.includes("mpesa") && (
                <div>
                  <label className="text-sm font-semibold text-kazi-dark mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-kazi-green" />
                    M-Pesa Phone Number
                  </label>
                  <input
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    type="tel"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kazi-green focus:border-transparent"
                  />
                </div>
              )}

            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 4: Confirm
          ───────────────────────────────────────── */}
          {step === "confirm" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-kazi-dark text-base">
                Confirm Booking
              </h3>

              {/* Summary card */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-start text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-semibold text-kazi-dark text-right max-w-[60%]">
                    {selectedService?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-start text-sm">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-semibold text-kazi-dark text-right">
                    {selectedDate} at {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between items-start text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold text-kazi-dark">
                    {selectedService?.duration || "1 hr"}
                  </span>
                </div>
                <div className="flex justify-between items-start text-sm">
                  <span className="text-gray-500 flex-shrink-0">Location</span>
                  <span className="font-semibold text-kazi-dark text-right max-w-[60%] truncate">
                    {locationAddress.slice(0, 40)}
                    {locationAddress.length > 40 ? "…" : ""}
                  </span>
                </div>
                <div className="flex justify-between items-start text-sm">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-semibold text-kazi-dark">
                    {paymentLabel(selectedPayment)}
                  </span>
                </div>
                {hasDeal && dealPrice !== undefined && originalPrice !== undefined && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 line-through">Original</span>
                      <span className="text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600 font-semibold">
                        {discountType === "PERCENTAGE" ? `${discount}% Discount` : `KSh ${discount} OFF`}
                      </span>
                      <span className="text-green-600 font-bold">-{formatCurrency(originalPrice - dealPrice)}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center">
                  <span className="font-bold text-kazi-dark">Total</span>
                  <span className="font-black text-kazi-orange text-xl">
                    {formatCurrency(hasDeal && dealPrice !== undefined ? dealPrice : (selectedService?.price || 0))}
                  </span>
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Provider notified instantly.{" "}
                  <strong>{countdownMax} seconds to respond.</strong>
                </p>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 5: Searching / Payment
          ───────────────────────────────────────── */}
          {step === "searching" && (
            waitingForPayment ? (
              /* M-Pesa payment waiting screen */
              <div className="flex flex-col items-center py-8 space-y-5">
                <div className="text-6xl animate-bounce">📱</div>
                <div className="text-center">
                  <h3 className="font-black text-kazi-dark text-xl mb-2">Check Your Phone!</h3>
                  <p className="text-gray-500 text-sm mb-2">
                    An M-Pesa prompt has been sent to
                  </p>
                  <p className="font-bold text-kazi-orange text-lg">
                    {mpesaPhone.replace(/\s/g, "")}
                  </p>
                </div>
                <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💚</span>
                    <div>
                      <p className="font-bold text-sm text-kazi-dark">Enter your M-Pesa PIN</p>
                      <p className="text-xs text-gray-500">The prompt will expire in 2 minutes</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Waiting for payment confirmation...</p>
                </div>
                <p className="text-xs text-gray-400">
                  Amount:{" "}
                  <strong className="text-kazi-orange">
                    KSh {selectedService?.price?.toLocaleString()}
                  </strong>
                </p>
              </div>
            ) : (
              /* Provider search / countdown screen */
              <div className="flex flex-col items-center justify-center py-10 space-y-6">
                {/* Pulsing ring + spinner */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-24 w-24 rounded-full bg-kazi-orange opacity-20 animate-ping" />
                  <span className="absolute inline-flex h-20 w-20 rounded-full bg-kazi-orange opacity-10 animate-ping animation-delay-150" />
                  <div className="relative w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-kazi-orange animate-spin" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-bold text-kazi-dark text-xl mb-1">
                    {waitingForProvider ? "Waiting for Provider..." : "Confirming Booking..."}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {waitingForProvider
                      ? `${business.businessName || business.name} has ${countdownMax} seconds to respond`
                      : `Notifying ${business.businessName || business.name}`}
                  </p>
                </div>

                {waitingForProvider && (
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                      <circle
                        cx="48" cy="48" r="42" fill="none" stroke="#f97316" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - countdown / countdownMax)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-black text-kazi-orange leading-none">
                        {countdown}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-kazi-orange rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* ─────────────────────────────────────────
              STEP 6a: Success
          ───────────────────────────────────────── */}
          {step === "success" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-kazi-green" fill="currentColor" />
              </div>
              <div className="text-center">
                <h3 className="font-black text-kazi-dark text-2xl mb-1">
                  Booking Confirmed! 🎉
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {business.businessName || business.name}
                </p>
                {selectedService && (
                  <p className="text-xs text-kazi-orange font-semibold mt-1">
                    {selectedService.name}
                  </p>
                )}
                {selectedDate && selectedTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedDate} at {selectedTime}
                  </p>
                )}
              </div>

              <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-sm text-kazi-dark font-medium">
                  You will receive an SMS confirmation shortly
                </p>
              </div>

              {business.category === "FUNDI" && business.user?.phone && (
                <div className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
                  <p className="text-sm text-kazi-dark font-medium">
                    Your Fundi is on their way. Stay available on{" "}
                    <span className="font-bold text-kazi-orange">
                      {business.user.phone}
                    </span>
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 6b: Declined
          ───────────────────────────────────────── */}
          {step === "declined" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <X className="w-10 h-10 text-red-500" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <h3 className="font-black text-kazi-dark text-xl mb-1">
                  Request Declined
                </h3>
                <p className="text-sm text-gray-500">
                  This provider couldn&apos;t take your booking.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98]"
                >
                  Try Another Provider
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  className="flex-1 py-3 bg-gray-100 text-kazi-dark font-bold text-sm rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 6c: Timeout
          ───────────────────────────────────────── */}
          {step === "timeout" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="w-10 h-10 text-kazi-amber" />
              </div>
              <div className="text-center">
                <h3 className="font-black text-kazi-dark text-xl mb-1">
                  No Response
                </h3>
                <p className="text-sm text-gray-500">
                  The provider didn&apos;t respond in time.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98]"
                >
                  Try Another Provider
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  className="flex-1 py-3 bg-gray-100 text-kazi-dark font-bold text-sm rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky action footer — always visible above the keyboard / FABs */}
        {(step === "datetime" || step === "payment" || step === "confirm") && (
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            {step === "datetime" && (
              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep("payment")}
                className="w-full py-3.5 bg-kazi-orange text-white font-bold text-sm rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-all active:scale-[0.98]"
              >
                Continue
              </button>
            )}
            {step === "payment" && (
              <button
                onClick={() => setStep("confirm")}
                className="w-full py-3.5 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98]"
              >
                Review Booking
              </button>
            )}
            {step === "confirm" && (
              <button
                onClick={handleConfirm}
                className="w-full py-3.5 bg-kazi-orange text-white font-bold text-sm rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                {business.category === "FUNDI" ? "Confirm & Send Request" : "Confirm & Place Order"}
              </button>
            )}
          </div>
        )}
      </div>

      {providerBusy && busyProviderData && (
        <ProviderBusyModal
          provider={busyProviderData}
          onClose={() => { setProviderBusy(false); onClose(); }}
        />
      )}
    </div>
  );
}
