"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, MapPin, ArrowRight, Star, Zap, TrendingUp, Shield,
  Smartphone, ChevronRight, Play, CheckCircle, HardHat, Store,
  ChevronDown, X, Users,
} from "lucide-react";
import { io } from "socket.io-client";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import PostCard from "@/components/feed/PostCard";
import ScrollProgress from "@/components/ui/ScrollProgress";
import WhatsAppBubble from "@/components/ui/WhatsAppBubble";
import LiveBookingToast from "@/components/ui/LiveBookingToast";
import TrustBar from "@/components/home/TrustBar";
import SocialProofSection from "@/components/home/SocialProofSection";
import VideoTestimonials from "@/components/home/VideoTestimonials";
import BookingDemo from "@/components/home/BookingDemo";
import BeforeAfterSlider from "@/components/home/BeforeAfterSlider";
import KaziPromise from "@/components/home/KaziPromise";
import CostCalculator from "@/components/home/CostCalculator";
import BlogPreview from "@/components/home/BlogPreview";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import ReferralBanner from "@/components/home/ReferralBanner";
import { POSTS, CATEGORIES } from "@/lib/data";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [start, target, duration]);
  return count;
}

function AnimatedCounter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(target, 1800, started);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl font-black text-white">{count.toLocaleString()}{suffix}</p>
      <p className="text-xs text-white/60 mt-0.5">{label}</p>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-kazi-amber" : "text-gray-300"}`}
          fill={i <= rating ? "#F59E0B" : "none"} />
      ))}
    </div>
  );
}

const FAQ_ITEMS = [
  { q: "Is KaziShow safe to use?", a: "Every provider on KaziShow is ID-verified before listing. Fundis go through a strict 5-step process including document checks, portfolio reviews, and background checks. You can see their verification badge on their profile." },
  { q: "How do I pay for services?", a: "We support M-Pesa (Lipa Na M-Pesa), cash on delivery, and pay-after-service options. You choose what works for you when booking." },
  { q: "What if the Fundi doesn't show up?", a: "We have a no-show protection policy. If a verified provider misses a booking without notice, you get a full refund and we escalate to our trust team. Your money and time are protected." },
  { q: "How long does verification take?", a: "Business accounts are verified within 24 hours. Fundi accounts take 2–3 business days as we do a thorough ID and portfolio review." },
  { q: "Can I book same-day services?", a: "Yes! Many providers on KaziShow offer same-day bookings. Look for the ⚡ Instant Book tag on their profile." },
  { q: "What areas do you cover?", a: "We currently cover all of Nairobi and its satellite towns — Westlands, Kasarani, Karen, Kilimani, Thika Rd, Langata, Eastleigh, Ruaka, and more. Mombasa launching soon." },
];

const VERIFICATION_STEPS = [
  { icon: "🪪", title: "ID Upload", desc: "National ID or Passport is scanned and verified against government records." },
  { icon: "📸", title: "Photo Portfolio", desc: "Minimum 3 real photos of completed work are reviewed by our trust team." },
  { icon: "📞", title: "Phone Verification", desc: "M-Pesa registered number confirms identity and local presence." },
  { icon: "⭐", title: "First Review Gate", desc: "After 3 bookings, ratings must stay above 4.0 to keep the verified badge." },
];

