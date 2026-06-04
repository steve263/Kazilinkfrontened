"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = [
  "Loading and Moving", "Cleaning", "Catering and Cooking", "Security",
  "Events and Hospitality", "Construction", "Driving", "Gardening",
  "Childcare", "Office Work", "Sales and Promotions", "Other",
];

const PAY_TYPES = ["per day", "per hour", "per week", "fixed price"];

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "", location: "", address: "",
    pay: "", payType: "per day", workersNeeded: "1",
    startDate: "", duration: "1 day", skills: "", requirements: "", isUrgent: false,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const totalPay  = parseFloat(form.pay || "0") * parseInt(form.workersNeeded || "1");
  const commission = Math.round(totalPay * 0.1);

  async function handleSubmit() {
    if (!form.title || !form.category || !form.description || !form.location || !form.pay || !form.startDate) {
      toast.error("Please fill all required fields");
      return;
    }
    const token = localStorage.getItem("kazishow_token") || "";
    if (!token) { router.push("/auth/login"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/jobs/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Job posted! 🎉");
        router.push(`/jobs/${data.data.id}`);
      } else {
        toast.error(data.message || "Failed to post job");
      }
    } catch {
      toast.error("Network error — please try again");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Toaster position="top-center" />

      <div className="bg-kazi-dark px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 mb-4 text-sm hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl">📢 Post a Job</h1>
        <p className="text-white/50 text-sm mt-1">Find workers fast — KaziShow takes 10% commission on payment</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">

        {/* Job details card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-kazi-dark text-base">Job Details</h3>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Need 5 loaders today — Mombasa Road"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Category *</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange bg-white transition-colors">
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Description *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the job. What workers will do, what to bring, dress code, tools needed, etc."
              rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Location / Area *</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Exact Address (optional)</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. ABC Warehouse, Gate 3, off Mombasa Road"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
          </div>
        </div>

        {/* Pay and schedule */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-kazi-dark text-base">Pay & Schedule</h3>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Pay (KSh) *</label>
              <input value={form.pay} onChange={(e) => set("pay", e.target.value)}
                placeholder="e.g. 1500" type="number" min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Pay Type</label>
              <select value={form.payType} onChange={(e) => set("payType", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange bg-white transition-colors">
                {PAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Workers Needed</label>
              <input value={form.workersNeeded} onChange={(e) => set("workersNeeded", e.target.value)}
                type="number" min="1" max="100"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Duration</label>
              <select value={form.duration} onChange={(e) => set("duration", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange bg-white transition-colors">
                {["Few hours", "Half day", "1 day", "2 days", "3 days", "1 week", "2 weeks", "1 month", "Ongoing"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Start Date *</label>
            <input value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
              type="datetime-local"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
          </div>

          {/* Commission breakdown */}
          {form.pay && (
            <div className="bg-orange-50 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment breakdown</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You pay workers</span>
                <span className="font-black text-kazi-dark">KSh {totalPay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">KaziShow commission (10%)</span>
                <span className="font-bold text-gray-500">KSh {commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-orange-200 pt-1.5 mt-1.5">
                <span className="font-bold text-gray-700">Workers receive</span>
                <span className="font-black text-green-600">KSh {(totalPay - commission).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Optional details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-kazi-dark text-base">Optional Details</h3>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Skills Required</label>
            <input value={form.skills} onChange={(e) => set("skills", e.target.value)}
              placeholder="e.g. Driving licence, forklift experience, cooking skills"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Requirements (one per line)</label>
            <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)}
              placeholder={"Must be physically fit\nMust have own safety boots\nMust be punctual"}
              rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange resize-none transition-colors" />
          </div>

          {/* Urgent toggle */}
          <button
            onClick={() => set("isUrgent", !form.isUrgent)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-colors ${
              form.isUrgent ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200 hover:border-red-200"
            }`}
          >
            <div className="text-left">
              <p className="font-black text-kazi-dark text-sm">🔴 Mark as URGENT</p>
              <p className="text-xs text-gray-400 mt-0.5">Urgent jobs appear at the top and attract workers faster</p>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.isUrgent ? "bg-red-500" : "bg-gray-300"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isUrgent ? "translate-x-6" : "translate-x-0"}`} />
            </div>
          </button>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-base disabled:opacity-60 active:scale-[0.98] transition-all shadow-lg shadow-orange-200">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Posting…
            </span>
          ) : "📢 Post Job Now"}
        </button>
      </div>
    </div>
  );
}
