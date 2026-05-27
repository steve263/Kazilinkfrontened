import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const LAST_UPDATED = "13 May 2026";

const sections = [
  {
    title: "1. Information We Collect",
    body: `We collect information you provide directly, including: your name, phone number, email address, profile photo, and location when you register; payment information processed through M-Pesa; booking details and service history; messages and communications on the Platform; photos and content you upload; and device information such as your IP address and browser type.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use your information to: create and manage your account; process bookings and payments; connect you with service providers or customers; send booking confirmations, receipts, and notifications; improve our Platform and personalise your experience; detect and prevent fraud or abuse; comply with legal obligations under Kenyan law; and send you promotional messages (you can opt out at any time).`,
  },
  {
    title: "3. Sharing Your Information",
    body: `We share your information with: service providers or customers as necessary to complete a booking (e.g. your name and phone number are shared with the provider you book); payment processors (M-Pesa/Safaricom) to facilitate transactions; third-party service providers who help us operate the Platform (cloud hosting, SMS delivery, analytics); and law enforcement or regulators when required by Kenyan law. We do not sell your personal data to third parties.`,
  },
  {
    title: "4. Phone Numbers and Communications",
    body: `Your phone number is used for account verification via OTP, booking notifications, and M-Pesa payments. We may share your phone number with a service provider solely to facilitate a confirmed booking. You may receive SMS notifications from KaziShow — you can opt out by contacting support.`,
  },
  {
    title: "5. Location Data",
    body: `We collect location information you provide during registration or when using map features. This helps us show you nearby service providers and helps providers find your location for service delivery. We do not track your real-time location in the background without your explicit consent.`,
  },
  {
    title: "6. Data Retention",
    body: `We retain your personal data for as long as your account is active or as needed to provide services. If you deactivate your account, we may retain certain data for up to 12 months for legal and fraud-prevention purposes. You may request deletion of your data by contacting kazishow0@gmail.com.`,
  },
  {
    title: "7. Security",
    body: `We implement industry-standard security measures including encrypted passwords, HTTPS, and JWT-based authentication. However, no system is completely secure. You are responsible for keeping your account credentials confidential. Please notify us immediately at kazishow0@gmail.com if you suspect unauthorised access to your account.`,
  },
  {
    title: "8. Cookies and Analytics",
    body: `KaziShow uses session storage and local storage to keep you logged in and remember your preferences. We may use analytics tools to understand how users interact with our Platform. These tools may collect anonymised usage data. You can clear your browser storage at any time through your browser settings.`,
  },
  {
    title: "9. Children's Privacy",
    body: `KaziShow is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has created an account, please contact us and we will delete the account promptly.`,
  },
  {
    title: "10. Your Rights",
    body: `Under Kenyan data protection law (Data Protection Act, 2019), you have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data; object to processing of your data for marketing purposes; and lodge a complaint with the Office of the Data Protection Commissioner. To exercise any of these rights, contact us at kazishow0@gmail.com.`,
  },
  {
    title: "11. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. Your continued use of KaziShow after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "12. Contact Us",
    body: `For any privacy-related questions or requests, contact our Data Protection Officer at kazishow0@gmail.com or on WhatsApp at +254 795 542 312. Our offices are located in Nairobi, Kenya.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-kazi-dark py-14 px-5 text-center">
        <p className="text-kazi-orange text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
        <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-12 pb-28">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8">
          <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-kazi-orange pl-4">
            Your privacy matters to us. This policy explains what data KaziShow collects, how we use it, and your rights under the Kenya Data Protection Act 2019.
          </p>

          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-black text-kazi-dark mb-2">{s.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link href="/terms" className="text-sm text-kazi-orange font-semibold hover:underline">
              Terms of Service →
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
