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
import PWAInstall from "@/components/PWAInstall";

export const metadata: Metadata = {
  title: "KaziShow — Kenya's #1 Service Booking Platform",
  description:
    "Find verified plumbers, electricians, hotels, salons and more in Nairobi. Book any service in 30 seconds.",
  keywords: "Kenya, Nairobi, local business, booking, services, KaziShow, plumber, electrician, salon",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KaziShow",
  },
  icons: {
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
  },
  openGraph: {
    title: "KaziShow — Kenya's #1 Service Platform",
    description: "Find verified service providers in Nairobi instantly",
    url: "https://kazishow.vercel.app",
    siteName: "KaziShow",
    locale: "en_KE",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6B2B",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B2B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KaziShow" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
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
          <PWAInstall />
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
