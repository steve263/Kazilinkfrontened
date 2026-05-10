"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, FileText, Phone, Mail, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_INFO: Record<string, { emoji: string; label: string; color: string; message: string }> = {
  PENDING: {
    emoji: "⏳",
    label: "Appeal Pending",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    message: "Your appeal has been submitted and is waiting for review. We will respond within 48 hours.",
  },
  UNDER_REVIEW: {
    emoji: "🔍",
    label: "Under Review",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    message: "Our team is actively reviewing your appeal. We will contact you soon.",
  },
  MORE_INFO_NEEDED: {
    emoji: "📋",
    label: "More Information Needed",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    message: "Admin needs more information about your appeal. Please provide additional details.",
  },
  APPROVED: {
    emoji: "✅",
    label: "Appeal Approved",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    message: "Your appeal was approved! Your account should be reinstated — please sign out and back in.",
  },
  REJECTED: {
    emoji: "❌",
    label: "Appeal Rejected",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    message: "Your appeal was not approved. You may submit a new appeal after 30 days.",
  },
};

interface Props {
  onUnsuspend?: () => void;
}

export default function SuspensionScreen({ onUnsuspend }: Props) {
  const router = useRouter();
  const [appeal, setAppeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) { setLoading(false); return; }

    fetch(`${API_URL}/api/trust/appeal/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setAppeal(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const info = appeal ? STATUS_INFO[appeal.status] : null;
  const canAppeal = !appeal || appeal.status === "REJECTED";

  const handleSignOut = () => {
    localStorage.removeItem("kazishow_token");
    localStorage.removeItem("kazishow_user");
    window.location.href = "/auth/login";
  };

  // Fixed full-screen — completely covers the app, no background content visible
  return (
    <div
      className="fixed inset-0 bg-kazi-dark z-[99999] overflow-y-auto"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="min-h-full flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-2xl font-black text-white">
            Kazi<span className="text-kazi-orange">Show</span>
          </h1>
        </div>

        <div className="w-full max-w-md">
          {/* Suspension notice */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 mb-5 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-white font-black text-xl mb-2">Account Suspended</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Your KaziShow account has been suspended due to a violation of our community guidelines.
            </p>
          </div>

          {/* Appeal status */}
          {!loading && appeal && info && (
            <div className={`border rounded-2xl p-4 mb-4 ${info.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{info.emoji}</span>
                <p className="font-bold text-sm">{info.label}</p>
              </div>
              <p className="text-sm opacity-80">{info.message}</p>
              {appeal.adminNote && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs font-bold mb-1">Admin note:</p>
                  <p className="text-sm">{appeal.adminNote}</p>
                </div>
              )}
              {appeal.status === "MORE_INFO_NEEDED" && (
                <button
                  onClick={() => router.push("/appeal/provide-info")}
                  className="mt-3 w-full py-2.5 bg-kazi-orange text-white font-bold rounded-xl text-sm"
                >
                  Provide More Information →
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {canAppeal && (
              <button
                onClick={() => router.push("/appeal")}
                className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl flex items-center justify-between px-5 hover:bg-orange-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-black">Appeal Suspension</p>
                    <p className="text-orange-100 text-xs">Submit your case for review</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <a
              href="https://wa.me/254795542312?text=Hello%2C%20my%20KaziShow%20account%20has%20been%20suspended%20and%20I%20need%20help."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-green-500/10 border border-green-500/30 text-green-400 font-bold rounded-2xl flex items-center justify-between px-5 hover:bg-green-500/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-bold">WhatsApp Support</p>
                  <p className="text-green-400/60 text-xs">0795542312 or 0731421635</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </a>

            <a
              href="mailto:support@kazishow.co.ke?subject=Account%20Suspension%20Appeal"
              className="w-full py-4 bg-white/5 border border-white/10 text-white/60 font-bold rounded-2xl flex items-center justify-between px-5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-bold">Email Support</p>
                  <p className="text-white/40 text-xs">support@kazishow.co.ke</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </a>

            <button
              onClick={handleSignOut}
              className="w-full py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              Sign out
            </button>
          </div>

          <p className="mt-6 text-white/30 text-xs text-center leading-relaxed">
            Appeals are reviewed within 48 hours. Providing false information may result in permanent suspension.
          </p>
        </div>
      </div>
    </div>
  );
}
