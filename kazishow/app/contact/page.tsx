"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Mail, MessageCircle, Phone, Clock, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const channels = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+254 795 542 312",
    description: "Fastest response — typically under 1 hour",
    href: "https://wa.me/254795542312",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: Mail,
    label: "Email",
    value: "support@kazishow.co.ke",
    description: "For detailed queries and account issues",
    href: "mailto:support@kazishow.co.ke",
    color: "text-kazi-orange",
    bg: "bg-orange-50",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+254 795 542 312",
    description: "Mon – Fri, 8 am – 6 pm EAT",
    href: "tel:+254795542312",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        toast.error(data.message || "Failed to send. Please try WhatsApp instead.");
      }
    } catch {
      toast.error("Network error — please try WhatsApp or email directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-kazi-dark py-14 px-5 text-center">
        <p className="text-kazi-orange text-xs font-bold uppercase tracking-widest mb-3">Support</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Contact Us</h1>
        <p className="text-white/50 text-sm max-w-sm mx-auto">
          We&apos;re here to help. Reach out via WhatsApp for the fastest response.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-12 pb-28 space-y-6">
        {/* Channels */}
        <div className="grid sm:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${ch.bg} flex items-center justify-center`}>
                <ch.icon className={`w-5 h-5 ${ch.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{ch.label}</p>
                <p className="text-sm font-semibold text-kazi-dark">{ch.value}</p>
                <p className="text-xs text-gray-400 mt-1">{ch.description}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Hours notice */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-kazi-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-kazi-dark mb-1">Support Hours</p>
            <p className="text-sm text-gray-500">
              Monday – Friday: 8:00 am – 6:00 pm EAT<br />
              Saturday: 9:00 am – 2:00 pm EAT<br />
              Sunday &amp; Public Holidays: WhatsApp only
            </p>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-black text-kazi-dark mb-5">Send us a message</h2>

          {sent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-black text-kazi-dark mb-2">Message sent!</p>
              <p className="text-sm text-gray-500 mb-6">
                We&apos;ll get back to you within 1 business day. For urgent issues use WhatsApp.
              </p>
              <button
                onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
                className="text-sm text-kazi-orange font-semibold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Your Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Booking issue, Payment problem"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Message <span className="text-kazi-orange">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* FAQ link */}
        <p className="text-center text-sm text-gray-400">
          Looking for quick answers?{" "}
          <Link href="/faq" className="text-kazi-orange font-semibold hover:underline">
            Browse our FAQ
          </Link>
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
