"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Star, Clock, Users,
  Briefcase, UserCheck, ChevronRight, Zap, Filter,
  TrendingUp, Award, CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const WORK_CATEGORIES = [
  { label: "All", emoji: "🔍" },
  { label: "Loading", emoji: "📦" },
  { label: "Cleaning", emoji: "🧹" },
  { label: "Security", emoji: "🛡️" },
  { label: "Catering", emoji: "🍽️" },
  { label: "Events", emoji: "🎪" },
  { label: "Construction", emoji: "🏗️" },
  { label: "Driving", emoji: "🚗" },
  { label: "Gardening", emoji: "🌿" },
  { label: "Office", emoji: "💼" },
  { label: "Sales", emoji: "📣" },
];

const JOB_CATEGORIES = [
  { label: "All", emoji: "🔍" },
  { label: "Loading and Moving", emoji: "📦" },
  { label: "Cleaning", emoji: "🧹" },
  { label: "Catering and Cooking", emoji: "🍽️" },
  { label: "Security", emoji: "🛡️" },
  { label: "Events and Hospitality", emoji: "🎪" },
  { label: "Construction", emoji: "🏗️" },
  { label: "Driving", emoji: "🚗" },
  { label: "Gardening", emoji: "🌿" },
  { label: "Office Work", emoji: "💼" },
  { label: "Sales and Promotions", emoji: "📣" },
];

const CATEGORY_GRADIENT: Record<string, string> = {
  "Loading and Moving":      "from-blue-500 to-blue-600",
  "Cleaning":                "from-green-500 to-teal-500",
  "Security":                "from-slate-600 to-slate-700",
  "Catering and Cooking":    "from-orange-500 to-red-500",
  "Events and Hospitality":  "from-purple-500 to-purple-600",
  "Construction":            "from-yellow-500 to-orange-500",
  "Driving":                 "from-blue-600 to-indigo-600",
  "Gardening":               "from-green-600 to-teal-600",
  "Office Work":             "from-indigo-500 to-blue-500",
  "Sales and Promotions":    "from-pink-500 to-rose-500",
  "Other":                   "from-gray-500 to-gray-600",
};

