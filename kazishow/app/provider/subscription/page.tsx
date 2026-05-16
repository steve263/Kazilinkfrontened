"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Phone, ArrowLeft, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const PLANS = [
  {
    key: "STARTER",
    name: "Starter",
    price: 800,
    emoji: "🌱",
    borderColor: "border-green-400",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    buttonColor: "bg-green-500 hover:bg-green-600",
    features: [
      "Listed on KaziShow",
      "Unlimited bookings",
      "Customer reviews",
      "SMS notifications",
      "Basic analytics",
    ],
  },
  {
    key: "GROWTH",
    name: "Growth",
    price: 1200,
    emoji: "🚀",
    borderColor: "border-kazi-orange",
    bgColor: "bg-orange-50",
    textColor: "text-kazi-orange",
    buttonColor: "bg-kazi-orange hover:bg-orange-600",
    popular: true,
    features: [
      "Everything in Starter",
      "Featured in search results",
      "Priority customer support",
      "Advanced analytics",
      "Booking reminders",
    ],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    price: 1500,
    emoji: "👑",
    borderColor: "border-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    features: [
      "Everything in Growth",
      "Top position in search",
      "Social media promotion",
      "Dedicated account manager",
      "Custom profile badge",
    ],
  },
];

type Step = "plans" | "pay" | "waiting" | "success";

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState("GROWTH");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState<Step>("plans");

  useEffect(() => {
    const userRaw = localStorage.getItem("kazishow_user");
    if (!userRaw) { router.push("/auth/login"); return; }
    const user = JSON.parse(userRaw);
    if (user.role !== "PROVIDER") { router.push("/"); return; }
    setPhone(user.phone || "");
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

  const handleSubscribe = async () => {
    if (!phone.trim()) { toast.error("Enter your M-Pesa phone number"); return; }
    setPaying(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/subscriptions/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: selectedPlan, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("waiting");
        // Poll for activation (up to 2 minutes)
        const interval = setInterval(async () => {
          const res2 = await fetch(`${API_URL}/api/subscriptions/my`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data2 = await res2.json();
          if (data2.data?.subscription?.status === "ACTIVE") {
            clearInterval(interval);
            setSubscription(data2.data);
            setStep("success");
          }
        }, 3000);
        setTimeout(() => clearInterval(interval), 120000);
      } else {
        toast.error(data.message || "Payment failed. Try again.");
      }
    } catch {
      toast.error("Payment failed. Check your connection and try again.");
    } finally {
      setPaying(false);
    }
  };

  const getStatusInfo = () => {
    const sub = subscription?.subscription;
    if (!sub) return null;
    const days = subscription?.daysRemaining || 0;
    if (sub.status === "TRIAL") {
      return {
        label: "FREE TRIAL",
        wrapClass: "bg-green-50 border-green-200",
        textClass: "text-green-700",
        badgeClass: "bg-green-100 text-green-700",
        message: days > 0 ? `${days} day${days !== 1 ? "s" : ""} remaining in your free trial` : "Your free trial has expired",
        emoji: "🎁",
      };
    }
    if (sub.status === "ACTIVE") {
      return {
        label: "ACTIVE",
        wrapClass: "bg-blue-50 border-blue-200",
        textClass: "text-blue-700",
        badgeClass: "bg-blue-100 text-blue-700",
        message: `${days} day${days !== 1 ? "s" : ""} remaining • Renews automatically`,
        emoji: "✅",
      };
    }
    return {
      label: "EXPIRED",
      wrapClass: "bg-red-50 border-red-200",
      textClass: "text-red-600",
      badgeClass: "bg-red-100 text-red-600",
      message: "Your subscription has expired. Renew to receive bookings.",
      emoji: "❌",
    };
  };

  const plan = PLANS.find(p => p.key === selectedPlan)!;
  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-kazi-dark flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-kazi-orange" />
              My Subscription
            </h1>
            <p className="text-gray-500 text-sm">Keep your business visible and receiving bookings</p>
          </div>
        </div>

        {/* Current status card */}
        {statusInfo && (
          <div className={`rounded-2xl p-4 border ${statusInfo.wrapClass}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{statusInfo.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                  {subscription?.subscription?.plan && subscription?.subscription?.status !== "TRIAL" && (
                    <span className={`text-xs font-bold ${statusInfo.textClass}`}>
                      {subscription.subscription.plan} Plan
                    </span>
                  )}
                </div>
                <p className={`text-sm font-semibold ${statusInfo.textClass}`}>{statusInfo.message}</p>
              </div>
            </div>

            {/* Trial countdown bar */}
            {subscription?.subscription?.status === "TRIAL" && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Trial progress</span>
                  <span>{14 - (subscription?.daysRemaining || 0)} of 14 days used</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((14 - (subscription?.daysRemaining || 0)) / 14) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plans selection */}
        {step === "plans" && (
          <>
            <div>
              <h2 className="font-black text-kazi-dark text-lg mb-1">Choose Your Plan</h2>
              <p className="text-gray-400 text-sm">First 14 days FREE • Then KSh 800–1,500/month</p>
            </div>

            <div className="space-y-3">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPlan(p.key)}
                  className={`w-full rounded-2xl p-4 text-left border-2 transition-all relative ${
                    selectedPlan === p.key ? `${p.borderColor} ${p.bgColor}` : "border-gray-200 bg-white"
                  }`}
                >
                  {p.popular && (
                    <div className="absolute top-3 right-3 bg-kazi-orange text-white text-xs font-black px-2 py-0.5 rounded-full">
                      POPULAR
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{p.emoji}</span>
                    <div>
                      <p className="font-black text-kazi-dark">{p.name}</p>
                      <p className={`text-lg font-black ${selectedPlan === p.key ? p.textColor : "text-kazi-dark"}`}>
                        KSh {p.price.toLocaleString()}
                        <span className="text-sm font-normal text-gray-400">/month</span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${selectedPlan === p.key ? p.textColor : "text-gray-400"}`} />
                        <span className="text-xs text-gray-600">{f}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("pay")}
              className={`w-full py-4 text-white font-black rounded-2xl text-base ${plan.buttonColor}`}
            >
              Subscribe to {plan.name} — KSh {plan.price.toLocaleString()}/month →
            </button>
            <p className="text-center text-xs text-gray-400">Your first 14 days are FREE • Cancel anytime</p>

            {/* Payment history */}
            {(subscription?.subscription?.payments?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-kazi-dark">Payment History</h3>
                </div>
                {subscription.subscription.payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-kazi-dark">KSh {payment.amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
                          : "Pending"}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      payment.status === "PAID" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pay step */}
        {step === "pay" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-black text-kazi-dark text-lg">Pay via M-Pesa 💚</h2>
              <p className="text-gray-400 text-sm">{plan.name} Plan — KSh {plan.price.toLocaleString()}/month</p>
            </div>

            <div className={`rounded-xl p-3 ${plan.bgColor}`}>
              <div className="flex items-center justify-between">
                <p className={`font-bold text-sm ${plan.textColor}`}>{plan.emoji} {plan.name} Plan</p>
                <p className={`font-black text-lg ${plan.textColor}`}>KSh {plan.price.toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Active for 30 days from payment</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kazi-orange"
                />
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                ⏰ An M-Pesa prompt will be sent to your phone. Enter your PIN to complete payment.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("plans")}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={handleSubscribe}
                disabled={paying}
                className={`flex-1 py-3 text-white font-black rounded-2xl disabled:opacity-60 ${plan.buttonColor}`}
              >
                {paying ? "Sending..." : `Pay KSh ${plan.price.toLocaleString()} 💚`}
              </button>
            </div>
          </div>
        )}

        {/* Waiting for payment */}
        {step === "waiting" && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-4 animate-bounce">📱</div>
            <h3 className="font-black text-kazi-dark text-xl mb-2">Check Your Phone!</h3>
            <p className="text-gray-500 text-sm mb-1">M-Pesa prompt sent to</p>
            <p className="font-bold text-kazi-orange text-lg mb-4">{phone}</p>
            <div className={`rounded-2xl p-4 mb-4 ${plan.bgColor}`}>
              <p className={`text-sm font-semibold ${plan.textColor}`}>
                💚 Enter your M-Pesa PIN to activate {plan.name} plan
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Waiting for payment confirmation...</p>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-black text-kazi-dark text-2xl mb-2">Subscription Active!</h3>
            <p className="text-gray-500 text-sm mb-4">
              Your {plan.name} plan is now active for 30 days. You can start receiving bookings!
            </p>
            <div className={`rounded-2xl p-4 mb-6 ${plan.bgColor}`}>
              <p className={`font-black text-lg ${plan.textColor}`}>{plan.emoji} {plan.name} Plan Active</p>
              <p className="text-gray-500 text-sm mt-1">Active for 30 days • KSh {plan.price.toLocaleString()}/month</p>
            </div>
            <button
              onClick={() => router.push("/provider/notifications")}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
            >
              Start Receiving Bookings 🚀
            </button>
          </div>
        )}
      </div>
      <div className="pb-24" />
      <BottomNav />
    </div>
  );
}
