"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft, Phone, MessageSquare, MapPin, Navigation,
  Clock, CheckCircle, Loader2, Zap,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

// Map components — client-side only
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then((m) => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then((m) => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import("react-leaflet").then((m) => m.Popup),        { ssr: false });
const Polyline     = dynamic(() => import("react-leaflet").then((m) => m.Polyline),     { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDI: "🔧", SHOP: "🏪", HOTEL: "🏨", RESTAURANT: "🍽️",
  TECH: "💻", PROFESSIONAL: "💼", BUSINESS: "🏢",
};

const STATUS_INFO: Record<string, { label: string; color: string; desc: string }> = {
  ACCEPTED:    { label: "Accepted",    color: "bg-green-500",   desc: "Your provider has accepted and will be on their way soon" },
  EN_ROUTE:    { label: "On the Way",  color: "bg-blue-500",    desc: "Your provider is heading to your location" },
  ARRIVED:     { label: "Arrived",     color: "bg-cyan-500",    desc: "Your provider has arrived at your location" },
  IN_PROGRESS: { label: "In Progress", color: "bg-purple-500",  desc: "Your job is underway" },
  PREPARING:   { label: "Preparing",   color: "bg-amber-500",   desc: "Your order is being prepared" },
  READY:       { label: "Ready",       color: "bg-teal-500",    desc: "Your order is ready!" },
  COMPLETED:   { label: "Completed",   color: "bg-emerald-500", desc: "Job complete! Please leave a review." },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Recenter map when provider moves — must be a child of MapContainer
const MapController = dynamic(
  () => import("react-leaflet").then((m) => {
    function Controller({ center }: { center: [number, number] }) {
      const map = m.useMap();
      useEffect(() => { map.panTo(center, { animate: true, duration: 0.8 }); }, [center, map]);
      return null;
    }
    return Controller;
  }),
  { ssr: false }
);

export default function TrackingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();

  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [providerLoc, setProviderLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow]             = useState(Date.now());
  const [status, setStatus]       = useState("");
  const [providerIcon, setProviderIcon] = useState<any>(null);
  const [customerIcon, setCustomerIcon] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("kazishow_token") : null;
  const user  = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("kazishow_user") || "null") : null;

  // Build custom Leaflet icons (client-side only)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@keyframes markerPing{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.8);opacity:0}}`;
    document.head.appendChild(style);

    import("leaflet").then((Leaflet) => {
      const L = (Leaflet as any).default || Leaflet;

      setProviderIcon(
        L.divIcon({
          className: "",
          html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(255,107,43,0.35);animation:markerPing 1.6s ease-out infinite"></div>
            <div style="width:24px;height:24px;border-radius:50%;background:#FF6B2B;border:3px solid white;box-shadow:0 2px 10px rgba(255,107,43,0.55)"></div>
          </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        })
      );

      setCustomerIcon(
        L.divIcon({
          className: "",
          html: `<div style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.22))">
            <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.716 23.284 0 15 0z" fill="#1d4ed8"/>
              <circle cx="15" cy="15" r="7" fill="white"/>
              <circle cx="15" cy="15" r="4" fill="#1d4ed8"/>
            </svg>
          </div>`,
          iconSize: [30, 40],
          iconAnchor: [15, 40],
          popupAnchor: [0, -40],
        })
      );
    });

    return () => { style.remove(); };
  }, []);

  const fetchTracking = useCallback(async () => {
    if (!token) { router.replace("/auth/login"); return; }
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/tracking`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!d.success) { toast.error(d.message || "Booking not found"); router.back(); return; }
      setData(d.data);
      setStatus(d.data.booking.status);
      if (d.data.providerLocation?.lat && d.data.providerLocation?.lng) {
        setProviderLoc({ lat: d.data.providerLocation.lat, lng: d.data.providerLocation.lng });
        if (d.data.providerLocation.updatedAt) setLastUpdated(new Date(d.data.providerLocation.updatedAt));
      }
    } catch {
      toast.error("Could not load tracking info");
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  // Socket connection
  useEffect(() => {
    if (!user?.id) return;
    const socket = io(API, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join", user.id));

    socket.on("provider_location_update", ({ bookingId: bid, lat, lng }: any) => {
      if (bid !== bookingId) return;
      setProviderLoc({ lat, lng });
      setLastUpdated(new Date());
    });
    socket.on("booking_in_progress", ({ booking }: any) => {
      if (booking?.id === bookingId) setStatus("IN_PROGRESS");
    });
    socket.on("booking_completed", ({ booking }: any) => {
      if (booking?.id === bookingId) setStatus("COMPLETED");
    });
    socket.on("order_status_update", ({ booking, status: s }: any) => {
      if (booking?.id === bookingId) setStatus(s);
    });
    socket.on("provider_en_route", ({ booking }: any) => {
      if (booking?.id === bookingId) setStatus("EN_ROUTE");
    });
    socket.on("provider_arrived", ({ booking }: any) => {
      if (booking?.id === bookingId) setStatus("ARRIVED");
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id, bookingId]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const interval = setInterval(fetchTracking, 30_000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  // Tick every second so "Last ping" counter stays live
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-kazi-orange animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Loading tracking info…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { booking, provider, customer } = data;
  const statusInfo = STATUS_INFO[status] || { label: status, color: "bg-gray-400", desc: "" };
  const isFundi = provider.category === "FUNDI";

  const customerLatLng: [number, number] | null =
    booking.lat && booking.lng ? [booking.lat, booking.lng] : null;
  const providerLatLng: [number, number] | null =
    providerLoc ? [providerLoc.lat, providerLoc.lng] : null;
  const mapCenter: [number, number] = providerLatLng || customerLatLng || [-1.286389, 36.817223];

  const distanceKm =
    providerLatLng && customerLatLng
      ? haversineKm(providerLatLng[0], providerLatLng[1], customerLatLng[0], customerLatLng[1])
      : null;
  const etaMinutes = distanceKm != null ? Math.ceil((distanceKm / 30) * 60) : null;
  const trackingActive = ["EN_ROUTE", "ACCEPTED"].includes(status) && !!providerLatLng;

  return (
    <div className="min-h-screen bg-kazi-cream flex flex-col">
      {/* TOP BAR */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-kazi-dark" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-kazi-dark text-base leading-tight truncate">
            {isFundi ? "Track your Fundi" : `Track your ${provider.category?.toLowerCase()}`}
          </h1>
          <p className="text-xs text-gray-500 truncate">{booking.service?.name || "Service"}</p>
        </div>
        <button onClick={fetchTracking} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Navigation className="w-4 h-4 text-kazi-orange" />
        </button>
      </div>

      {/* STATUS BANNER */}
      <div className={`${statusInfo.color} text-white px-4 py-3 flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          {status === "COMPLETED"
            ? <CheckCircle className="w-5 h-5" />
            : <Loader2 className="w-5 h-5 animate-spin" />}
        </div>
        <div>
          <p className="font-black text-sm">{statusInfo.label}</p>
          <p className="text-xs text-white/80">{statusInfo.desc}</p>
        </div>
      </div>

      {/* MAP */}
      <div className="relative" style={{ height: "45vh" }}>
        {typeof window !== "undefined" && (
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            {/* CartoDB Positron — clean, modern look */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
            />

            {/* Dashed route between provider and customer */}
            {providerLatLng && customerLatLng && (
              <Polyline
                positions={[providerLatLng, customerLatLng]}
                color="#FF6B2B"
                weight={3}
                dashArray="10, 8"
                opacity={0.65}
              />
            )}

            {/* Customer / destination pin */}
            {customerLatLng && customerIcon && (
              <Marker position={customerLatLng} icon={customerIcon}>
                <Popup>
                  <div className="text-xs font-semibold">{booking.address}</div>
                  <div className="text-xs text-gray-400">Your location</div>
                </Popup>
              </Marker>
            )}

            {/* Provider moving pin */}
            {providerLatLng && providerIcon && (
              <Marker position={providerLatLng} icon={providerIcon}>
                <Popup>
                  <div className="text-xs font-semibold">{provider.businessName}</div>
                  <div className="text-xs text-gray-400">
                    {lastUpdated
                      ? `Updated ${Math.round((now - lastUpdated.getTime()) / 1000)}s ago`
                      : "Live location"}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Auto-pan when provider moves */}
            {providerLatLng && trackingActive && (
              <MapController center={providerLatLng} />
            )}
          </MapContainer>
        )}

        {/* Map legend */}
        {(providerLatLng || customerLatLng) && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-md text-[11px] font-semibold">
            {providerLatLng && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-kazi-orange border-2 border-white shadow-sm" />
                <span className="text-gray-700">{provider.businessName}</span>
              </div>
            )}
            {customerLatLng && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-700 border-2 border-white shadow-sm" />
                <span className="text-gray-700">Your location</span>
              </div>
            )}
          </div>
        )}

        {/* No location overlay */}
        {!providerLatLng && status === "EN_ROUTE" && (
          <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none z-10">
            <div className="bg-black/60 backdrop-blur text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Waiting for provider location…
            </div>
          </div>
        )}
      </div>

      {/* INFO CARD */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 px-4 pt-5 pb-8 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">

        {/* Distance + ETA row */}
        {distanceKm != null && status === "EN_ROUTE" && (
          <div className="flex gap-3">
            <div className="flex-1 bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-black text-blue-600">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Away</p>
            </div>
            <div className="flex-1 bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-black text-kazi-orange">
                {etaMinutes != null ? `~${etaMinutes} min` : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Est. arrival</p>
            </div>
            {lastUpdated && (
              <div className="flex-1 bg-green-50 rounded-2xl p-3 text-center">
                <p className="text-xl font-black text-kazi-green">
                  {Math.round((now - lastUpdated.getTime()) / 1000)}s
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Last ping</p>
              </div>
            )}
          </div>
        )}

        {/* Provider card */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-orange-50 overflow-hidden flex items-center justify-center flex-shrink-0 text-2xl">
            {provider.profileImage
              ? <img src={provider.profileImage} alt="provider" className="w-full h-full object-cover" />
              : CATEGORY_EMOJI[provider.category] || "🔧"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-kazi-dark text-sm">{provider.businessName}</p>
            <p className="text-xs text-gray-500">{provider.user?.name}</p>
            {trackingActive && (
              <span className="inline-flex items-center gap-1 text-[10px] text-kazi-green font-bold">
                <span className="w-1.5 h-1.5 bg-kazi-green rounded-full animate-pulse" />
                Location live
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {provider.user?.phone && (
              <a
                href={`tel:${provider.user.phone}`}
                className="w-10 h-10 rounded-xl bg-kazi-green/10 flex items-center justify-center hover:bg-kazi-green/20 transition-colors"
              >
                <Phone className="w-4 h-4 text-kazi-green" />
              </a>
            )}
            {provider.user?.id && (
              <Link
                href={`/chat/${provider.user.id}`}
                className="w-10 h-10 rounded-xl bg-kazi-orange/10 flex items-center justify-center hover:bg-kazi-orange/20 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-kazi-orange" />
              </Link>
            )}
          </div>
        </div>

        {/* Booking summary */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-kazi-orange flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{booking.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">
              {new Date(booking.scheduledDate).toLocaleDateString("en-KE", {
                weekday: "short", day: "numeric", month: "short",
              })} at {booking.scheduledTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{booking.service?.name || "Service"}</span>
            <span className="font-black text-kazi-orange">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </div>

        {/* Status timeline */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Journey</p>
          <div className="space-y-2">
            {(isFundi
              ? ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"]
              : ["ACCEPTED", "PREPARING", "READY", "COMPLETED"]
            ).map((s, i, arr) => {
              const statusOrder = arr.indexOf(status);
              const isDone    = arr.indexOf(s) <= statusOrder;
              const isCurrent = s === status;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${isDone ? "bg-kazi-orange" : "bg-gray-200"}`}>
                    {isDone && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm ${isCurrent ? "font-bold text-kazi-dark" : isDone ? "text-gray-600" : "text-gray-300"}`}>
                    {STATUS_INFO[s]?.label || s}
                    {isCurrent && <span className="ml-2 text-xs text-kazi-orange font-semibold">← Current</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review prompt on completion — uses provider.id not booking.id */}
        {status === "COMPLETED" && provider.id && (
          <Link
            href={`/business/${provider.id}`}
            className="block w-full py-3 bg-kazi-orange text-white font-bold text-sm text-center rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Leave a Review
          </Link>
        )}
      </div>
    </div>
  );
}
