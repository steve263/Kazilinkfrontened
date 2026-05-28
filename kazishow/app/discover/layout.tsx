import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Service Providers in Nairobi",
  description:
    "Browse verified plumbers, electricians, carpenters, hotels, restaurants, salons and more in Nairobi. All providers are ID-verified. Book instantly — no calls needed.",
  keywords: [
    "plumber Nairobi", "electrician Nairobi", "fundi near me",
    "salon Nairobi", "hotel Nairobi", "service providers Kenya",
    "book fundi online", "verified plumber Kenya",
  ],
  alternates: { canonical: "https://kazishow.co.ke/discover" },
  openGraph: {
    title: "Discover Verified Service Providers in Nairobi — KaziShow",
    description: "Find and book verified plumbers, electricians, hotels, salons near you in Nairobi. Instant booking, no calls.",
    url: "https://kazishow.co.ke/discover",
  },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
