import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About KaziShow — Kenya's #1 Service Platform",
  description:
    "KaziShow was built to solve the problem of finding trusted service providers in Nairobi. Learn about our mission, how we verify providers, and why thousands of Kenyans trust us.",
  alternates: { canonical: "https://kazishow.co.ke/about" },
  openGraph: {
    title: "About KaziShow — Kenya's #1 Service Booking Platform",
    description: "Learn why KaziShow is Kenya's most trusted platform for finding and booking local service providers.",
    url: "https://kazishow.co.ke/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
