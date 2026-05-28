import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deals & Offers on Services in Nairobi — KaziShow",
  description:
    "Find the best deals on plumbers, electricians, salons, hotels and more in Nairobi. Exclusive discounts from verified KaziShow providers.",
  alternates: { canonical: "https://kazishow.co.ke/deals" },
  openGraph: {
    title: "Best Service Deals in Nairobi — KaziShow",
    description: "Exclusive discounts on verified service providers in Nairobi. Book and save today.",
    url: "https://kazishow.co.ke/deals",
  },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
