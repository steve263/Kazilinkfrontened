import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact KaziShow — We're Here to Help",
  description:
    "Get in touch with the KaziShow support team. WhatsApp, email or call us. We respond within minutes.",
  alternates: { canonical: "https://kazishow.co.ke/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
