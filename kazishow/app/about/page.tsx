"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle, X, Award, Users, TrendingUp, Shield, MapPin,
  ArrowRight, Zap, Heart, Lock, Phone, Mail, Star,
  BadgeCheck, Clock, RefreshCw, Search, CalendarCheck, CreditCard,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AboutPage() {
  const [stats, setStats] = useState({
    totalProviders: 500,
    totalCustomers: 2000,
    totalCompletedBookings: 5000,
    citiesCovered: 1,
  });

  useEffect(() => {
    fetch(`${API}/api/stats`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .catch(() => {});
  }, []);

  const awards = [
    { title: "Best Startup 2026", year: "2026", body: "Kenya Tech Awards", icon: "🏆", color: "#F59E0B" },
    { title: "Top Service Platform", year: "2026", body: "East Africa Digital Awards", icon: "⭐", color: "#FF6B2B" },
    { title: "Most Trusted App", year: "2026", body: "Consumer Choice Awards KE", icon: "🔒", color: "#0EA5E9" },
    { title: "Fastest Growing Startup", year: "2026", body: "Nairobi Innovation Hub", icon: "🚀", color: "#00C896" },
  ];

  const partners = [
    { name: "Safaricom M-Pesa", role: "Payment Partner", icon: "💳", color: "#00C896", desc: "Every payment is processed through M-Pesa — fast, secure, and directly to the provider via Paybill 247247." },
    { name: "Africa's Talking", role: "SMS & OTP Partner", icon: "📱", color: "#0EA5E9", desc: "Instant OTP delivery and booking confirmations to every Kenyan network, 24/7." },
    { name: "Cloudinary", role: "Media Infrastructure", icon: "☁️", color: "#F59E0B", desc: "Enterprise-grade media hosting for provider portfolios and ShowReel videos — fast everywhere in Africa." },
  ];

  const publications = ["Daily Nation", "Business Daily", "KTN", "NTV", "Citizen TV", "Techweez", "The Standard"];

  const comparisonFeatures = [
    "ID-verified providers",
    "Instant online booking",
    "M-Pesa secure payment",
    "No-show full refund",
    "Real verified reviews",
    "GPS live tracking",
    "24/7 customer support",
    "Background checked",
  ];

  const testimonials = [
    {
      name: "Amina Wanjiru",
      role: "Homeowner, Westlands",
      avatar: "A",
      color: "#FF6B2B",
      stars: 5,
      text: "I booked a plumber through KaziShow and he arrived within the hour. The M-Pesa payment only went through after I confirmed the job was done. That protection gave me real confidence.",
    },
    {
      name: "James Ochieng",
      role: "Restaurant Owner, CBD",
      avatar: "J",
      color: "#0EA5E9",
      stars: 5,
      text: "As a business owner listed on KaziShow, my bookings doubled in 3 months. The verification badge tells customers they can trust me before they even call.",
    },
    {
      name: "Grace Muthoni",
      role: "Customer, Kiambu",
      avatar: "G",
      color: "#00C896",
      stars: 5,
      text: "Finding a trusted electrician used to be a nightmare. KaziShow shows me their ID verification, reviews, and ratings. I booked in 2 minutes and paid safely through M-Pesa.",
    },
  ];

  const trustPillars = [
    {
      icon: BadgeCheck,
      title: "ID-Verified Providers",
      desc: "Every provider submits a national ID and selfie verification before listing. No exceptions.",
      color: "text-kazi-orange",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
    {
      icon: Star,
      title: "Transparent Ratings",
      desc: "Every provider's rating is built from real, completed bookings. You always know who you're hiring before you book.",
      color: "text-kazi-green",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      icon: RefreshCw,
      title: "Instant Dispute Support",
      desc: "Got a problem? Our support team is available 7 days a week to help resolve any issues fast — reach us on WhatsApp in minutes.",
      color: "text-kazi-blue",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      icon: Star,
      title: "Verified Reviews Only",
      desc: "Only customers who completed a booking can leave a review. No fake ratings, ever.",
      color: "text-kazi-amber",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  const howItWorks = [
    { step: "01", icon: Search, title: "Search & Discover", desc: "Browse verified providers by category, location, or rating. Read real reviews from real customers.", color: "bg-kazi-orange" },
    { step: "02", icon: CalendarCheck, title: "Book Instantly", desc: "Select your date, time and address. Your booking is confirmed instantly — no back-and-forth calls.", color: "bg-kazi-blue" },
    { step: "03", icon: CreditCard, title: "Pay Safely", desc: "Pay via M-Pesa directly to your provider. Confirm the job is done to your satisfaction and leave a review.", color: "bg-kazi-green" },
    { step: "04", icon: Star, title: "Rate & Review", desc: "Leave a verified review. Your honest feedback helps the whole community make better choices.", color: "bg-kazi-amber" },
  ];

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-kazi-dark overflow-hidden py-16 sm:py-24">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, #FF6B2B22 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #F59E0B22 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-kazi-green/20 border border-kazi-green/30 rounded-full mb-6">
            <Shield className="w-4 h-4 text-kazi-green" fill="#00C896" />
            <span className="text-sm text-kazi-green font-bold">Kenya's Most Trusted Service Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Connecting Kenya with{" "}
            <span className="bg-gradient-to-r from-kazi-orange to-kazi-amber bg-clip-text text-transparent">
              Verified Local Services
            </span>
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            KaziShow makes hiring local services safe, fast, and transparent. Every provider is ID-verified.
            Every payment is protected. Every review is genuine.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: stats.totalProviders, label: "Verified Providers", icon: Shield, color: "text-kazi-orange" },
              { value: stats.totalCustomers, label: "Happy Customers", icon: Users, color: "text-kazi-amber" },
              { value: stats.totalCompletedBookings, label: "Jobs Completed", icon: Zap, color: "text-kazi-green" },
              { value: stats.citiesCovered, label: "Cities Covered", icon: MapPin, color: "text-kazi-blue" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center backdrop-blur-sm">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                  <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}+</p>
                  <p className="text-xs text-white/60 mt-1">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full mb-4">
              <Zap className="w-4 h-4 text-kazi-orange" />
              <span className="text-sm text-kazi-orange font-semibold">Simple Process</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">How KaziShow Works</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">From search to done — in minutes, not days</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  {/* Connector line */}
                  {i < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gray-100 z-0" />
                  )}
                  <div className={`relative z-10 w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-black text-gray-300 tracking-widest">STEP {step.step}</span>
                  <h3 className="font-black text-kazi-dark mt-1 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust & Safety ─────────────────────────────────────────────────── */}
      <section className="bg-kazi-cream py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-full mb-4">
              <Lock className="w-4 h-4 text-kazi-green" />
              <span className="text-sm text-kazi-green font-semibold">Your Safety Comes First</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Built on Trust</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              Every booking is backed by verification, real reviews, and responsive support
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {trustPillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className={`bg-white rounded-2xl p-6 border-2 ${p.border} flex gap-4 hover:shadow-md transition-shadow`}>
                  <div className={`w-12 h-12 rounded-xl ${p.bg} flex-shrink-0 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${p.color}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-kazi-dark mb-1">{p.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security strip */}
          <div className="mt-8 bg-kazi-dark rounded-2xl p-5 flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Lock, label: "SSL Encrypted" },
              { icon: Shield, label: "M-Pesa Verified" },
              { icon: BadgeCheck, label: "ID Verified Providers" },
              { icon: Clock, label: "24/7 Support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/70">
                <Icon className="w-4 h-4 text-kazi-green" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer Testimonials ──────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full mb-4">
              <Star className="w-4 h-4 text-kazi-amber" fill="#F59E0B" />
              <span className="text-sm text-kazi-amber font-semibold">Real Stories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">What Kenyans Are Saying</h2>
            <p className="text-gray-500 text-sm">All reviews are from verified bookings — no fake stars</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-kazi-orange transition-colors">
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-kazi-amber" fill="#F59E0B" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ backgroundColor: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-black text-kazi-dark text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-kazi-green font-bold rounded-full">✓ Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-4">The KaziShow Story</h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Founded in 2026, KaziShow started with a simple observation: hiring services in Kenya was broken.
              People were asking for recommendations via WhatsApp groups, hiring through Facebook, or trusting
              random referrals with no accountability. There was no central, trusted platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-sm font-black text-kazi-orange mb-2">The Problem</p>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                No way to find verified, rated local providers. The process was fragmented, risky, and time-consuming. Scammers thrived.
              </p>
            </div>
            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-sm font-black text-kazi-blue mb-2">Our Solution</p>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                One platform with ID-verified providers, secure M-Pesa payments, and genuine customer reviews — all in one place.
              </p>
            </div>
            <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-sm font-black text-kazi-green mb-2">Our Vision</p>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                A Kenya where every provider can grow a trusted business, and every customer can hire with complete confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Awards ────────────────────────────────────────────────────────── */}
      <section className="bg-kazi-dark py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-kazi-amber/20 rounded-full mb-4">
              <Award className="w-4 h-4 text-kazi-amber" />
              <span className="text-sm text-kazi-amber font-semibold">Recognition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Awards &amp; Recognition</h2>
            <p className="text-white/50 text-sm">Recognised by leading organisations across East Africa</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {awards.map((award) => (
              <div key={award.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all text-center group">
                <p className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{award.icon}</p>
                <h3 className="text-sm font-black text-white mb-1">{award.title}</h3>
                <p className="text-xs text-white/50 mb-3 leading-tight">{award.body}</p>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: award.color }}>{award.year}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
              <Heart className="w-4 h-4 text-kazi-blue" fill="#0EA5E9" />
              <span className="text-sm text-kazi-blue font-semibold">Partners</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Trusted Partners</h2>
            <p className="text-gray-500 text-sm">Enterprise-grade infrastructure behind every transaction</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <div key={partner.name} className="rounded-2xl p-6 border-2 border-gray-100 hover:border-kazi-orange transition-all group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${partner.color}18` }}>
                  {partner.icon}
                </div>
                <p className="font-black text-kazi-dark mb-0.5">{partner.name}</p>
                <p className="text-xs text-kazi-orange font-bold mb-3">{partner.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── As Seen On ────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-12 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-6">As Featured In</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {publications.map((pub) => (
              <span key={pub} className="font-black text-gray-300 text-sm hover:text-kazi-orange transition-colors cursor-default select-none">
                {pub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why KaziShow ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Why KaziShow Wins</h2>
          <p className="text-gray-500 text-sm">How we compare to the alternatives</p>
        </div>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          <div className="grid grid-cols-5 text-center text-xs sm:text-sm font-black uppercase tracking-wide bg-gray-50 border-b border-gray-100">
            <div className="p-4 text-left text-gray-400">Feature</div>
            <div className="p-4 text-kazi-orange bg-orange-50 border-x border-gray-100">KaziShow</div>
            <div className="p-4 text-gray-400">Facebook</div>
            <div className="p-4 text-gray-400">WhatsApp</div>
            <div className="p-4 text-gray-400">Other Apps</div>
          </div>
          {comparisonFeatures.map((feature, i) => (
            <div
              key={i}
              className={`grid grid-cols-5 text-center text-sm border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}
            >
              <div className="p-3 sm:p-4 text-left text-gray-700 font-semibold text-xs sm:text-sm">{feature}</div>
              <div className="p-3 sm:p-4 bg-orange-50/60">
                <CheckCircle className="w-5 h-5 text-kazi-green mx-auto" fill="#00C896" />
              </div>
              <div className="p-3 sm:p-4"><X className="w-5 h-5 text-red-300 mx-auto" /></div>
              <div className="p-3 sm:p-4"><X className="w-5 h-5 text-red-300 mx-auto" /></div>
              <div className="p-3 sm:p-4"><X className="w-5 h-5 text-red-300 mx-auto" /></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Core Values ───────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Our Values</h2>
            <p className="text-gray-500 text-sm">What drives every decision we make</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield, title: "Trust", desc: "Every provider is verified. Every payment is protected. Trust is non-negotiable.", color: "bg-orange-100", icon_color: "text-kazi-orange" },
              { icon: TrendingUp, title: "Growth", desc: "Empowering local providers to build sustainable, growing businesses.", color: "bg-blue-100", icon_color: "text-kazi-blue" },
              { icon: Users, title: "Community", desc: "Building Kenya's most reliable and connected service network.", color: "bg-green-100", icon_color: "text-kazi-green" },
              { icon: Award, title: "Excellence", desc: "We hold providers and ourselves to the highest standard, always.", color: "bg-amber-100", icon_color: "text-kazi-amber" },
            ].map((value) => (
              <div key={value.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center hover:border-kazi-orange transition-colors">
                <div className={`w-14 h-14 rounded-2xl ${value.color} flex items-center justify-center mx-auto mb-4`}>
                  <value.icon className={`w-7 h-7 ${value.icon_color}`} />
                </div>
                <h3 className="font-black text-kazi-dark mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose KaziShow ───────────────────────────────────────────── */}
      <section className="bg-kazi-cream py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-kazi-orange text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              Why KaziShow
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-3">
              The Smarter Way to Find & Hire Services
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              We built KaziShow to solve the real problems Kenyans face when looking for trusted local services.
            </p>
          </div>

          {/* 6-card grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-12">
            {[
              { icon: "✅", title: "Verified Providers", desc: "Every Fundi and business is ID-verified before they can receive bookings." },
              { icon: "⭐", title: "Honest Reviews", desc: "Real ratings from real customers — no fake reviews, no hidden scores." },
              { icon: "⚡", title: "Book in 30 Seconds", desc: "Search, pick, and book in under a minute — no calls, no back-and-forth." },
              { icon: "📍", title: "Near You", desc: "Find service providers in your area, available when you need them." },
              { icon: "💰", title: "Fair Pricing", desc: "Transparent pricing set by providers. Pay directly — no hidden platform fees." },
              { icon: "🛡️", title: "Safe & Accountable", desc: "Report bad providers instantly. Our team reviews every complaint within 24 hours." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-kazi-orange hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-black text-kazi-dark text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="bg-kazi-dark rounded-2xl py-8 px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center mb-12">
            {[
              { value: "500+", label: "Verified Providers" },
              { value: "2,000+", label: "Happy Customers" },
              { value: "5,000+", label: "Bookings Completed" },
              { value: "4.8 ★", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-black text-kazi-orange">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* For Providers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-10">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1">
                <h3 className="text-lg font-black text-kazi-dark mb-4">Built for Providers Too</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    "Get discovered by thousands of customers near you",
                    "Manage all your bookings from one app",
                    "Build your reputation with verified reviews",
                    "Flexible model — pay per job (Fundis) or monthly subscription (Businesses)",
                    "Dedicated support team to help you grow",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="text-kazi-green font-bold mt-0.5">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-56 shrink-0">
                {[
                  { label: "Fundis", icon: "🔧", desc: "Plumbers, electricians & more" },
                  { label: "Hotels", icon: "🏨", desc: "Accommodation & hospitality" },
                  { label: "Salons", icon: "💇", desc: "Beauty & grooming services" },
                  { label: "Restaurants", icon: "🍽️", desc: "Food & dining experiences" },
                ].map((cat) => (
                  <div key={cat.label} className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <p className="text-xs font-black text-kazi-dark">{cat.label}</p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{cat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mission statement */}
          <div className="text-center">
            <p className="text-base sm:text-lg font-semibold text-kazi-dark max-w-2xl mx-auto mb-6">
              🇰🇪 KaziShow is on a mission to make quality services accessible to every Kenyan — and to help every skilled provider build a sustainable livelihood.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/discover"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-kazi-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Find a Service Provider
              </a>
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-kazi-dark text-white font-bold rounded-xl hover:bg-kazi-dark2 transition-colors"
              >
                Register Your Business
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Strip ─────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-black text-kazi-dark text-lg mb-1">Have a question? We're here.</h3>
              <p className="text-gray-500 text-sm">Our support team responds within minutes, not days.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:support@kazishow.co.ke"
                className="flex items-center gap-2 px-5 py-3 bg-gray-50 border border-gray-200 text-kazi-dark text-sm font-semibold rounded-xl hover:border-kazi-orange hover:text-kazi-orange transition-colors"
              >
                <Mail className="w-4 h-4" /> support@kazishow.co.ke
              </a>
              <a
                href="tel:+254700000000"
                className="flex items-center gap-2 px-5 py-3 bg-kazi-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                <Phone className="w-4 h-4" /> Call Us Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-kazi-dark py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-kazi-green/20 border border-kazi-green/30 rounded-full mb-6">
            <CheckCircle className="w-4 h-4 text-kazi-green" fill="#00C896" />
            <span className="text-sm text-kazi-green font-bold">Free to join. No hidden fees.</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Join KaziShow Today</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto leading-relaxed">
            Whether you're looking for a trusted service or ready to grow your business — KaziShow is the safest place to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-900/30"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/discover"
              className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-2 border border-white/20"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </section>

      <BottomNav />
      <WhatsAppBubble />
    </div>
  );
}
