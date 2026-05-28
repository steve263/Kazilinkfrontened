import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — KaziShow",
  description:
    "Got questions about KaziShow? Find answers about booking services, provider verification, payments, cancellations and more.",
  alternates: { canonical: "https://kazishow.co.ke/faq" },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