const PLACEHOLDER_REVIEWS = [
  { id: "p1", customer: { name: "Awaiting Reviews" }, provider: { businessName: "—" }, rating: 5, comment: "Be the first to review!" },
  { id: "p2", customer: { name: "Awaiting Reviews" }, provider: { businessName: "—" }, rating: 5, comment: "Be the first to review!" },
  { id: "p3", customer: { name: "Awaiting Reviews" }, provider: { businessName: "—" }, rating: 5, comment: "Be the first to review!" },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitDismissed, setExitDismissed] = useState(false);

  // Live booking counter from API
  const [totalBookings, setTotalBookings] = useState(0);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const bookingCountRef = useRef<HTMLDivElement>(null);
  const [counterStarted, setCounterStarted] = useState(false);
  const animatedBookings = useCountUp(totalBookings, 2000, counterStarted && bookingsLoaded);

  // Live visitors via Socket.io
  const [liveVisitors, setLiveVisitors] = useState(0);

  // Real reviews from database
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const trendingPosts = POSTS.filter((p) => p.isTrending).slice(0, 3);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/stats`);
      const data = await res.json();
      if (data.success) {
        setTotalBookings(data.data.totalCompletedBookings || 0);
        setBookingsLoaded(true);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCounterStarted(true); }, { threshold: 0.3 });
    if (bookingCountRef.current) obs.observe(bookingCountRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const socket = io(API, { transports: ["websocket"] });
    socket.on("live_visitors", ({ count }: { count: number }) => setLiveVisitors(count));
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API}/api/reviews`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setReviews(data.data.slice(0, 3));
        } else {
          setReviews([]);
        }
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoaded(true);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (exitDismissed) return;
    const handler = (e: MouseEvent) => { if (e.clientY < 20) setShowExitPopup(true); };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [exitDismissed]);

  return (
    <div className="min-h-screen bg-kazi-cream">
      <ScrollProgress />
      <Navbar />
      <LiveBookingToast />

      {/* Exit-intent popup */}
      {showExitPopup && !exitDismissed && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center relative animate-slide-up">
            <button onClick={() => { setShowExitPopup(false); setExitDismissed(true); }} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="text-2xl font-black text-kazi-dark mb-2">Wait — don't go!</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Get <span className="font-black text-kazi-orange">KSh 200 off</span> your first booking when you sign up today. Valid for 24 hours only.
            </p>
            <Link href="/auth/register" onClick={() => { setShowExitPopup(false); setExitDismissed(true); }}
              className="block w-full py-3.5 bg-kazi-orange text-white font-black rounded-2xl text-sm hover:bg-orange-600 transition-all mb-3">
              Claim My KSh 200 Discount
            </Link>
            <button onClick={() => { setShowExitPopup(false); setExitDismissed(true); }} className="text-xs text-gray-400 hover:text-gray-600">
              No thanks, I&apos;ll pay full price
            </button>
          </div>
        </div>
      )}

      <TrustBar />

      {/* Hero */}
      <section className="relative bg-kazi-dark overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 20% 50%, #FF6B2B22 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #F59E0B22 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #0EA5E922 0%, transparent 40%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              {/* Live visitors badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4 border border-white/20">
                <div className="w-2 h-2 rounded-full bg-kazi-green animate-pulse" />
                <Users className="w-3.5 h-3.5 text-white/80" />
                <span className="text-sm text-white/90 font-medium">
                  {liveVisitors > 0 ? `${liveVisitors} people browsing right now` : "Join thousands browsing now"}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4">
                Find Verified{" "}
                <span className="bg-gradient-to-r from-kazi-orange to-kazi-amber bg-clip-text text-transparent">
                  Services
                </span>
                <br />Near You
              </h1>
              <p className="text-lg text-white/70 mb-8 leading-relaxed">
                Book skilled fundis, cleaners, salons and more. All ID-verified. All local. Pay with M-Pesa.
              </p>
              <div className="max-w-xl">
                <div className="flex bg-white rounded-2xl p-1.5 shadow-2xl">
                  <div className="flex items-center gap-2 pl-3 pr-1 flex-shrink-0">
                    <MapPin className="w-4 h-4 text-kazi-orange" />
                    <span className="text-sm text-gray-500 hidden sm:block">Nairobi</span>
                  </div>
                  <div className="w-px bg-gray-200 mx-2 hidden sm:block" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder="Search plumber, salon, cleaner…"
                    className="flex-1 px-3 py-3 text-sm text-kazi-dark bg-transparent outline-none"
                  />
                  <Link href={`/discover?q=${searchQuery}`}
                    className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-kazi-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95">
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:block">Search</span>
                  </Link>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {["Plumber", "Electrician", "Cleaner", "Salon"].map((s) => (
                    <Link key={s} href={`/discover?q=${s}`}
                      className="px-3 py-1 bg-white/10 border border-white/20 text-white/80 text-xs rounded-full hover:bg-white/20 transition-colors">
                      {s}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Stats row with live booking counter */}
              <div ref={bookingCountRef} className="flex items-center gap-8 mt-10 lg:justify-start justify-center">
                <AnimatedCounter target={500} suffix="+" label="Providers" />
                <AnimatedCounter target={200} suffix="+" label="Verified Fundis" />
                <div className="text-center">
                  <p className="text-2xl font-black text-white">
                    {bookingsLoaded ? animatedBookings.toLocaleString() : "—"}+
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">Bookings Made</p>
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-kazi-orange/20 rounded-[3rem] blur-3xl scale-110" />
                <div className="relative w-64 h-[520px] bg-kazi-dark2 rounded-[3rem] border-[6px] border-gray-700 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-kazi-dark2 rounded-b-2xl z-10" />
                  <div className="h-full overflow-hidden pt-6 bg-kazi-cream">
                    <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100 flex items-center justify-between">
                      <span className="font-black text-sm text-kazi-dark">Kazi<span className="text-kazi-orange">Show</span></span>
                      <div className="w-6 h-6 rounded-full bg-orange-100" />
                    </div>
                    {[
                      { name: "James Mwangi", tag: "⚡ Electrician", rating: "4.9", color: "#FF6B2B" },
                      { name: "Glamour Studio", tag: "💇 Salon", rating: "4.8", color: "#EC4899" },
                      { name: "CleanPro Kenya", tag: "🧹 Cleaning", rating: "4.7", color: "#00C896" },
                      { name: "Peter Otieno", tag: "🔧 Plumber", rating: "4.9", color: "#0EA5E9" },
                    ].map((card, i) => (
                      <div key={i} className="mx-3 mt-2.5 bg-white rounded-2xl p-3 shadow-sm border border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ backgroundColor: card.color + "30" }} />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-kazi-dark truncate">{card.name}</p>
                            <p className="text-xs text-gray-400">{card.tag}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-kazi-amber" fill="#F59E0B" />
                            <span className="text-xs font-bold text-gray-600">{card.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-4">
                      {["🏠", "🔍", "📍", "👤"].map((icon) => (
                        <div key={icon} className="text-base">{icon}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -right-6 top-20 bg-white rounded-2xl shadow-xl px-3 py-2 border border-gray-100 animate-bounce">
                  <p className="text-xs font-bold text-kazi-dark">✅ ID Verified</p>
                </div>
                <div className="absolute -left-8 bottom-24 bg-kazi-orange rounded-2xl shadow-xl px-3 py-2 animate-pulse">
                  <p className="text-xs font-bold text-white">⚡ Instant Book</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1200 60L1200 20C1000 60 800 0 600 30C400 60 200 10 0 40L0 60Z" fill="#F8F7F4" />
          </svg>
        </div>
      </section>

      <SocialProofSection />

      {/* Who do you need? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <h2 className="text-xl font-black text-kazi-dark mb-5">Who do you need?</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/discover?type=fundi">
            <div className="group bg-white rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all border-2 border-transparent hover:border-kazi-orange cursor-pointer hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-kazi-orange/15 flex items-center justify-center mb-3 group-hover:bg-kazi-orange/25 transition-colors">
                <HardHat className="w-7 h-7 text-kazi-orange" />
              </div>
              <h3 className="font-black text-kazi-dark mb-1">Skilled Fundi</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Plumber, electrician, carpenter, cleaner &amp; more — all ID-verified</p>
              <div className="flex items-center gap-1 mt-3 text-kazi-orange text-xs font-semibold">Find a Fundi <ArrowRight className="w-3.5 h-3.5" /></div>
            </div>
          </Link>
          <Link href="/discover?type=business">
            <div className="group bg-white rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all border-2 border-transparent hover:border-kazi-blue cursor-pointer hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-kazi-blue/15 flex items-center justify-center mb-3 group-hover:bg-kazi-blue/25 transition-colors">
                <Store className="w-7 h-7 text-kazi-blue" />
              </div>
              <h3 className="font-black text-kazi-dark mb-1">Local Business</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Salons, restaurants, gyms, repair shops &amp; more — verified &amp; rated</p>
              <div className="flex items-center gap-1 mt-3 text-kazi-blue text-xs font-semibold">Find a Business <ArrowRight className="w-3.5 h-3.5" /></div>
            </div>
          </Link>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-kazi-dark">Browse by Category</h2>
          <Link href="/discover" className="flex items-center gap-1 text-sm text-kazi-orange font-semibold hover:gap-2 transition-all">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-14 gap-2">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/discover?category=${cat.id}`}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all group hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110" style={{ backgroundColor: `${cat.color}15` }}>
                {cat.icon}
              </div>
              <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{cat.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </section>

      <KaziPromise />

      {/* How Verification Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl p-8 card-shadow">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-kazi-green/10 rounded-full mb-4">
              <Shield className="w-4 h-4 text-kazi-green" />
              <span className="text-sm text-kazi-green font-semibold">Trust &amp; Safety</span>
            </div>
            <h2 className="text-2xl font-black text-kazi-dark mb-2">How Verification Works</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Every Fundi goes through a strict 4-step verification before they can accept bookings.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {VERIFICATION_STEPS.map((step, i) => (
              <div key={i} className="relative text-center p-5 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors group">
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="absolute top-3 right-3 w-5 h-5 bg-kazi-orange rounded-full flex items-center justify-center text-white text-xs font-black">{i + 1}</div>
                <h3 className="font-black text-sm text-kazi-dark mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-kazi-green/10 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-kazi-green flex-shrink-0" fill="#00C896" />
            <p className="text-sm text-gray-700">
              <span className="font-bold">Verified badge revoked</span> if a provider falls below 4.0 stars or receives 2+ safety complaints.
            </p>
          </div>
        </div>
      </section>

      <BookingDemo />
      <BeforeAfterSlider />

      {/* How KaziShow Works */}
      <section className="bg-kazi-dark2 py-16 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-2">How KaziShow Works</h2>
            <p className="text-white/60 text-sm">Book any service in under 2 minutes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: Search, title: "Discover", desc: "Search or browse verified fundis and businesses near you.", color: "#FF6B2B" },
              { step: "02", icon: Zap, title: "Book Instantly", desc: "Select a service, choose a time, and send your request.", color: "#F59E0B" },
              { step: "03", icon: Smartphone, title: "Pay with M-Pesa", desc: "Secure payment before or after service. No cash hassle.", color: "#00C896" },
            ].map((item) => (
              <div key={item.step} className="relative text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${item.color}20` }}>
                  <item.icon className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <div className="absolute top-4 right-4 text-4xl font-black opacity-10" style={{ color: item.color }}>{item.step}</div>
                <h3 className="font-black text-white text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VideoTestimonials />

      {/* Trending Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-kazi-orange" />
            <h2 className="text-xl font-black text-kazi-dark">Trending Posts</h2>
          </div>
          <Link href="/feed" className="flex items-center gap-1 text-sm text-kazi-orange font-semibold hover:gap-2 transition-all">
            View feed <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingPosts.map((post) => <PostCard key={post.id} post={post as any} />)}
        </div>
      </section>

      {/* Real Stories, Real Results — real reviews from database */}
      <section className="bg-kazi-dark py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white mb-2">Real Stories, Real Results</h2>
            <p className="text-white/50 text-sm">What real customers say about KaziShow providers</p>
          </div>

          {!reviewsLoaded && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-24" />
                      <div className="h-2 bg-white/10 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-white/10 rounded" />
                    <div className="h-2 bg-white/10 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {reviewsLoaded && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {(reviews.length > 0 ? reviews : PLACEHOLDER_REVIEWS).map((review, i) => {
                const isPlaceholder = reviews.length === 0;
                const avatarColors = ["#FF6B2B", "#EC4899", "#0EA5E9"];
                const avatarColor = avatarColors[i % avatarColors.length];
                const customerName = review.customer?.name || "Anonymous";
                const providerName = review.provider?.businessName;
                return (
                  <div key={review.id} className={`bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all ${isPlaceholder ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0" style={{ backgroundColor: avatarColor }}>
                        {customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">{customerName}</p>
                        <p className="text-white/50 text-xs">{providerName ? `Reviewed ${providerName}` : "— awaiting reviews"}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                    <p className="text-sm text-white/70 mt-3 leading-relaxed line-clamp-3">
                      {isPlaceholder ? "Be the first to review!" : (review.comment || "Great service!")}
                    </p>
                    {!isPlaceholder && providerName && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <span className="text-kazi-orange font-semibold text-xs">Provider: {providerName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/testimonials" className="inline-flex items-center gap-2 px-6 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all text-sm">
              View All Testimonials <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <CostCalculator />

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-kazi-dark mb-2">Frequently Asked Questions</h2>
          <p className="text-gray-500 text-sm">Everything you need to know before booking</p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                <span className="font-bold text-sm text-kazi-dark pr-4">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <BlogPreview />
      <ReferralBanner />
      <NewsletterSignup />

      {/* Grow your business / Provider CTA */}
      <section className="bg-kazi-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-kazi-orange/20 rounded-full mb-6">
            <Shield className="w-4 h-4 text-kazi-orange" />
            <span className="text-sm text-kazi-orange font-semibold">For Service Providers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Grow Your Business on KaziShow</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            List your services, accept bookings, receive M-Pesa payments, and reach thousands of customers across Nairobi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all text-sm flex items-center justify-center gap-2 active:scale-95">
              <Zap className="w-5 h-5" />Join as Provider
            </Link>
            <Link href="/discover" className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-2 border border-white/20">
              <Play className="w-5 h-5" />Explore Platform
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {["Free to list", "Verified badge", "M-Pesa payments"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-kazi-green" />
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-kazi-dark border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-kazi-orange flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-black text-white">Kazi<span className="text-kazi-orange">Show</span></span>
            </div>
            <p className="text-sm text-white/40 text-center">© 2025 KaziShow Ltd · Made for Kenya 🇰🇪 · Reg. PVT-2024-NBI-04821</p>
            <div className="flex items-center gap-4">
              {["Privacy", "Terms", "Contact"].map((link) => (
                <Link key={link} href="#" className="text-sm text-white/40 hover:text-kazi-orange transition-colors">{link}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
      <WhatsAppBubble />

      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <Link href="/discover"
          className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 bg-kazi-orange text-white text-sm font-black rounded-full shadow-2xl shadow-orange-400/40 hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all border-2 border-orange-300/30 animate-bounce"
          style={{ animationDuration: "3s" }}>
          <Search className="w-4 h-4" />
          Find a Service Near You
        </Link>
      </div>
    </div>
  );
}
