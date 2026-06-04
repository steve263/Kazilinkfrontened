"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Users, Search, ArrowLeft, Briefcase, Zap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = [
  "All", "Loading and Moving", "Cleaning", "Catering and Cooking",
  "Security", "Events and Hospitality", "Construction", "Driving",
  "Gardening", "Childcare", "Office Work", "Sales and Promotions", "Other",
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
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const fetchJobs = useCallback(async (s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (urgentOnly) params.set("urgent", "true");
      if (s) params.set("search", s);
      const res = await fetch(`${API}/api/jobs?${params}`);
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch {}
    setLoading(false);
  }, [category, urgentOnly]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const urgentCount  = jobs.filter((j) => j.isUrgent).length;
  const totalSpots   = jobs.reduce((s, j) => s + Math.max(0, j.workersNeeded - j.workersHired), 0);
  const avgPay       = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.pay, 0) / jobs.length) : 0;

  return (
    <div className="min-h-screen bg-kazi-cream pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-kazi-dark px-4 pt-16 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-black text-2xl flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-kazi-orange" /> Casual Jobs
            </h1>
            <p className="text-white/50 text-sm mt-0.5">{jobs.length} jobs available now in Nairobi</p>
          </div>
          <Link href="/jobs/post" className="bg-kazi-orange text-white font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-transform">
            + Post Job
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchJobs(search)}
            placeholder="Search jobs…"
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white text-sm placeholder-white/40 focus:outline-none focus:border-kazi-orange transition-colors"
          />
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
          <button
            onClick={() => setUrgentOnly(!urgentOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
              urgentOnly ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:bg-red-50"
            }`}
          >
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Urgent
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                category === cat ? "bg-kazi-orange text-white" : "bg-white text-gray-600 hover:bg-orange-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Urgent", val: urgentCount, color: "text-red-500" },
            { label: "Open Spots", val: totalSpots, color: "text-kazi-dark" },
            { label: `Avg KSh ${avgPay.toLocaleString()}`, val: "", color: "text-green-600" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              {val !== "" && <p className={`font-black text-xl ${color}`}>{val}</p>}
              <p className={`text-xs font-bold mt-0.5 ${val === "" ? color : "text-gray-400"}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">💼</div>
            <p className="font-black text-kazi-dark text-lg">No jobs right now</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon or post a job</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const spotsLeft = job.workersNeeded - job.workersHired;
              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                >
                  {job.isUrgent && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                      <span className="text-xs font-black text-red-500 tracking-wide">URGENT</span>
                      <span className="text-xs text-gray-400 ml-auto">{timeAgo(job.createdAt)}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-kazi-dark text-base leading-tight">{job.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5 truncate">
                        {job.employer?.employerProfile?.companyName || "Private employer"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-kazi-orange text-lg">KSh {job.pay.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{job.payType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" /> {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(job.startDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs bg-orange-50 text-kazi-orange px-2 py-0.5 rounded-full font-semibold">
                      {job.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Worker CTA */}
        <div className="mt-6 bg-kazi-dark rounded-2xl p-5">
          <p className="text-white font-black text-lg mb-1">Looking for work? 👷</p>
          <p className="text-white/60 text-sm mb-4">
            Create your free worker profile and start getting hired for casual jobs today
          </p>
          <Link
            href="/jobs/worker/register"
            className="block w-full py-3 bg-kazi-orange text-white font-black rounded-xl text-center text-sm active:scale-95 transition-transform"
          >
            Create Worker Profile — FREE
          </Link>
        </div>

        {/* My applications link */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/jobs/my-applications" className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-1">📋</p>
            <p className="font-bold text-kazi-dark text-sm">My Applications</p>
          </Link>
          <Link href="/jobs/employer" className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all">
            <p className="text-2xl mb-1">📢</p>
            <p className="font-bold text-kazi-dark text-sm">My Posted Jobs</p>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
