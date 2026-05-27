import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const LAST_UPDATED = "13 May 2026";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By creating an account or using KaziShow ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. These terms apply to all users including customers, service providers (fundis and businesses), and visitors.`,
  },
  {
    title: "2. Description of Service",
    body: `KaziShow is a Kenyan online marketplace that connects customers with local service providers including fundis, salons, restaurants, cleaning companies, repair shops, and other businesses. We facilitate bookings, payments, and communications between parties but are not a party to any service agreement between customers and providers.`,
  },
  {
    title: "3. User Accounts",
    body: `You must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use the Platform. One person may not maintain more than one account. You are responsible for all activity that occurs under your account.`,
  },
  {
    title: "4. Service Providers",
    body: `Service providers must complete our verification process before going live. By listing on KaziShow, providers confirm that they are legally authorised to offer their services in Kenya. Providers are independent contractors and not employees of KaziShow. KaziShow reserves the right to suspend or remove any provider who violates these terms or receives consistent poor reviews.`,
  },
  {
    title: "5. Bookings and Payments",
    body: `All payments are processed through M-Pesa or other supported payment methods. KaziShow charges a service fee on each completed booking. Prices displayed are inclusive of all applicable taxes unless stated otherwise. Cancellation policies are set by individual providers and displayed on their profile pages.`,
  },
  {
    title: "6. Prohibited Conduct",
    body: `You agree not to: use the Platform for any unlawful purpose; post false, misleading, or fraudulent information; harass, abuse, or harm other users; attempt to circumvent our payment system by arranging off-platform payments; scrape, copy, or reproduce Platform content without permission; create fake reviews or manipulate ratings.`,
  },
  {
    title: "7. Reviews and Content",
    body: `Users may post reviews, photos, and other content on the Platform. By submitting content, you grant KaziShow a non-exclusive, royalty-free licence to use, display, and distribute that content. Content must be truthful and must not violate the rights of any third party. KaziShow reserves the right to remove any content that violates these terms.`,
  },
  {
    title: "8. Limitation of Liability",
    body: `KaziShow acts as an intermediary and is not responsible for the quality, safety, or legality of services provided by listed businesses. To the maximum extent permitted by Kenyan law, KaziShow shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.`,
  },
  {
    title: "9. Dispute Resolution",
    body: `In the event of a dispute between a customer and a service provider, KaziShow may assist in mediation but is under no obligation to resolve disputes. Any disputes arising from these Terms shall be governed by the laws of Kenya and resolved in the courts of Nairobi.`,
  },
  {
    title: "10. Changes to Terms",
    body: `KaziShow reserves the right to modify these Terms at any time. We will notify users of material changes via email or in-app notification. Continued use of the Platform after changes constitutes acceptance of the updated Terms.`,
  },
  {
    title: "11. Contact Us",
    body: `If you have questions about these Terms, contact us at kazishow0@gmail.com or on WhatsApp at +254 795 542 312.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-kazi-dark py-14 px-5 text-center">
        <p className="text-kazi-orange text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Terms of Service</h1>
        <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-12 pb-28">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8">
          <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-kazi-orange pl-4">
            Please read these Terms of Service carefully before using KaziShow. These terms govern your use of our platform and services.
          </p>

          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-black text-kazi-dark mb-2">{s.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link href="/privacy" className="text-sm text-kazi-orange font-semibold hover:underline">
              Privacy Policy →
            </Link>
            <Link href="/auth/register" className="text-sm text-gray-400 hover:text-kazi-dark">
              Back to registration
            </Link>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
