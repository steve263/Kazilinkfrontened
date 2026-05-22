"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Settings, Users, ShoppingBag, Activity, CheckSquare,
  BarChart2, ClipboardCheck, Wallet, Shield, Scale, XCircle, Megaphone,
  ShieldAlert, CreditCard, BadgeCheck, Save, AlertTriangle, RefreshCw, Gavel,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAdminGuard, getAdminToken } from "@/middleware/adminGuard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEFAULT_SETTINGS = {
  commissionRate: 10,
  cashCommissionRate: 5,
  trialDays: 30,
  starterPrice: 999,
  growthPrice: 2499,
  premiumPrice: 4999,
  maxBookingsPerDay: 10,
  autoCancelHours: 24,
  autoReleaseHours: 48,
  cancellationRefundHours: 12,
  maintenanceMode: false,
  newRegistrationsOpen: true,
  appName: "KaziShow",
  supportPhone: "",
  supportPhone2: "",
  supportEmail: "",
  whatsappNumber: "",
  smsEnabled: true,
  smsWelcomeMessage: "Welcome to KaziShow! Find trusted home services near you.",
  pushEnabled: true,
  emailEnabled: false,
  defaultCity: "Nairobi",
  defaultCountry: "Kenya",
  currency: "KSh",
};

const NAV = [
  { label: "Overview",        href: "/admin",                 icon: BarChart2 },
  { label: "Approvals",       href: "/admin/approvals",       icon: ClipboardCheck },
  { label: "Verification",    href: "/admin/verification",    icon: BadgeCheck },
  { label: "Providers",       href: "/admin/providers",       icon: CheckSquare },
  { label: "Users",           href: "/admin/users",           icon: Users },
  { label: "Bookings",        href: "/admin/bookings",        icon: ShoppingBag },
  { label: "Analytics",       href: "/admin/analytics",       icon: Activity },
  { label: "Withdrawals",     href: "/admin/withdrawals",     icon: Wallet },
  { label: "Trust & Safety",  href: "/admin/trust",           icon: Shield },
  { label: "Appeals",         href: "/admin/appeals",         icon: Scale },
  { label: "Disputes",        href: "/admin/disputes",        icon: Gavel },
  { label: "Cancellations",   href: "/admin/cancellations",   icon: XCircle },
  { label: "Subscriptions",   href: "/admin/subscriptions",   icon: CreditCard },
  { label: "Broadcast",       href: "/admin/broadcast",       icon: Megaphone },
  { label: "Auto-Suspension", href: "/admin/auto-suspension", icon: ShieldAlert },
  { label: "Settings",        href: "/admin/settings",        icon: Settings },
];

const SECTIONS = [
  { key: "commission",    label: "Commission",     emoji: "💰" },
  { key: "subscription",  label: "Subscription",   emoji: "💳" },
  { key: "booking",       label: "Booking Rules",  emoji: "📅" },
  { key: "contact",       label: "Contact Info",   emoji: "📞" },
  { key: "notifications", label: "Notifications",  emoji: "🔔" },
  { key: "app",           label: "App Control",    emoji: "⚙️" },
];

interface AppSettingsData {
  commissionRate: number;
  cashCommissionRate: number;
  trialDays: number;
  starterPrice: number;
  growthPrice: number;
  premiumPrice: number;
  maxBookingsPerDay: number;
  autoCancelHours: number;
  autoReleaseHours: number;
  cancellationRefundHours: number;
  maintenanceMode: boolean;
  newRegistrationsOpen: boolean;
  appName: string;
  supportPhone: string;
  supportPhone2: string;
  supportEmail: string;
  whatsappNumber: string;
  smsEnabled: boolean;
  smsWelcomeMessage: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  defaultCity: string;
  defaultCountry: string;
  currency: string;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-14 h-7 rounded-full transition-all shrink-0 ${value ? "bg-kazi-orange" : "bg-gray-200"}`}>
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? "left-8" : "left-1"}`} />
    </button>
  );
}

