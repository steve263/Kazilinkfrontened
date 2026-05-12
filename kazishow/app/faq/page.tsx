"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is KaziShow?",
        a: "KaziShow is a Kenyan online marketplace that connects customers with trusted local service providers — including fundis, salons, restaurants, cleaning companies, and repair shops. You can browse services, book instantly, and pay securely via M-Pesa.",
      },
      {
        q: "Is KaziShow free to use?",
        a: "Creating an account and browsing services is completely free. KaziShow charges a small service fee on completed bookings. Service providers pay a commission only when they receive a booking.",
      },
      {
        q: "What areas does KaziShow cover?",
        a: "KaziShow currently operates in Nairobi and surrounding areas. We are expanding to other Kenyan cities — follow us on social media for updates.",
      },
    ],
  },
  {
    category: "Bookings & Payments",
    items: [
      {
        q: "How do I book a service?",
        a: "Browse or search for the service you need, open a provider's profile, and tap 'Book Now'. Choose your date and time, confirm the details, and complete payment via M-Pesa. You will receive a confirmation SMS instantly.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We currently accept M-Pesa (STK push and Paybill). More payment options are coming soon.",
      },
      {
        q: "Can I cancel a booking?",
        a: "Cancellation policies vary by provider and are shown on their profile page before you book. Some providers allow free cancellation up to 24 hours in advance. Contact the provider directly for urgent cancellations.",
      },
      {
        q: "What if a provider doesn't show up?",
        a: "If a provider fails to show up for a confirmed booking, contact our support team at support@kazishow.co.ke or WhatsApp +254 795 542 312. We will investigate and arrange a refund or alternative provider.",
      },
    ],
  },
  {
    category: "For Service Providers",
    items: [
      {
        q: "How do I list my business on KaziShow?",
        a: "Sign up as a Business or Fundi from our registration page. Complete your profile, upload photos of your work, and submit for verification. Once approved, your listing goes live and customers can start booking you.",
      },
      {
        q: "How do I receive payments?",
        a: "Payments are released to your M-Pesa number after a booking is completed and confirmed. Payouts are processed within 24 hours of service completion.",
      },
      {
        q: "What is the verification process?",
        a: "We verify providers by reviewing your national ID, business details (for businesses), and optionally a selfie. This protects customers and builds trust in your profile. Verification usually takes 1–2 business days.",
      },
      {
        q: "Can I set my own prices?",
        a: "Yes, you set your own service prices. KaziShow deducts a small commission from each booking. You keep the rest.",
      },
    ],
  },
  {
    category: "Account & Safety",
    items: [
      {
        q: "How does KaziShow keep me safe?",
        a: "All providers go through ID verification before going live. Customers and providers can rate and review each other after every booking. Our trust score system and report feature help us remove bad actors quickly.",
      },
      {
        q: "How do I report a problem with a provider or customer?",
        a: "Open the user's profile or booking, tap the Report button, choose a reason, and submit. Our team reviews all reports within 24 hours. For urgent issues, contact us on WhatsApp at +254 795 542 312.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: "On the login page, tap 'Forgot password?' and enter your phone number. We will send you an OTP to reset your password.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings > Account > Deactivate Account. Your account will be deactivated immediately. To permanently delete your data, email support@kazishow.co.ke and we will process your request within 7 days.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-kazi-dark">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-kazi-orange flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-kazi-dark py-14 px-5 text-center">
        <p className="text-kazi-orange text-xs font-bold uppercase tracking-widest mb-3">Help Centre</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-white/50 text-sm max-w-sm mx-auto">
          Everything you need to know about KaziShow. Can&apos;t find your answer?{" "}
          <Link href="/contact" className="text-kazi-orange hover:underline">Contact us</Link>.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-12 pb-28 space-y-6">
        {faqs.map((section) => (
          <div key={section.category} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-black text-kazi-orange mb-4 uppercase tracking-wide text-xs">
              {section.category}
            </h2>
            {section.items.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}

        {/* CTA */}
        <div className="bg-kazi-dark rounded-2xl p-8 text-center">
          <p className="text-white font-black text-lg mb-2">Still have questions?</p>
          <p className="text-white/50 text-sm mb-5">Our support team is happy to help.</p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-kazi-orange text-white font-black rounded-2xl hover:bg-orange-600 transition-all"
          >
            Contact Support
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
