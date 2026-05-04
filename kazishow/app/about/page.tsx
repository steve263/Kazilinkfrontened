"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, X, Award, Users, TrendingUp, Shield, MapPin, ArrowRight, Zap, Heart } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AboutPage() {
  const [stats, setStats] = useState({ totalProviders: 500, totalCustomers: 2000, totalCompletedBookings: 5000, citiesCovered: 1 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/api/stats`);
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch {}
    };
    fetchStats();
  }, []);

  const awards = [
    { title: "Best Startup 2024", year: "2024", body: "Kenya Tech Awards", icon: "🏆", color: "#F59E0B" },
    { title: "Top Service Platform Kenya", year: "2024", body: "East Africa Digital Awards", icon: "⭐", color: "#FF6B2B" },
    { title: "Most Trusted App", year: "2025", body: "Consumer Choice Awards KE", icon: "🔒", color: "#0EA5E9" },
    { title: "Fastest Growing Startup", year: "2024", body: "Nairobi Innovation Hub", icon: "🚀", color: "#00C896" },
  ];

  const partners = [
    { name: "Safaricom M-Pesa", role: "Payment Partner", icon: "💳", color: "#00C896", desc: "Seamless M-Pesa integration for secure, instant payments across all bookings." },
    { name: "Africa's Talking", role: "SMS Partner", icon: "📱", color: "#0EA5E9", desc: "Reliable SMS notifications and OTP delivery to every corner of Kenya." },
    { name: "Cloudinary", role: "Media Partner", icon: "☁️", color: "#F59E0B", desc: "Fast, optimised image and video hosting for provider profiles and testimonials." },
  ];

  const publications = ["Daily Nation", "Business Daily", "KTN", "NTV", "Citizen TV", "Techweez", "The Standard"];

  const comparisonFeatures = [
    "Verified providers",
    "Instant online booking",
    "M-Pesa secure payment",
    "No-show full refund",
    "Real verified reviews",
    "GPS location tracking",
    "24/7 customer support",
    "Background checked",
  ];

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-kazi-dark overflow-hidden py-16 sm:py-24">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, #FF6B2B22 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #F59E0B22 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Connecting Kenya with{" "}
            <span className="bg-gradient-to-r from-kazi-orange to-kazi-amber bg-clip-text text-transparent">
              Trusted Local Services
            </span>
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            KaziShow is on a mission to make quality services accessible, transparent, and affordable for every Kenyan.
            We believe in empowering local service providers and giving customers peace of mind and run for good.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
            {[
              { value: stats.totalProviders, label: "Verified Providers", icon: Shield, color: "text-kazi-orange" },
              { value: stats.totalCustomers, label: "Happy Customers", icon: Users, color: "text-kazi-amber" },
              { value: stats.totalCompletedBookings, label: "Bookings Completed", icon: Zap, color: "text-kazi-green" },
              { value: stats.citiesCovered, label: "Cities Covered", icon: MapPin, color: "text-kazi-blue" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                  <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}+</p>
                  <p className="text-xs text-white/60 mt-1">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white rounded-3xl p-8 sm:p-10 card-shadow">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-4">The KaziShow Story</h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Founded in 2024, KaziShow started with a simple problem: hiring services in Kenya was broken. People were asking friends for recommendations via WhatsApp, discovering services through Facebook groups, or trusting random contacts. There was no central, trusted platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-sm font-bold text-kazi-orange mb-2">The Problem</p>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Kenyans had no way to find verified, rated, local service providers. The process was fragmented, risky, and time-consuming.
              </p>
            </div>
            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-sm font-bold text-kazi-blue mb-2">Our Solution</p>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                A all-in-one platform connecting customers with ID-verified, trusted providers. Transparent ratings, secure payments, and genuine reviews.
              </p>
            </div>
            <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-sm font-bold text-kazi-green mb-2">Our Vision</p>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                A Kenya where every service provider can grow their business, and every customer can find quality services with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recognition & Awards */}
      <section className="bg-kazi-dark2 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-kazi-amber/20 rounded-full mb-4">
              <Award className="w-4 h-4 text-kazi-amber" />
              <span className="text-sm text-kazi-amber font-semibold">Recognition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Awards &amp; Recognition</h2>
            <p className="text-white/60 text-sm">Recognised by leading organisations across East Africa</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {awards.map((award) => (
              <div key={award.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all text-center group">
                <p className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{award.icon}</p>
                <h3 className="text-sm font-black text-white mb-1">{award.title}</h3>
                <p className="text-xs text-white/50 mb-2 leading-tight">{award.body}</p>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: award.color }}>{award.year}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Partners & Integrations */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-kazi-blue/10 rounded-full mb-4">
              <Heart className="w-4 h-4 text-kazi-blue" />
              <span className="text-sm text-kazi-blue font-semibold">Partners</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Trusted Partners &amp; Integrations</h2>
            <p className="text-gray-500 text-sm">World-class infrastructure powering every KaziShow transaction</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <div key={partner.name} className="rounded-2xl p-6 border-2 border-gray-100 hover:border-kazi-orange transition-all">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ backgroundColor: `${partner.color}15` }}>
                  {partner.icon}
                </div>
                <p className="font-black text-kazi-dark mb-0.5">{partner.name}</p>
                <p className="text-xs text-kazi-orange font-semibold mb-3">{partner.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* As Seen On */}
      <section className="bg-kazi-cream py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-6">As Seen On</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {publications.map((pub) => (
              <span key={pub} className="font-black text-gray-300 text-base hover:text-kazi-orange transition-colors cursor-default select-none">
                {pub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Why KaziShow Wins</h2>
          <p className="text-gray-600">How we compare to alternatives</p>
        </div>
        <div className="bg-white rounded-3xl overflow-hidden card-shadow">
          <div className="grid grid-cols-5 text-center text-xs sm:text-sm font-black uppercase tracking-wide bg-gray-50 border-b border-gray-100">
            <div className="p-4 text-left text-gray-400 sm:text-center">Feature</div>
            <div className="p-4 text-kazi-orange bg-orange-50 border-r border-gray-100">KaziShow</div>
            <div className="p-4 text-gray-500 border-r border-gray-100">Facebook</div>
            <div className="p-4 text-gray-500 border-r border-gray-100">Random</div>
            <div className="p-4 text-gray-500">Other Apps</div>
          </div>
          {comparisonFeatures.map((feature, i) => (
            <div
              key={i}
              className={`grid grid-cols-5 text-center text-sm border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
            >
              <div className="p-3 sm:p-4 text-left text-gray-700 font-semibold text-xs sm:text-sm">{feature}</div>
              <div className="p-3 sm:p-4 bg-orange-50/50">
                <CheckCircle className="w-5 h-5 text-kazi-green mx-auto" fill="#00C896" />
              </div>
              <div className="p-3 sm:p-4">
                <X className="w-5 h-5 text-red-300 mx-auto" />
              </div>
              <div className="p-3 sm:p-4">
                <X className="w-5 h-5 text-red-300 mx-auto" />
              </div>
              <div className="p-3 sm:p-4">
                <X className="w-5 h-5 text-red-300 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Meet Our Team</h2>
            <p className="text-gray-600">Built by Kenyans, for Kenya</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: "Stephen Gicheru", role: "Founder & CEO", avatar: "D", color: "#FF6B2B" },
              { name: "Mary Ivy Wairimu", role: "Chief Technology Officer", avatar: "M", color: "#0EA5E9" },
              { name: "Alvin Njaramba", role: "Head of Operations", avatar: "A", color: "#EC4899" },
              { name: "Mary Tessy Muthoni", role: "Executive Director", avatar: "M", color: "#EC4899" },
              { name: "Andrea Kamau", role: "Head of Marketing", avatar: "A", color: "#EC4899" },


            ].map((member) => (
              <div key={member.name} className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-orange-50 transition-colors">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: member.color }}>
                  {member.avatar}
                </div>
                <h3 className="text-lg font-black text-kazi-dark">{member.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-kazi-dark mb-2">Our Values</h2>
          <p className="text-gray-600">What drives us every day</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Shield, title: "Trust", desc: "Every provider is verified. Every payment is secure." },
            { icon: TrendingUp, title: "Growth", desc: "Empowering local service providers to scale." },
            { icon: Users, title: "Community", desc: "Building Kenya's most trusted service network." },
            { icon: Award, title: "Excellence", desc: "Only the best providers. Only quality services." },
          ].map((value) => (
            <div key={value.title} className="bg-white rounded-2xl p-6 card-shadow text-center hover:card-shadow-hover transition-all">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <value.icon className="w-7 h-7 text-kazi-orange" />
              </div>
              <h3 className="font-black text-kazi-dark mb-2">{value.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-kazi-dark py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Join KaziShow Today</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">Be part of Kenya's trusted service platform. Whether you're looking for services or ready to list yours.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all text-sm flex items-center justify-center gap-2 active:scale-95">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/discover" className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-2 border border-white/20">
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
