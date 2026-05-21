"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowLeft, CreditCard, Copy } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PAYBILL = "247247";

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

type Step = "plans" | "pay" | "waiting";

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState("GROWTH");
  const [mpesaCode, setMpesaCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState<Step>("plans");

  useEffect(() => {
    const userRaw = localStorage.getItem("kazishow_user");
    if (!userRaw) { router.push("/auth/login"); return; }
    const user = JSON.parse(userRaw);
    if (user.role !== "PROVIDER") { router.push("/"); return; }
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/subscriptions/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
        setProvider(data.data?.provider);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmitPayment = async () => {
    if (!mpesaCode.trim() || mpesaCode.trim().length < 8) {
      toast.error("Please enter a valid M-Pesa confirmation code");
      return;
    }
    setPaying(true);
    try {
      const token = localStorage.getItem("kazishow_token");
      const res = await fetch(`${API_URL}/api/subscriptions/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: selectedPlan, mpesaCode: mpesaCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("waiting");
      } else {
        toast.error(data.message || "Submission failed. Try again.");
      }
    } catch {
      toast.error("Failed to submit. Check your connection.");
    } finally {
      setPaying(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
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
        message: `${days} day${days !== 1 ? "s" : ""} remaining`,
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
  const providerAccountRef = `SUB-${(provider?.id ?? subscription?.subscription?.providerId ?? "").slice(0, 8).toUpperCase()}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-kazi-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Toaster position="top-right" />
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
                      payment.status === "PAID" ? "bg-green-100 text-green-600" :
                      payment.status === "PENDING_VERIFICATION" ? "bg-amber-100 text-amber-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {payment.status === "PENDING_VERIFICATION" ? "⏳ Verifying" : payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pay step — manual Paybill */}
        {step === "pay" && (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="font-black text-kazi-dark text-xl">Pay via M-Pesa 💚</h3>
              <p className="text-gray-400 text-sm mt-1">{plan.name} Plan — KSh {plan.price.toLocaleString()}/month</p>
            </div>

            {/* Amount */}
            <div className={`rounded-2xl p-4 text-center ${plan.bgColor}`}>
              <p className={`font-black text-4xl ${plan.textColor}`}>KSh {plan.price.toLocaleString()}</p>
              <p className="text-gray-500 text-sm mt-1">Active for 30 days from confirmation</p>
            </div>

            {/* Step by step */}
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <h4 className="font-black text-kazi-dark">📱 How to Pay</h4>

              {[
                { step: 1, title: "Open M-Pesa", desc: "Go to M-Pesa → Lipa Na M-Pesa → Pay Bill" },
                { step: 2, title: "Business Number (Paybill)", value: PAYBILL, copyKey: "paybill" },
                { step: 3, title: "Account Number", value: providerAccountRef, copyKey: "account" },
                { step: 4, title: "Amount", value: `KSh ${plan.price.toLocaleString()}`, copyKey: "amount" },
                { step: 5, title: "Enter PIN and confirm", desc: "You will receive an M-Pesa SMS" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${plan.buttonColor.split(" ")[0]}`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-kazi-dark text-sm">{item.title}</p>
                    {item.desc && <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>}
                    {item.value && (
                      <button
                        onClick={() => copyText(item.copyKey === "amount" ? String(plan.price) : item.value!, item.title)}
                        className="mt-1.5 w-full flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 hover:border-kazi-orange"
                      >
                        <p className="font-black text-kazi-dark text-lg tracking-wider">{item.value}</p>
                        <span className="text-xs text-kazi-orange font-bold flex items-center gap-1">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* M-Pesa code input */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Enter M-Pesa Confirmation Code
              </label>
              <input
                type="text"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                placeholder="e.g. QGH7YU89K"
                maxLength={12}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl font-black tracking-widest uppercase text-sm focus:outline-none focus:border-kazi-orange"
              />
              <p className="text-xs text-gray-400 mt-1">Copy this from the M-Pesa SMS you receive after payment</p>
            </div>

            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="font-black text-green-700 text-sm mb-2">📋 Payment Summary</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paybill</span>
                  <span className="font-black">{PAYBILL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account</span>
                  <span className="font-black">{providerAccountRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-black text-kazi-orange">KSh {plan.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-black">{plan.name} — 30 days</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("plans")}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl"
              >
                Back
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={paying || !mpesaCode}
                className={`flex-1 py-3 text-white font-black rounded-2xl disabled:opacity-60 ${plan.buttonColor}`}
              >
                {paying ? "Submitting..." : "✅ Submit Code"}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">Admin confirms within 1 hour and activates your subscription</p>
          </div>
        )}

        {/* Waiting for admin */}
        {step === "waiting" && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="font-black text-kazi-dark text-xl mb-2">Payment Submitted!</h3>
            <p className="text-gray-500 text-sm mb-4">
              Admin will verify your M-Pesa payment and activate your {plan.name} plan within 1 hour.
            </p>
            <div className={`rounded-2xl p-4 mb-6 ${plan.bgColor}`}>
              <p className={`font-black text-lg ${plan.textColor}`}>{plan.emoji} {plan.name} — KSh {plan.price.toLocaleString()}/month</p>
              <p className="text-gray-500 text-sm mt-1">You will receive an SMS when activated</p>
            </div>
            <button
              onClick={() => router.push("/provider/notifications")}
              className="w-full py-4 bg-kazi-orange text-white font-black rounded-2xl"
            >
              Back to My Jobs
            </button>
          </div>
        )}
      </div>
      <div className="pb-24" />
      <BottomNav />
    </div>
  );
}
