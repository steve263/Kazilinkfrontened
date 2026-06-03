"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Mail, MessageCircle,
  Clock, Briefcase, Send, ChevronLeft, ChevronRight,
  RefreshCw,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_COLOR: Record<string, string> = {
  PENDING:     "bg-amber-100 text-amber-700",
  ACCEPTED:    "bg-green-100 text-green-700",
  EN_ROUTE:    "bg-cyan-100 text-cyan-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  PREPARING:   "bg-orange-100 text-orange-700",
  READY:       "bg-teal-100 text-teal-700",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function AdminSchedulePage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [customMsg, setCustomMsg] = useState("");

  useEffect(() => {
    if (ready) setToken(getAdminToken());
  }, [ready]);

  const fetchSchedule = useCallback(async (t: string, date: string) => {
    if (!t) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/schedule?date=${date}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = await res.json();
      if (d.success) setData(d.data);
      else toast.error("Failed to load schedule");
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) fetchSchedule(token, selectedDate);
  }, [token, selectedDate, fetchSchedule]);

  function changeDate(date: string) {
    setSelectedDate(date);
  }
  function prevDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    changeDate(d.toISOString().split("T")[0]);
  }
  function nextDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    changeDate(d.toISOString().split("T")[0]);
  }

  function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }
  function fmtTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("en-KE", {
      hour: "2-digit", minute: "2-digit",
    });
  }

  function buildDefaultMsg(name: string, bookings: any[]) {
    const dateLabel = fmtDate(selectedDate);
    const list = bookings
      .map((b) => `${b.service?.name || "Service"} for ${b.customer?.name || "Customer"} at ${fmtTime(b.scheduledDate)}`)
      .join(", ");
    return `Hello ${name}! This is a reminder from KaziShow. You have ${bookings.length} booking(s) on ${dateLabel}: ${list}. Please prepare and be ready on time. Thank you! kazishow.co.ke`;
  }

  function openWhatsApp(phone: string, message: string) {
    const cleaned = phone.replace(/\s/g, "").replace(/^\+/, "").replace(/^0/, "254");
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, "_blank");
  }
  function openEmail(email: string, body: string) {
    const subject = `KaziShow Booking Reminder — ${fmtDate(selectedDate)}`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  }

  async function sendSMS(phone: string, message: string, providerId: string) {
    setSendingTo(providerId);
    try {
      const res = await fetch(`${API}/api/admin/schedule/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerPhone: phone, message, method: "sms" }),
      });
      const d = await res.json();
      if (d.success) toast.success("SMS sent!");
      else toast.error(d.message || "SMS failed");
    } catch {
      toast.error("Network error");
    }
    setSendingTo(null);
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Toaster position="top-right" />

      {/* Top bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-kazi-orange" />
              Provider Schedule
            </h1>
            <p className="text-slate-400 text-xs">See who is booked and send reminders</p>
          </div>
        </div>
        <button
          onClick={() => fetchSchedule(token, selectedDate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Date picker card ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
          {/* Quick buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex gap-2">
              {[
                { label: "Today",    val: todayStr()    },
                { label: "Tomorrow", val: tomorrowStr() },
              ].map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => changeDate(val)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    selectedDate === val
                      ? "bg-kazi-orange text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Arrow + date input */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevDay}
                className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => changeDate(e.target.value)}
                className="px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl text-sm font-bold focus:outline-none focus:border-kazi-orange transition-colors"
              />
              <button
                onClick={nextDay}
                className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>

          {/* Summary banner */}
          <div className="bg-slate-900 dark:bg-slate-700 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white font-black text-base">{fmtDate(selectedDate)}</p>
              <p className="text-white/50 text-xs mt-0.5">
                {loading ? "Loading…" : `${data?.totalBookings ?? 0} bookings across ${data?.totalProviders ?? 0} providers`}
              </p>
            </div>
            <div className="flex gap-5">
              <div className="text-center">
                <p className="text-kazi-orange font-black text-2xl">{data?.totalBookings ?? 0}</p>
                <p className="text-white/40 text-xs">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-white font-black text-2xl">{data?.totalProviders ?? 0}</p>
                <p className="text-white/40 text-xs">Providers</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading spinner ── */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && (data?.totalBookings ?? 0) === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-4">📅</div>
            <p className="font-black text-slate-700 dark:text-white text-lg">No bookings on this day</p>
            <p className="text-slate-400 text-sm mt-2">No providers scheduled for {fmtDate(selectedDate)}</p>
          </div>
        )}

        {/* ── Provider cards ── */}
        {!loading && (data?.providers ?? []).map((item: any) => {
          const provider = item.provider;
          const bookings = item.bookings;
          const name    = provider?.businessName || provider?.user?.name || "Provider";
          const phone   = provider?.user?.phone || "";
          const email   = provider?.user?.email || "";
          const defMsg  = buildDefaultMsg(name, bookings);

          return (
            <div key={provider.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">

              {/* Provider header */}
              <div className="bg-slate-900 dark:bg-slate-700 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-kazi-orange rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{name}</p>
                    <p className="text-white/50 text-xs">
                      {phone} · {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => openWhatsApp(phone, defMsg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>

                  {email && (
                    <button
                      onClick={() => openEmail(email, defMsg)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  )}

                  <button
                    onClick={() => sendSMS(phone, defMsg, provider.id)}
                    disabled={sendingTo === provider.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-kazi-orange hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-60"
                  >
                    {sendingTo === provider.id ? (
                      <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin inline-block" /> Sending…</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> SMS</>
                    )}
                  </button>

                  <button
                    onClick={() => { setModal({ provider, name, phone, email, bookings, defMsg }); setCustomMsg(""); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    ✏️ Custom
                  </button>
                </div>
              </div>

              {/* Booking rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {bookings.map((b: any) => (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-kazi-orange" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">
                          {b.service?.name || "Service"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          Customer: {b.customer?.name || "Unknown"}
                          {b.customer?.phone ? ` · ${b.customer.phone}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3" />
                          {fmtTime(b.scheduledDate)}
                        </div>
                        {b.totalAmount > 0 && (
                          <p className="text-xs font-bold text-kazi-orange mt-0.5">
                            KSh {b.totalAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] || "bg-slate-100 text-slate-600"}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Default message preview */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Default reminder:</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{defMsg}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Custom message modal ── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 dark:text-white text-lg">✏️ Custom Message</h3>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              To: <strong className="text-slate-700 dark:text-white">{modal.name}</strong> · {modal.phone}
            </p>

            <textarea
              value={customMsg || modal.defMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl text-sm focus:outline-none focus:border-kazi-orange transition-colors resize-none mb-4"
            />

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  openWhatsApp(modal.phone, customMsg || modal.defMsg);
                  setModal(null);
                }}
                className="py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>

              {modal.email ? (
                <button
                  onClick={() => {
                    openEmail(modal.email, customMsg || modal.defMsg);
                    setModal(null);
                  }}
                  className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => {
                  sendSMS(modal.phone, customMsg || modal.defMsg, modal.provider.id);
                  setModal(null);
                }}
                className="py-3 bg-kazi-orange hover:bg-orange-600 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-4 h-4" /> SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
