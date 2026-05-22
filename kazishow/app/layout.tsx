import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ScrollProgress from "@/components/ui/ScrollProgress";
import AuthGuard from "@/components/layout/AuthGuard";
import SuspensionGate from "@/components/layout/SuspensionGate";
import IncomingCallHandler from "@/components/call/IncomingCallHandler";
import PushNotificationInit from "@/components/PushNotificationInit";
import NotificationPermissionBanner from "@/components/notifications/NotificationPermissionBanner";
import WhatsAppFloat from "@/components/support/WhatsAppFloat";
import AISupportChat from "@/components/support/AISupportChat";
import GoogleAuthProvider from "@/components/auth/GoogleAuthProvider";
import BookingNotificationManager from "@/components/notifications/BookingNotificationManager";
import JobCompletionManager from "@/components/notifications/JobCompletionManager";
import CommissionGuard from "@/components/commission/CommissionGuard";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { SettingsProvider } from "@/lib/settingsContext";

export const metadata: Metadata = {
  title: "KaziShow — Discover Local Businesses in Kenya",
  description:
    "Africa's local business discovery and booking platform. Find salons, restaurants, cleaners, repairs and more near you.",
  keywords: "Kenya, Nairobi, local business, booking, services, KaziShow",
  openGraph: {
    title: "KaziShow",
    description: "Discover, book, and support local Kenyan businesses.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FF6B2B",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-kazi-cream min-h-screen">
        <SettingsProvider>
        <GoogleAuthProvider>
        <SuspensionGate>
          <AuthGuard />
          <IncomingCallHandler />
          <PushNotificationInit />
          <NotificationPermissionBanner />
          <ScrollProgress />
          <SubscriptionBanner />
          {children}
          <JobCompletionManager />
          <BookingNotificationManager />
          <CommissionGuard />
          <WhatsAppFloat />
          <AISupportChat />
        </SuspensionGate>
        </GoogleAuthProvider>
        </SettingsProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1A1714",
              color: "#F8F7F4",
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#00C896", secondary: "#fff" } },
            error: { iconTheme: { primary: "#FF6B2B", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
