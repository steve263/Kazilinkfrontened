"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MapPin, Star, CheckCircle, Briefcase, Award, MessageCircle, ChevronLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/jobs/workers/${params.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setWorker(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-gray-500 font-bold">Worker not found</p>
          <button onClick={() => router.back()} className="mt-4 text-kazi-orange text-sm font-bold">← Back</button>
        </div>
      </div>
    );
  }

  const skills = worker.skills ? worker.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const waPhone = (worker.user?.phone || "").replace(/^0/, "254").replace(/\s/g, "");

  return (
    <div className="min-h-screen bg-kazi-cream pb-28">
      <Toaster position="top-center" />

      {/* Orange gradient cover */}
      <div className="h-48 bg-gradient-to-br from-kazi-orange via-orange-500 to-orange-700 relative overflow-hidden">
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {/* Decorative circles */}
        <div className="absolute -top-4 right-6 w-40 h-40 rounded-full border-4 border-white/15 pointer-events-none" />
        <div className="absolute top-10 right-14 w-20 h-20 rounded-full border-2 border-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 left-8 w-28 h-28 rounded-full border-4 border-white/10 pointer-events-none" />
      </div>

      <div className="px-4 -mt-12 relative">

        {/* Avatar + status */}
        <div className="flex items-end justify-between mb-4">
          <div className="w-24 h-24 rounded-3xl bg-kazi-dark border-4 border-white shadow-xl flex items-center justify-center font-black text-white text-4xl">
            {worker.user?.name?.charAt(0).toUpperCase() || "W"}
          </div>
          <div className="flex gap-2 mb-2">
            {worker.isAvailable ? (
              <span className="bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow">🟢 Available Now</span>
            ) : (
              <span className="bg-gray-400 text-white text-xs font-black px-3 py-1.5 rounded-full">Busy</span>
            )}
          </div>
        </div>

        {/* Name card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="font-black text-kazi-dark text-2xl leading-tight">{worker.user?.name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {worker.isVerified && (
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
                <span className="flex items-center gap-1 bg-orange-50 text-kazi-orange text-xs font-bold px-2.5 py-1 rounded-full border border-orange-100">
                  <MapPin className="w-3 h-3" /> {worker.location}
                </span>
              </div>
            </div>
            {worker.rating > 0 && (
              <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-200 flex-shrink-0">
                <div className="flex items-center gap-0.5 justify-center">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-black text-kazi-dark text-xl">{worker.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Rating</p>
              </div>
            )}
          </div>

          {worker.bio && (
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">{worker.bio}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Jobs Done",  val: worker.totalJobs,                     color: "text-kazi-orange" },
            { label: "Rating",     val: worker.rating > 0 ? worker.rating.toFixed(1) : "New", color: "text-kazi-dark" },
            { label: "Status",     val: worker.isAvailable ? "Ready" : "Busy", color: worker.isAvailable ? "text-green-600" : "text-gray-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className={`font-black text-2xl ${color}`}>{val}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h3 className="font-black text-kazi-dark text-base mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-kazi-orange" /> Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span key={i} className="bg-orange-50 text-kazi-orange font-bold text-sm px-4 py-2 rounded-full border border-orange-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {worker.experience && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h3 className="font-black text-kazi-dark text-base mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-kazi-orange" /> Experience
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">{worker.experience}</p>
          </div>
        )}

        {/* Post a job for this worker */}
        <div className="bg-kazi-dark rounded-2xl p-5 mb-4">
          <p className="text-white font-black text-base mb-1">Need this worker for a job?</p>
          <p className="text-white/60 text-sm mb-4">Post your job and they can apply, or contact them directly via WhatsApp.</p>
          <button
            onClick={() => router.push("/jobs/post")}
            className="w-full py-3 bg-kazi-orange text-white font-black rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            Post a Job Now
          </button>
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="flex gap-3 max-w-lg mx-auto">
          {waPhone && (
            <button
              onClick={() => window.open(`https://wa.me/${waPhone}`, "_blank")}
              className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp
            </button>
          )}
          <button
            onClick={() => {
              toast.success("Post a job and this worker will be able to apply!");
              router.push("/jobs/post");
            }}
            className="flex-1 py-4 bg-kazi-orange text-white font-black rounded-2xl text-base active:scale-[0.98] transition-transform shadow-lg shadow-orange-200"
          >
            Hire Worker →
          </button>
        </div>
      </div>
    </div>
  );
}
