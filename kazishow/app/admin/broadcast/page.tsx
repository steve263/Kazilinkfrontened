"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Megaphone, Users, ShoppingBag, Activity, CheckSquare,
  BarChart2, ClipboardCheck, Wallet, Shield, Scale, XCircle, ShieldAlert, Send,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TARGETS = [
  { value: "ALL_CUSTOMERS", label: "All Customers", description: "Send to everyone who has booked a service", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "ALL_PROVIDERS", label: "All Providers", description: "Send to all verified service providers", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "ALL_USERS",     label: "Everyone",      description: "Send to all active users (customers + providers)", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const NAV = [
  { label: "Overview",        href: "/admin",                 icon: BarChart2 },
  { label: "Approvals",       href: "/admin/approvals",       icon: ClipboardCheck },
  { label: "Providers",       href: "/admin/providers",       icon: CheckSquare },
  { label: "Users",           href: "/admin/users",           icon: Users },
  { label: "Bookings",        href: "/admin/bookings",        icon: ShoppingBag },
  { label: "Analytics",       href: "/admin/analytics",       icon: Activity },
  { label: "Withdrawals",     href: "/admin/withdrawals",     icon: Wallet },
  { label: "Trust & Safety",  href: "/admin/trust",           icon: Shield },
  { label: "Appeals",         href: "/admin/appeals",         icon: Scale },
  { label: "Cancellations",   href: "/admin/cancellations",   icon: XCircle },
  { label: "Broadcast",       href: "/admin/broadcast",       icon: Megaphone },
  { label: "Auto-Suspension", href: "/admin/auto-suspension", icon: ShieldAlert },
];

interface BroadcastResult {
  notificationsSent: number;
  smsSent: number;
  target: string;
}

export default function BroadcastPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("ALL_CUSTOMERS");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<BroadcastResult | null>(null);
  const [history, setHistory] = useState<Array<{ title: string; target: string; sent: number; date: string }>>([]);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const sendBroadcast = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!message.trim()) { toast.error("Message is required"); return; }
    if (message.trim().length > 160) { toast.error("Message too long (max 160 chars for SMS)"); return; }

    const targetLabel = TARGETS.find((t) => t.value === target)?.label || target;
    const confirmed = window.confirm(
      `Send "${title}" to ${targetLabel}?\n\nThis will send in-app notifications and SMS to all matching active users. This cannot be undone.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), target }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data.data);
        setHistory((prev) => [
          { title: title.trim(), target: targetLabel, sent: data.data.notificationsSent, date: new Date().toLocaleString("en-KE") },
          ...prev.slice(0, 9),
        ]);
        toast.success(`Broadcast sent to ${data.data.notificationsSent} users!`);
        setTitle("");
        setMessage("");
      } else {
        toast.error(data.message || "Broadcast failed");
      }
    } catch {
      toast.error("Network error — broadcast may not have sent");
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-kazi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream flex">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-kazi-dark flex-col hidden lg:flex">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kazi-orange rounded-xl flex items-center justify-center font-black text-white">K</div>
            <div>
              <p className="font-black text-white text-sm">KaziShow</p>
              <p className="text-xs text-white/40">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/broadcast" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-64 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
          <Link href="/admin" className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">Announcement Broadcast</h1>
              <p className="text-xs text-gray-400">Send in-app notifications and SMS to your users</p>
            </div>
          </div>
        </div>

        <div className="p-5 max-w-2xl mx-auto space-y-5">
          {/* Target selection */}
          <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
            <h2 className="font-black text-kazi-dark mb-3">Who to notify</h2>
            <div className="space-y-2">
              {TARGETS.map((t) => (
                <label key={t.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${target === t.value ? "border-kazi-orange bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <input
                    type="radio"
                    name="target"
                    value={t.value}
                    checked={target === t.value}
                    onChange={() => setTarget(t.value)}
                    className="mt-0.5 accent-kazi-orange"
                  />
                  <div>
                    <p className="font-bold text-kazi-dark text-sm">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message form */}
          <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100 space-y-4">
            <h2 className="font-black text-kazi-dark">Message content</h2>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Feature Available!"
                maxLength={80}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange"
              />
              <p className="text-xs text-gray-400 mt-1">{title.length}/80 characters</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Keep it short and clear. This is also sent as an SMS."
                maxLength={160}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange resize-none"
              />
              <p className={`text-xs mt-1 ${message.length > 140 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                {message.length}/160 characters (SMS limit)
              </p>
            </div>

            {/* Preview */}
            {(title || message) && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2">Preview</p>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="font-bold text-kazi-dark text-sm">{title || "Title…"}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{message || "Message…"}</p>
                </div>
              </div>
            )}

            <button
              onClick={sendBroadcast}
              disabled={loading || !title.trim() || !message.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-kazi-orange text-white font-black rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {loading ? "Sending…" : `Send to ${TARGETS.find((t) => t.value === target)?.label}`}
            </button>
          </div>

          {/* Last result */}
          {lastResult && (
            <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
              <p className="font-black text-green-800 mb-1">Broadcast sent successfully!</p>
              <div className="text-sm text-green-700 space-y-0.5">
                <p>In-app notifications: <span className="font-bold">{lastResult.notificationsSent.toLocaleString()}</span></p>
                <p>SMS queued: <span className="font-bold">{lastResult.smsSent.toLocaleString()}</span></p>
                <p>Target group: <span className="font-bold">{lastResult.target}</span></p>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
              <h2 className="font-black text-kazi-dark mb-3">Recent broadcasts (this session)</h2>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-semibold text-kazi-dark text-sm">{h.title}</p>
                      <p className="text-xs text-gray-400">{h.target} · {h.date}</p>
                    </div>
                    <span className="text-xs font-bold text-kazi-orange">{h.sent.toLocaleString()} sent</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
