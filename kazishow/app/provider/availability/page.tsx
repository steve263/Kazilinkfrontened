"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Calendar, Clock, Plus, X, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DAYS = [
  { key: "monday",    label: "Monday" },
  { key: "tuesday",   label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday",  label: "Thursday" },
  { key: "friday",    label: "Friday" },
  { key: "saturday",  label: "Saturday" },
  { key: "sunday",    label: "Sunday" },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

export default function AvailabilityPage() {
  const router = useRouter();
  const [avail, setAvail] = useState<any>({
    monday: true, tuesday: true, wednesday: true, thursday: true,
    friday: true, saturday: false, sunday: false,
    startTime: "08:00", endTime: "18:00", slotDuration: 60,
    breakStart: "", breakEnd: "",
  });
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [newExc, setNewExc]         = useState({ date: "", reason: "" });
  const [showAddExc, setShowAddExc] = useState(false);
  const [providerId, setProviderId] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("kazishow_user");
    if (!raw) return router.push("/auth/login");
    const user = JSON.parse(raw);
    if (user.role !== "PROVIDER") return router.push("/");
    const pid = user.provider?.id;
    if (!pid) { toast.error("Provider profile not found"); return; }
    setProviderId(pid);
    fetch(`${API}/api/providers/${pid}/schedule`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setAvail(d.data); setExceptions(d.data.exceptions || []); }
      })
      .catch(() => toast.error("Could not load schedule"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API}/api/providers/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(avail),
      });
      const d = await res.json();
      if (d.success) toast.success("Schedule saved! ✅");
      else toast.error(d.message);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const addException = async () => {
    if (!newExc.date) { toast.error("Select a date"); return; }
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API}/api/providers/schedule/exception`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: newExc.date, isAvailable: false, reason: newExc.reason || "Day off" }),
      });
      const d = await res.json();
      if (d.success) {
        setExceptions(prev => [...prev, d.data]);
        setNewExc({ date: "", reason: "" });
        setShowAddExc(false);
        toast.success("Day off added!");
      } else toast.error(d.message);
    } catch { toast.error("Failed to add day off"); }
  };

  const removeException = async (id: string) => {
    try {
      const token = localStorage.getItem("kazishow_token");
      await fetch(`${API}/api/providers/schedule/exception/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setExceptions(prev => prev.filter(e => e.id !== id));
      toast.success("Removed");
    } catch { toast.error("Failed to remove"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-center" />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white card-shadow">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-kazi-dark">📅 My Availability</h1>
            <p className="text-gray-500 text-sm">Control when customers can book you</p>
          </div>
        </div>

        {/* Working days */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <h2 className="font-bold text-kazi-dark mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-kazi-orange" /> Working Days
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {DAYS.map(day => (
              <button key={day.key}
                onClick={() => setAvail((p: any) => ({ ...p, [day.key]: !p[day.key] }))}
                className={`p-3 rounded-xl text-sm font-bold flex items-center justify-between transition-all ${
                  avail[day.key] ? "bg-kazi-orange text-white" : "bg-gray-100 text-gray-400"
                }`}>
                <span>{day.label}</span>
                <span>{avail[day.key] ? "✅" : "❌"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Working hours */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <h2 className="font-bold text-kazi-dark mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-kazi-orange" /> Working Hours
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: "Start Time", key: "startTime" },
              { label: "End Time",   key: "endTime" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">{label}</label>
                <select value={avail[key]}
                  onChange={e => setAvail((p: any) => ({ ...p, [key]: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange">
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Slot Duration</label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map(m => (
                <button key={m}
                  onClick={() => setAvail((p: any) => ({ ...p, slotDuration: m }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    avail.slotDuration === m ? "bg-kazi-orange text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                  {m < 60 ? `${m}min` : `${m / 60}hr`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: "Break Start", key: "breakStart" },
              { label: "Break End",   key: "breakEnd" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">{label} <span className="text-gray-300">(optional)</span></label>
                <select value={avail[key] || ""}
                  onChange={e => setAvail((p: any) => ({ ...p, [key]: e.target.value || null }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange">
                  <option value="">None</option>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Days off */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-kazi-dark">🏖️ Days Off</h2>
            <button onClick={() => setShowAddExc(true)}
              className="flex items-center gap-1 text-kazi-orange text-sm font-bold">
              <Plus className="w-4 h-4" /> Add Day Off
            </button>
          </div>

          {showAddExc && (
            <div className="bg-orange-50 rounded-xl p-4 mb-4 space-y-3">
              <input type="date" value={newExc.date}
                onChange={e => setNewExc(p => ({ ...p, date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange" />
              <input type="text" value={newExc.reason}
                onChange={e => setNewExc(p => ({ ...p, reason: e.target.value }))}
                placeholder="Reason e.g. Holiday, Sick day"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange" />
              <div className="flex gap-2">
                <button onClick={addException} className="flex-1 py-2.5 bg-kazi-orange text-white font-bold rounded-xl text-sm">Add</button>
                <button onClick={() => setShowAddExc(false)} className="px-4 py-2.5 bg-gray-100 text-gray-500 font-bold rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          {exceptions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No days off set yet.</p>
          ) : (
            <div className="space-y-2">
              {exceptions.map(exc => (
                <div key={exc.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-kazi-dark">
                      {new Date(exc.date).toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    {exc.reason && <p className="text-xs text-gray-400">{exc.reason}</p>}
                  </div>
                  <button onClick={() => removeException(exc.id)} className="text-red-400 hover:text-red-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all">
          {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Save Availability
        </button>
        <div className="pb-24" />
      </div>
      <BottomNav />
    </div>
  );
}
