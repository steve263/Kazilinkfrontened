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
import JsonLD from "@/components/SEO/JsonLD";

export const metadata: Metadata = {
  metadataBase: new URL("https://kazishow.co.ke"),
  title: {
    default: "KaziShow — Find Verified Service Providers in Nairobi",
    template: "%s | KaziShow Kenya",
  },
  description:
    "KaziShow connects you with verified plumbers, electricians, carpenters, hotels, salons and more in Nairobi. Book any local service in 30 seconds. FREE to use.",
  keywords: [
    "plumber Nairobi", "electrician Nairobi", "carpenter Nairobi",
    "fundi Nairobi", "services near me Nairobi", "book service Nairobi",
    "verified service providers Kenya", "local services Nairobi",
    "home services Nairobi", "hotel booking Nairobi", "salon booking Nairobi",
    "KaziShow", "Kenya service platform", "fundi Kenya", "plumber Kenya",
  ],
  authors: [{ name: "KaziShow", url: "https://kazishow.co.ke" }],
  creator: "KaziShow Kenya",
  publisher: "KaziShow Kenya",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KaziShow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
    type: "website",
    locale: "en_KE",
    url: "https://kazishow.co.ke",
    siteName: "KaziShow",
    title: "KaziShow — Find Verified Service Providers in Nairobi",
    description:
      "Find verified plumbers, electricians, hotels, salons and more in Nairobi. Book any service in 30 seconds. FREE to use.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KaziShow — Kenya's #1 Service Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KaziShow — Find Verified Service Providers in Nairobi",
    description: "Find verified plumbers, electricians, hotels, salons and more in Nairobi. Book in 30 seconds.",
    images: ["/og-image.png"],
    creator: "@kazishow",
  },
  alternates: { canonical: "https://kazishow.co.ke" },
  verification: { google: "google5cec31496d640cd8" },
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
        <JsonLD />
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
