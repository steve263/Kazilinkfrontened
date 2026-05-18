"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SubscriptionBanner() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userRaw: string | null = null;
    try { userRaw = localStorage.getItem("kazishow_user"); } catch { return; }
    if (!userRaw) { setLoading(false); return; }

    let user: any;
    try { user = JSON.parse(userRaw); } catch { setLoading(false); return; }

    // Only business providers need subscription banners
    if (user?.role !== "PROVIDER") { setLoading(false); return; }
    if (user?.provider?.category === "FUNDI") { setLoading(false); return; }

    setUserName(user.name || "");
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/subscriptions/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSubscription(data.data);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading || !subscription) return null;

  const sub = subscription.subscription;
  const daysLeft: number = subscription.daysRemaining ?? 0;
  const isExpired = sub?.status === "EXPIRED" || !subscription.isActive;
  const isTrial = sub?.status === "TRIAL";

  // Only show banner when ≤7 days remain or expired
  if (!isExpired && daysLeft > 7) return null;
  // Already dismissed (non-urgent only — urgent is always visible)
  const isUrgent = isExpired || daysLeft <= 2;
  if (!isUrgent && dismissed) return null;

  // ── Full-screen blocking popup for expired ───────────────────────────────────
  if (isExpired) {
    return (
      <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">{isTrial ? "🎁" : "😔"}</div>

          <h2 className="font-black text-kazi-dark text-2xl mb-3">
            {isTrial ? "Your Free Trial Has Ended" : "Subscription Expired"}
          </h2>

          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {isTrial
              ? `Hi ${userName || "there"}! 👋 We hope you enjoyed your 14-day free trial on KaziShow. To continue receiving bookings and growing your business, please subscribe to one of our affordable plans starting at just KSh 800/month!`
              : `Hi ${userName || "there"}! 👋 Your KaziShow subscription has expired. Don't worry — your profile and all your data are safe. Subscribe again from KSh 800/month to continue receiving bookings from thousands of customers!`}
          </p>

          {/* Plans preview */}
          <div className="space-y-2 mb-6">
            {([
              { name: "Starter", price: 800, emoji: "🌱", popular: false },
              { name: "Growth", price: 1200, emoji: "🚀", popular: true },
              { name: "Premium", price: 1500, emoji: "👑", popular: false },
            ] as const).map((plan) => (
              <div
                key={plan.name}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  plan.popular ? "bg-kazi-orange text-white" : "bg-gray-50 text-kazi-dark"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{plan.emoji}</span>
                  <span className="font-bold text-sm">{plan.name}</span>
                  {plan.popular && (
                    <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      POPULAR
                    </span>
                  )}
                </div>
                <span className={`font-black text-sm ${plan.popular ? "text-white" : "text-kazi-orange"}`}>
                  KSh {plan.price}/mo
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/provider/subscription")}
            className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl text-lg mb-3"
          >
            {isTrial ? "Subscribe Now 🚀" : "Renew Subscription 🔄"}
          </button>

          <p className="text-gray-400 text-xs">
            Your bookings and reviews are saved and will reappear immediately after subscribing
          </p>
        </div>
      </div>
    );
  }

  // ── Slim top banner for 1–7 days remaining ──────────────────────────────────
  const getBannerConfig = () => {
    if (daysLeft <= 1) return {
      bg: "bg-red-500",
      icon: "🔴",
      title: isTrial ? "Last Day of Free Trial!" : "Subscription Expires Today!",
      message: isTrial
        ? "Subscribe now to avoid losing customers!"
        : "Renew now to avoid any interruption!",
      buttonLabel: isTrial ? "Subscribe Now" : "Renew Today",
    };
    if (daysLeft <= 2) return {
      bg: "bg-red-500",
      icon: "🚨",
      title: isTrial ? `${daysLeft} Days Left in Free Trial!` : `${daysLeft} Days Left on Your Plan!`,
      message: isTrial ? "Subscribe now to keep getting bookings!" : "Renew to keep getting bookings!",
      buttonLabel: isTrial ? "Subscribe Now" : "Renew Now",
    };
    if (daysLeft <= 4) return {
      bg: "bg-amber-500",
      icon: "⚠️",
      title: isTrial ? `${daysLeft} Days Left in Free Trial` : `${daysLeft} Days Left on Your Plan`,
      message: isTrial ? "Choose a plan to continue using KaziShow!" : "Renew to keep receiving bookings!",
      buttonLabel: isTrial ? "Choose a Plan" : "Renew Plan",
    };
    return {
      bg: "bg-blue-500",
      icon: "ℹ️",
      title: isTrial ? `${daysLeft} Days Left in Free Trial` : `${daysLeft} Days Remaining`,
      message: isTrial ? "Subscribe to keep your business active!" : "Renew to avoid any interruption.",
      buttonLabel: isTrial ? "View Plans" : "Renew",
    };
  };

  const config = getBannerConfig();

  return (
    <div className={`${config.bg} px-4 py-3 flex items-center justify-between`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base flex-shrink-0">{config.icon}</span>
        <div className="min-w-0">
          <p className="text-white font-black text-xs leading-tight">{config.title}</p>
          <p className="text-white/80 text-xs leading-tight truncate">{config.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <button
          onClick={() => router.push("/provider/subscription")}
          className="bg-white text-kazi-dark font-black text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
        >
          {config.buttonLabel}
        </button>
        {!isUrgent && (
          <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
