"use client";
import { useState } from "react";
import { Clock, Search, Bell, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Props {
  provider: { id: string; businessName?: string; providerName?: string; category?: string };
  onClose: () => void;
}

export default function ProviderBusyModal({ provider, onClose }: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const name = provider.businessName || provider.providerName || "This provider";

  const joinWaitlist = async () => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) {
      toast.error("Please login first");
      router.push("/auth/login");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`${API_URL}/api/providers/${provider.id}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setJoined(true);
        toast.success("You're on the waitlist!");
      } else {
        toast.error(data.message || "Failed to join waitlist");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-amber-500 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">🔴</div>
            <div>
              <h2 className="font-black text-xl">Provider Busy</h2>
              <p className="text-amber-100 text-sm">Currently on another job</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-amber-50 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800 text-sm">{name} is currently busy</p>
              <p className="text-gray-500 text-xs mt-1">
                They are working on another job right now. You will be notified as soon as they are free!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {!joined ? (
              <button
                onClick={joinWaitlist}
                disabled={joining}
                className="w-full py-4 bg-kazi-orange text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-orange-600 transition-all active:scale-95"
              >
                {joining ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Joining Waitlist...</>
                ) : (
                  <><Bell className="w-5 h-5" /> Notify Me When Free</>
                )}
              </button>
            ) : (
              <div className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                ✅ You are on the waitlist!
              </div>
            )}

            <button
              onClick={() => { onClose(); router.push(`/discover?category=${provider.category || ""}`); }}
              className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Search className="w-5 h-5" /> Find Similar Providers
            </button>

            <button onClick={onClose} className="w-full py-3 text-gray-400 text-sm hover:text-gray-600">
              Maybe Later
            </button>
          </div>

          {joined && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-xs text-green-700 text-center">
                🔔 You will receive a push notification and SMS when {name} is available again!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