const SKILL_COLORS = [
  "bg-orange-50 text-orange-600 border-orange-100",
  "bg-blue-50 text-blue-600 border-blue-100",
  "bg-green-50 text-green-600 border-green-100",
  "bg-purple-50 text-purple-600 border-purple-100",
  "bg-pink-50 text-pink-600 border-pink-100",
];

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function JobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"workers" | "jobs">("jobs");
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const fetchWorkers = useCallback(async (s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("skills", category);
      if (s) params.set("search", s);
      const res = await fetch(`${API}/api/jobs/workers/all?${params}`);
      const data = await res.json();
      if (data.success) setWorkers(data.data);
    } catch {}
    setLoading(false);
  }, [category]);

  const fetchJobs = useCallback(async (s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (s) params.set("search", s);
      const res = await fetch(`${API}/api/jobs?${params}`);
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch {}
    setLoading(false);
  }, [category]);

  useEffect(() => {
    if (activeTab === "workers") fetchWorkers();
    else fetchJobs();
  }, [activeTab, category, fetchWorkers, fetchJobs]);

  function switchTab(tab: "workers" | "jobs") {
    setActiveTab(tab);
    setCategory("All");
    setSearch("");
  }

  const categories = activeTab === "workers" ? WORK_CATEGORIES : JOB_CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Navbar />

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="bg-kazi-dark relative overflow-hidden pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-kazi-orange/10" />
          <div className="absolute top-20 -right-20 w-48 h-48 rounded-full bg-kazi-orange/5" />
          <div className="absolute -bottom-8 left-10 w-32 h-32 rounded-full bg-white/5" />
        </div>

        <div className="relative px-4 pt-5 pb-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-kazi-orange text-xs font-black uppercase tracking-widest mb-1">KaziShow Jobs</p>
              <h1 className="text-white font-black text-3xl leading-tight">
                {activeTab === "jobs" ? "Find Your\nNext Job" : "Hire Top\nWorkers"}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {activeTab === "jobs"
                  ? "Browse verified job opportunities in Kenya"
                  : "Connect with skilled workers near you"}
              </p>
            </div>
            <div className="bg-kazi-orange/20 border border-kazi-orange/30 rounded-2xl px-3 py-2 text-center min-w-[64px]">
              <p className="text-kazi-orange font-black text-xl leading-none">
                {activeTab === "jobs" ? jobs.length : workers.length}
              </p>
              <p className="text-white/50 text-[10px] mt-0.5">
                {activeTab === "jobs" ? "Jobs" : "Workers"}
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => router.push(activeTab === "workers" ? "/jobs/worker/register" : "/jobs/post")}
              className="flex-1 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40 active:scale-[0.97] transition-transform"
            >
              {activeTab === "workers"
                ? <><UserCheck className="w-4 h-4" /> Register as Worker</>
                : <><Briefcase className="w-4 h-4" /> Post a Job</>
              }
            </button>
            <button
              onClick={() => router.push(activeTab === "workers" ? "/jobs/my-applications" : "/jobs/employer")}
              className="px-4 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-2xl text-sm flex items-center gap-1.5 active:scale-[0.97] transition-transform whitespace-nowrap"
            >
              {activeTab === "workers" ? "My Apps" : "Dashboard"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 rounded-2xl p-1 flex gap-1">
            {[
              { id: "jobs" as const,    label: "Find Jobs",    emoji: "📋" },
              { id: "workers" as const, label: "Find Workers", emoji: "👷" },
            ].map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === id
                    ? "bg-white text-kazi-dark shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search + Filter ──────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (activeTab === "workers" ? fetchWorkers(search) : fetchJobs(search))}
            placeholder={activeTab === "workers" ? "Search by name or skill…" : "Search jobs by title or location…"}
            className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange focus:bg-white transition-all"
          />
          <button
            onClick={() => activeTab === "workers" ? fetchWorkers(search) : fetchJobs(search)}
            className="absolute right-2 top-2 w-8 h-8 bg-kazi-orange rounded-xl flex items-center justify-center"
          >
            <Search className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* ── Category Pills ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar">
          {categories.map(({ label, emoji }) => (
            <button
              key={label}
              onClick={() => setCategory(label)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                category === label
                  ? "bg-kazi-orange text-white shadow-md shadow-orange-200"
                  : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-kazi-orange"
              }`}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-4 max-w-2xl mx-auto">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Finding {activeTab === "jobs" ? "jobs" : "workers"}…</p>
          </div>
        ) : (
          <>
            {/* ── JOBS TAB ── */}
            {activeTab === "jobs" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-500 text-sm font-semibold">
                    <span className="text-kazi-dark font-black">{jobs.length}</span> job{jobs.length !== 1 ? "s" : ""} found
                  </p>
                  {jobs.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-kazi-orange font-bold">
                      <TrendingUp className="w-3 h-3" /> Live listings
                    </div>
                  )}
                </div>

                {jobs.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="font-black text-kazi-dark text-xl">No jobs yet</p>
                    <p className="text-gray-400 text-sm mt-2 mb-6">Be the first to post a job!</p>
                    <button onClick={() => router.push("/jobs/post")} className="px-8 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm shadow-lg shadow-orange-200">
                      Post First Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => <JobCard key={job.id} job={job} router={router} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── WORKERS TAB ── */}
            {activeTab === "workers" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-500 text-sm font-semibold">
                    <span className="text-kazi-dark font-black">{workers.length}</span> worker{workers.length !== 1 ? "s" : ""} available
                  </p>
                  {workers.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Ready to hire
                    </div>
                  )}
                </div>

                {workers.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">👷</div>
                    <p className="font-black text-kazi-dark text-xl">No workers yet</p>
                    <p className="text-gray-400 text-sm mt-2 mb-6">Be the first worker on KaziShow!</p>
                    <button onClick={() => router.push("/jobs/worker/register")} className="px-8 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm shadow-lg shadow-orange-200">
                      Register as Worker
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workers.map((worker) => <WorkerCard key={worker.id} worker={worker} router={router} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ── JOB CARD ──────────────────────────────────────────────────────────────────
function JobCard({ job, router }: { job: any; router: any }) {
  const spotsLeft   = job.workersNeeded - job.workersHired;
  const isFull      = spotsLeft <= 0;
  const companyName = job.employer?.employerProfile?.companyName || "Private";
  const gradient    = CATEGORY_GRADIENT[job.category] || "from-kazi-orange to-orange-600";

  return (
    <div
      onClick={() => router.push(`/jobs/${job.id}`)}
      className={`bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-xl transition-all active:scale-[0.99] border border-gray-100 ${isFull ? "opacity-70" : ""}`}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${gradient} p-5 relative overflow-hidden`}>
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-8 right-8 w-14 h-14 rounded-full bg-white/10 pointer-events-none" />

        {job.isUrgent && (
          <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> URGENT
          </div>
        )}

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/25 backdrop-blur rounded-2xl flex items-center justify-center font-black text-white text-xl border border-white/30 flex-shrink-0">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-black text-base leading-tight">{companyName}</p>
              <p className="text-white/70 text-xs">{job.category}</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-2xl px-3 py-2 text-right border border-white/30 flex-shrink-0">
            <p className="text-white font-black text-lg leading-none">KSh {job.pay?.toLocaleString()}</p>
            <p className="text-white/70 text-xs mt-0.5">{job.payType}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-black text-kazi-dark text-lg leading-tight mb-1.5">{job.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">{job.description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="flex items-center gap-1 bg-gray-50 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-100">
            <MapPin className="w-3 h-3 text-kazi-orange" /> {job.location}
          </span>
          <span className="flex items-center gap-1 bg-gray-50 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-100">
            <Clock className="w-3 h-3 text-kazi-orange" />
            {new Date(job.startDate).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>

        {/* Spots bar */}
        <div className={`rounded-2xl p-3 mb-3 ${
          isFull ? "bg-red-50 border border-red-100"
          : spotsLeft <= 2 ? "bg-amber-50 border border-amber-100"
          : "bg-green-50 border border-green-100"
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <p className={`text-xs font-black ${isFull ? "text-red-600" : spotsLeft <= 2 ? "text-amber-700" : "text-green-700"}`}>
              {isFull ? "🚫 No Vacancy" : spotsLeft <= 2 ? `⚡ ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : `✅ ${spotsLeft} spots open`}
            </p>
            <p className="text-xs text-gray-400">{job.workersHired}/{job.workersNeeded} filled</p>
          </div>
          {!isFull && (
            <div className="h-1.5 bg-white rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${spotsLeft <= 2 ? "bg-amber-400" : "bg-green-500"}`}
                style={{ width: `${(job.workersHired / job.workersNeeded) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(job.createdAt)}</span>
            <span>·</span>
            <Users className="w-3 h-3" />
            <span>{job._count?.applications || 0} applied</span>
          </div>
          {isFull ? (
            <span className="bg-red-100 text-red-500 text-xs font-black px-4 py-2 rounded-xl">Closed</span>
          ) : (
            <div className={`bg-gradient-to-r ${gradient} text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm`}>
              Apply <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── WORKER CARD ───────────────────────────────────────────────────────────────
function WorkerCard({ worker, router }: { worker: any; router: any }) {
  const skills = worker.skills ? worker.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const initial = worker.user?.name?.charAt(0).toUpperCase() || "W";

  const avatarColors = [
    "from-orange-400 to-red-500",
    "from-blue-500 to-indigo-600",
    "from-green-500 to-teal-600",
    "from-purple-500 to-pink-500",
    "from-yellow-500 to-orange-500",
  ];
  const colorIndex = worker.user?.name?.charCodeAt(0) % avatarColors.length || 0;

  return (
    <div
      onClick={() => router.push(`/jobs/workers/${worker.userId}`)}
      className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-xl transition-all active:scale-[0.99] border border-gray-100"
    >
      {/* Top accent */}
      <div className={`h-1 bg-gradient-to-r ${avatarColors[colorIndex]}`} />

      <div className="p-4">
        <div className="flex items-start gap-4 mb-3">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColors[colorIndex]} flex items-center justify-center font-black text-white text-2xl flex-shrink-0 shadow-lg`}>
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-kazi-dark text-lg leading-tight">{worker.user?.name || "Worker"}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {worker.isVerified && (
                    <span className="flex items-center gap-0.5 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                  {worker.isAvailable ? (
                    <span className="flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Available
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">Busy</span>
                  )}
                </div>
              </div>

              {worker.rating > 0 && (
                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                  <span className="font-black text-yellow-700 text-sm">{worker.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3 h-3 text-kazi-orange flex-shrink-0" />
              <span className="text-gray-500 text-xs truncate">{worker.location}</span>
            </div>
          </div>
        </div>

        {worker.bio && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3 bg-gray-50 rounded-xl px-3 py-2">{worker.bio}</p>
        )}

        {skills.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {skills.slice(0, 4).map((skill: string, i: number) => (
              <span key={i} className={`text-xs font-bold px-2.5 py-1 rounded-full border ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-black text-kazi-dark text-base leading-none">{worker.totalJobs}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Jobs done</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-center">
              <p className="font-black text-kazi-dark text-base leading-none">
                {worker.rating > 0 ? worker.rating.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Rating</p>
            </div>
            {worker.totalJobs >= 5 && (
              <>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-kazi-orange" />
                  <span className="text-[10px] text-kazi-orange font-black">Pro</span>
                </div>
              </>
            )}
          </div>

          <button className="bg-kazi-dark text-white text-xs font-black px-5 py-2.5 rounded-2xl flex items-center gap-1.5 hover:bg-kazi-orange transition-colors active:scale-95">
            Hire <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
