"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Star, Clock, Users,
  Briefcase, UserCheck, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const WORK_CATEGORIES = [
  "All", "Loading", "Cleaning", "Security", "Catering",
  "Events", "Construction", "Driving", "Gardening", "Office", "Sales",
];
const JOB_CATEGORIES = [
  "All", "Loading and Moving", "Cleaning", "Catering and Cooking", "Security",
  "Events and Hospitality", "Construction", "Driving", "Gardening",
  "Office Work", "Sales and Promotions",
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

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-kazi-dark pt-16 pb-0">
        <div className="px-4 pt-4 mb-3">
          <h1 className="text-white font-black text-2xl">💼 Jobs</h1>
          <p className="text-white/50 text-sm mt-0.5">Find work or hire workers in Nairobi</p>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-0 border-b border-white/10">
          {[
            { id: "jobs" as const,    label: "📋 Find Jobs",    sub: "Apply for work" },
            { id: "workers" as const, label: "👷 Find Workers", sub: "Hire someone" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex-1 py-3.5 font-black text-sm transition-all border-b-2 ${
                activeTab === id
                  ? "text-kazi-orange border-kazi-orange"
                  : "text-white/40 border-transparent hover:text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (activeTab === "workers" ? fetchWorkers(search) : fetchJobs(search))}
            placeholder={activeTab === "workers" ? "Search workers by skill…" : "Search jobs…"}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-kazi-orange shadow-sm transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
          {(activeTab === "workers" ? WORK_CATEGORIES : JOB_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all shadow-sm ${
                category === cat
                  ? "bg-kazi-orange text-white shadow-orange-200"
                  : "bg-white text-gray-600 hover:bg-orange-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => router.push(activeTab === "workers" ? "/jobs/worker/register" : "/jobs/post")}
            className="flex-1 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-200 active:scale-[0.98] transition-transform"
          >
            {activeTab === "workers"
              ? <><UserCheck className="w-4 h-4" /> Register as Worker</>
              : <><Briefcase className="w-4 h-4" /> Post a Job</>
            }
          </button>
          <button
            onClick={() => router.push(activeTab === "workers" ? "/jobs/my-applications" : "/jobs/employer")}
            className="flex-1 py-3 bg-white text-kazi-dark font-black rounded-2xl text-sm shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            My Dashboard →
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── JOBS TAB ── */}
            {activeTab === "jobs" && (
              <div>
                <p className="text-gray-400 text-sm font-semibold mb-3">
                  {jobs.length} job{jobs.length !== 1 ? "s" : ""} available
                </p>
                {jobs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="font-black text-kazi-dark text-lg">No jobs posted yet</p>
                    <p className="text-gray-400 text-sm mt-2 mb-5">Be the first to post a job!</p>
                    <button onClick={() => router.push("/jobs/post")} className="px-6 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm">
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
                <p className="text-gray-400 text-sm font-semibold mb-3">
                  {workers.length} worker{workers.length !== 1 ? "s" : ""} available
                </p>
                {workers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                    <div className="text-5xl mb-3">👷</div>
                    <p className="font-black text-kazi-dark text-lg">No workers yet</p>
                    <p className="text-gray-400 text-sm mt-2 mb-5">Be the first worker on KaziShow!</p>
                    <button onClick={() => router.push("/jobs/worker/register")} className="px-6 py-3 bg-kazi-orange text-white font-black rounded-2xl text-sm">
                      Register as Worker
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
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
      className={`bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] ${isFull ? "opacity-75" : ""}`}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${gradient} p-5 relative overflow-hidden`}>
        <div className="absolute top-2 right-6 w-24 h-24 rounded-full border-4 border-white/20 pointer-events-none" />
        <div className="absolute top-8 right-14 w-12 h-12 rounded-full border-2 border-white/15 pointer-events-none" />

        {job.isUrgent && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> URGENT
          </div>
        )}

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center font-black text-white text-2xl border border-white/30 flex-shrink-0">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-black text-base leading-tight">{companyName}</p>
              <p className="text-white/70 text-xs mt-0.5">{job.category}</p>
              {job.employer?.employerProfile?.rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span className="text-white/80 text-xs font-bold">{job.employer.employerProfile.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-2xl px-3 py-2.5 text-right border border-white/30 flex-shrink-0">
            <p className="text-white font-black text-xl leading-none">KSh {job.pay.toLocaleString()}</p>
            <p className="text-white/70 text-xs mt-0.5">{job.payType}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-black text-kazi-dark text-lg leading-tight mb-2">{job.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{job.description}</p>

        {/* Location + date chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { icon: MapPin, label: job.location },
            { icon: Clock,  label: new Date(job.startDate).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" }) },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1 bg-gray-50 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-100">
              <Icon className="w-3 h-3 text-kazi-orange" /> {label}
            </span>
          ))}
        </div>

        {/* Spots counter */}
        <div className={`rounded-2xl p-3 mb-3 flex items-center justify-between ${
          isFull
            ? "bg-red-50 border border-red-200"
            : spotsLeft <= 2
            ? "bg-amber-50 border border-amber-200"
            : "bg-green-50 border border-green-200"
        }`}>
          <div className="flex items-center gap-2">
            {isFull ? (
              <>
                <span className="text-lg">🚫</span>
                <div>
                  <p className="font-black text-red-600 text-sm">No Vacancy</p>
                  <p className="text-red-400 text-xs">All positions filled</p>
                </div>
              </>
            ) : (
              <>
                <span className="text-lg">{spotsLeft <= 2 ? "⚡" : "✅"}</span>
                <div>
                  <p className={`font-black text-sm ${spotsLeft <= 2 ? "text-amber-700" : "text-green-700"}`}>
                    {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
                  </p>
                  <p className={`text-xs ${spotsLeft <= 2 ? "text-amber-500" : "text-green-500"}`}>
                    {spotsLeft <= 2 ? "Filling up fast — apply now!" : "Grab your chance!"}
                  </p>
                </div>
              </>
            )}
          </div>
          {!isFull && (
            <div className="w-20">
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${spotsLeft <= 2 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${(job.workersHired / job.workersNeeded) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5 text-right">{job.workersHired}/{job.workersNeeded}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{timeAgo(job.createdAt)}</span>
            <span>·</span>
            <span>{job._count?.applications || 0} applied</span>
          </div>
          {isFull ? (
            <span className="bg-red-100 text-red-500 text-xs font-black px-4 py-2 rounded-xl">No Vacancy</span>
          ) : (
            <div className={`bg-gradient-to-r ${gradient} text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1`}>
              Apply Now <ChevronRight className="w-3.5 h-3.5" />
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

  return (
    <div
      onClick={() => router.push(`/jobs/workers/${worker.userId}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="h-1.5 bg-gradient-to-r from-kazi-orange to-orange-400" />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kazi-dark to-slate-700 flex items-center justify-center font-black text-white text-2xl flex-shrink-0 shadow-md">
            {worker.user?.name?.charAt(0).toUpperCase() || "W"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-kazi-dark text-lg leading-tight">{worker.user?.name || "Worker"}</p>
              {worker.isVerified && (
                <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">✓ Verified</span>
              )}
              {worker.isAvailable && (
                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">🟢 Available</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-kazi-orange" /> {worker.location}
              </span>
              {worker.rating > 0 && (
                <span className="flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-kazi-dark">{worker.rating.toFixed(1)}</span>
                </span>
              )}
              {worker.totalJobs > 0 && (
                <span className="text-xs text-gray-400">{worker.totalJobs} jobs done</span>
              )}
            </div>
          </div>
        </div>

        {worker.bio && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{worker.bio}</p>
        )}

        {skills.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {skills.slice(0, 3).map((skill: string, i: number) => (
              <span key={i} className="bg-orange-50 text-kazi-orange text-xs font-bold px-3 py-1.5 rounded-full border border-orange-100">
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="font-black text-kazi-dark">{worker.totalJobs}</p>
              <p className="text-xs text-gray-400">Jobs</p>
            </div>
            <div className="text-center">
              <p className="font-black text-kazi-dark">{worker.rating > 0 ? worker.rating.toFixed(1) : "New"}</p>
              <p className="text-xs text-gray-400">Rating</p>
            </div>
          </div>
          <div className="bg-kazi-orange text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1">
            Hire <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