function NumInput({ value, onChange, min, max, prefix, suffix }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; prefix?: string; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shrink-0">
      {prefix && <span className="text-gray-500 text-sm font-semibold">{prefix}</span>}
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 text-kazi-dark font-black text-lg focus:outline-none bg-transparent" />
      {suffix && <span className="text-gray-500 text-sm font-semibold">{suffix}</span>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const ready = useAdminGuard();
  const [token, setToken] = useState("");
  const [settings, setSettings] = useState<AppSettingsData | null>(null);
  const [original, setOriginal] = useState<AppSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("commission");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { if (ready) setToken(getAdminToken()); }, [ready]);

  const fetchSettings = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/settings`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        const merged = { ...DEFAULT_SETTINGS, ...data.data };
        setSettings(merged);
        setOriginal(merged);
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Settings fetch error:", msg);
      // Only toast on auth/server errors, not 404 (route not yet deployed)
      if (!msg.includes("404")) toast.error("Could not load settings. Using defaults.");
      setSettings({ ...DEFAULT_SETTINGS });
      setOriginal({ ...DEFAULT_SETTINGS });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) fetchSettings(token); }, [token, fetchSettings]);

  const update = (key: keyof AppSettingsData, value: unknown) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Settings saved successfully!");
        setOriginal({ ...settings });
        setHasChanges(false);
      } else {
        toast.error("Failed to save: " + (data.message || "Unknown error"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Save error:", msg);
      toast.error("Network error saving settings: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset to last saved settings?")) { setSettings(original); setHasChanges(false); }
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

      {/* Admin Sidebar */}
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${href === "/admin/settings" ? "bg-kazi-orange text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
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
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-kazi-dark">App Settings</h1>
              <p className="text-xs text-gray-400">Control all KaziShow settings from here</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-amber-600 text-xs font-bold">Unsaved</span>
              </div>
            )}
            <button onClick={handleReset} disabled={!hasChanges}
              className="px-3 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm disabled:opacity-40 hover:bg-gray-200 transition-colors">
              Reset
            </button>
            <button onClick={handleSave} disabled={saving || !hasChanges}
              className="flex items-center gap-1.5 px-4 py-2 bg-kazi-orange text-white font-black rounded-xl text-sm disabled:opacity-60 hover:bg-orange-600 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {loading || !settings ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 max-w-5xl mx-auto">

            {/* Maintenance warning */}
            {settings.maintenanceMode && (
              <div className="mb-5 bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <p className="font-black text-red-600">🚨 Maintenance Mode is ON</p>
                  <p className="text-red-500 text-sm">The app is currently offline for all users. Turn it off if this is not intended.</p>
                </div>
              </div>
            )}

            <div className="flex gap-5">

              {/* Section navigation */}
              <div className="w-44 shrink-0">
                <div className="bg-white rounded-2xl card-shadow overflow-hidden sticky top-24">
                  {SECTIONS.map((s) => (
                    <button key={s.key} onClick={() => setSection(s.key)}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-left transition-all border-b border-gray-50 last:border-0 ${section === s.key ? "bg-kazi-orange text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                      <span>{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section content */}
              <div className="flex-1 min-w-0">

                {/* ── COMMISSION ── */}
                {section === "commission" && (
                  <div className="bg-white rounded-2xl card-shadow p-6 space-y-5">
                    <div>
                      <h2 className="font-black text-kazi-dark text-xl mb-1">💰 Commission Settings</h2>
                      <p className="text-gray-400 text-sm">How much KaziShow takes from provider payments</p>
                    </div>
                    {[
                      {
                        key: "commissionRate" as const,
                        label: "M-Pesa Commission Rate",
                        desc: "KaziShow's cut from M-Pesa payments received by the provider",
                        preview: `KSh 2,000 job → KaziShow KSh ${Math.round(2000 * settings.commissionRate / 100)}, Provider KSh ${2000 - Math.round(2000 * settings.commissionRate / 100)}`,
                        suffix: "%", min: 0, max: 50,
                      },
                      {
                        key: "cashCommissionRate" as const,
                        label: "Cash Commission Rate",
                        desc: "Percentage provider pays after a cash job",
                        preview: `KSh 2,000 cash → Provider pays KaziShow KSh ${Math.round(2000 * settings.cashCommissionRate / 100)}`,
                        suffix: "%", min: 0, max: 50,
                      },
                    ].map(({ key, label, desc, preview, suffix, min, max }) => (
                      <div key={key} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="font-bold text-kazi-dark">{label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                          <p className="text-kazi-orange text-xs font-bold mt-1">{preview}</p>
                        </div>
                        <NumInput value={settings[key]} onChange={(v) => update(key, v)} min={min} max={max} suffix={suffix} />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── SUBSCRIPTION ── */}
                {section === "subscription" && (
                  <div className="bg-white rounded-2xl card-shadow p-6 space-y-5">
                    <div>
                      <h2 className="font-black text-kazi-dark text-xl mb-1">💳 Subscription Settings</h2>
                      <p className="text-gray-400 text-sm">Business subscription plans and trial period</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-kazi-dark">Free Trial Period</p>
                        <p className="text-gray-400 text-xs mt-0.5">How many days new businesses get for free</p>
                      </div>
                      <NumInput value={settings.trialDays} onChange={(v) => update("trialDays", v)} min={1} max={90} suffix="days" />
                    </div>
                    <p className="font-bold text-kazi-dark text-sm">Plan Prices (per month)</p>
                    {[
                      { key: "starterPrice" as const, emoji: "🌱", label: "Starter Plan", desc: "Basic listing and bookings", color: "bg-green-50 border-green-200", textColor: "text-green-700", descColor: "text-green-600" },
                      { key: "growthPrice"  as const, emoji: "🚀", label: "Growth Plan",  desc: "Featured in search results", color: "bg-orange-50 border-orange-200", textColor: "text-kazi-orange", descColor: "text-orange-500" },
                      { key: "premiumPrice" as const, emoji: "👑", label: "Premium Plan", desc: "Top position + promotion",   color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", descColor: "text-purple-500" },
                    ].map(({ key, emoji, label, desc, color, textColor, descColor }) => (
                      <div key={key} className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${color}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{emoji}</span>
                          <div>
                            <p className={`font-bold ${textColor}`}>{label}</p>
                            <p className={`text-xs ${descColor}`}>{desc}</p>
                          </div>
                        </div>
                        <NumInput value={settings[key]} onChange={(v) => update(key, v)} min={100} max={10000} prefix="KSh" />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── BOOKING RULES ── */}
                {section === "booking" && (
                  <div className="bg-white rounded-2xl card-shadow p-6 space-y-5">
                    <div>
                      <h2 className="font-black text-kazi-dark text-xl mb-1">📅 Booking Rules</h2>
                      <p className="text-gray-400 text-sm">Control booking behaviour and time limits</p>
                    </div>
                    {[
                      { key: "autoCancelHours" as const,          label: "Auto Cancel",          desc: "Cancel PENDING bookings if provider doesn't accept within X hours",                    suffix: "hrs", min: 1, max: 72 },
                      { key: "autoReleaseHours" as const,         label: "Payment Auto Release", desc: "Auto-complete job if customer doesn't confirm within X hours after provider marks done", suffix: "hrs", min: 1, max: 72 },
                      { key: "cancellationRefundHours" as const,  label: "Full Refund Window",   desc: "Customer gets full refund if they cancel X hours before the booking",                  suffix: "hrs", min: 1, max: 48 },
                    ].map(({ key, label, desc, suffix, min, max }) => (
                      <div key={key} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="font-bold text-kazi-dark">{label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                        </div>
                        <NumInput value={settings[key]} onChange={(v) => update(key, v)} min={min} max={max} suffix={suffix} />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CONTACT INFO ── */}
                {section === "contact" && (
                  <div className="bg-white rounded-2xl card-shadow p-6 space-y-4">
                    <div>
                      <h2 className="font-black text-kazi-dark text-xl mb-1">📞 Contact Information</h2>
                      <p className="text-gray-400 text-sm">Support contact details shown to users</p>
                    </div>
                    {[
                      { key: "supportPhone"  as const, label: "📱 Support Phone 1",      placeholder: "07XX XXX XXX" },
                      { key: "supportPhone2" as const, label: "📱 Support Phone 2",      placeholder: "07XX XXX XXX" },
                      { key: "whatsappNumber" as const, label: "💬 WhatsApp Number",     placeholder: "07XX XXX XXX" },
                      { key: "supportEmail"  as const, label: "📧 Support Email",        placeholder: "support@kazishow.co.ke" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">{label}</label>
                        <input type="text" value={settings[key]} onChange={(e) => update(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">📱 Welcome SMS Message</label>
                      <textarea value={settings.smsWelcomeMessage} onChange={(e) => update("smsWelcomeMessage", e.target.value)}
                        placeholder="Welcome to KaziShow…" rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange resize-none" />
                      <p className="text-xs text-gray-400 mt-1">{settings.smsWelcomeMessage?.length || 0}/160 characters</p>
                    </div>
                  </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {section === "notifications" && (
                  <div className="bg-white rounded-2xl card-shadow p-6 space-y-4">
                    <div>
                      <h2 className="font-black text-kazi-dark text-xl mb-1">🔔 Notification Settings</h2>
                      <p className="text-gray-400 text-sm">Control which notification channels are active</p>
                    </div>
                    {[
                      { key: "smsEnabled"   as const, emoji: "📱", label: "SMS Notifications",   desc: "Send SMS via Africa's Talking" },
                      { key: "pushEnabled"  as const, emoji: "🔔", label: "Push Notifications",  desc: "Send push notifications via Firebase" },
                      { key: "emailEnabled" as const, emoji: "📧", label: "Email Notifications", desc: "Send emails via Resend" },
                    ].map(({ key, emoji, label, desc }) => (
                      <div key={key} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{emoji}</span>
                          <div>
                            <p className="font-bold text-kazi-dark">{label}</p>
                            <p className="text-gray-400 text-xs">{desc}</p>
                          </div>
                        </div>
                        <Toggle value={settings[key]} onChange={(v) => update(key, v)} />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── APP CONTROL ── */}
                {section === "app" && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl card-shadow p-6 space-y-4">
                      <div>
                        <h2 className="font-black text-kazi-dark text-xl mb-1">⚙️ App Control</h2>
                        <p className="text-gray-400 text-sm">Control app availability and registration</p>
                      </div>

                      {/* Maintenance mode */}
                      <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border-2 ${settings.maintenanceMode ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🚨</span>
                          <div>
                            <p className={`font-bold ${settings.maintenanceMode ? "text-red-600" : "text-kazi-dark"}`}>Maintenance Mode</p>
                            <p className={`text-xs mt-0.5 ${settings.maintenanceMode ? "text-red-500" : "text-gray-400"}`}>
                              {settings.maintenanceMode ? "⚠️ App is OFFLINE for all users!" : "Take app offline for maintenance"}
                            </p>
                          </div>
                        </div>
                        <Toggle value={settings.maintenanceMode} onChange={(v) => {
                          if (v && !window.confirm("Turn on maintenance mode?\n\nAll users will see an offline message and cannot use the app!")) return;
                          update("maintenanceMode", v);
                        }} />
                      </div>

                      {/* New registrations */}
                      <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">👥</span>
                          <div>
                            <p className="font-bold text-kazi-dark">New Registrations</p>
                            <p className="text-gray-400 text-xs">Allow new users to sign up on KaziShow</p>
                          </div>
                        </div>
                        <Toggle value={settings.newRegistrationsOpen} onChange={(v) => update("newRegistrationsOpen", v)} />
                      </div>

                      {/* App info */}
                      <div className="space-y-3 pt-2">
                        <p className="font-bold text-kazi-dark text-sm">App Information</p>
                        {[
                          { key: "appName"     as const, label: "App Name" },
                          { key: "defaultCity" as const, label: "Default City" },
                          { key: "currency"    as const, label: "Currency Symbol" },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="text-xs font-bold text-gray-400 block mb-1">{label}</label>
                            <input type="text" value={settings[key]} onChange={(e) => update(key, e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-kazi-orange" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="bg-white rounded-2xl card-shadow p-6">
                      <p className="font-black text-red-600 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Danger Zone
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => { if (window.confirm(`Send test SMS to ${settings.supportPhone}?`)) toast.success(`Test SMS sent to ${settings.supportPhone}`); }}
                          className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                          📱 Send Test SMS
                        </button>
                        <button
                          onClick={() => { if (window.confirm("Clear all expired notifications from database?")) toast.success("Expired notifications cleared"); }}
                          className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                          🗑️ Clear Old Notifications
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating save bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-kazi-dark rounded-2xl px-6 py-3 flex items-center gap-4 shadow-2xl z-50">
          <p className="text-white text-sm font-semibold">You have unsaved changes</p>
          <button onClick={handleReset} className="text-white/60 text-sm font-bold hover:text-white transition-colors">Reset</button>
          <button onClick={handleSave} disabled={saving}
            className="bg-kazi-orange text-white font-black px-5 py-2 rounded-xl text-sm disabled:opacity-60 hover:bg-orange-600 transition-colors">
            {saving ? "Saving…" : "💾 Save Now"}
          </button>
        </div>
      )}
    </div>
  );
}
